import { inject } from './inject.js';
import { showModal, modalCancelButton } from './modals.js';

const currentVersion = browser.runtime.getManifest().version;

const getRunningXkit = async (currentVersion) => {
  const runningVersion = window.xkitRunning;
  Object.defineProperty(window, 'xkitRunning', {
    value: currentVersion,
    writable: false,
    enumerable: false,
    configurable: true
  });
  return runningVersion;
};

export const checkRepeatInit = () => inject(getRunningXkit, [currentVersion])
  .then(result => {
    if (result) {
      const updateMessage = result !== currentVersion
        ? [`The extension appears to have been auto-updated to ${currentVersion}!`, document.createElement('br')]
        : [];

      showModal({
        title: 'XKit Rewritten has been initialized multiple times',
        message: [
          ...updateMessage,
          'Refreshing this browser tab is recommended to avoid unexpected behavior.'
        ],
        buttons: [
          modalCancelButton,
          Object.assign(document.createElement('button'), {
            textContent: 'Reload',
            className: 'blue',
            onclick: () => {
              location.reload(true);
            }
          })
        ]
      });
    }
  });
