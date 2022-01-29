import { keyToClasses } from './css_map.js';
import { buildStyle } from './interface.js';
import { buildSvg } from './remixicon.js';

/**
 * Create a button template that can be cloned with cloneControlButton() for inserting into the controls of a post.
 *
 * @param {string} symbolId - The name of the RemixIcon to use
 * @param {string} buttonClass - An extra class to identify the extension that added the button
 * @returns {Promise<HTMLDivElement>} A button that can be cloned with cloneControlButton()
 */
export const createControlButtonTemplate = async function (symbolId, buttonClass) {
  const controlButtonContainer = document.createElement('div');
  controlButtonContainer.classList.add('xkit-control-button-container', buttonClass);

  const controlButton = document.createElement('button');
  controlButton.classList.add('xkit-control-button');
  controlButtonContainer.appendChild(controlButton);

  const controlButtonInner = document.createElement('span');
  controlButtonInner.classList.add('xkit-control-button-inner');
  controlButtonInner.tabIndex = -1;
  controlButton.appendChild(controlButtonInner);

  const svg = buildSvg(symbolId);
  controlButtonInner.appendChild(svg);

  return controlButtonContainer;
};

/**
 * Create a deep-level clone of a button template that is ready to add to the page
 *
 * @param {HTMLDivElement} template - A button template as returned by createControlButtonTemplate()
 * @param {object} events - An object of DOM Event names and handler functions,
 *                          e.g. { click: () => { alert('Hello!'); } }
 * @returns {HTMLDivElement} A clone of the button template, with the specified event handlers attached
 */
export const cloneControlButton = function (template, events) {
  const newButton = template.cloneNode(true);
  Object.entries(events).forEach(([type, listener]) => newButton.addEventListener(type, listener));
  return newButton;
};

keyToClasses('footerRedesign').then(footerRedesignClasses => {
  const selector = footerRedesignClasses.map(className => `.${className} .xkit-control-button-container`);
  const styleElement = buildStyle(`${selector} { margin-left: 0; }`);
  document.head.append(styleElement);
});
