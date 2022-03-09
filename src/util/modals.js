import { dom } from './dom.js';

let lastFocusedElement;

/**
 * Show a takeover prompt to the user
 *
 * @param {object} options - Destructured
 * @param {string} [options.title] - Prompt title
 * @param {(string|Node)[]} [options.message] - Nodes to be displayed in the modal, to be used as prompts or non-submit inputs
 * @param {(HTMLAnchorElement|HTMLButtonElement)[]} [options.buttons] - Array of buttons to be displayed in the modal
 */
export const showModal = ({ title, message = [], buttons = [] }) => {
  const modalElement = dom('div', {
    id: 'xkit-modal',
    tabindex: '-1',
    role: 'dialog',
    'aria-modal': 'true'
  }, null, [
    dom('style', null, null, ['body { overflow: hidden; }']),
    title ? dom('h3', { class: 'title' }, null, [title]) : '',
    dom('div', { class: 'message' }, null, message),
    dom('div', { class: 'buttons' }, null, buttons)
  ]);

  hideModal();
  document.getElementById('base-container')?.appendChild(modalElement);

  lastFocusedElement = document.activeElement;
  modalElement.focus();
};

export const hideModal = () => {
  document.getElementById('xkit-modal')?.remove();
  lastFocusedElement?.focus();
};

export const modalCancelButton = dom('button', null, { click: hideModal }, ['Cancel']);
export const modalCompleteButton = dom('button', { class: 'blue' }, { click: hideModal }, ['OK']);
