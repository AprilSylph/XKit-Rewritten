import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { postSelector } from './interface.js';
import { pageModifications } from './mutations.js';
import { inject } from './inject.js';
import { timelineObject } from './react_props.js';

const postHeaderSelector = `${postSelector} article > header`;
const blogHeaderSelector = `[style*="--blog-title-color"] > div > div > header, ${keyToCss('blogCardHeaderBar')}`;

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

const unburyBlog = () => {
  const element = document.currentScript.parentElement;
  const reactKey = Object.keys(element).find(key => key.startsWith('__reactFiber'));
  let fiber = element[reactKey];

  while (fiber !== null) {
    const { blog, blogSettings } = fiber.memoizedProps || {};
    if (blog ?? blogSettings) {
      return blog ?? blogSettings;
    } else {
      fiber = fiber.return;
    }
  }
};
const blogData = async (element) => inject(unburyBlog, [], element);

const meatballItems = {};
const blogMeatballItems = {};

/**
 * Add a custom button to posts' meatball menus.
 *
 * @param {object} options - Destructured
 * @param {string} options.id - Identifier for this button (must be unique)
 * @param {string} options.label - Button text to display
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

/**
 * Add a custom button to blogs' meatball menus in blog cards and the blog view header.
 *
 * @param {object} options - Destructured
 * @param {string} options.id - Identifier for this button (must be unique)
 * @param {string} options.label - Button text to display
 * @param {Function} options.onclick - Button click listener function
 * @param {Function} [options.postFilter] - Filter function, called with the blog data of the menu element being actioned on. Must return true for button to be added. Some blog data fields, such as "followed," are not availiable in blog cards.
 */
export const registerBlogMeatballItem = function ({ id, label, onclick, postFilter }) {
  blogMeatballItems[id] = { label, onclick, postFilter };
  pageModifications.trigger(addMeatballItems);
};

export const unregisterBlogMeatballItem = id => {
  delete blogMeatballItems[id];
  $(`[data-xkit-meatball-button="${id}"]`).remove();
};

const addMeatballItems = meatballMenus => meatballMenus.forEach(async meatballMenu => {
  const inPostHeader = await inject(testHeaderElement, [postHeaderSelector], meatballMenu);
  if (inPostHeader) {
    addPostMeatballItem(meatballMenu);
    return;
  }
  const inBlogHeader = await inject(testHeaderElement, [blogHeaderSelector], meatballMenu);
  if (inBlogHeader) {
    addBlogMeatballItem(meatballMenu);
  }
});

const addPostMeatballItem = async meatballMenu => {
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
      label
    ]);
    meatballItemButton.__timelineObjectData = __timelineObjectData;

    meatballMenu.append(meatballItemButton);

    if (postFilter instanceof Function) {
      const shouldShowItem = postFilter(__timelineObjectData);
      meatballItemButton.hidden = shouldShowItem !== true;

      if (shouldShowItem instanceof Promise) {
        shouldShowItem.then(result => { meatballItemButton.hidden = result !== true; });
      }
    } else {
      meatballItemButton.hidden = false;
    }
  });
};

const addBlogMeatballItem = async meatballMenu => {
  const __blogData = await blogData(meatballMenu);

  $(meatballMenu).children('[data-xkit-meatball-button]').remove();

  Object.keys(blogMeatballItems).sort().forEach(id => {
    const { label, onclick, postFilter } = blogMeatballItems[id];

    const meatballItemButton = dom('button', {
      'data-xkit-meatball-button': id,
      hidden: true
    }, {
      click: onclick
    }, [
      label
    ]);
    meatballItemButton.__blogData = __blogData;

    meatballMenu.append(meatballItemButton);

    if (postFilter instanceof Function) {
      const shouldShowItem = postFilter(__blogData);
      meatballItemButton.hidden = shouldShowItem !== true;

      if (shouldShowItem instanceof Promise) {
        shouldShowItem.then(result => { meatballItemButton.hidden = result !== true; });
      }
    } else {
      meatballItemButton.hidden = false;
    }
  });
};

pageModifications.register(keyToCss('meatballMenu'), addMeatballItems);
