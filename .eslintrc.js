module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:jest/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'jest',
  ],
  rules: {
    'no-underscore-dangle': 'off',
    'max-classes-per-file': 'off',
    '@typescript-eslint/no-redeclare': 'off',
    'import/prefer-default-export': 'off',
  },
};
