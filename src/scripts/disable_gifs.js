(function() {
  const pauseGif = function(gifElement) {
    const image = new Image();
    image.src = gifElement.currentSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.className = gifElement.className;
      canvas.classList.add('xkit-paused-gif');
      canvas.style.zIndex = 1;
      canvas.getContext('2d').drawImage(image, 0, 0);

      const gifLabel = document.createElement('p');
      gifLabel.className = 'xkit-gif-label';

      gifElement.parentNode.appendChild(canvas);
      gifElement.parentNode.appendChild(gifLabel);
    };
  };

  const processGifs = function() {
    [...document.querySelectorAll('figure img[srcset*=".gif"]:not(.xkit-disable-gifs-done)')]
    .forEach(gifElement => {
      gifElement.classList.add('xkit-disable-gifs-done');

      if (gifElement.parentNode.querySelector('.xkit-paused-gif') !== null) {
        return;
      }

      if (gifElement.complete && gifElement.currentSrc) {
        pauseGif(gifElement);
      } else {
        gifElement.onload = () => pauseGif(gifElement);
      }
    });
  };

  const main = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.addListener(processGifs);
    processGifs();
  };

  const clean = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.removeListener(processGifs);
    $('.xkit-paused-gif, .xkit-gif-label').remove();
    $('.xkit-disable-gifs-done').removeClass('xkit-disable-gifs-done');
  };

  const stylesheet = '/src/scripts/disable_gifs.css';

  return { main, clean, stylesheet };
})();
