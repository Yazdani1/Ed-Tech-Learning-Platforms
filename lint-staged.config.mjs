// Runs on staged files before every commit (husky pre-commit hook).
// Whole-project checks (typecheck, arch:check, generated docs) run once in .husky/pre-commit.
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
};
