/**
 * Removes all elements on the current page with the given css class.
 * i.e. jQuery $(`.${className}`).remove();
 *
 * @param {...string} classNames - one or more class names to select elements to remove
 * @returns {void}
 */
export const remove = (...classNames) =>
  [...document.querySelectorAll(classNames.map(className => `.${className}`).join(','))]
    .forEach(element => element.remove());

/**
 * Removes the given css class from all elements on the current page that have it.
 * i.e. jQuery $(`.${className}`).removeClass(className);
 *
 * @param {...string} classNames - one or more class names to remove
 * @returns {void}
 */
export const removeClass = (...classNames) =>
  classNames.forEach(className =>
    [...document.querySelectorAll(`.${className}`)].forEach(element =>
      element.classList.remove(className)
    )
  );

/**
 * Removes the given data attribute from all elements on the current page that have it.
 * i.e. jQuery $(`[data-${dashStylename}]`).removeAttr(`data-${dashStylename}`);
 *
 * @param {...string} dashStylenames - one or more data attributes to remove, in dash-style
 * @returns {void}
 */
export const removeAttr = (...dashStylenames) =>
  dashStylenames.forEach(dashStylename =>
    [...document.querySelectorAll(`[data-${dashStylename}]`)].forEach(element =>
      element.removeAttribute(`data-${dashStylename}`)
    )
  );

/**
 * Removes the given data attribute from all elements on the current page that have it.
 *
 * @param {...string} camelCaseNames - one or more data attributes to remove, in camelCase
 * @returns {void}
 */
export const removeDataset = (...camelCaseNames) =>
  camelCaseNames.forEach(camelCaseName =>
    removeAttr(camelCaseName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`))
  );
