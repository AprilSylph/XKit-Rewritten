(function () {
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

    if (defaultVolumeChanges) {
      ({ newValue: defaultVolume } = defaultVolumeChanges);
    }
  };

  const main = async function () {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { keyToCss } = await fakeImport('/util/css_map.js');
    const { getPreferences } = await fakeImport('/util/preferences.js');
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    nativePlayerSelector = await keyToCss('nativePlayer');
    trackInfoSelector = await keyToCss('trackInfo');

    ({ defaultVolume } = await getPreferences('vanilla_audio'));

    onNewPosts.addListener(addAudioControls);
    addAudioControls();
  };

  const clean = async function () {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    onNewPosts.removeListener(addAudioControls);
    $(`.${excludeClass} + audio[controls]`).remove();
    $(`.${excludeClass}`).removeClass(excludeClass);
  };

  return { main, clean, stylesheet: true };
})();
