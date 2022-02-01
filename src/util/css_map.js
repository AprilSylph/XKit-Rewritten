import { getCssMap } from './tumblr_helpers.js';

/**
 * @param {string} key - The source name of an element
 * @returns {Promise<string[]>} An array of generated classnames from the CSS map
 */
export const keyToClasses = async function (key) {
  const cssMap = await getCssMap;
  return cssMap[key];
};

/**
 * @param {string} key - The source name of an element
 * @returns {Promise<string>} - A CSS :is() selector which targets all elements with that source name
 */
export const keyToCss = async function (key) {
  const classes = await keyToClasses(key);
  return `:is(${classes.map(className => `.${className}`).join(', ')})`;
};

/**
 * Template tag for constructing strings with promise parts
 * e.g. resolveExpressions`article > ${keyToCss('footerWrapper')}`
 *
 * @param {string[]} strings - Raw string parts
 * @param {Promise<string>[]} expressions - Promises to resolve
 * @returns {Promise<string>} The input string with resolved promises
 */
export const resolveExpressions = async function (strings, ...expressions) {
  const resolvedExpressions = await Promise.all(expressions);
  return strings.map((string, index) => `${string}${resolvedExpressions[index] || ''}`).join('');
};
