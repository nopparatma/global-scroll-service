import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '*.js', '*.mjs', '*.cjs', '*.config.ts'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
    },
  }
);
