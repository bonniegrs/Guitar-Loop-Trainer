import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    prettier,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                Blob: 'readonly',
                FileReader: 'readonly',
                AudioContext: 'readonly',
                webkitAudioContext: 'readonly',
                HTMLElement: 'readonly',
                YT: 'readonly',
                console: 'readonly',
                navigator: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': 'warn',
            eqeqeq: ['error', 'always'],
            curly: ['error', 'multi-line'],
            'no-var': 'error',
            'prefer-const': 'error',
        },
    },
    {
        files: ['tests/**/*.js', 'e2e/**/*.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly',
                test: 'readonly',
                process: 'readonly',
            },
        },
        rules: {
            'no-console': 'off',
        },
    },
    {
        files: ['*.config.js'],
        languageOptions: {
            globals: {
                process: 'readonly',
            },
        },
    },
    {
        ignores: ['node_modules/', 'test-results/', 'playwright-report/', 'coverage/'],
    },
];
