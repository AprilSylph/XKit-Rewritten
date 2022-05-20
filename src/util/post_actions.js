import { buildSvg } from './remixicon.js';
import { pageModifications } from './mutations.js';
import { keyToCss } from './css_map.js';
import { dom } from './dom.js';

// Remove outdated post options when loading module
$('.xkit-post-option').remove();

const fakePostActions = dom('div', { class: 'xkit-post-actions' });
const postOptions = {};

const addPostOptions = ([postFormButton]) => {
  if (!postFormButton) { return; }

  const postActions = document.querySelector(keyToCss('postActions'));
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
pageModifications.register(keyToCss('postFormButton'), addPostOptions);

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
