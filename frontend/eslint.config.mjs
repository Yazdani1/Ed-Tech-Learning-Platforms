import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },

  eslint.configs.recommended,
  tseslint.configs.recommended,

  // React flat config (handles react plugin + react/react-in-jsx-scope off)
  reactPlugin.configs.flat['jsx-runtime'],

  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // ── Unused imports: auto-removed on save ──────────────────────────
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // ── TypeScript ────────────────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': 'off', // handled by unused-imports
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // ── React Hooks ───────────────────────────────────────────────────
      ...reactHooks.configs['recommended-latest'].rules,

      // ── React Refresh (Vite HMR) ──────────────────────────────────────
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── React ─────────────────────────────────────────────────────────
      'react/prop-types': 'off', // TypeScript covers this
      'react/self-closing-comp': 'error',

      // ── General ───────────────────────────────────────────────────────
      'no-duplicate-imports': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);
