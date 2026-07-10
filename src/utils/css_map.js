import { inject } from './inject.js';

/**
 * The dictionary, supplied by the Tumblr web platform API for third-party extensions, that translates source
 * CSS class names as written internally by Tumblr developers (e.g. "container") to generated class names
 * that appear in the DOM (e.g. ["Emdd2", "XKCjm"...]).
 *
 * Note: the same semantic source name can be used in multiple unrelated components (Tumblr uses scoped css),
 * resulting in multiple generated class names that cannot be distinguished between using only this information.
 * @see https://github.com/tumblr/docs/blob/master/web-platform.md#getcssmap
 * @type {Record<string, string[]>}
 */
export const cssMap = await inject('/main_world/css_map.js');

/**
 * @param {...string} keys One or more element source names
 * @returns {string[]} An array of generated classnames from the CSS map
 */
export const keyToClasses = (...keys) => keys.flatMap(key => cssMap[key]).filter(Boolean);

/**
 * @param {...string} keys One or more element source names
 * @returns {string} A CSS :is() selector which targets all elements that match any of the given source names
 */
export const keyToCss = function (...keys) {
  const classes = keyToClasses(...keys);
  return `:is(${classes.map(className => `.${className}`).join(', ')})`;
};
