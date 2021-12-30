module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/vue3-essential', '@vue/airbnb', '@vue/typescript/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-lone-blocks': 'warn',
    // '@typescript-eslint/no-explicit-any': 'off',
    // 'class-methods-use-this': 'off',
    // 'operator-linebreak': 'off',
    // 'lines-between-class-members': 'off',
    // 'implicit-arrow-linebreak': 'off',
    // semi: 'off',
    // 'semi-style': 'off',
    // 'linebreak-style': 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
      env: {
        mocha: true,
      },
    },
  ],
}
