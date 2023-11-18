import { inject } from './inject.js';

export const cssMap = await inject('/util/injected_get_css_map.js');

/**
 * @param {...string} keys - One or more element source names
 * @returns {string[]} An array of generated classnames from the CSS map
 */
export const keyToClasses = (...keys) => keys.flatMap(key => cssMap[key]).filter(Boolean);

/**
 * @param {...string} keys - One or more element source names
 * @returns {string} - A CSS :is() selector which targets all elements that match any of the given source names
 */
export const keyToCss = function (...keys) {
  const classes = keyToClasses(...keys);
  return `:is(${classes.map(className => `.${className}`).join(', ')})`;
};
