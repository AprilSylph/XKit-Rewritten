let lastFocusedElement;

/**
 * Show a takeover prompt to the user
 *
 * @param {object} options - Destructured
 * @param {string} [options.title] - Prompt title
 * @param {(string|Node)[]} [options.message] - Nodes to be displayed in the modal, to be used as prompts or non-submit inputs
 * @param {HTMLButtonElement[]} [options.buttons] - Array of buttons to be displayed in the modal
 */
export const showModal = ({ title, message = [], buttons = [] }) => {
  const modalElement = Object.assign(document.createElement('div'), { id: 'xkit-modal', tabIndex: -1 });
  modalElement.setAttribute('role', 'dialog');
  modalElement.setAttribute('aria-modal', true);

  const styleElement = Object.assign(document.createElement('style'), { textContent: 'body { overflow: hidden; }' });
  modalElement.appendChild(styleElement);

  if (title) {
    const titleElement = Object.assign(document.createElement('h3'), {
      className: 'title',
      textContent: title
    });
    modalElement.appendChild(titleElement);
  }

  const messageElement = Object.assign(document.createElement('div'), { className: 'message' });
  messageElement.append(...message);
  modalElement.appendChild(messageElement);

  const buttonsElement = Object.assign(document.createElement('div'), { className: 'buttons' });
  buttonsElement.append(...buttons);
  modalElement.appendChild(buttonsElement);

  hideModal();
  document.getElementById('base-container')?.appendChild(modalElement);

  lastFocusedElement = document.activeElement;
  modalElement.focus();
};

export const hideModal = () => {
  const modalElement = document.getElementById('xkit-modal');
  modalElement?.parentNode?.removeChild(modalElement);
  lastFocusedElement?.focus();
};

export const modalCancelButton = Object.assign(document.createElement('button'), {
  textContent: 'Cancel',
  onclick: hideModal
});

export const modalCompleteButton = Object.assign(document.createElement('button'), {
  textContent: 'OK',
  className: 'blue',
  onclick: hideModal
});
