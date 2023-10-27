import { pageModifications } from '../../util/mutations.js';
import { keyToCss } from '../../util/css_map.js';
import { dom } from '../../util/dom.js';
import { postSelector } from '../../util/interface.js';

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
    gifLabel.className = gifElement.clientWidth < 150
      ? 'xkit-paused-gif-label mini'
      : 'xkit-paused-gif-label';

    gifElement.parentNode.append(canvas, gifLabel);
  };
};

const processGifs = function (gifElements) {
  gifElements.forEach(gifElement => {
    if (gifElement.closest('.block-editor-writing-flow')) return;
    const pausedGifElements = [
      ...gifElement.parentNode.querySelectorAll('.xkit-paused-gif'),
      ...gifElement.parentNode.querySelectorAll('.xkit-paused-gif-label')
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

const processBackgroundGifs = function (gifBackgroundElements) {
  gifBackgroundElements.forEach(gifBackgroundElement => {
    gifBackgroundElement.classList.add('xkit-paused-background-gif');
    const pausedGifElements = [
      ...gifBackgroundElement.querySelectorAll('.xkit-paused-gif-label')
    ];
    if (pausedGifElements.length) {
      return;
    }
    const gifLabel = document.createElement('p');
    gifLabel.className = 'xkit-paused-gif-label';
    gifBackgroundElement.append(gifLabel);
  });
};

const processRows = function (rowsElements) {
  rowsElements.forEach(rowsElement => {
    [...rowsElement.children].forEach(row => {
      if (!row.querySelector('figure')) return;

      if (row.previousElementSibling?.classList?.contains('xkit-paused-gif-container')) {
        row.previousElementSibling.append(row);
      } else {
        const wrapper = dom('div', { class: 'xkit-paused-gif-container' });
        row.replaceWith(wrapper);
        wrapper.append(row);
      }
    });
  });
};

export const main = async function () {
  document.body.classList.add(className);
  const gifImage = `
    :is(figure, ${keyToCss('tagImage', 'takeoverBanner')}) img[srcset*=".gif"]:not(${keyToCss('poster')})
  `;
  pageModifications.register(gifImage, processGifs);

  const gifBackgroundImage = `
    ${keyToCss('communityHeaderImage', 'bannerImage')}[style*=".gif"]
  `;
  pageModifications.register(gifBackgroundImage, processBackgroundGifs);

  pageModifications.register(`${postSelector} ${keyToCss('rows')}`, processRows);
};

export const clean = async function () {
  pageModifications.unregister(processGifs);
  pageModifications.unregister(processBackgroundGifs);
  pageModifications.unregister(processRows);
  document.body.classList.remove(className);

  [...document.querySelectorAll('.xkit-paused-gif-container')].forEach(wrapper =>
    wrapper.replaceWith(...wrapper.children)
  );

  $('.xkit-paused-gif, .xkit-paused-gif-label').remove();
  $('.xkit-accesskit-disabled-gif').removeClass('xkit-accesskit-disabled-gif');
  $('.xkit-paused-background-gif').removeClass('xkit-paused-background-gif');
};
