import { dom } from './dom.js';
import { buildStyle } from './interface.js';
import { buildSvg } from './remixicon.js';

// Remove outdated buttons when loading module
$('.xkit-control-button-container').remove();

document.documentElement.append(buildStyle(`
.xkit-control-button-tooltip {
  position: absolute;
  bottom: 50%;
  left: 50%;
  transform: translate(-50%, -20.5px);

  z-index: 2;
  pointer-events: none;

  transition: visibility 0ms 250ms;
}

:not(:hover) > .xkit-control-button-tooltip {
  visibility: hidden;
  transition: visibility 0ms 0ms;
}

.xkit-control-button-tooltip-box {
  min-width: 54px;
  width: max-content;
  padding: 4px 10px;

  border-radius: 4px;
  box-shadow: 0 0 4px rgba(0,0,0,.25);

  background-color: black;
  color: white;

  font-size: .875rem;
  font-weight: 500;
  line-height: 20px;
  text-align: center;
}

.xkit-control-button-tooltip::after {
  content: "";
  position: absolute;
  left: 50%;
  transform: translateX(-8px);

  border: 8px solid transparent;
  border-top-color: black;
}
`));

/**
 * Create a button template that can be cloned with cloneControlButton() for inserting into the controls of a post.
 * @param {string} symbolId - The name of the RemixIcon to use
 * @param {string} buttonClass - An extra class to identify the extension that added the button
 * @param {string} tooltip - Text to display in the button tooltip
 * @returns {HTMLDivElement} A button that can be cloned with cloneControlButton()
 */
export const createControlButtonTemplate = function (symbolId, buttonClass, tooltip) {
  return dom('div', { class: `xkit-control-button-container ${buttonClass}` }, null, [
    dom('div', { class: 'xkit-control-button-tooltip' }, null, [
      dom('div', { class: 'xkit-control-button-tooltip-box' }, null, [tooltip])
    ]),
    dom('button', { class: 'xkit-control-button' }, null, [
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
