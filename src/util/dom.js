/**
 * Create elements with simple syntax
 * @template {keyof HTMLElementTagNameMap} TagName
 * @param {TagName} tagName - Type of element to create
 * @param {object} [attributes] - Property-value pairs to set as HTML/XML attributes (e.g. { href: '/' })
 * @param {object} [events] - Property-value pairs to set as event listeners (e.g. { click: () => {} })
 * @param {(Node|string)[]} [children] - Zero or more valid children
 * @returns {HTMLElementTagNameMap[TagName]} Element created to specification
 */
export function dom (tagName, attributes = {}, events = {}, children = []) {
  const element = document.createElement(tagName);

  attributes && Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  events && Object.entries(events).forEach(([type, listener]) => element.addEventListener(type, listener));
  children && element.replaceChildren(...children);

  element.normalize();
  return element;
}

/**
 * Create elements with simple syntax
 * @template {keyof SVGElementTagNameMap} TagName
 * @param {TagName} tagName - Type of element to create
 * @param {object} attributes - Property-value pairs to set as HTML/XML attributes (e.g. { href: '/' })
 * @param {object} [events] - Property-value pairs to set as event listeners (e.g. { click: () => {} })
 * @param {(Node|string)[]} [children] - Zero or more valid children
 * @returns {SVGElementTagNameMap[TagName]} Element created to specification
 */
export function domSvg (tagName, attributes, events = {}, children = []) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);

  attributes && Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  events && Object.entries(events).forEach(([type, listener]) => element.addEventListener(type, listener));
  children && element.replaceChildren(...children);

  element.normalize();
  return element;
}
