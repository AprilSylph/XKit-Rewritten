import { keyToClasses, keyToCss } from './css_map.js';
import { onPostsMutated } from './mutations.js';

/**
 * @param {object} options - Arguments object (destructured, not used directly)
 * @param {string} options.excludeClass - Classname to exclude and add
 * @param {boolean} options.noPeepr - Whether to exclude posts in #glass-container (optional)
 * @param {boolean} options.includeFiltered - Whether to include filtered posts (optional)
 * @returns {Array} - Array of post elements matching the query options
 */
export const getPostElements = function ({ excludeClass, noPeepr = false, includeFiltered = false }) {
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

const meatballItems = {};

/**
 * Add a custom button to posts' meatball menus.
 *
 * @param {string} label - Button text to display
 * @param {Function} callback - Button click listener function
 */
export const registerMeatballItem = function (label, callback) {
  if (meatballItems[label] === undefined) {
    meatballItems[label] = callback;
  }
};

export const unregisterMeatballItem = label => delete meatballItems[label];

(async function () {
  const meatballMenuSelector = await keyToCss('meatballMenu');
  const [meatballItemClass] = await keyToClasses('meatballItem');
  const [dropdownItemClass] = await keyToClasses('dropdownItem');

  onPostsMutated.addListener(() => {
    document.querySelectorAll(`[data-id] header ${meatballMenuSelector}`).forEach(async meatballMenu => {
      if (!meatballMenu || meatballMenu.classList.contains('xkit-done')) { return; }
      meatballMenu.classList.add('xkit-done');

      Object.keys(meatballItems).sort().forEach(label => {
        const meatballItemButton = document.createElement('button');
        meatballItemButton.classList.add(meatballItemClass, dropdownItemClass);
        meatballItemButton.textContent = label;
        meatballItemButton.dataset.xkitMeatballButton = label;
        meatballItemButton.addEventListener('click', meatballItems[label]);

        meatballMenu.appendChild(meatballItemButton);
      });
    });
  });
})();
