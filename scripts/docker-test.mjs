#!/usr/bin/env node
// Test and check runner (works the same on Windows, macOS and Linux; no `make` needed).
// Each test stack runs in its own Docker project and is removed afterwards, even when tests fail.
//
//   node scripts/docker-test.mjs backend    (npm run test:backend)   Vitest + Supertest against mongo-test
//   node scripts/docker-test.mjs frontend   (npm run test:frontend)  Vitest + React Testing Library + MSW
//   node scripts/docker-test.mjs e2e        (npm run test:e2e)       Playwright, desktop + mobile
//   node scripts/docker-test.mjs e2e public browse                    only e2e/public.spec.ts + browse.spec.ts
//   node scripts/docker-test.mjs build      (npm run docker:build)   backend production image builds
//   node scripts/docker-test.mjs check      (npm run check)          everything above + lint, types, docs
//   node scripts/docker-test.mjs check:feature public browse        (npm run check:feature -- public browse)
//        per feature: lint, types, format, docs, ALL backend + frontend tests, e2e of the named specs only

import { spawnSync } from 'node:child_process';

const TEST_STACK = ['-p', 'edtech-learning-platform-test', '-f', 'docker/compose.test.yml'];
const E2E = ['--profile', 'e2e'];
// npm is a .cmd file on Windows, which only starts through a shell
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/** Runs a command with the output shown live; returns its exit code. */
function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    // Only npm.cmd needs a shell; the arguments are fixed strings from this file, never user input
    shell: command === NPM && process.platform === 'win32',
  });
  return result.status ?? 1;
}

function checkDocker() {
  if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0) {
    console.error('Docker is not running. Start Docker Desktop, then run the command again.');
    process.exit(1);
  }
}

/** One test service in the test stack (optionally another command), then the stack is removed (keeps the exit code). */
function testService(service, extra = [], command = []) {
  checkDocker();
  const status = run('docker', [
    'compose',
    ...TEST_STACK,
    ...extra,
    'run',
    '--rm',
    '--build',
    service,
    ...command,
  ]);
  run('docker', ['compose', ...TEST_STACK, ...extra, 'down', '-v', '--remove-orphans']);
  return status;
}

function buildImages() {
  checkDocker();
  // The frontend is hosted on Vercel (no Docker image); its production build is `next build` in CI.
  return run('docker', [
    'build',
    '-f',
    'docker/backend.Dockerfile',
    '--target',
    'prod',
    '-t',
    'edtech-learning-platform-backend:check',
    '.',
  ]);
}

/** Spec names after the target ("public", "public.spec.ts" or "e2e/public.spec.ts") as frontend/e2e paths. */
function specPaths() {
  return process.argv.slice(3).map((name) => {
    const base = name.replace(/^e2e\//, '').replace(/\.spec\.ts$/, '');
    // Plain file names only: no options, no paths outside frontend/e2e
    if (!/^[a-z0-9-]+$/i.test(base)) {
      console.error(`Not an e2e spec name: ${name} (use e.g. "public" for e2e/public.spec.ts)`);
      process.exit(2);
    }
    return `e2e/${base}.spec.ts`;
  });
}

/** Playwright: every spec, or only the named ones. */
const PROMO_SPEC = 'e2e/promos.spec.ts';
const MAIN_PROJECTS = ['--project=desktop', '--project=mobile'];
const PROMO_PROJECTS = ['--project=desktop-promos', '--project=mobile-promos'];

/**
 * Playwright in the test stack. A running promo shows a pop-up on every visitor's home and course pages, so the
 * promo spec runs as a second, separate run after the others (it would cover their pages if run alongside).
 */
function e2e(specs) {
  const all = specs.length === 0;
  const others = specs.filter((spec) => spec !== PROMO_SPEC);
  const withPromos = all || specs.includes(PROMO_SPEC);
  let status = 0;
  if (all || others.length > 0) {
    status = testService('playwright', E2E, [
      'npx',
      'playwright',
      'test',
      ...MAIN_PROJECTS,
      ...others,
    ]);
  }
  if (status === 0 && withPromos) {
    status = testService('playwright', E2E, ['npx', 'playwright', 'test', ...PROMO_PROJECTS]);
  }
  return status;
}

/** Runs the steps in order and stops at the first failure. */
function runSteps(label, steps) {
  for (const [name, step] of steps) {
    if (step() !== 0) {
      console.error(`\n${label} FAILED at: ${name}`);
      return 1;
    }
  }
  console.log(`\n${label} passed`);
  return 0;
}

const FAST_CHECKS = [
  ['lint', () => run(NPM, ['run', 'lint'])],
  ['typecheck', () => run(NPM, ['run', 'typecheck'])],
  ['format:check', () => run(NPM, ['run', 'format:check'])],
  ['docs:check', () => run(NPM, ['run', 'docs:check'])],
];

const STEPS = {
  backend: () => testService('backend-test'),
  frontend: () => testService('frontend-test'),
  e2e: () => e2e(specPaths()),
  build: buildImages,
  // Fast checks first, then the test suites, then the production build
  check: () =>
    runSteps('check', [
      ...FAST_CHECKS,
      ['test:backend', STEPS.backend],
      ['test:frontend', STEPS.frontend],
      ['test:e2e', () => e2e([])],
      ['docker:build', buildImages],
    ]),
  // After each feature: the same, but e2e only for the named specs and no image build (CI runs everything)
  'check:feature': () => {
    const specs = specPaths();
    if (specs.length === 0) {
      console.error(
        'Name the e2e specs of the feature, e.g. npm run check:feature -- public browse',
      );
      return 2;
    }
    return runSteps('check:feature', [
      ...FAST_CHECKS,
      ['test:backend', STEPS.backend],
      ['test:frontend', STEPS.frontend],
      [`test:e2e (${specs.join(', ')})`, () => e2e(specs)],
    ]);
  },
};

const target = process.argv[2];
const step = STEPS[target];
if (!step) {
  console.error(`Usage: node scripts/docker-test.mjs <${Object.keys(STEPS).join('|')}>`);
  process.exit(2);
}
process.exit(step());
