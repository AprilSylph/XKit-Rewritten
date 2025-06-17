import jsdoc from 'eslint-plugin-jsdoc';
import neostandard from 'neostandard';

export default [
  /**
   * Semistandard style guide, via neostandard package.
   * @see https://github.com/neostandard/neostandard?tab=readme-ov-file#readme
   *
   * Includes the following plugins and makes them available for use:
   * - `@stylistic`
   * - `import-x`
   * - `n`
   * - `promise`
   * - `react`
   * - `typescript-eslint`
   */
  ...neostandard({
    env: ['browser', 'jquery', 'webextensions'],
    ignores: ['src/lib/**'],
    semi: true,
  }),

  /**
   * Prevent circular imports. Relies on `import-x` plugin via neostandard.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-cycle.md
   */
  { rules: { 'import-x/no-cycle': 'error' } },

  /**
   * Import eslint-plugin-jsdoc and use its recommended config.
   * @see https://github.com/gajus/eslint-plugin-jsdoc?tab=readme-ov-file#readme
   */
  jsdoc.configs['flat/recommended'],

  /**
   * Do not require JSDoc on "main world" injected scripts, which have definitions
   * which make them look reusable but are only used by the `inject()` util.
   * @see https://github.com/AprilSylph/XKit-Rewritten/blob/master/src/utils/inject.js
   */
  { files: ['src/main_world/**'], rules: { 'jsdoc/require-jsdoc': 'off' } },
];
