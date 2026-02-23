import { keyToCss } from '../../utils/css_map.js';
import { figcaption } from '../../utils/dom.js';
import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';

let mode;

const processedClass = 'accesskit-visible-alt-text';

const imageBlockSelector = keyToCss('imageBlock');
const imageBlockLinkSelector = keyToCss('imageBlockLink');
const imageBlockButtonInnerSelector = `${keyToCss('imageBlockButton')} ${keyToCss('buttonInner')}`;

export const styleElement = buildStyle(`
${imageBlockLinkSelector}, ${imageBlockButtonInnerSelector} {
  height: 100%;
}

.${processedClass} ${keyToCss('altTextHelper')} {
  display: none;
}
`);

const processImages = function (imageElements) {
  const imageBlocks = new Map();
  imageElements.forEach(imageElement => {
    const { alt } = imageElement;
    if (alt) {
      const imageBlock = imageElement.closest(imageBlockSelector);
      imageBlocks.set(imageBlock, alt);
    }
  });

  for (const [imageBlock, alt] of imageBlocks) {
    if (imageBlock.classList.contains(processedClass)) continue;
    imageBlock.classList.add(processedClass);

    const isDefaultAltText = [translate('Image'), translate('Image').toLowerCase(), 'image'].includes(alt);
    const shouldShowCaption = mode === 'show' || !isDefaultAltText;
    if (!shouldShowCaption) continue;

    const caption = figcaption({
      click: event => {
        event.preventDefault();
        event.stopPropagation();
      },
    }, [alt]);
    imageBlock.append(caption);
  }
};

const onStorageChanged = async function (changes) {
  const { 'accesskit.preferences.visible_alt_text_mode': modeChanges } = changes;
  if (modeChanges?.oldValue === undefined) return;

  mode = modeChanges.newValue;
  $(`.${processedClass} figcaption`).remove();
  $(`.${processedClass}`).removeClass(processedClass);
  pageModifications.trigger(processImages);
};

export const main = async function () {
  ({ visible_alt_text_mode: mode } = await getPreferences('accesskit'));

  pageModifications.register(`article ${imageBlockSelector} img[alt]`, processImages);
  browser.storage.local.onChanged.addListener(onStorageChanged);
};

export const clean = async function () {
  pageModifications.unregister(processImages);
  browser.storage.local.onChanged.removeListener(onStorageChanged);

  $(`.${processedClass} figcaption`).remove();
  $(`.${processedClass}`).removeClass(processedClass);
};
