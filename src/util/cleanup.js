/**
 * Removes all elements on the current page with the given css class.
 * i.e. jQuery $(`.${className}`).remove();
 *
 * @param {string} className - class name to select elements to remove
 * @returns {void}
 */
export const remove = className =>
  [...document.querySelectorAll(`.${className}`)].forEach(element => element.remove());

/**
 * Removes the given css class from all elements on the current page that have it.
 * i.e. jQuery $(`.${className}`).removeClass(className);
 *
 * @param {string} className - class name to remove
 * @returns {void}
 */
export const removeClass = className =>
  [...document.querySelectorAll(`.${className}`)].forEach(element => element.classList.remove(className));

/**
 * Removes the given data attribute from all elements on the current page that have it.
 * i.e. jQuery $(`[data-${dashStylename}]`).removeAttr(`data-${dashStylename}`);
 *
 * @param {string} dashStylename - data attribute to remove, in dash-style
 * @returns {void}
 */
export const removeAttr = dashStylename =>
  [...document.querySelectorAll(`[data-${dashStylename}]`)].forEach(element => element.removeAttribute(`data-${dashStylename}`));

/**
 * Removes the given data attribute from all elements on the current page that have it.
 *
 * @param {string} camelCaseName - data attribute to remove, in camelCase
 * @returns {void}
 */
export const removeDataset = camelCaseName =>
  removeAttr(camelCaseName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
