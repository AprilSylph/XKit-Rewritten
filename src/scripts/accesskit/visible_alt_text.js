import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { pageModifications } from '../../util/mutations.js';
import { getPreferences } from '../../util/preferences.js';

let mode;

let imageBlockSelector;
let imageString;

const styleElement = buildStyle();
const processedClass = 'accesskit-visible-alt-text';

const processImages = function (imageElements) {
  const imageBlocks = new Map();
  imageElements.forEach(imageElement => {
    const { alt } = imageElement;
    const imageBlock = imageElement.closest(imageBlockSelector);
    if (imageBlock !== null) imageBlocks.set(imageBlock, alt);
  });

  for (const [imageBlock, alt] of imageBlocks) {
    if (imageBlock.classList.contains(processedClass)) continue;
    imageBlock.classList.add(processedClass);

    const isDefaultAltText = alt === imageString || alt === 'image';
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
  imageBlockSelector = await keyToCss('imageBlock');
  imageString = await translate('Image');

  const imageBlockLinkSelector = await keyToCss('imageBlockLink');
  const imageBlockButtonInnerSelector = await resolveExpressions`${keyToCss('imageBlockButton')} ${keyToCss('buttonInner')}`;
  // Ensure proper styling for image attributions and images in rows
  styleElement.textContent = `${imageBlockLinkSelector}, ${imageBlockButtonInnerSelector} { height: 100%; }`;
  document.head.append(styleElement);

  pageModifications.register('img[alt]', processImages);

  browser.storage.onChanged.addListener(onStorageChanged);
};

export const clean = async function () {
  pageModifications.unregister(processImages);
  browser.storage.onChanged.removeListener(onStorageChanged);

  styleElement.remove();

  $(`.${processedClass} figcaption`).remove();
  $(`.${processedClass}`).removeClass(processedClass);
};
