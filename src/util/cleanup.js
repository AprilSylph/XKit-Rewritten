/**
 * Get all elements on the current page with the given css class.
 * (Elements may be returned more than once if called with multiple class names.)
 *
 * @param  {...string} classNames - one or more class names to select elements
 * @returns {Element[]} All elements on the page with the given classnames
 */
const getElementsByClassName = (...classNames) =>
  classNames.flatMap(className => [...document.getElementsByClassName(className)]);

/**
 * Remove all elements on the current page with the given css class.
 * i.e. jQuery $(`.${className}`).remove();
 *
 * @param {...string} classNames - one or more class names to select elements to remove
 * @returns {void}
 */
export const removeElementsByClassName = (...classNames) =>
  getElementsByClassName(...classNames).forEach(element => element.remove());

/**
 * Remove the given css class from all elements on the current page that have it.
 * i.e. jQuery $(`.${className}`).removeClass(className);
 *
 * @param {...string} classNames - one or more class names to remove
 * @returns {void}
 */
export const removeClass = (...classNames) =>
  classNames.forEach(className =>
    getElementsByClassName(className).forEach(element => element.classList.remove(className))
  );

/**
 * Remove the given attribute from all elements on the current page that have it.
 * i.e. jQuery $(`[${dashStylename}]`).removeAttr(dashStylename);
 *
 * @param {...string} attributes - one or more attributes to remove, in dash-style
 * @returns {void}
 */
export const removeAttr = (...attributes) =>
  attributes.forEach(attribute =>
    [...document.querySelectorAll(`[${attribute}]`)].forEach(element =>
      element.removeAttribute(attribute)
    )
  );

const dashStyle = string => string.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

/**
 * Remove the given data attribute from all elements on the current page that have it.
 *
 * @param {...string} dataAttributes - one or more data attributes to remove, in camelCase
 * @returns {void}
 */
export const removeDataset = (...dataAttributes) =>
  dataAttributes.forEach(dataAttribute => removeAttr(`data-${dashStyle(dataAttribute)}`));
