import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { postSelector } from './interface.js';
import { pageModifications } from './mutations.js';
import { inject } from './inject.js';
import { blogData, notePropsObjects, timelineObject } from './react_props.js';

const postHeaderSelector = `${postSelector} article > header`;
const blogHeaderSelector = `[style*="--blog-title-color"] > div > div > header, ${keyToCss('blogCardHeaderBar')}`;

const meatballItems = {
  post: {},
  blog: {},
  reply: {}
};

/**
 * Add a custom button to posts' meatball menus.
 * @param {object} options - Destructured
 * @param {string} options.id - Identifier for this button (must be unique)
 * @param {string|Function} options.label - Button text to display. May be a function accepting the timelineObject data of the post element being actioned on.
 * @param {Function} options.onclick - Button click listener function
 * @param {Function} [options.postFilter] - Filter function, called with the timelineObject data of the post element being actioned on. Must return true for button to be added
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
 * @param {object} options - Destructured
 * @param {string} options.id - Identifier for this button (must be unique)
 * @param {string|Function} options.label - Button text to display. May be a function accepting the blog data of the post element being actioned on.
 * @param {Function} options.onclick - Button click listener function
 * @param {Function} [options.blogFilter] - Filter function, called with the blog data of the menu element being actioned on. Must return true for button to be added. Some blog data fields, such as "followed", are not available in blog cards.
 */
export const registerBlogMeatballItem = function ({ id, label, onclick, blogFilter }) {
  meatballItems.blog[id] = { label, onclick, filter: blogFilter };
  pageModifications.trigger(addMeatballItems);
};

export const unregisterBlogMeatballItem = id => {
  delete meatballItems.blog[id];
  $(`[data-xkit-blog-meatball-button="${id}"]`).remove();
};

/**
 * Add a custom button to post replies' meatball menus.
 * @param {object} options - Destructured
 * @param {string} options.id - Identifier for this button (must be unique)
 * @param {string|Function} options.label - Button text to display. May be a function accepting the note component props data of the reply element being actioned on.
 * @param {Function} options.onClick - Button click listener function
 * @param {Function} [options.notePropsFilter] - Filter function, called with the note component props data of the reply element being actioned on. Must return true for button to be added.
 */
export const registerReplyMeatballItem = function ({ id, label, onClick, notePropsFilter }) {
  meatballItems.reply[id] = { label, onClick, filter: notePropsFilter };
  pageModifications.trigger(addMeatballItems);
};

export const unregisterReplyMeatballItem = id => {
  delete meatballItems.reply[id];
  $(`[data-xkit-reply-meatball-button="${id}"]`).remove();
};

const addMeatballItems = meatballMenus => meatballMenus.forEach(async meatballMenu => {
  const inPostHeader = await inject('/main_world/test_header_element.js', [postHeaderSelector], meatballMenu);
  if (inPostHeader) {
    addTypedMeatballItems({
      meatballMenu,
      type: 'post',
      reactData: await timelineObject(meatballMenu),
      reactDataKey: '__timelineObjectData'
    });
    return;
  }
  const inBlogHeader = await inject('/main_world/test_header_element.js', [blogHeaderSelector], meatballMenu);
  if (inBlogHeader) {
    addTypedMeatballItems({
      meatballMenu,
      type: 'blog',
      reactData: await blogData(meatballMenu),
      reactDataKey: '__blogData'
    });
    return;
  }
  const inPostFooter = await inject('/main_world/test_parent_element.js', ['footer *'], meatballMenu);
  if (inPostFooter) {
    const __notePropsData = await notePropsObjects(meatballMenu);

    if (__notePropsData[0]?.note?.type === 'reply') {
      addTypedMeatballItems({
        meatballMenu,
        type: 'reply',
        reactData: __notePropsData,
        reactDataKey: '__notePropsData'
      });
    }
  }
});

const addTypedMeatballItems = async ({ meatballMenu, type, reactData, reactDataKey }) => {
  $(meatballMenu).children(`[data-xkit-${type}-meatball-button]`).remove();

  Object.keys(meatballItems[type]).sort().forEach(id => {
    const { label, onclick, filter } = meatballItems[type][id];

    const meatballItemButton = dom('button', {
      class: 'xkit-meatball-button',
      [`data-xkit-${type}-meatball-button`]: id,
      hidden: true
    }, {
      click: onclick
    }, [
      '\u22EF'
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
