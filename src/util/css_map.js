import { getCssMap } from './tumblr_helpers.js';
import { cartesian } from './misc.js';

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
 * Template tag for constructing selectors with promise parts
 * e.g. asyncSelector`article > ${keyToCss('footerWrapper')}`
 *
 * @param {string[]} strings - Raw string parts
 * @param  {Promise<string>[]} expressions - Promises to resolve
 * @returns {Promise<string>} The input string with resolved promises
 */
export const asyncSelector = async function (strings, ...expressions) {
  const resolvedExpressions = await Promise.all(expressions);
  return strings.map((string, index) => `${string}${resolvedExpressions[index] || ''}`).join('');
};

/**
 * Constructs a descendant selector which accounts for all possible
 * combinations of each source name. For example, if 'main' and 'timeline'
 * both map to two generated classnames:
 * keyToClasses('main') = [ "_2U2YY", "_27pa2" ]
 * keyToClasses('timeline') = [ "cfpPU", "_3ItSq" ]
 * then passing ('main', 'timeline') to this function will return
 * "._2U2YY .cfpPU, ._2U2YY ._3ItS, ._27pa2 .cfpPU, ._27pa2 ._3ItSq"
 * which targets any 'timeline' contained in any 'main'.
 *
 * @param {...string} keys - One or more element source names
 * @returns {Promise<string>} - A CSS selector
 */
export const descendantSelector = async function (...keys) {
  const sets = [];

  for (const key of keys) {
    const set = await keyToClasses(key);
    sets.push(set.map(className => `.${className}`));
  }

  return cartesian(...sets)
    .map(selectors => selectors.join(' '))
    .join(', ');
};
