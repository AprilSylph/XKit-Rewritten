import { pageModifications } from '../../util/mutations.js';
import { keyToCss } from '../../util/css_map.js';
import { dom } from '../../util/dom.js';
import { buildStyle, postSelector } from '../../util/interface.js';

const canvasClass = 'xkit-paused-gif-placeholder';
const labelClass = 'xkit-paused-gif-label';
const containerClass = 'xkit-paused-gif-container';
const backgroundGifClass = 'xkit-paused-background-gif';

const loadedClass = 'xkit-paused-gif-loaded';
const forceLoadClass = 'xkit-paused-gif-force-load';

const hovered = `:is(:hover > *, .${containerClass}:hover *)`;

const inEditor = '.block-editor-writing-flow *';

const gifSelector = `img[srcset*=".gif"]:not(${keyToCss('poster')}):not(${inEditor})`;
const posterSelector = `${gifSelector} + ${keyToCss('poster')}`;

const styleElement = buildStyle(`
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
}

:is(.${loadedClass} > ${posterSelector}, .${canvasClass}, .${labelClass})${hovered} {
  display: none;
}

${gifSelector}:not(${hovered}):not(.${forceLoadClass}),
${gifSelector}:not(${hovered}):not(.${forceLoadClass}) ~ ${keyToCss('loader')} {
  display: none;
}

${posterSelector} {
  visibility: visible !important;
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

const addPlaceholder = function (gifElement) {
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
      gifElement.after(canvas);
      gifElement.parentNode.classList.add(loadedClass);
    }
  };
};

const loaded = gifElement =>
  (gifElement.complete && gifElement.currentSrc) ||
  new Promise(resolve => gifElement.addEventListener('load', resolve, { once: true }));

const processGifs = function (gifElements) {
  gifElements.forEach(async gifElement => {
    const pausedGifElements = [
      ...gifElement.parentNode.querySelectorAll(`.${canvasClass}`),
      ...gifElement.parentNode.querySelectorAll(`.${labelClass}`)
    ];
    if (pausedGifElements.length) {
      gifElement.parentNode.append(...pausedGifElements);
      return;
    }

    addLabel(gifElement);
    if (gifElement.parentNode.querySelector(posterSelector)) {
      await loaded(gifElement);
      gifElement.parentNode.classList.add(loadedClass);
    } else {
      gifElement.classList.add(forceLoadClass);
      await loaded(gifElement);
      gifElement.classList.remove(forceLoadClass);
      addPlaceholder(gifElement);
    }
  });
};

const processBackgroundGifs = function (gifBackgroundElements) {
  gifBackgroundElements.forEach(gifBackgroundElement => {
    gifBackgroundElement.classList.add(backgroundGifClass);
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
  document.documentElement.append(styleElement);

  pageModifications.register(gifSelector, processGifs);

  const gifBackgroundImage = `
    ${keyToCss('communityHeaderImage', 'bannerImage')}[style*=".gif"]
  `;
  pageModifications.register(gifBackgroundImage, processBackgroundGifs);

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

  styleElement.remove();
  $(`.${canvasClass}, .${labelClass}`).remove();
  $(`.${loadedClass}`).removeClass(loadedClass);
  $(`.${forceLoadClass}`).removeClass(forceLoadClass);
  $(`.${backgroundGifClass}`).removeClass(backgroundGifClass);
};
