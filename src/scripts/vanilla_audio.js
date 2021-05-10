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
      if (trackInfo) { trackInfo.classList.add('trackInfo'); }

      const audioClone = audio.cloneNode(true);
      audioClone.controls = true;
      audioClone.volume = defaultVolume / 100;
      nativePlayer.parentNode.appendChild(audioClone);
    });
};

const onStorageChanged = async function (changes, areaName) {
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
  browser.storage.onChanged.addListener(onStorageChanged);
  const { keyToCss } = await import('../util/css_map.js');
  const { getPreferences } = await import('../util/preferences.js');
  const { onNewPosts } = await import('../util/mutations.js');

  nativePlayerSelector = await keyToCss('nativePlayer');
  trackInfoSelector = await keyToCss('trackInfo');

  ({ defaultVolume } = await getPreferences('vanilla_audio'));

  onNewPosts.addListener(addAudioControls);
  addAudioControls();
};

export const clean = async function () {
  browser.storage.onChanged.removeListener(onStorageChanged);
  const { onNewPosts } = await import('../util/mutations.js');

  onNewPosts.removeListener(addAudioControls);
  $(`.${excludeClass} + audio[controls]`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
