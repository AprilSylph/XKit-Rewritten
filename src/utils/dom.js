/** @typedef {Record<string, string>} Attributes */
/** @typedef {Record<string, () => void>} Events */
/** @typedef {(string | Node)[]} Children */

/**
 * Create elements with simple syntax
 * @param {string} tagName - Type of element to create
 * @param {Attributes} [attributes] - Property-value pairs to set as HTML/XML attributes (e.g. { href: '/' })
 * @param {Events} [events] - Property-value pairs to set as event listeners (e.g. { click: () => {} })
 * @param {Children} [children] - Zero or more valid children
 * @returns {Element} Element created to specification
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

/**
 * Create elements with even simpler syntax
 * @param {string} tagName Type of element to create
 * @param {Attributes & Events} [properties] Property-value pairs to set as HTML/XML attributes or event listeners
 * @param {Children} [children] Zero or more valid children
 * @returns {Element} Element created to specification
 * @example element('a', { href: '/' }) => <a href="/">
 */
export function element (tagName, properties = {}, children = []) {
  const element = properties?.xmlns
    ? document.createElementNS(properties.xmlns, tagName)
    : document.createElement(tagName);

  const attributes = Object.entries(properties).filter(([key, value]) => typeof value === 'string');
  const events = Object.entries(properties).filter(([key, value]) => typeof value === 'function');

  element.replaceChildren(children);
  attributes.forEach(([name, value]) => element.setAttribute(name, value));
  events.forEach(([type, listener]) => element.addEventListener(type, listener));

  element.normalize();
  return element;
}

export const a = (props = {}, children = []) => element('a', props, children);
export const button = (props = {}, children = []) => element('button', props, children);
export const datalist = (props = {}, children = []) => element('datalist', props, children);
export const div = (props = {}, children = []) => element('div', props, children);
export const fieldset = (props = {}, children = []) => element('fieldset', props, children);
export const form = (props = {}, children = []) => element('form', props, children);
export const h1 = (props = {}, children = []) => element('h1', props, children);
export const h3 = (props = {}, children = []) => element('h3', props, children);
export const hr = (props = {}, children = []) => element('hr', props, children);
export const img = (props = {}, children = []) => element('img', props, children);
export const input = (props = {}, children = []) => element('input', props, children);
export const label = (props = {}, children = []) => element('label', props, children);
export const li = (props = {}, children = []) => element('li', props, children);
export const option = (props = {}, children = []) => element('option', props, children);
export const p = (props = {}, children = []) => element('p', props, children);
export const select = (props = {}, children = []) => element('select', props, children);
export const small = (props = {}, children = []) => element('small', props, children);
export const span = (props = {}, children = []) => element('span', props, children);
export const strong = (props = {}, children = []) => element('strong', props, children);
export const style = (props = {}, children = []) => element('style', props, children);
export const table = (props = {}, children = []) => element('table', props, children);
export const td = (props = {}, children = []) => element('td', props, children);
export const th = (props = {}, children = []) => element('th', props, children);
export const tr = (props = {}, children = []) => element('tr', props, children);
export const ul = (props = {}, children = []) => element('ul', props, children);

export const path = (props = {}, children = []) => element('path', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
export const svg = (props = {}, children = []) => element('svg', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
export const use = (props = {}, children = []) => element('use', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
