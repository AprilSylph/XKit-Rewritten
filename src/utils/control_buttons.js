import { dom } from './dom.js';
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
