import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { displayBlockUnlessDisabledAttr, getClosestRenderedElement, postSelector } from './interface.js';
import { pageModifications } from './mutations.js';
import { blogData, timelineObject } from './react_props.js';

const postHeaderSelector = `${postSelector} :is(article > header, article > div > header)`;
const blogHeaderSelector = `[style*="--blog-title-color"] > div > div > header, ${keyToCss('blogCardHeaderBar')}`;

const meatballItems = {
  post: {},
  blog: {},
};

/**
 * Add a custom button to posts' meatball menus.
 * @param {object} options Destructured
 * @param {string} options.id Identifier for this button (must be unique)
 * @param {string | Function} options.label Button text to display. May be a function accepting the timelineObject data of the post element being actioned on.
 * @param {(event: PointerEvent) => void} options.onclick Button click listener function
 * @param {Function} [options.postFilter] Filter function, called with the timelineObject data of the post element being actioned on. Must return true for button to be added
 */
export const registerMeatballItem = function ({ id, label, onclick, postFilter }) {
  meatballItems.post[id] = { label, onclick, filter: postFilter };
  pageModifications.trigger(addMeatballItems);
};

export const unregisterMeatballItem = id => {
  delete meatballItems.post[id];
  $(`[data-xkit-post-meatball-button="${id}"]`).remove();
};

/**
 * Add a custom button to blogs' meatball menus in blog cards and the blog view header.
 * @param {object} options Destructured
 * @param {string} options.id Identifier for this button (must be unique)
 * @param {string | Function} options.label Button text to display. May be a function accepting the blog data of the post element being actioned on.
 * @param {(event: PointerEvent) => void} options.onclick Button click listener function
 * @param {Function} [options.blogFilter] Filter function, called with the blog data of the menu element being actioned on. Must return true for button to be added. Some blog data fields, such as "followed", are not available in blog cards.
 */
export const registerBlogMeatballItem = function ({ id, label, onclick, blogFilter }) {
  meatballItems.blog[id] = { label, onclick, filter: blogFilter };
  pageModifications.trigger(addMeatballItems);
};

export const unregisterBlogMeatballItem = id => {
  delete meatballItems.blog[id];
  $(`[data-xkit-blog-meatball-button="${id}"]`).remove();
};

const addMeatballItems = meatballMenus => meatballMenus.forEach(async meatballMenu => {
  const closestHeader = await getClosestRenderedElement(meatballMenu, 'header');
  if (closestHeader?.matches(postHeaderSelector)) {
    addTypedMeatballItems({
      meatballMenu,
      type: 'post',
      reactData: await timelineObject(meatballMenu),
      reactDataKey: '__timelineObjectData',
    });
    return;
  }
  if (closestHeader?.matches(blogHeaderSelector)) {
    addTypedMeatballItems({
      meatballMenu,
      type: 'blog',
      reactData: await blogData(meatballMenu),
      reactDataKey: '__blogData',
    });
  }
});

const addTypedMeatballItems = async ({ meatballMenu, type, reactData, reactDataKey }) => {
  $(meatballMenu).children(`[data-xkit-${type}-meatball-button]`).remove();

  Object.keys(meatballItems[type]).sort().forEach(id => {
    const { label, onclick, filter } = meatballItems[type][id];

    const meatballItemButton = dom('button', {
      class: 'xkit-meatball-button',
      [`data-xkit-${type}-meatball-button`]: id,
      [displayBlockUnlessDisabledAttr]: '',
      hidden: true,
    }, {
      click: onclick,
    }, [
      '\u22EF',
    ]);
    meatballItemButton[reactDataKey] = reactData;

    if (label instanceof Function) {
      const labelResult = label(reactData);

      if (labelResult instanceof Promise) {
        labelResult.then(result => { meatballItemButton.textContent = result; });
      } else {
        meatballItemButton.textContent = labelResult;
      }
    } else {
      meatballItemButton.textContent = label;
    }

    if (filter instanceof Function) {
      const shouldShowItem = filter(reactData);
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
