/** @typedef {Record<string, string>} Attributes */
/** @typedef {Record<string, () => void>} Events */
/** @typedef {(string | Node)[]} Children */

/**
 * Create elements with simple syntax
 * @param {string} tagName - Type of element to create
 * @param {Record<string, string>} [attributes] - Property-value pairs to set as HTML/XML attributes (e.g. { href: '/' })
 * @param {Record<string, () => void>} [events] - Property-value pairs to set as event listeners (e.g. { click: () => {} })
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
function element (tagName, properties = {}, children = []) {
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

export const button = (props = {}, children = []) => element('button', props, children);
export const div = (props = {}, children = []) => element('div', props, children);
export const h3 = (props = {}, children = []) => element('h3', props, children);
export const img = (props = {}, children = []) => element('img', props, children);
export const input = (props = {}, children = []) => element('input', props, children);
export const label = (props = {}, children = []) => element('label', props, children);
export const p = (props = {}, children = []) => element('p', props, children);
export const span = (props = {}, children = []) => element('span', props, children);
export const strong = (props = {}, children = []) => element('strong', props, children);
export const style = (props = {}, children = []) => element('style', props, children);

export const svg = (props = {}, children = []) => element('svg', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
export const use = (props = {}, children = []) => element('use', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
