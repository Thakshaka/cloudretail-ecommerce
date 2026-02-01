module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'consistent-return': 'off',
    'no-underscore-dangle': 'off',
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'no-param-reassign': ['error', { props: false }],
    'max-len': ['error', { code: 120, ignoreComments: true }]
  }
};
