import { inject } from './inject.js';

export const cssMap = await inject('/main_world/css_map.js');

/**
 * @param {...string} keys - One or more element source names
 * @returns {string[]} An array of generated classnames from the CSS map
 */
export const keyToClasses = (...keys) => keys.flatMap(key => cssMap[key]).filter(Boolean);

/**
 * @param {...string} keys - One or more element source names
 * @returns {string} - A CSS selector which targets all elements that match any of the given source names
 */
export const keyToCss = function (...keys) {
  const selectors = keyToClasses(...keys).map(className => `.${className}`);
  return selectors.length === 1
    ? selectors[0]
    : `:is(${selectors.join(', ')})`;
};
