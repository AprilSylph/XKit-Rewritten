(function () {
  let nativePlayerSelector;
  let trackInfoSelector;

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
      nativePlayer.parentNode.appendChild(audioClone);
    });
  };

  const main = async function () {
    const { keyToCss } = await fakeImport('/src/util/css_map.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    nativePlayerSelector = await keyToCss('nativePlayer');
    trackInfoSelector = await keyToCss('trackInfo');

    onNewPosts.addListener(addAudioControls);
    addAudioControls();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    onNewPosts.removeListener(addAudioControls);
    $(`.${excludeClass} + audio[controls]`).remove();
    $(`.${excludeClass}`).removeClass(excludeClass);
  };

  return { main, clean, stylesheet: true };
})();
