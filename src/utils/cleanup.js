/**
 * Remove elements that have the specified ID from the document.
 * @param {string} id A string representing the ID of the element to remove.
 */
export function removeElementsById (id) {
  [...document.querySelectorAll(`#${CSS.escape(id)}`)].forEach(element => element.remove());
}

/**
 * Remove elements that have the specified class name from the document.
 * @param {string} className A string representing the class name of the elements to remove.
 */
export function removeElementsByClassName (className) {
  [...document.querySelectorAll(`.${CSS.escape(className)}`)].forEach(element => element.remove());
}

/**
 * Remove elements that have the specified attribute from the document.
 * @param {string} attribute A string representing the attribute name to match.
 */
export function removeElementsByAttribute (attribute) {
  [...document.querySelectorAll(`[${CSS.escape(attribute)}]`)].forEach(element => element.remove());
}

/**
 * Remove elements that match the given CSS selector from the document.
 * @param {string} selector A string containing one or more selectors to match.
 */
export function removeElementsBySelector (selector) {
  [...document.querySelectorAll(selector)].forEach(element => element.remove());
}

/**
 * Remove child elements that have the specified attribute from a parent element.
 * @param {Element} parentNode The element to remove children from.
 * @param {string} attribute A string representing the attribute name to match.
 */
export function removeChildrenByAttribute (parentNode, attribute) {
  [...parentNode.querySelectorAll(`:scope > [${CSS.escape(attribute)}]`)].forEach(element => element.remove());
}

/**
 * Remove the specified class name from all elements in the document.
 * @param {string} className A string representing the class name to remove.
 */
export function removeClassNameFromElements (className) {
  [...document.querySelectorAll(`.${CSS.escape(className)}`)].forEach(element => element.classList.remove(className));
}

/**
 * Remove the specified attribute from all elements in the document.
 * @param {string} attribute A string representing the name of the attribute to remove.
 */
export function removeAttributeFromElements (attribute) {
  [...document.querySelectorAll(`[${CSS.escape(attribute)}]`)].forEach(element => element.removeAttribute(attribute));
}
