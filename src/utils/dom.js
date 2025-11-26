/** @typedef {Record<string, string>} Attributes */
/** @typedef {Record<string, () => void>} Events */
/** @typedef {(string | Node)[]} Children */

/**
 * Create elements with simple syntax
 * @deprecated Obsoleted by `element()` and element-specific shorthand functions.
 * @param {string} tagName Type of element to create
 * @param {Attributes} [attributes] Property-value pairs to set as HTML/XML attributes (e.g. { href: '/' })
 * @param {Events} [events] Property-value pairs to set as event listeners (e.g. { click: () => {} })
 * @param {Children} [children] Zero or more valid children
 * @returns {HTMLElement | SVGElement | MathMLElement} Element created to specification
 */
export function dom (tagName, attributes = {}, events = {}, children = []) {
  const element = attributes?.xmlns
    ? document.createElementNS(attributes.xmlns, tagName)
    : document.createElement(tagName);

  attributes && Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  events && Object.entries(events).forEach(([type, listener]) => element.addEventListener(type, listener));
  children && element.replaceChildren(...children);

  element.normalize();
  return element;
}

/** @typedef {Attributes & Events} Properties */

/**
 * Create elements with very simple syntax
 * @param {string} tagName Type of element to create
 * @param {Properties} [properties] Property-value pairs to set as HTML/XML attributes or event listeners
 * @param {Children} [children] Zero or more valid children
 * @returns {HTMLElement | SVGElement | MathMLElement} Element created to specification
 * @example element('a', { href: '/' }) => <a href="/">
 */
export function element (tagName, properties = {}, children = []) {
  const element = properties?.xmlns
    ? document.createElementNS(properties.xmlns, tagName)
    : document.createElement(tagName);

  const attributes = Object.entries(properties).filter(([key, value]) => typeof value !== 'function');
  const events = Object.entries(properties).filter(([key, value]) => typeof value === 'function');

  element.replaceChildren(...children);
  attributes.forEach(([name, value]) => element.setAttribute(name, value));
  events.forEach(([type, listener]) => element.addEventListener(type, listener));

  element.normalize();
  return element;
}

/** @typedef {(props?: Properties, children?: Children) => HTMLElement} HTMLShorthand */
/** @typedef {(props?: Properties) => HTMLElement} VoidHTMLShorthand */
/** @typedef {(props?: Properties, children?: Children) => SVGElement} SVGShorthand */

/** @type {HTMLShorthand} */ export const a = (props = {}, children = []) => element('a', props, children);
/** @type {HTMLShorthand} */ export const button = (props = {}, children = []) => element('button', props, children);
/** @type {HTMLShorthand} */ export const canvas = (props = {}, children = []) => element('canvas', props, children);
/** @type {HTMLShorthand} */ export const datalist = (props = {}, children = []) => element('datalist', props, children);
/** @type {HTMLShorthand} */ export const div = (props = {}, children = []) => element('div', props, children);
/** @type {HTMLShorthand} */ export const fieldset = (props = {}, children = []) => element('fieldset', props, children);
/** @type {HTMLShorthand} */ export const figcaption = (props = {}, children = []) => element('figcaption', props, children);
/** @type {HTMLShorthand} */ export const form = (props = {}, children = []) => element('form', props, children);
/** @type {HTMLShorthand} */ export const h1 = (props = {}, children = []) => element('h1', props, children);
/** @type {HTMLShorthand} */ export const h3 = (props = {}, children = []) => element('h3', props, children);
/** @type {HTMLShorthand} */ export const label = (props = {}, children = []) => element('label', props, children);
/** @type {HTMLShorthand} */ export const li = (props = {}, children = []) => element('li', props, children);
/** @type {HTMLShorthand} */ export const option = (props = {}, children = []) => element('option', props, children);
/** @type {HTMLShorthand} */ export const p = (props = {}, children = []) => element('p', props, children);
/** @type {HTMLShorthand} */ export const select = (props = {}, children = []) => element('select', props, children);
/** @type {HTMLShorthand} */ export const small = (props = {}, children = []) => element('small', props, children);
/** @type {HTMLShorthand} */ export const span = (props = {}, children = []) => element('span', props, children);
/** @type {HTMLShorthand} */ export const strong = (props = {}, children = []) => element('strong', props, children);
/** @type {HTMLShorthand} */ export const style = (props = {}, children = []) => element('style', props, children);
/** @type {HTMLShorthand} */ export const table = (props = {}, children = []) => element('table', props, children);
/** @type {HTMLShorthand} */ export const td = (props = {}, children = []) => element('td', props, children);
/** @type {HTMLShorthand} */ export const th = (props = {}, children = []) => element('th', props, children);
/** @type {HTMLShorthand} */ export const tr = (props = {}, children = []) => element('tr', props, children);
/** @type {HTMLShorthand} */ export const ul = (props = {}, children = []) => element('ul', props, children);

/** @type {VoidHTMLShorthand} */ export const br = (props = {}) => element('br', props);
/** @type {VoidHTMLShorthand} */ export const hr = (props = {}) => element('hr', props);
/** @type {VoidHTMLShorthand} */ export const img = (props = {}) => element('img', props);
/** @type {VoidHTMLShorthand} */ export const input = (props = {}) => element('input', props);
/** @type {VoidHTMLShorthand} */ export const link = (props = {}) => element('link', props);

/** @type {SVGShorthand} */ export const path = (props = {}, children = []) => element('path', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
/** @type {SVGShorthand} */ export const svg = (props = {}, children = []) => element('svg', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
/** @type {SVGShorthand} */ export const use = (props = {}, children = []) => element('use', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
