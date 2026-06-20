import { keyToCss } from '../../utils/css_map.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';

const trackInfoSelector = keyToCss('trackInfo');

let defaultVolume;

const excludeClass = 'xkit-vanilla-audio-done';

const addAudioControls = nativePlayers => nativePlayers.forEach(nativePlayer => {
  if (nativePlayer.classList.contains(excludeClass)) return;
  nativePlayer.classList.add(excludeClass);

  const audio = nativePlayer.querySelector('audio');
  if (audio === null) return;

  const trackInfo = nativePlayer.querySelector(trackInfoSelector);
  trackInfo?.classList.add('trackInfo');

  const audioClone = audio.cloneNode(true);
  audioClone.controls = true;
  audioClone.volume = defaultVolume / 100;
  nativePlayer.parentNode.appendChild(audioClone);
});

export const onStorageChanged = async function (changes) {
  const {
    'vanilla_audio.preferences.defaultVolume': defaultVolumeChanges,
  } = changes;

  if (defaultVolumeChanges && defaultVolumeChanges.oldValue !== undefined) {
    ({ newValue: defaultVolume } = defaultVolumeChanges);
  }
};

export const main = async function () {
  ({ defaultVolume } = await getPreferences('vanilla_audio'));
  pageModifications.register(keyToCss('nativePlayer'), addAudioControls);
};

export const clean = async function () {
  pageModifications.unregister(addAudioControls);
  $(`.${excludeClass} + audio[controls]`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
