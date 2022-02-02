import { getCssMap } from './tumblr_helpers.js';

/**
 * @param {...string} keys - One or more element source names
 * @returns {Promise<string[]>} An array of generated classnames from the CSS map
 */
export const keyToClasses = async function (...keys) {
  const cssMap = await getCssMap;
  return keys.flatMap(key => cssMap[key]);
};

/**
 * @param {...string} keys - One or more element source names
 * @returns {Promise<string>} - A CSS :is() selector which targets all elements that match any of the given source names
 */
export const keyToCss = async function (...keys) {
  const classes = await keyToClasses(...keys);
  return `:is(${classes.map(className => `.${className}`).join(', ')})`;
};

/**
 * Template tag for constructing strings with promise parts
 * e.g. resolveExpressions`article > ${keyToCss('reblog')}`
 *      => 'article > :is(.FHOOB, .u2tXn)'
 *
 * @param {string[]} strings - Raw string parts
 * @param {Promise<string>[]} expressions - Promises to resolve
 * @returns {Promise<string>} The input string with resolved promises
 */
export const resolveExpressions = async function (strings, ...expressions) {
  const resolvedExpressions = await Promise.all(expressions);
  return strings.map((string, index) => `${string}${resolvedExpressions[index] || ''}`).join('');
};
