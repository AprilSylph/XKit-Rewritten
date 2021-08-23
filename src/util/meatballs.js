import { keyToClasses, keyToCss } from './css_map.js';
import { onPostsMutated } from './mutations.js';

const meatballItems = {};

/**
 * Add a custom button to posts' meatball menus.
 *
 * @param {object} options - Destructured
 * @param {string} options.id - Identifier for this button (must be unique)
 * @param {string} options.label - Button text to display
 * @param {Function} options.onclick - Button click listener function
 * @param {Function} [options.postFilter] - Filter function, called with the post element being actioned on. Must return true for button to be added
 */
export const registerMeatballItem = function ({ id, label, onclick, postFilter }) {
  meatballItems[id] = { label, onclick, postFilter };
};

export const unregisterMeatballItem = id => {
  delete meatballItems[id];
  [...document.querySelectorAll('[data-xkit-meatball-button]')]
    .filter(button => button.dataset.xkitMeatballButton === id)
    .forEach(button => button.remove());
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
        .filter(id => meatballItems[id].postFilter === undefined || meatballItems[id].postFilter(meatballMenu.closest('[data-id]')))
        .forEach(id => {
          const { label, onclick } = meatballItems[id];
          const meatballItemButton = document.createElement('button');
          Object.assign(meatballItemButton, { textContent: label, onclick });
          meatballItemButton.classList.add(meatballItemClass, dropdownItemClass);
          meatballItemButton.dataset.xkitMeatballButton = id;

          meatballMenu.appendChild(meatballItemButton);
        });
    });
  });
})();
