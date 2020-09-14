(function () {
  /**
   * @param {object} options - Arguments object (destructured, not used directly)
   * @param {string} options.excludeClass - Classname to exclude and add
   * @param {boolean} options.noPeepr - Whether to only return posts in #base-container (optional)
   * @returns {Array} - Array of post elements matching the query options
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
   * @param {string} css - CSS rules to be applied to the page
   */
  const addStyle = css => {
    const style = document.createElement('style');
    style.classList.add('xkit');
    style.textContent = css;
    document.documentElement.appendChild(style);
  };

  /**
   * @param {string} css - CSS rules to remove from the page
   *                       (must match a string previously passed to addStyle)
   */
  const removeStyle = css => {
    [...document.querySelectorAll('style.xkit')]
    .filter(style => style.textContent === css)
    .forEach(style => style.parentNode.removeChild(style));
  };

  const meatballItems = {};

  /**
   * Add a custom button to posts' meatball menus.
   *
   * @param {string} label - Button text to display
   * @param {Function} callback - Button click listener function
   */
  const registerMeatballItem = function (label, callback) {
    if (meatballItems[label] === undefined) {
      meatballItems[label] = callback;
    }
  };

  const unregisterMeatballItem = label => delete meatballItems[label];

  (async function () {
    const { keyToClasses, keyToCss } = await fakeImport('/src/util/css_map.js');
    const { onPostsMutated } = await fakeImport('/src/util/mutations.js');

    const meatballMenuSelector = await keyToCss('meatballMenu');
    const [meatballItemClass] = await keyToClasses('meatballItem');
    const [dropdownItemClass] = await keyToClasses('dropdownItem');

    onPostsMutated.addListener(() => {
      const meatballMenu = document.querySelector(`[data-id] ${meatballMenuSelector}`);

      if (!meatballMenu || meatballMenu.classList.contains('xkit-done')) { return; }
      meatballMenu.classList.add('xkit-done');

      Object.keys(meatballItems).sort().forEach(label => {
        const meatballItemButton = document.createElement('button');
        meatballItemButton.classList.add(meatballItemClass, dropdownItemClass);
        meatballItemButton.textContent = label;
        meatballItemButton.addEventListener('click', meatballItems[label]);

        meatballMenu.appendChild(meatballItemButton);
      });
    });
  })();

  return { getPostElements, addStyle, removeStyle, registerMeatballItem, unregisterMeatballItem };
})();
