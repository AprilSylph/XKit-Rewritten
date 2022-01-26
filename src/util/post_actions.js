import { buildSvg } from './remixicon.js';
import { pageModifications } from './mutations.js';
import { keyToCss } from './css_map.js';

const excludeClass = 'xkit-post-actions-done';

const fakePostActions = Object.assign(document.createElement('div'), { className: 'xkit-post-actions' });
const postOptions = {};

let postActionsSelector;
let postFormButtonSelector;

const addPostOptions = ([postFormButton]) => {
  if (!postFormButton || postFormButton.classList.contains(excludeClass)) { return; }
  postFormButton.classList.add(excludeClass);

  const postActions = document.querySelector(postActionsSelector);
  if (!postActions) {
    fakePostActions.textContent = '';
    postFormButton.parentNode.insertBefore(fakePostActions, postFormButton);
  }

  Object.keys(postOptions).sort().reverse().forEach(id => {
    const postOption = postOptions[id];
    const target = postActions || fakePostActions;
    if (!target.contains(postOption)) { target.prepend(postOption); }
  });
};

(async () => {
  postActionsSelector = await keyToCss('postActions');
  postFormButtonSelector = await keyToCss('postFormButton');

  pageModifications.register(postFormButtonSelector, addPostOptions);
})();

/**
 * Create and register a button to add to the new post form
 *
 * @param {string} id - Unique identifier for this post option
 * @param {object} options - Construction options for this post option
 * @param {string} options.symbolId - RemixIcon symbol to use
 * @param {Function} options.onclick - Click handler function for this button
 */
export const registerPostOption = async function (id, { symbolId, onclick }) {
  const postOptionLabel = Object.assign(document.createElement('label'), { className: 'xkit-post-option' });
  const postOptionButton = document.createElement('button');

  postOptionButton.addEventListener('click', onclick);
  postOptionLabel.appendChild(postOptionButton);

  const postOptionSvg = buildSvg(symbolId);
  postOptionButton.appendChild(postOptionSvg);

  postOptions[id] = postOptionLabel;

  $(`.${excludeClass}`).removeClass(excludeClass);
  pageModifications.trigger(addPostOptions);
};

/**
 * @param {string} id - Identifier for the previously registered post option
 */
export const unregisterPostOption = id => {
  postOptions[id]?.remove();
  delete postOptions[id];
};
