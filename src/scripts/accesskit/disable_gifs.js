import { pageModifications } from '../../util/mutations.js';

const className = 'accesskit-disable-gifs';

const pauseGif = function (gifElement) {
  const image = new Image();
  image.src = gifElement.currentSrc;
  image.onload = () => {
    if (gifElement.parentNode === null) { return; }
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.className = gifElement.className;
    canvas.classList.add('xkit-paused-gif');
    canvas.getContext('2d').drawImage(image, 0, 0);

    const gifLabel = document.createElement('p');
    gifLabel.className = 'xkit-gif-label';

    gifElement.parentNode.append(canvas, gifLabel);
  };
};

const processGifs = function (gifElements) {
  gifElements.forEach(gifElement => {
    const pausedGifElements = [
      ...gifElement.parentNode.querySelectorAll('.xkit-paused-gif'),
      ...gifElement.parentNode.querySelectorAll('.xkit-gif-label')
    ];
    if (pausedGifElements.length) {
      gifElement.after(...pausedGifElements);
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
  pageModifications.register('figure img[srcset*=".gif"]', processGifs);
};

export const clean = async function () {
  pageModifications.unregister(processGifs);
  document.body.classList.remove(className);

  $('.xkit-paused-gif, .xkit-gif-label').remove();
  $('.xkit-accesskit-disabled-gif').removeClass('xkit-accesskit-disabled-gif');
};
