import neostandard, { resolveIgnoresFromGitignore } from 'neostandard';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  ...neostandard({
    globals: {
      ...globals.browser,
      ...globals.es2021,
      ...globals.webextensions,
      ...globals.jquery
    },
    semi: true,
    ignores: [...resolveIgnoresFromGitignore(), 'src/lib/*']
  }),
  jsdoc.configs['flat/recommended'],
  {
    rules: {
      'import-x/no-cycle': 'error'
    }
  },
  {
    files: ['src/main_world/*'],
    rules: {
      'jsdoc/require-jsdoc': 'off'
    }
  }
];
