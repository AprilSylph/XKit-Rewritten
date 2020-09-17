(function () {
  let videoPlayerSelector;

  const excludeClass = 'xkit-vanilla-video-done';

  const addVideoControls = async function () {
    [...document.querySelectorAll(`${videoPlayerSelector}:not(.${excludeClass}`)]
    .forEach(videoPlayer => {
      videoPlayer.classList.add(excludeClass);

      const video = videoPlayer.querySelector('video');
      if (!video) { return; }

      video.controls = true;
      video.loop = false;
      video.autoplay = false;
      video.pause();
      video.currentTime = 0;
    });
  };

  const main = async function () {
    const { keyToCss } = await fakeImport('/src/util/css_map.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    videoPlayerSelector = await keyToCss('videoPlayer');

    onNewPosts.addListener(addVideoControls);
    addVideoControls();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    onNewPosts.removeListener(addVideoControls);
  };

  return { main, clean, stylesheet: true };
})();
