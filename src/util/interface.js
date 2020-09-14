(function () {
  /**
   * @param {Object} options
   * @param {String} options.excludeClass - Classname to exclude and add
   * @param {Boolean} options.noPeepr - Whether to only return posts in #base-container (optional)
   * @return {Array} - Array of post elements matching the query options
   */
  const getPostElements = function ({ excludeClass, noPeepr = false }) {
    if (!excludeClass) {
      return [];
    }

    const selector = `${noPeepr ? '#base-container' : ''} [data-id]:not(.${excludeClass})`;
    const postElements = [...document.querySelectorAll(selector)];
    postElements.forEach(postElement => postElement.classList.add(excludeClass));

    return postElements;
  };

  /**
   * @param {String} css - CSS rules to be applied to the page
   */
  const addStyle = css => {
    const style = document.createElement('style');
    style.classList.add('xkit');
    style.textContent = css;
    document.documentElement.appendChild(style);
  };

  /**
   * @param {String} css - CSS rules to remove from the page
   *                       (must match a string previously passed to addStyle)
   */
  const removeStyle = css => {
    [...document.querySelectorAll('style.xkit')]
    .filter(style => style.textContent === css)
    .forEach(style => style.parentNode.removeChild(style));
  };

  return { getPostElements, addStyle, removeStyle };
})();
