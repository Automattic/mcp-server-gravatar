const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
  ignorePatterns: ['.*.{js,cjs}', '**/node_modules/**', '**/dist/**', 'src/generated/**'],
  plugins: ['@typescript-eslint', 'import', 'unused-imports'],
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  overrides: [
    // TypeScript
    {
      files: ['**/*.{ts,tsx,mjs}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
        'prettier', // disable rules that conflict with prettier
      ],
      rules: {
        '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        'unused-imports/no-unused-imports': 'warn',
        '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        'prefer-const': 'warn',
        'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
        'no-empty': 'warn',
        // Consider adding this rule when implementing the logging utility
        // 'no-console': ['warn', { allow: ['warn', 'error'] }],
      },
    },

    // Node
    {
      files: ['.eslintrc.cjs', 'vitest.config.ts'],
      env: {
        node: true,
      },
    },
  ],
};
