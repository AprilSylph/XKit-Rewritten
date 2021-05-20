import { onPostsMutated } from '../../util/mutations.js';

const className = 'accesskit-disable-gifs';

const pauseGif = function (gifElement) {
  const image = new Image();
  image.src = gifElement.currentSrc;
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.className = gifElement.className;
    canvas.classList.add('xkit-paused-gif');
    canvas.getContext('2d').drawImage(image, 0, 0);

    const gifLabel = document.createElement('p');
    gifLabel.className = 'xkit-gif-label';

    gifElement.parentNode.prepend(canvas);
    gifElement.parentNode.prepend(gifLabel);
  };
};

const processGifs = function () {
  [...document.querySelectorAll('figure img[srcset*=".gif"]:not(.xkit-accesskit-disabled-gif)')]
    .forEach(gifElement => {
      gifElement.classList.add('xkit-accesskit-disabled-gif');

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

export const main = async function () {
  document.body.classList.add(className);

  onPostsMutated.addListener(processGifs);
  processGifs();
};

export const clean = async function () {
  onPostsMutated.removeListener(processGifs);

  document.body.classList.remove(className);

  $('.xkit-paused-gif, .xkit-gif-label').remove();
  $('.xkit-accesskit-disabled-gif').removeClass('xkit-accesskit-disabled-gif');
};
