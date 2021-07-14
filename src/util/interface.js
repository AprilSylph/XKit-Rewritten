/**
 * @param {object} options - Destructured
 * @param {string} options.excludeClass - Classname to exclude and add
 * @param {RegExp} [options.timeline] - Filter results to matching [data-timeline] children {@link ./react_props.js exposeTimelines}
 * @param {boolean} [options.noPeepr] - Whether to exclude posts in [role="dialog"]
 * @param {boolean} [options.includeFiltered] - Whether to include filtered posts
 * @returns {HTMLDivElement[]} Post elements matching the query options
 */
export const getPostElements = function ({ excludeClass, timeline, noPeepr = false, includeFiltered = false }) {
  if (!excludeClass) {
    return [];
  }

  const selector = `[tabindex="-1"][data-id]:not(.${excludeClass})`;
  let postElements = [...document.querySelectorAll(selector)];

  if (timeline instanceof RegExp) {
    postElements = postElements.filter(postElement => timeline.test(postElement.closest('[data-timeline]').dataset.timeline));
  }

  if (noPeepr) {
    postElements = postElements.filter(postElement => postElement.matches('[role="dialog"] [tabindex="-1"][data-id]') === false);
  }

  if (!includeFiltered) {
    postElements = postElements.filter(postElement => postElement.querySelector('article footer') !== null);
  }

  postElements.forEach(postElement => postElement.classList.add(excludeClass));

  return postElements;
};

/**
 * @param {string} css - CSS rules to be applied to the page
 */
export const addStyle = css => {
  const style = document.createElement('style');
  style.classList.add('xkit');
  style.textContent = css;
  document.documentElement.appendChild(style);
};

/**
 * @param {string} css - CSS rules to remove from the page
 *                       (must match a string previously passed to addStyle)
 */
export const removeStyle = css => {
  [...document.querySelectorAll('style.xkit')]
    .filter(style => style.textContent === css)
    .forEach(style => style.parentNode.removeChild(style));
};
