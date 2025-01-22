import { pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { sha256 } from '../../utils/crypto.js';

const canvasClass = 'xkit-paused-gif-placeholder';
const labelClass = 'xkit-paused-gif-label';
const containerClass = 'xkit-paused-gif-container';
const backgroundGifClass = 'xkit-paused-background-gif';

export const styleElement = buildStyle(`
.${labelClass} {
  position: absolute;
  top: 1ch;
  right: 1ch;

  height: 1em;
  padding: 0.6ch;
  border-radius: 3px;

  background-color: rgb(var(--black));
  color: rgb(var(--white));
  font-size: 1rem;
  font-weight: bold;
  line-height: 1em;
}

.${labelClass}::before {
  content: "GIF";
}

.${labelClass}.mini {
  font-size: 0.6rem;
}

.${canvasClass} {
  position: absolute;
  visibility: visible;

  background-color: rgb(var(--white));
}

*:hover > .${canvasClass},
*:hover > .${labelClass},
.${containerClass}:hover .${canvasClass},
.${containerClass}:hover .${labelClass} {
  display: none;
}

.${backgroundGifClass}:not(:hover) {
  background-image: none !important;
  background-color: rgb(var(--secondary-accent));
}

.${backgroundGifClass}:not(:hover) > div {
  color: rgb(var(--black));
}
`);

const addLabel = (element, inside = false) => {
  if (element.parentNode.querySelector(`.${labelClass}`) === null) {
    const gifLabel = document.createElement('p');
    gifLabel.className = element.clientWidth && element.clientWidth < 150
      ? `${labelClass} mini`
      : labelClass;

    inside ? element.append(gifLabel) : element.parentNode.append(gifLabel);
  }
};

const pauseGif = function (gifElement) {
  const image = new Image();
  image.src = gifElement.currentSrc;
  image.onload = () => {
    if (gifElement.parentNode && gifElement.parentNode.querySelector(`.${canvasClass}`) === null) {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.className = gifElement.className;
      canvas.classList.add(canvasClass);
      canvas.getContext('2d').drawImage(image, 0, 0);
      gifElement.parentNode.append(canvas);
      addLabel(gifElement);
    }
  };
};

const processGifs = function (gifElements) {
  gifElements.forEach(gifElement => {
    if (gifElement.closest('.block-editor-writing-flow')) return;
    const pausedGifElements = [
      ...gifElement.parentNode.querySelectorAll(`.${canvasClass}`),
      ...gifElement.parentNode.querySelectorAll(`.${labelClass}`)
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

const sourceUrlRegex = /(?<=url\(["'])[^)]*?\.gifv?(?=["']\))/g;

const pausedBackgroundImageValues = {};

const backgroundStyleElement = buildStyle();
const updateBackgroundStyle = () => {
  backgroundStyleElement.textContent = Object.entries(pausedBackgroundImageValues)
    .map(([id, value]) => `[data-disable-gifs-id="${id}"]:not(:hover) { background-image: ${value} !important; }`)
    .join('\n');
};

const createPausedCssValue = (sourceValue, sourceUrl) => new Promise(resolve => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = sourceUrl;
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0);
    canvas.toBlob(blob => {
      const blobUrl = URL.createObjectURL(blob);
      resolve(sourceValue.replaceAll(sourceUrlRegex, blobUrl));
    });
  };
});

const processBackgroundGifs = function (gifBackgroundElements) {
  gifBackgroundElements.forEach(async gifBackgroundElement => {
    const sourceValue = gifBackgroundElement.style.backgroundImage;
    const sourceUrl = sourceValue.match(sourceUrlRegex)?.[0];

    if (sourceUrl) {
      const id = await sha256(sourceValue);
      pausedBackgroundImageValues[id] ??= await createPausedCssValue(sourceValue, sourceUrl);
      updateBackgroundStyle();

      gifBackgroundElement.dataset.disableGifsId = id;
    } else {
      gifBackgroundElement.classList.add(backgroundGifClass);
    }
    addLabel(gifBackgroundElement, true);
  });
};

const processRows = function (rowsElements) {
  rowsElements.forEach(rowsElement => {
    [...rowsElement.children].forEach(row => {
      if (!row.querySelector('figure')) return;

      if (row.previousElementSibling?.classList?.contains(containerClass)) {
        row.previousElementSibling.append(row);
      } else {
        const wrapper = dom('div', { class: containerClass });
        row.replaceWith(wrapper);
        wrapper.append(row);
      }
    });
  });
};

export const main = async function () {
  const gifImage = `
    :is(figure, ${keyToCss('tagImage', 'takeoverBanner')}) img[srcset*=".gif"]:not(${keyToCss('poster')})
  `;
  pageModifications.register(gifImage, processGifs);

  const gifBackgroundImage = `
    ${keyToCss('communityHeaderImage', 'bannerImage')}[style*=".gif"]
  `;
  pageModifications.register(gifBackgroundImage, processBackgroundGifs);
  document.documentElement.append(backgroundStyleElement);

  pageModifications.register(
    `:is(${postSelector}, ${keyToCss('blockEditorContainer')}) ${keyToCss('rows')}`,
    processRows
  );
};

export const clean = async function () {
  pageModifications.unregister(processGifs);
  pageModifications.unregister(processBackgroundGifs);
  pageModifications.unregister(processRows);

  [...document.querySelectorAll(`.${containerClass}`)].forEach(wrapper =>
    wrapper.replaceWith(...wrapper.children)
  );

  $(`.${canvasClass}, .${labelClass}`).remove();
  $(`.${backgroundGifClass}`).removeClass(backgroundGifClass);
  $('[data-disable-gifs-id]').removeAttr('data-disable-gifs-id');

  backgroundStyleElement.remove();
};
