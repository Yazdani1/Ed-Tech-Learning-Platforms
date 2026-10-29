#!/usr/bin/env node
// Test and check runner (works the same on Windows, macOS and Linux; no `make` needed).
// Each test stack runs in its own Docker project and is removed afterwards, even when tests fail.
//
//   node scripts/docker-test.mjs backend    (npm run test:backend)   Vitest + Supertest against mongo-test
//   node scripts/docker-test.mjs frontend   (npm run test:frontend)  Vitest + React Testing Library + MSW
//   node scripts/docker-test.mjs e2e        (npm run test:e2e)       Playwright, desktop + mobile
//   node scripts/docker-test.mjs build      (npm run docker:build)   backend production image builds
//   node scripts/docker-test.mjs check      (npm run check)          everything above + lint, types, docs

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

/** One test service in the test stack, then the stack is removed (keeps the test's exit code). */
function testService(service, extra = []) {
  checkDocker();
  const status = run('docker', [
    'compose',
    ...TEST_STACK,
    ...extra,
    'run',
    '--rm',
    '--build',
    service,
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

const STEPS = {
  backend: () => testService('backend-test'),
  frontend: () => testService('frontend-test'),
  e2e: () => testService('playwright', E2E),
  build: buildImages,
  // Fast checks first, then the test suites, then the production build
  check: () => {
    const steps = [
      ['lint', () => run(NPM, ['run', 'lint'])],
      ['typecheck', () => run(NPM, ['run', 'typecheck'])],
      ['format:check', () => run(NPM, ['run', 'format:check'])],
      ['docs:check', () => run(NPM, ['run', 'docs:check'])],
      ['test:backend', STEPS.backend],
      ['test:frontend', STEPS.frontend],
      ['test:e2e', STEPS.e2e],
      ['docker:build', buildImages],
    ];
    for (const [name, step] of steps) {
      if (step() !== 0) {
        console.error(`\ncheck FAILED at: ${name}`);
        return 1;
      }
    }
    console.log('\ncheck passed');
    return 0;
  },
};

const target = process.argv[2];
const step = STEPS[target];
if (!step) {
  console.error(`Usage: node scripts/docker-test.mjs <${Object.keys(STEPS).join('|')}>`);
  process.exit(2);
}
process.exit(step());
