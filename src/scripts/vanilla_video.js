import { getPreferences } from '../util/preferences.js';
import { pageModifications } from '../util/mutations.js';

const vanillaVideoClass = 'xkit-vanilla-video-player';

let defaultVolume;

const cloneVideoElements = videoElements => videoElements.forEach(videoElement => {
  if (videoElement.previousElementSibling?.classList.contains(vanillaVideoClass)) return;

  const newVideoElement = Object.assign(document.createElement('video'), {
    controls: true,
    crossOrigin: videoElement.crossOrigin,
    poster: videoElement.poster,
    volume: defaultVolume / 100,
    className: vanillaVideoClass
  });
  newVideoElement.setAttribute('playsinline', true);

  const videoSources = [...videoElement.children];
  newVideoElement.append(
    ...videoSources.map(sourceElement => sourceElement.cloneNode(true))
  );

  videoElement.before(newVideoElement);
});

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
  pageModifications.register(`video:not(.${vanillaVideoClass})`, cloneVideoElements);
};

export const clean = async function () {
  pageModifications.unregister(cloneVideoElements);
  $(`.${vanillaVideoClass}`).remove();
};

export const stylesheet = true;
