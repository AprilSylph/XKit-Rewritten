import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import neostandard from 'neostandard';

export default [
  ...neostandard({
    env: ['browser', 'jquery', 'webextensions'],
    ignores: ['src/lib/**'],
    semi: true,
  }),
  {
    ...importPlugin.flatConfigs.recommended,
    languageOptions: { sourceType: 'module' },
    rules: { 'import/no-cycle': 'error' }
  },
  jsdocPlugin.configs['flat/recommended'],
];
