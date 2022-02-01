import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';

const excludeClass = 'xkit-vanilla-video-done';
const videoClass = 'xkit-vanilla-video-player';

let defaultVolume;

const cloneVideoElements = async function () {
  [...document.querySelectorAll(`video:not(.${excludeClass}):not(.${videoClass})`)].forEach(async videoElement => {
    videoElement.classList.add(excludeClass);

    const newVideoElement = Object.assign(document.createElement('video'), {
      controls: true,
      crossOrigin: videoElement.crossOrigin,
      poster: videoElement.poster,
      volume: defaultVolume / 100,
      className: videoClass
    });
    newVideoElement.setAttribute('playsinline', true);

    [...videoElement.children]
      .forEach(sourceElement => newVideoElement.appendChild(sourceElement.cloneNode(true)));

    videoElement.parentNode.parentNode.prepend(newVideoElement);
  });
};

export const onStorageChanged = async function (changes, areaName) {
  if (areaName !== 'local') {
    return;
  }

  const {
    'vanilla_video.preferences.defaultVolume': defaultVolumeChanges
  } = changes;

  if (defaultVolumeChanges && defaultVolumeChanges.oldValue !== undefined) {
    ({ newValue: defaultVolume } = defaultVolumeChanges);
  }
};

export const main = async function () {
  ({ defaultVolume } = await getPreferences('vanilla_video'));

  onNewPosts.addListener(cloneVideoElements);
};

export const clean = async function () {
  onNewPosts.removeListener(cloneVideoElements);
  $(`.${videoClass}`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
