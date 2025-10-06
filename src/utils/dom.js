/** @typedef {Record<string, string>} Attributes */
/** @typedef {Record<string, () => void>} Events */

/**
 * Create elements with simple syntax
 * @param {string} tagName - Type of element to create
 * @param {Record<string, string>} [attributes] - Property-value pairs to set as HTML/XML attributes (e.g. { href: '/' })
 * @param {Record<string, () => void>} [events] - Property-value pairs to set as event listeners (e.g. { click: () => {} })
 * @param {(string | Node)[]} [children] - Zero or more valid children
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

/** @typedef {Record<"children", (string | Node)[] | undefined>} Children */
/** @typedef {Attributes & Events & Children} Properties */

/**
 * Create elements with even simpler syntax
 * @param {string} tagName Type of element to create
 * @param {Properties} properties Property-value pairs to set as HTML/XML attributes, event listeners, or children
 * @returns {Element} Element created to specification
 * @example element('a', { href: '/' }) => <a href="/">
 */
function element (tagName, properties = {}) {
  const element = properties?.xmlns
    ? document.createElementNS(properties.xmlns, tagName)
    : document.createElement(tagName);

  const { children = [], ...propertiesWithoutChildren } = properties;
  const attributes = Object.entries(propertiesWithoutChildren).filter(([key, value]) => typeof value === 'string');
  const events = Object.entries(propertiesWithoutChildren).filter(([key, value]) => typeof value === 'function');

  element.replaceChildren(children);
  attributes.forEach(([name, value]) => element.setAttribute(name, value));
  events.forEach(([type, listener]) => element.addEventListener(type, listener));

  element.normalize();
  return element;
}

export const button = (props = {}) => element('button', props);
export const div = (props = {}) => element('div', props);
export const h3 = (props = {}) => element('h3', props);
export const img = (props = {}) => element('img', props);
export const input = (props = {}) => element('input', props);
export const label = (props = {}) => element('label', props);
export const p = (props = {}) => element('p', props);
export const span = (props = {}) => element('span', props);
export const strong = (props = {}) => element('strong', props);
export const style = (props = {}) => element('style', props);

export const svg = (props = {}) => element('svg', { xmlns: 'http://www.w3.org/2000/svg', ...props });
export const use = (props = {}) => element('use', { xmlns: 'http://www.w3.org/2000/svg', ...props });
