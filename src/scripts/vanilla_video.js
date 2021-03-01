(function () {
  const excludeClass = 'xkit-vanilla-video-done';
  const videoClass = 'xkit-vanilla-video-player';

  const cloneVideoElements = async function () {
    [...document.querySelectorAll(`video:not(.${excludeClass})`)].forEach(async videoElement => {
      videoElement.classList.add(excludeClass);

      const newVideoElement = Object.assign(document.createElement('video'), {
        controls: true,
        crossorigin: videoElement.crossorigin,
        playsinline: true,
        poster: videoElement.poster,
        src: videoElement.currentSrc,
        style: videoElement.style,
        className: videoClass
      });

      videoElement.parentNode.parentNode.prepend(newVideoElement);
    });
  };

  const main = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    onNewPosts.addListener(cloneVideoElements);
    cloneVideoElements();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    onNewPosts.removeListener(cloneVideoElements);
    $(`.${videoClass}`).remove();
    $(`.${excludeClass}`).removeClass(excludeClass);
  };

  return { main, clean, stylesheet: true };
})();
