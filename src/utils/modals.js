import { removeElementsById } from './cleanup.js';
import { button, div, h3, span, style } from './dom.js';

// Remove any outdated modal when loading module
removeElementsById('xkit-modal');

let lastFocusedElement;

/**
 * Show a takeover prompt to the user
 * @param {object} options Destructured
 * @param {string} [options.title] Prompt title
 * @param {(string|Node)[]} [options.message] Nodes to be displayed in the modal, to be used as prompts or non-submit inputs
 * @param {(HTMLElement)[]} [options.buttons] Array of buttons to be displayed in the modal
 */
export const showModal = ({ title, message = [], buttons = [] }) => {
  const modalElement = div({
    id: 'xkit-modal',
    tabindex: '-1',
    role: 'dialog',
    'aria-modal': 'true',
    'data-skip-glass-focus-trap': '', // Prevents Tumblr's trapFocusInsideGlass function from stealing focus when opened from mobile drawer
  }, [
    style({}, ['body { overflow: hidden; }']),
    ...(
      title
        ? [h3({ class: 'title' }, [title])]
        : []
    ),
    div({ class: 'message' }, message),
    div({ class: 'buttons' }, buttons),
  ]);

  hideModal();
  document.getElementById('base-container')?.appendChild(modalElement);

  lastFocusedElement = document.activeElement;
  modalElement.focus();
};

/**
 * Hide the current takeover prompt.
 */
export const hideModal = () => {
  removeElementsById('xkit-modal');
  lastFocusedElement?.focus();
  lastFocusedElement = null;
};

export const modalCancelButton = button({ click: hideModal }, ['Cancel']);
export const modalCompleteButton = button({ class: 'blue', click: hideModal }, ['OK']);

/**
 * Show a takeover prompt to the user with details about a thrown exception.
 * @param {Error} exception Thrown exception to describe
 */
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

/**
 * Create a version of a function that shows a takeover prompt to the user if it throws.
 * @template {function (...T): R} Callback, T, R
 * @param {Callback} func A function
 * @returns {Callback} A version of the function with explicit error handling
 */
export const withModalOnError = func =>
  async (...args) => {
    try {
      return await func(...args);
    } catch (exception) {
      showErrorModal(exception);
    }
  };

export const showContextInvalidatedModal = () =>
  showModal({
    title: 'XKit Rewritten has become unloaded.',
    message: [
      'If this is unexpected, this is likely due to your browser automatically applying an XKit version update.',
      '\n\n',
      'Outdated XKit modifications will be updated/removed after you refresh this Tumblr tab.',
    ],
    buttons: [
      button({ click: hideModal }, ['Close']),
      button({ class: 'blue', click: () => location.reload() }, ['Refresh Now']),
    ],
  });

export const createTagSpan = tag => span({ class: 'xkit-modal-tag' }, [tag]);
export const createBlogSpan = name => span({ class: 'xkit-modal-blog' }, [name]);
