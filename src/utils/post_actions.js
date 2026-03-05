import { keyToCss } from './css_map.js';
import { button, label } from './dom.js';
import { displayBlockUnlessDisabledAttr } from './interface.js';
import { pageModifications } from './mutations.js';
import { buildSvg } from './remixicon.js';

// Remove outdated post options when loading module
$('.xkit-post-option').remove();

const postOptions = {};

const addPostOptions = ([postFormButton]) => {
  if (!postFormButton) { return; }

  const postActions = postFormButton.parentElement;

  postFormButton.before(
    ...Object.keys(postOptions)
      .sort()
      .map(id => postOptions[id])
      .filter(postOption => !postActions.contains(postOption)),
  );
};

pageModifications.register(keyToCss('postFormButton'), addPostOptions);

/**
 * Create and register a button to add to the new post form
 * @param {object} options Destructured
 * @param {string} options.id Identifier for this post option (must be unique)
 * @param {string} options.symbolId RemixIcon symbol to use
 * @param {(event: PointerEvent) => void} options.onclick Click handler function for this button
 */
export const registerPostOption = async function ({ id, symbolId, onclick }) {
  postOptions[id] = label({ class: 'xkit-post-option', [displayBlockUnlessDisabledAttr]: '' }, [
    button({ click: onclick }, [buildSvg(symbolId)]),
  ]);

  pageModifications.trigger(addPostOptions);
};

/**
 * @param {string} id Identifier for the previously registered post option
 */
export const unregisterPostOption = id => {
  postOptions[id]?.remove();
  delete postOptions[id];
};
