import { keyToCss } from '../util/css_map.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';

let nativePlayerSelector;
let trackInfoSelector;

let defaultVolume;

const excludeClass = 'xkit-vanilla-audio-done';

const addAudioControls = async function () {
  [...document.querySelectorAll(`${nativePlayerSelector}:not(.${excludeClass})`)]
    .forEach(nativePlayer => {
      const audio = nativePlayer.querySelector('audio');
      if (!audio) { return; }

      nativePlayer.classList.add(excludeClass);

      const trackInfo = nativePlayer.querySelector(trackInfoSelector);
      trackInfo?.classList.add('trackInfo');

      const audioClone = audio.cloneNode(true);
      audioClone.controls = true;
      audioClone.volume = defaultVolume / 100;
      nativePlayer.parentNode.appendChild(audioClone);
    });
};

export const onStorageChanged = async function (changes, areaName) {
  if (areaName !== 'local') {
    return;
  }

  const {
    'vanilla_audio.preferences.defaultVolume': defaultVolumeChanges
  } = changes;

  if (defaultVolumeChanges && defaultVolumeChanges.oldValue !== undefined) {
    ({ newValue: defaultVolume } = defaultVolumeChanges);
  }
};

export const main = async function () {
  nativePlayerSelector = await keyToCss('nativePlayer');
  trackInfoSelector = await keyToCss('trackInfo');

  ({ defaultVolume } = await getPreferences('vanilla_audio'));

  onNewPosts.addListener(addAudioControls);
  addAudioControls();
};

export const clean = async function () {
  onNewPosts.removeListener(addAudioControls);
  $(`.${excludeClass} + audio[controls]`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
