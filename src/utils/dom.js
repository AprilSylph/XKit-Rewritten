/**
 * Create elements with simple syntax
 * @param {string} tagName - Type of element to create
 * @param {object} [attributes] - Property-value pairs to set as HTML/XML attributes (e.g. { href: '/' })
 * @param {object} [events] - Property-value pairs to set as event listeners (e.g. { click: () => {} })
 * @param {(Node|string)[]} [children] - Zero or more valid children
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
