(function () {
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
        src: videoElement.currentSrc,
        volume: defaultVolume / 100,
        className: videoClass
      });
      newVideoElement.setAttribute('playsinline', true);

      videoElement.parentNode.parentNode.prepend(newVideoElement);
    });
  };

  const onStorageChanged = async function (changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const {
      'vanilla_video.preferences.defaultVolume': defaultVolumeChanges
    } = changes;

    if (defaultVolumeChanges) {
      ({ newValue: defaultVolume } = defaultVolumeChanges);
    }
  };

  const main = async function () {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/util/preferences.js');
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    ({ defaultVolume } = await getPreferences('vanilla_video'));

    onNewPosts.addListener(cloneVideoElements);
    cloneVideoElements();
  };

  const clean = async function () {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    onNewPosts.removeListener(cloneVideoElements);
    $(`.${videoClass}`).remove();
    $(`.${excludeClass}`).removeClass(excludeClass);
  };

  return { main, clean, stylesheet: true };
})();
