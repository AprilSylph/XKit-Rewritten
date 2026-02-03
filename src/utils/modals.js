import { dom } from './dom.js';

// Remove any outdated modal when loading module
document.getElementById('xkit-modal')?.remove();

let lastFocusedElement;

/**
 * Show a takeover prompt to the user
 * @param {object} options Destructured
 * @param {string} [options.title] Prompt title
 * @param {(string|Node)[]} [options.message] Nodes to be displayed in the modal, to be used as prompts or non-submit inputs
 * @param {(HTMLElement)[]} [options.buttons] Array of buttons to be displayed in the modal
 */
export const showModal = ({ title, message = [], buttons = [] }) => {
  const modalElement = dom('div', {
    id: 'xkit-modal',
    tabindex: '-1',
    role: 'dialog',
    'aria-modal': 'true',

    // prevents Tumblr's trapFocusInsideGlass function from stealing focus when opened from mobile drawer
    'data-skip-glass-focus-trap': '',
  }, null, [
    dom('style', null, null, ['body { overflow: hidden; }']),
    title ? dom('h3', { class: 'title' }, null, [title]) : '',
    dom('div', { class: 'message' }, null, message),
    dom('div', { class: 'buttons' }, null, buttons),
  ]);

  hideModal();
  document.getElementById('base-container')?.appendChild(modalElement);

  lastFocusedElement = document.activeElement;
  modalElement.focus();
};

export const hideModal = () => {
  document.getElementById('xkit-modal')?.remove();
  lastFocusedElement?.focus();
  lastFocusedElement = null;
};

export const modalCancelButton = dom('button', null, { click: hideModal }, ['Cancel']);
export const modalCompleteButton = dom('button', { class: 'blue' }, { click: hideModal }, ['OK']);

export const showErrorModal = exception => {
  console.error('XKit Rewritten error:', exception);

  showModal({
    title: 'Something went wrong.',
    message: [
      [
        exception.body?.errors?.[0]?.detail,
        exception.errors?.[0]?.detail,
        exception.message,
        browser.runtime?.id === undefined && 'Please refresh this browser tab!',
      ]
        .filter(Boolean)
        .join('\n\n'),
    ],
    buttons: [modalCompleteButton],
  });
};

export const createTagSpan = tag => dom('span', { class: 'xkit-modal-tag' }, null, [tag]);
export const createBlogSpan = name => dom('span', { class: 'xkit-modal-blog' }, null, [name]);
