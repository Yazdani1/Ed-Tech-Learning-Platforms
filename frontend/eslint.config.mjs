// ESLint flat config for the Next.js frontend. Enforces the code rules in CLAUDE.md.
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const MAX_FILE_LINES = 1000;
const MAX_FUNCTION_LINES = 60;

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      '*.config.{js,mjs,cjs}',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
      'unused-imports': unusedImports,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,

      // Size limits
      'max-lines': ['error', { max: MAX_FILE_LINES }],
      'max-lines-per-function': [
        'warn',
        { max: MAX_FUNCTION_LINES, skipBlankLines: true, skipComments: true },
      ],

      // Types
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': 'off', // handled by unused-imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Hygiene and security
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'Never render raw HTML (XSS). Sanitise rich text in a dedicated viewer component.',
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Use utils/storage (never for tokens: auth uses the httpOnly cookie).',
        },
      ],
    },
  },
  prettier,
);
