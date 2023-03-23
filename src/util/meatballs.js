import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { postSelector } from './interface.js';
import { pageModifications } from './mutations.js';
import { inject } from './inject.js';
import { timelineObject } from './react_props.js';

const postHeaderSelector = `${postSelector} article > header`;

const testHeaderElement = (selector) => {
  const menuElement = document.currentScript.parentElement;
  const reactKey = Object.keys(menuElement).find(key => key.startsWith('__reactFiber'));
  let fiber = menuElement[reactKey];

  while (fiber !== null) {
    if (fiber.elementType === 'header') {
      return fiber.stateNode.matches(selector);
    } else {
      fiber = fiber.return;
    }
  }
};

const meatballItems = {};

/**
 * Add a custom button to posts' meatball menus.
 *
 * @param {object} options - Destructured
 * @param {string} options.id - Identifier for this button (must be unique)
 * @param {string|Function} options.label - Button text to display. May be a function accepting the timelineObject data of the post element being actioned on.
 * @param {Function} options.onclick - Button click listener function
 * @param {Function} [options.postFilter] - Filter function, called with the timelineObject data of the post element being actioned on. Must return true for button to be added
 */
export const registerMeatballItem = function ({ id, label, onclick, postFilter }) {
  meatballItems[id] = { label, onclick, postFilter };
  pageModifications.trigger(addMeatballItems);
};

export const unregisterMeatballItem = id => {
  delete meatballItems[id];
  $(`[data-xkit-meatball-button="${id}"]`).remove();
};

const addMeatballItems = meatballMenus => meatballMenus.forEach(async meatballMenu => {
  const inPostHeader = await inject(testHeaderElement, [postHeaderSelector], meatballMenu);
  if (!inPostHeader) return;

  const __timelineObjectData = await timelineObject(meatballMenu);

  $(meatballMenu).children('[data-xkit-meatball-button]').remove();

  Object.keys(meatballItems).sort().forEach(id => {
    const { label, onclick, postFilter } = meatballItems[id];

    const meatballItemButton = dom('button', {
      'data-xkit-meatball-button': id,
      hidden: true
    }, {
      click: onclick
    }, [
      '\u22EF'
    ]);
    meatballItemButton.__timelineObjectData = __timelineObjectData;

    if (label instanceof Function) {
      const labelResult = label(__timelineObjectData);

      if (labelResult instanceof Promise) {
        labelResult.then(result => { meatballItemButton.textContent = result; });
      } else {
        meatballItemButton.textContent = labelResult;
      }
    } else {
      meatballItemButton.textContent = label;
    }

    if (postFilter instanceof Function) {
      const shouldShowItem = postFilter(__timelineObjectData);
      meatballItemButton.hidden = shouldShowItem !== true;

      if (shouldShowItem instanceof Promise) {
        shouldShowItem.then(result => { meatballItemButton.hidden = result !== true; });
      }
    } else {
      meatballItemButton.hidden = false;
    }

    meatballMenu.append(meatballItemButton);
  });
});

pageModifications.register(keyToCss('meatballMenu'), addMeatballItems);
