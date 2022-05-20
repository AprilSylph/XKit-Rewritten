import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { pageModifications } from '../../util/mutations.js';
import { getPreferences } from '../../util/preferences.js';

let mode;

const styleElement = buildStyle();
const processedClass = 'accesskit-visible-alt-text';

const processImages = function (imageElements) {
  const imageBlocks = new Map();
  imageElements.forEach(imageElement => {
    const { alt } = imageElement;
    const imageBlock = imageElement.closest(keyToCss('imageBlock'));
    imageBlocks.set(imageBlock, alt);
  });

  for (const [imageBlock, alt] of imageBlocks) {
    if (imageBlock.classList.contains(processedClass)) continue;
    imageBlock.classList.add(processedClass);

    const isDefaultAltText = alt === translate('Image') || alt === 'image';
    const shouldShowCaption = mode === 'show' || !isDefaultAltText;
    if (!shouldShowCaption) continue;

    const caption = Object.assign(document.createElement('figcaption'), { textContent: alt });
    caption.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    imageBlock.append(caption);
  }
};

const onStorageChanged = async function (changes, areaName) {
  if (areaName !== 'local') return;

  const { 'accesskit.preferences.visible_alt_text_mode': modeChanges } = changes;
  if (modeChanges?.oldValue === undefined) return;

  mode = modeChanges.newValue;
  $(`.${processedClass} figcaption`).remove();
  $(`.${processedClass}`).removeClass(processedClass);
  pageModifications.trigger(processImages);
};

export const main = async function () {
  ({ visible_alt_text_mode: mode } = await getPreferences('accesskit'));

  // Ensure proper styling for image attributions and images in rows
  styleElement.textContent = `
    ${keyToCss('imageBlockLink')},
    ${keyToCss('imageBlockButton')} ${keyToCss('buttonInner')} {
      height: 100%;
    }
  `;
  document.head.append(styleElement);

  pageModifications.register(`article ${keyToCss('imageBlock')} img[alt]`, processImages);

  browser.storage.onChanged.addListener(onStorageChanged);
};

export const clean = async function () {
  pageModifications.unregister(processImages);
  browser.storage.onChanged.removeListener(onStorageChanged);

  styleElement.remove();

  $(`.${processedClass} figcaption`).remove();
  $(`.${processedClass}`).removeClass(processedClass);
};
