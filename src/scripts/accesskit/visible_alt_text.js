import { descendantSelector, keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { onPostsMutated } from '../../util/mutations.js';
import { getPreferences } from '../../util/preferences.js';

let mode;

let imageBlockSelector;
let imageString;

const styleElement = buildStyle();
const processedClass = 'accesskit-visible-alt-text';

const processImages = function () {
  [...document.querySelectorAll(imageBlockSelector)]
    .filter(imageBlock => imageBlock.classList.contains(processedClass) === false)
    .forEach(imageBlock => {
      const image = imageBlock.querySelector('img');
      if (image) {
        imageBlock.classList.add(processedClass);
        if (!image.alt) return;

        const isDefaultAltText = image.alt === imageString || image.alt === 'image';
        const shouldShowCaption = mode === 'show' || !isDefaultAltText;

        if (shouldShowCaption) {
          const caption = document.createElement('figcaption');
          caption.textContent = image.alt;
          imageBlock.appendChild(caption);
        }
      }
    });
};

const onStorageChanged = async function (changes, areaName) {
  if (areaName !== 'local') return;

  const { 'accesskit.preferences.visible_alt_text_mode': modeChanges } = changes;
  if (modeChanges?.oldValue === undefined) return;

  mode = modeChanges.newValue;
  $(`.${processedClass} figcaption`).remove();
  $(`.${processedClass}`).removeClass(processedClass);
  processImages();
};

export const main = async function () {
  ({ visible_alt_text_mode: mode } = await getPreferences('accesskit'));
  imageBlockSelector = await keyToCss('imageBlock');
  imageString = await translate('Image');

  const imageBlockButtonInnerSelector = await descendantSelector('imageBlockButton', 'buttonInner');

  // Setting this for all images ensures side-by-side images align vertically even if one has a caption and the other doesn't
  styleElement.textContent = `${imageBlockButtonInnerSelector} { height: 100%; }`;
  document.head.append(styleElement);

  onPostsMutated.addListener(processImages);
  processImages();

  browser.storage.onChanged.addListener(onStorageChanged);
};

export const clean = async function () {
  onPostsMutated.removeListener(processImages);
  browser.storage.onChanged.removeListener(onStorageChanged);

  styleElement.remove();

  $(`.${processedClass} figcaption`).remove();
  $(`.${processedClass}`).removeClass(processedClass);
};
