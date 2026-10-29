// Runs on staged files before every commit (husky pre-commit hook).
import { existsSync } from 'node:fs';

const GENERATED_DOCS = 'docs/database.md docs/dependency-graph.md';
// The docs generators arrive in Stage A Phase 6; until then the docs step is skipped.
const HAS_DOCS_SCRIPTS = existsSync('scripts/docs/generate-erd.mjs');
const docsSteps = HAS_DOCS_SCRIPTS ? ['npm run docs:generate', `git add ${GENERATED_DOCS}`] : [];

const quote = (files) => files.map((file) => `"${file}"`).join(' ');

export default {
  // Frontend (Next.js): format, then lint with zero warnings
  'frontend/**/*.{ts,tsx}': (files) => [
    `prettier --write ${quote(files)}`,
    `node frontend/node_modules/eslint/bin/eslint.js --fix --max-warnings=0 ${quote(files)}`,
  ],
  // Backend: never reformatted; only checked with its own ESLint config (errors block the commit)
  'backend/src/**/*.ts': (files) =>
    `node backend/node_modules/eslint/bin/eslint.js ${quote(files)}`,
  // New backend test files are formatted like the rest of the new code
  'backend/{tests/**/*.ts,vitest.config.mts}': ['prettier --write'],
  // Everything else Prettier knows (it skips the paths in .prettierignore)
  '*.{js,mjs,cjs,json,md,yml,yaml,css}': ['prettier --write --ignore-unknown'],
  // Once per commit when code changes: type-check both apps, check the frontend architecture rules,
  // refresh the generated diagrams (database.md comes from backend/src/models) and add them to the commit.
  '**/*.{ts,tsx}': () => ['npm run typecheck', 'npm run arch:check', ...docsSteps],
};
