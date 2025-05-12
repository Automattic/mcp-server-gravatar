import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        ignores: ['.*.{js,cjs}', '**/node_modules/**', '**/dist/**', 'src/generated/**'],
    },
    {
        files: ['**/*.{ts,tsx,mjs}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2024,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            'import': importPlugin,
            'unused-imports': unusedImportsPlugin,
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            // Disable rules that require type checking
            '@typescript-eslint/no-floating-promises': 'off',
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
        },
    },
    {
        files: ['eslint.config.js', 'vitest.config.ts'],
        languageOptions: {
            globals: {
                node: true,
            },
        },
    },
];
