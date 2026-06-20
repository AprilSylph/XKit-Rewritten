/** @typedef {Record<string, string>} Attributes */
/** @typedef {Record<string, (event: Event) => void>} Events */
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

/**
 * @template {HTMLElement | SVGElement | MathMLElement} T
 * @typedef {(props?: Properties, children?: Children) => T} E
 */
/**
 * @template {HTMLElement | SVGElement | MathMLElement} T
 * @typedef {(props?: Properties) => T} V
 */

/** @type {E<HTMLAnchorElement>}    */ export const a = (props = {}, children = []) => element('a', props, children);
/** @type {E<HTMLButtonElement>}    */ export const button = (props = {}, children = []) => element('button', props, children);
/** @type {E<HTMLCanvasElement>}    */ export const canvas = (props = {}, children = []) => element('canvas', props, children);
/** @type {E<HTMLDataListElement>}  */ export const datalist = (props = {}, children = []) => element('datalist', props, children);
/** @type {E<HTMLDivElement>}       */ export const div = (props = {}, children = []) => element('div', props, children);
/** @type {E<HTMLFieldSetElement>}  */ export const fieldset = (props = {}, children = []) => element('fieldset', props, children);
/** @type {E<HTMLElement>}          */ export const figcaption = (props = {}, children = []) => element('figcaption', props, children);
/** @type {E<HTMLFormElement>}      */ export const form = (props = {}, children = []) => element('form', props, children);
/** @type {E<HTMLHeadingElement>}   */ export const h1 = (props = {}, children = []) => element('h1', props, children);
/** @type {E<HTMLHeadingElement>}   */ export const h3 = (props = {}, children = []) => element('h3', props, children);
/** @type {E<HTMLLabelElement>}     */ export const label = (props = {}, children = []) => element('label', props, children);
/** @type {E<HTMLLIElement>}        */ export const li = (props = {}, children = []) => element('li', props, children);
/** @type {E<HTMLOptionElement>}    */ export const option = (props = {}, children = []) => element('option', props, children);
/** @type {E<HTMLParagraphElement>} */ export const p = (props = {}, children = []) => element('p', props, children);
/** @type {E<HTMLSelectElement>}    */ export const select = (props = {}, children = []) => element('select', props, children);
/** @type {E<HTMLElement>}          */ export const small = (props = {}, children = []) => element('small', props, children);
/** @type {E<HTMLSpanElement>}      */ export const span = (props = {}, children = []) => element('span', props, children);
/** @type {E<HTMLElement>}          */ export const strong = (props = {}, children = []) => element('strong', props, children);
/** @type {E<HTMLStyleElement>}     */ export const style = (props = {}, children = []) => element('style', props, children);
/** @type {E<HTMLTableElement>}     */ export const table = (props = {}, children = []) => element('table', props, children);
/** @type {E<HTMLTableCellElement>} */ export const td = (props = {}, children = []) => element('td', props, children);
/** @type {E<HTMLTableCellElement>} */ export const th = (props = {}, children = []) => element('th', props, children);
/** @type {E<HTMLTableRowElement>}  */ export const tr = (props = {}, children = []) => element('tr', props, children);
/** @type {E<HTMLUListElement>}     */ export const ul = (props = {}, children = []) => element('ul', props, children);

/** @type {V<HTMLBRElement>}        */ export const br = (props = {}) => element('br', props);
/** @type {V<HTMLHRElement>}        */ export const hr = (props = {}) => element('hr', props);
/** @type {V<HTMLImageElement>}     */ export const img = (props = {}) => element('img', props);
/** @type {V<HTMLInputElement>}     */ export const input = (props = {}) => element('input', props);
/** @type {V<HTMLLinkElement>}      */ export const link = (props = {}) => element('link', props);

/** @type {E<SVGPathElement>} */ export const path = (props = {}, children = []) => element('path', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
/** @type {E<SVGSVGElement>}  */ export const svg = (props = {}, children = []) => element('svg', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
/** @type {E<SVGUseElement>}  */ export const use = (props = {}, children = []) => element('use', { xmlns: 'http://www.w3.org/2000/svg', ...props }, children);
