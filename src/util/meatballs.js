import { keyToClasses, keyToCss } from './css_map.js';
import { onPostsMutated } from './mutations.js';

const meatballItems = {};

/**
 * Add a custom button to posts' meatball menus.
 *
 * @param {object} options -
 * @param {string} options.label - Button text to display (must be unique)
 * @param {Function} options.onClick - Button click listener function
 * @param {Function} [options.postFilter] - Filter function, called with the post element being actioned on. Must return true for button to be added
 */
export const registerMeatballItem = function ({ label, onClick, postFilter }) {
  if (meatballItems[label] === undefined) {
    meatballItems[label] = { onClick, postFilter };
  }
};

export const unregisterMeatballItem = label => {
  delete meatballItems[label];
  [...document.querySelectorAll('[data-xkit-meatball-button]')]
    .filter(button => button.textContent === label)
    .forEach(button => button.parentNode.removeChild(button));
};

(async function () {
  const meatballMenuSelector = await keyToCss('meatballMenu');
  const [meatballItemClass] = await keyToClasses('meatballItem');
  const [dropdownItemClass] = await keyToClasses('dropdownItem');

  onPostsMutated.addListener(() => {
    document.querySelectorAll(`[data-id] header ${meatballMenuSelector}`).forEach(async meatballMenu => {
      if (!meatballMenu || meatballMenu.classList.contains('xkit-done')) { return; }
      meatballMenu.classList.add('xkit-done');

      Object.keys(meatballItems)
        .sort()
        .filter(label => meatballItems[label].postFilter === undefined || meatballItems[label].postFilter(meatballMenu.closest('[data-id]')))
        .forEach(label => {
          const meatballItemButton = document.createElement('button');
          meatballItemButton.classList.add(meatballItemClass, dropdownItemClass);
          meatballItemButton.textContent = label;
          meatballItemButton.dataset.xkitMeatballButton = true;
          meatballItemButton.addEventListener('click', meatballItems[label].onClick);

          meatballMenu.appendChild(meatballItemButton);
        });
    });
  });
})();
