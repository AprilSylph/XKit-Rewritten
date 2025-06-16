import jsdoc from 'eslint-plugin-jsdoc';
import neostandard, { plugins } from 'neostandard';

export default [
  ...neostandard({
    env: ['browser', 'jquery', 'webextensions'],
    ignores: ['src/lib/**'],
    semi: true,
  }),
  { plugins, rules: { 'import-x/no-cycle': 'error' } },
  jsdoc.configs['flat/recommended'],
];
