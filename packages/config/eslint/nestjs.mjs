import base from './base.mjs';

export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
