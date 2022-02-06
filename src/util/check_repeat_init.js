import { inject } from './inject.js';
import { showModal, modalCompleteButton } from './modals.js';

const currentVersion = browser.runtime.getManifest().version;

const getRunningXkit = async (currentVersion) => {
  const runningVersion = window.xkitRunning;
  Object.defineProperty(window, 'xkitRunning', {
    value: currentVersion,
    writable: false,
    enumerable: false,
    configurable: false
  });
  return runningVersion;
};

export const checkRepeatInit = inject(getRunningXkit, [currentVersion])
  .then(result => {
    if (result) {
      showModal({
        title: 'XKit Rewritten has been initialized multiple times',
        message: [
          result === currentVersion
            ? 'Not sure how this happened! Are you a developer?'
            : `XKit Rewritten appears to been auto-updated to ${currentVersion}!`,
          document.createElement('br'),
          'Hard refreshing Tumblr via the refresh button or f5 key is recommended if you observe duplicate effects.'
        ],
        buttons: [modalCompleteButton]
      });
    }
  });
