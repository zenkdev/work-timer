import globals from 'globals';
import js from '@eslint/js';
import react from 'eslint-plugin-react/configs/recommended.js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactJsx from 'eslint-plugin-react/configs/jsx-runtime.js';
import ts from 'typescript-eslint';
import { fixupConfigRules } from '@eslint/compat';

export default [
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...ts.configs.stylistic,
  ...fixupConfigRules([
    {
      ...react,
      settings: {
        react: { version: 'detect' },
      },
    },
    reactJsx,
  ]),
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'function-declaration',
          unnamedComponents: 'arrow-function',
        },
      ],
      'newline-before-return': 'error',
      'no-duplicate-imports': ['error', { includeExports: true }],
      'no-inner-declarations': 'error',
      'no-multiple-empty-lines': 'error',
    },
  },
  { ignores: ['dist/', '**/*.d.ts'] },
];
