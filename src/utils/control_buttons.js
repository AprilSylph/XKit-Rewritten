import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { displayInlineBlockUnlessDisabledAttr } from './interface.js';
import { timelineObject } from './react_props.js';
import { buildSvg } from './remixicon.js';

// Remove outdated buttons when loading module
$('.xkit-control-button-container').remove();

/**
 * Create a button template that can be cloned with cloneControlButton() for inserting into the controls of a post.
 * @param {string} symbolId The name of the RemixIcon to use
 * @param {string} buttonClass An extra class to identify the extension that added the button
 * @param {string} label Descriptive text to be set as the button aria-label property and tooltip
 * @returns {HTMLDivElement} A button that can be cloned with cloneControlButton()
 */
export const createControlButtonTemplate = function (symbolId, buttonClass, label = '') {
  return dom('span', { class: `xkit-control-button-container ${buttonClass}`, [displayInlineBlockUnlessDisabledAttr]: '' }, null, [
    dom('button', { class: 'xkit-control-button', 'aria-label': label, title: label }, null, [
      dom('span', { class: 'xkit-control-button-inner', tabindex: '-1' }, null, [
        buildSvg(symbolId),
      ]),
    ]),
  ]);
};

/**
 * Create a deep-level clone of a button template that is ready to add to the page
 * @param {HTMLDivElement} template A button template as returned by createControlButtonTemplate()
 * @param {object} events An object of DOM Event names and handler functions,
 *                          e.g. { click: () => { alert('Hello!'); } }
 * @param {boolean} disabled Whether to disable the button clone
 * @returns {HTMLDivElement} A clone of the button template, with the specified event handlers attached
 */
export const cloneControlButton = function (template, events, disabled = false) {
  const newButtonContainer = template.cloneNode(true);
  const newButton = newButtonContainer.querySelector('button');
  Object.entries(events).forEach(([type, listener]) => newButton.addEventListener(type, listener));
  newButton.disabled = disabled;
  return newButtonContainer;
};

const secondaryFooterRowClass = 'xkit-controls-row';

/**
 * Adds a secondary footer row above the footer control buttons, similar to the one in the pre-2025 footer layout on editable posts.
 * @param {HTMLElement} postElement The target post element
 * @returns {HTMLDivElement} The inserted element
 */
const addSecondaryFooterRow = postElement => {
  const element =
    postElement.querySelector(`.${secondaryFooterRowClass}`) ||
    dom('div', { class: secondaryFooterRowClass });

  element.isConnected || postElement.querySelector('footer').before(element);
  return element;
};

/**
 * Inserts a control button into the post footer.
 * @param {HTMLElement} postElement The target post element
 * @param {HTMLDivElement} clonedControlButton Control button element to insert
 * @param {string} buttonClass Button HTML class
 * @returns {Promise<void>} Resolves when finished
 */
export const insertControlButton = async (postElement, clonedControlButton, buttonClass) => {
  const existingButton = postElement.querySelector(`.${buttonClass}`);
  if (existingButton !== null) { return; }

  const { community } = await timelineObject(postElement);
  const legacyEditControlIcon = postElement.querySelector(`${keyToCss('controlIcon')}:has(a[href*="/edit/"] use[href="#managed-icon__edit"])`);
  const newEditControlIcon = postElement.querySelector('a[href*="/edit/"]:has(use[href="#managed-icon__ds-pencil-outline-24"])');

  if (community) {
    clonedControlButton.classList.add('in-community');
    postElement.querySelector(keyToCss('controls')).append(clonedControlButton);
  } else if (legacyEditControlIcon) {
    clonedControlButton.classList.add('in-legacy-footer');
    legacyEditControlIcon.before(clonedControlButton);
  } else if (newEditControlIcon) {
    clonedControlButton.classList.add('in-new-footer');
    newEditControlIcon.before(clonedControlButton);
  } else {
    clonedControlButton.classList.add('in-new-footer');
    addSecondaryFooterRow(postElement).prepend(clonedControlButton);
  }
};
