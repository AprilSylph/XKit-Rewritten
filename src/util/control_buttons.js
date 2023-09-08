import { dom } from './dom.js';
import { buildStyle } from './interface.js';
import { buildSvg } from './remixicon.js';

// Remove outdated buttons when loading module
$('.xkit-control-button-container').remove();

document.documentElement.append(buildStyle(`
:not(:hover) > .xkit-control-button-tooltip{
  display: none;
}
.xkit-control-button-tooltip {
  z-index: 2;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.xkit-control-button-tooltip-popover-holder {
  position: absolute;
  inset: auto auto 0px 0px;
  transform: translate3d(-23px, -10px, 0px);
}

.xkit-control-button-tooltip-tooltip {
  pointer-events: none;
  font-family: var(--font-family);
  overflow-wrap: break-word;
  word-wrap: break-word;
  -webkit-hyphens: auto;
  hyphens: auto;
  color: #fff;
  text-align: center;
  background-color: #000;
  border-radius: 4px;
  min-width: 54px;
  padding: 4px 8px;
  font-size: .875rem;
  font-weight: 500;
  line-height: 20px;
  position: relative;
  box-shadow: 0 0 4px rgba(0,0,0,.25);
}
.xkit-control-button-tooltip-arrow {
  position: absolute;
  left: 0px;
  transform: translate3d(27px, 0px, 0px);
  bottom: -16px;
  pointer-events: none;
  width: 16px;
  height: 16px;
}
.xkit-control-button-tooltip-arrow::after {
  content: "";
  pointer-events: none;
  border: 8px solid transparent;
  width: 0;
  height: 0;
  position: absolute;

  border-top-color: #000;
  border-bottom: none;
  top: 0;
  left: 0;
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
      dom('div', { class: 'xkit-control-button-tooltip-popover-holder' }, null, [
        dom('div', { class: 'xkit-control-button-tooltip-tooltip' }, null, [tooltip]),
        dom('div', { class: 'xkit-control-button-tooltip-arrow ' })
      ])
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
