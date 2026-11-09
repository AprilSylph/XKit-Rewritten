import { removeElementsById } from './cleanup.js';
import { button, dialog, div, h1, span, strong, style } from './dom.js';

// Remove any outdated modal when loading module
removeElementsById('xkit-modal');

/**
 * Show a takeover prompt to the user
 * @param {object} options Destructured
 * @param {string} [options.title] Prompt title
 * @param {(string | Node)[]} [options.message] Nodes to be displayed in the modal, to be used as prompts or non-submit inputs
 * @param {HTMLElement[]} [options.buttons] Array of buttons to be displayed in the modal
 */
export const showModal = ({ title, message = [], buttons = [] }) => {
  hideModal();

  const modalElement = dialog({
    id: 'xkit-modal',
    'data-skip-glass-focus-trap': '', // Prevents Tumblr's `trapFocusInsideGlass()` from stealing focus when opened from mobile drawer
  }, [
    style({}, ['body { overflow: hidden; }']),
    ...(
      title
        ? [h1({ class: 'title' }, [title])]
        : []
    ),
    div({ class: 'message' }, message),
    div({ class: 'buttons' }, buttons),
  ]);

  document.body.append(modalElement);
  modalElement.showModal();
};

/**
 * Hide the current takeover prompt.
 */
export function hideModal () {
  [...document.querySelectorAll('dialog[open]#xkit-modal')].forEach(modalElement => {
    modalElement.close();
    modalElement.remove();
  });
}

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
export const createBlogSpan = name => strong({ class: 'xkit-modal-blog' }, [name]);
