import { inject } from './inject.js';

export const cssMap = await inject(async () => window.tumblr.getCssMap());

/**
 * @param {...string} keys - One or more element source names
 * @returns {string[]} An array of generated classnames from the CSS map
 */
export const keyToClasses = (...keys) => keys.flatMap(key => cssMap[key]).filter(Boolean);

/**
 * @param {...string} keys - One or more element source names
 * @returns {string} - A CSS :is() selector which targets all elements that match any of the given source names
 */
export const keyToCss = (...keys) =>
  `:is(${keyToClasses(...keys).map(className => `.${className}`).join(', ')})`;

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
