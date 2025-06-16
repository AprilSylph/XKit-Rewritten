import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import globals from 'globals';

const languageOptions = {
  globals: {
    ...globals.browser,
    ...globals.jquery,
    ...globals.webextensions,
  },
  sourceType: 'module',
}

export default [
  { ignores: ['src/lib/**'] },
  { ...js.configs.recommended, languageOptions },
  { ...importPlugin.flatConfigs.recommended, languageOptions, rules: { 'import/no-cycle': 'error' } },
  jsdocPlugin.configs["flat/recommended"],
];
