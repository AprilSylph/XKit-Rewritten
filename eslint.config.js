/** @see https://github.com/un-ts/eslint-plugin-import-x#readme */ import { importX } from 'eslint-plugin-import-x';
/** @see https://github.com/gajus/eslint-plugin-jsdoc#readme    */ import { jsdoc } from 'eslint-plugin-jsdoc';
/** @see https://github.com/neostandard/neostandard#readme      */ import neostandard from 'neostandard';

export default [
  /**
   * Semistandard style guide.
   *
   * Includes the following plugins and makes them available for use:
   * - `@stylistic`
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
   * Enforce consistent use of trailing commas in object and array literals.
   * @see https://eslint.style/rules/comma-dangle
   */
  { rules: { '@stylistic/comma-dangle': ['warn', 'always-multiline'] } },

  /**
   * Enable plugin `import-x` and use its recommended config.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/src/config/flat/recommended.ts
   */
  importX.configs['flat/recommended'],

  /**
   * Prevent cyclical imports; enforce alphabetical imports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-cycle.md
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/order.md
   */
  {
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/order': ['warn', { alphabetize: { order: 'asc', caseInsensitive: true } }],
    },
  },

  /** Enable plugin `jsdoc` and use its recommended config. */
  jsdoc({ config: 'flat/recommended' }),

  /**
   * Disallow hyphens before param descriptions. Prevents IntelliSense from showing parameter descriptions as bullet points.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-hyphen-before-param-description.md
   */
  { rules: { 'jsdoc/require-hyphen-before-param-description': ['error', 'never', { tags: { '*': 'never' } }] } },

  /**
   * Do not require JSDoc on "main world" injected scripts, which have definitions
   * which make them _look_ reusable, but are only used by the `inject()` util.
   * @see https://github.com/AprilSylph/XKit-Rewritten/blob/master/src/utils/inject.js
   */
  { files: ['src/main_world/**'], rules: { 'jsdoc/require-jsdoc': 'off' } },
];
