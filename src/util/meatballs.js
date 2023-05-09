import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { buildStyle, postSelector } from './interface.js';
import { pageModifications } from './mutations.js';
import { inject } from './inject.js';
import { blogData, timelineObject } from './react_props.js';

const postHeaderSelector = `${postSelector} article > header`;
const blogHeaderSelector = `[style*="--blog-title-color"] > div > div > header, ${keyToCss('blogCardHeaderBar')}`;

const styleElement = buildStyle(`
.xkit-meatball-button::before {
  content: "";

  display: inline-block;
  vertical-align: text-top;

  width: 1em;
  height: 1em;
  margin: 0.2ch 0.5ch;

  mask-size: contain;
  -webkit-mask-size: contain;
  mask-image: url(${browser.runtime.getURL('/icons/mask_128.png')});
  -webkit-mask-image: url(${browser.runtime.getURL('/icons/mask_128.png')});

  background-color: RGB(var(--black));
}
`);
document.documentElement.append(styleElement);

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
const blogMeatballItems = {};

/**
 * Add a custom button to posts' meatball menus.
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

/**
 * Add a custom button to blogs' meatball menus in blog cards and the blog view header.
 * @param {object} options - Destructured
 * @param {string} options.id - Identifier for this button (must be unique)
 * @param {string|Function} options.label - Button text to display. May be a function accepting the blog data of the post element being actioned on.
 * @param {Function} options.onClick - Button click listener function
 * @param {Function} [options.blogFilter] - Filter function, called with the blog data of the menu element being actioned on. Must return true for button to be added. Some blog data fields, such as "followed", are not available in blog cards.
 */
export const registerBlogMeatballItem = function ({ id, label, onClick, blogFilter }) {
  blogMeatballItems[id] = { label, onClick, blogFilter };
  pageModifications.trigger(addMeatballItems);
};

export const unregisterBlogMeatballItem = id => {
  delete blogMeatballItems[id];
  $(`[data-xkit-blog-meatball-button="${id}"]`).remove();
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
      class: 'xkit-meatball-button',
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
};

const addBlogMeatballItem = async meatballMenu => {
  const __blogData = await blogData(meatballMenu);

  $(meatballMenu).children('[data-xkit-meatball-button]').remove();

  Object.keys(blogMeatballItems).sort().forEach(id => {
    const { label, onClick, blogFilter } = blogMeatballItems[id];

    const meatballItemButton = dom('button', {
      class: 'xkit-meatball-button',
      'data-xkit-blog-meatball-button': id,
      hidden: true
    }, {
      click: onClick
    }, [
      '\u22EF'
    ]);
    meatballItemButton.__blogData = __blogData;

    if (label instanceof Function) {
      const labelResult = label(__blogData);

      if (labelResult instanceof Promise) {
        labelResult.then(result => { meatballItemButton.textContent = result; });
      } else {
        meatballItemButton.textContent = labelResult;
      }
    } else {
      meatballItemButton.textContent = label;
    }

    if (blogFilter instanceof Function) {
      const shouldShowItem = blogFilter(__blogData);
      meatballItemButton.hidden = shouldShowItem !== true;

      if (shouldShowItem instanceof Promise) {
        shouldShowItem.then(result => { meatballItemButton.hidden = result !== true; });
      }
    } else {
      meatballItemButton.hidden = false;
    }

    meatballMenu.append(meatballItemButton);
  });
};

pageModifications.register(keyToCss('meatballMenu'), addMeatballItems);
