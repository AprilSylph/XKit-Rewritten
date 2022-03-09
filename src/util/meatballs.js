import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { postSelector } from './interface.js';
import { pageModifications } from './mutations.js';

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
  pageModifications.trigger(addMeatballItems);
};

export const unregisterMeatballItem = id => {
  delete meatballItems[id];
  $(`[data-xkit-meatball-button="${id}"]`).remove();
};

const addMeatballItems = meatballMenuElements => meatballMenuElements.forEach(meatballMenu => {
  $(meatballMenu).children('[data-xkit-meatball-button]').remove();
  const currentPost = meatballMenu.closest(postSelector);

  Object.keys(meatballItems).sort().forEach(id => {
    const { label, onclick, postFilter } = meatballItems[id];

    const meatballItemButton = dom('button', {
      'data-xkit-meatball-button': id,
      hidden: true
    }, {
      click: onclick
    }, [
      label
    ]);

    meatballMenu.append(meatballItemButton);

    if (postFilter instanceof Function) {
      const shouldShowItem = postFilter(currentPost);
      meatballItemButton.hidden = shouldShowItem !== true;

      if (shouldShowItem instanceof Promise) {
        shouldShowItem.then(result => { meatballItemButton.hidden = result !== true; });
      }
    } else {
      meatballItemButton.hidden = false;
    }
  });
});

keyToCss('meatballMenu').then(meatballMenuSelector => pageModifications.register(
  `${postSelector} article header ${meatballMenuSelector}`,
  addMeatballItems
));
