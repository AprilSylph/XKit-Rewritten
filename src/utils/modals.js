import { removeElementsById } from './cleanup.js';
import { button, dialog, div, h1, span, strong, style } from './dom.js';

// Remove any outdated modal when loading module
removeElementsById('xkit-modal');

/** @type {(event: KeyboardEvent) => void} */
const escapeKeyCancel = (event) => {
  if (event.key === 'Escape') {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
};

const listenerOptions = { capture: true };

/**
 * Show a takeover prompt to the user
 * @param {object} options Destructured
 * @param {string} [options.title] Prompt title
 * @param {(string | Node)[]} [options.message] Nodes to be displayed in the modal, to be used as prompts or non-submit inputs
 * @param {HTMLElement[]} [options.buttons] Array of buttons to be displayed in the modal
 */
export const showModal = ({ title, message = [], buttons = [] }) => {
  hideModal();

  const isInterstitial = buttons.length === 0;
  if (isInterstitial) {
    // Do not allow interstitial modals to be closed by an Escape keydown.
    document.documentElement.addEventListener('keydown', escapeKeyCancel, listenerOptions);
  }

  // Use the live --overlay-tint-heavy variable if possible; use the static computed value on Chrome 105-121.
  // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::backdrop#browser_compatibility
  const colorOverlayTintHeavy = getComputedStyle(document.documentElement).getPropertyValue('--overlay-tint-heavy');
  const styleElement = style({}, `#xkit-modal::backdrop { background-color: var(--overlay-tint-heavy, ${colorOverlayTintHeavy}) }`);

  const modalElement = dialog({
    id: 'xkit-modal',

    /** Prevents Tumblr's `trapFocusInsideGlass()` from stealing focus when opened from mobile drawer. */
    'data-skip-glass-focus-trap': '',

    /** Mark interstitial dialogs as such. This gets removed when `hideModal()` is called. */
    ...(isInterstitial && { inert: '' }),

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/close_event
     * @type {(event: Event & { currentTarget: HTMLDialogElement }) => void}
     */
    close ({ currentTarget }) {
      if (currentTarget.inert) {
        // Re-open the interstitial modal and prevent teardown until `hideModal()` is called.
        // Prevents interstitials from being permanently closed by mobile browser "back" actions.
        currentTarget.showModal();
      } else {
        document.documentElement.removeEventListener('keydown', escapeKeyCancel, listenerOptions);
        currentTarget.remove();
      }
    },
  }, [
    styleElement,
    h1({ class: 'title' }, [title]),
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
  [...document.querySelectorAll('dialog[open]#xkit-modal')].forEach((/** @type {HTMLDialogElement} */ modalElement) => {
    modalElement.inert = false;
    modalElement.close();
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
        .join('\n'),
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
