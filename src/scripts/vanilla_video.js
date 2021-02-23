(function () {
  const addVideoControls = async function () {
    [...document.querySelectorAll('video:not([controls])')]
      .forEach(video => {
        video.controls = true;
        video.loop = false;
        video.autoplay = false;
        video.pause();
        video.currentTime = 0;
      });
  };

  const stopVideoAutoplay = async function () {
    [...document.querySelectorAll('video[controls][autoplay]')]
      .forEach(video => {
        video.autoplay = false;
        video.pause();
        video.currentTime = 0;
      });
  };

  const main = async function () {
    const { onNewPosts, onPostsMutated } = await fakeImport('/util/mutations.js');

    onNewPosts.addListener(addVideoControls);
    onPostsMutated.addListener(stopVideoAutoplay);

    addVideoControls();
  };

  const clean = async function () {
    const { onNewPosts, onPostsMutated } = await fakeImport('/util/mutations.js');

    onNewPosts.removeListener(addVideoControls);
    onPostsMutated.removeListener(stopVideoAutoplay);

    [...document.querySelectorAll('video[controls]')]
      .forEach(video => { video.controls = false; });
  };

  return { main, clean, stylesheet: true };
})();
