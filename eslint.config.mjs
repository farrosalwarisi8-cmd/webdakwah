import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      '**/*.d.ts',
      '**/src/generated/**',
      '.tmp-shots/**',
      'scripts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Service worker berjalan di scope Worker, bukan browser/DOM biasa.
    files: ['apps/web/public/sw.js'],
    languageOptions: {
      globals: {
        AbortController: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        caches: 'readonly',
        clearTimeout: 'readonly',
        clients: 'readonly',
        fetch: 'readonly',
        self: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  prettier,
);
