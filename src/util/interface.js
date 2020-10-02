(function () {
  /**
   * @param {object} options - Arguments object (destructured, not used directly)
   * @param {string} options.excludeClass - Classname to exclude and add
   * @param {boolean} options.noPeepr - Whether to exclude posts in #glass-container (optional)
   * @param {boolean} options.includeFiltered - Whether to include filtered posts (optional)
   * @returns {Array} - Array of post elements matching the query options
   */
  const getPostElements = function ({ excludeClass, noPeepr = false, includeFiltered = false }) {
    if (!excludeClass) {
      return [];
    }

    const selector = `${noPeepr ? '#base-container > :not(#glass-container)' : ''} [data-id]:not(.${excludeClass})`;
    let postElements = [...document.querySelectorAll(selector)];

    if (!includeFiltered) {
      postElements = postElements.filter(postElement => postElement.querySelector('article footer') !== null);
    }

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

  /**
   * Fetch the SVG belonging to a specific RemixIcon.
   *
   * @param {string} cssClass The RemixIcon class of the requested icon
   * @returns {string} The SVG path of the associated RemixIcon, or undefined if there is no icon with the requested class
   */
  const getIconPath = async function (cssClass) {
    const url = browser.runtime.getURL('/src/util/remixicon-svg.json');
    const file = await fetch(url);
    const icons = await file.json();

    if (Object.prototype.hasOwnProperty.call(icons, cssClass)) {
      return `<path d="${icons[cssClass]}"/>`;
    }
  };

  /**
   * Create a button template that can be cloned with cloneControlButton() for inserting into the controls of a post.
   *
   * @param {string} iconClass The RemixIcon class of the requested icon
   * @param {string} buttonClass An extra class to identify the extension that added the button
   * @returns {HTMLDivElement} A button that can be cloned with cloneControlButton()
   */
  const createControlButtonTemplate = async function (iconClass, buttonClass) {
    const controlButtonContainer = document.createElement('div');
    controlButtonContainer.classList.add('xkit-post-button-container', buttonClass);

    const controlButtonContainerSpan = document.createElement('span');
    controlButtonContainerSpan.classList.add('xkit-post-button-container-span');

    const controlButton = document.createElement('button');
    controlButton.classList.add('xkit-post-button');
    controlButton.tabIndex = 0;

    const controlButtonInner = document.createElement('span');
    controlButtonInner.classList.add('xkit-post-button-inner');
    controlButtonInner.tabIndex = -1;
    const iconPath = await getIconPath(iconClass);
    controlButtonInner.innerHTML = `<svg viewBox="2 2 20 20" width="21" height="21" fill="var(--gray-65)">${iconPath}</svg>`;

    controlButton.appendChild(controlButtonInner);
    controlButtonContainerSpan.appendChild(controlButton);
    controlButtonContainer.appendChild(controlButtonContainerSpan);

    return controlButtonContainer;
  };

  /**
   * Create a deep-level clone of a button template that is ready to add to the page
   *
   * @param {HTMLDivElement} template A button template as returned by createControlButtonTemplate()
   * @param {Function} callback A function to run when the button is clicked
   * @returns {HTMLDivElement} A clone of the template with a click handler attached
   */
  const cloneControlButton = function (template, callback) {
    const newButton = template.cloneNode(true);
    newButton.querySelector('button').addEventListener('click', callback);
    return newButton;
  };

  return { getPostElements, addStyle, removeStyle, registerMeatballItem, unregisterMeatballItem, getIconPath, createControlButtonTemplate, cloneControlButton };
})();
