import { buildSvg } from './remixicon.js';
import { pageModifications } from './mutations.js';
import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { remove } from './cleanup.js';

// Remove outdated post options when loading module
remove('xkit-post-option');

const fakePostActions = dom('div', { class: 'xkit-post-actions' });
const postOptions = {};

const postActionsSelector = keyToCss('postActions');
const postFormButtonSelector = keyToCss('postFormButton');

const addPostOptions = ([postFormButton]) => {
  if (!postFormButton) { return; }

  const postActions = document.querySelector(postActionsSelector);
  if (!postActions) {
    fakePostActions.replaceChildren();
    postFormButton.parentNode.insertBefore(fakePostActions, postFormButton);
  }

  Object.keys(postOptions).sort().reverse().forEach(id => {
    const postOption = postOptions[id];
    const target = postActions || fakePostActions;
    if (!target.contains(postOption)) { target.prepend(postOption); }
  });
};

pageModifications.register(postFormButtonSelector, addPostOptions);

/**
 * Create and register a button to add to the new post form
 *
 * @param {string} id - Unique identifier for this post option
 * @param {object} options - Construction options for this post option
 * @param {string} options.symbolId - RemixIcon symbol to use
 * @param {Function} options.onclick - Click handler function for this button
 */
export const registerPostOption = async function (id, { symbolId, onclick }) {
  postOptions[id] = dom('label', { class: 'xkit-post-option' }, null, [
    dom('button', null, { click: onclick }, [buildSvg(symbolId)])
  ]);

  pageModifications.trigger(addPostOptions);
};

/**
 * @param {string} id - Identifier for the previously registered post option
 */
export const unregisterPostOption = id => {
  postOptions[id]?.remove();
  delete postOptions[id];
};
