import { FlatCompat } from '@eslint/eslintrc';
import base from './base.mjs';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...base,
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
