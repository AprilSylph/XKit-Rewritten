import { descendantSelector, keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { onPostsMutated } from '../../util/mutations.js';

let imageBlockSelector;

const styleElement = buildStyle();
const processedClass = 'accesskit-visible-alt-text';

const processImages = function () {
  [...document.querySelectorAll(imageBlockSelector)]
    .filter(imageBlock => imageBlock.classList.contains(processedClass) === false)
    .forEach(imageBlock => {
      const image = imageBlock.querySelector('img');
      if (image) {
        imageBlock.classList.add(processedClass);

        if (image.alt) {
          const caption = document.createElement('figcaption');
          caption.textContent = image.alt;
          imageBlock.appendChild(caption);
        }
      }
    });
};

export const main = async function () {
  imageBlockSelector = await keyToCss('imageBlock');

  const imageBlockButtonInnerSelector = await descendantSelector('imageBlockButton', 'buttonInner');

  // Setting this for all images ensures side-by-side images align vertically even if one has a caption and the other doesn't
  styleElement.textContent = `${imageBlockButtonInnerSelector} { height: 100%; }`;
  document.head.append(styleElement);

  onPostsMutated.addListener(processImages);
  processImages();
};

export const clean = async function () {
  onPostsMutated.removeListener(processImages);

  styleElement.remove();

  $(`.${processedClass} figcaption`).remove();
  $(`.${processedClass}`).removeClass(processedClass);
};
