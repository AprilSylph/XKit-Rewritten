import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { buildStyle } from './interface.js';
import { timelineObject } from './react_props.js';
import { buildSvg } from './remixicon.js';

// Remove outdated buttons when loading module
$('.xkit-control-button-container').remove();

/**
 * Create a button template that can be cloned with cloneControlButton() for inserting into the controls of a post.
 * @param {string} symbolId - The name of the RemixIcon to use
 * @param {string} buttonClass - An extra class to identify the extension that added the button
 * @param {string} label - Descriptive text to be set as the button aria-label property and tooltip
 * @returns {HTMLDivElement} A button that can be cloned with cloneControlButton()
 */
export const createControlButtonTemplate = function (symbolId, buttonClass, label = '') {
  return dom('div', { class: `xkit-control-button-container ${buttonClass}` }, null, [
    dom('button', { class: 'xkit-control-button', 'aria-label': label, title: label }, null, [
      dom('span', { class: 'xkit-control-button-inner', tabindex: '-1' }, null, [
        buildSvg(symbolId)
      ])
    ])
  ]);
};

/**
 * Create a deep-level clone of a button template that is ready to add to the page
 * @param {HTMLDivElement} template - A button template as returned by createControlButtonTemplate()
 * @param {object} events - An object of DOM Event names and handler functions,
 *                          e.g. { click: () => { alert('Hello!'); } }
 * @param {boolean} disabled - Whether to disable the button clone
 * @returns {HTMLDivElement} A clone of the button template, with the specified event handlers attached
 */
export const cloneControlButton = function (template, events, disabled = false) {
  const newButtonContainer = template.cloneNode(true);
  const newButton = newButtonContainer.querySelector('button');
  Object.entries(events).forEach(([type, listener]) => newButton.addEventListener(type, listener));
  newButton.disabled = disabled;
  return newButtonContainer;
};

const controlIconSelector = keyToCss('controlIcon');

/**
 * Inserts a clone of a button template before the post edit icon, if the post is editable
 * @param {HTMLElement} postElement - The target post element
 * @param {HTMLDivElement} clonedControlButton - Button clone to insert if the post is editable
 * @param {string} buttonClass - Button HTML class
 * @returns {Promise<void>} Resolves when finished
 */
export const insertControlButtonEditable = async (postElement, clonedControlButton, buttonClass) => {
  const existingButton = postElement.querySelector(`.${buttonClass}`);
  if (existingButton !== null) { return; }

  const editIcon = postElement.querySelector(`footer ${keyToCss('controlIcon')} a[href*="/edit/"] use[href="#managed-icon__edit"]`);
  if (editIcon) {
    const controlIcon = editIcon.closest(controlIconSelector);
    controlIcon.before(clonedControlButton);
  } else {
    const { community, canEdit } = await timelineObject(postElement);
    if (community && canEdit) {
      postElement.querySelector(`${keyToCss('noteCountContainer')} > ${keyToCss('container')}`).before(clonedControlButton);
    }
  }
};

const styleElement = buildStyle(`
${keyToCss('noteCountContainer')} > .xkit-control-button-container {
    margin: 0 12px 0 0;
    align-self: center;
}
`);
document.documentElement.append(styleElement);
