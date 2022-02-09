import { inject } from './inject.js';
import { showModal, modalCompleteButton } from './modals.js';

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

export const checkRepeatInit = inject(getRunningXkit, [currentVersion])
  .then(result => {
    if (result) {
      const updateMessage = result !== currentVersion
        ? [`The extension appears to have been auto-updated to ${currentVersion}!`, document.createElement('br')]
        : [];

      showModal({
        title: 'XKit Rewritten has been initialized multiple times',
        message: [
          ...updateMessage,
          'Hard refreshing this browser tab via the refresh button or f5 key is recommended.'
        ],
        buttons: [modalCompleteButton]
      });
    }
  });
