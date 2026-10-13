import { removeClassName, removeElementsBySelector } from '../../utils/cleanup.js';
import { keyToCss } from '../../utils/css_map.js';
import { figcaption } from '../../utils/dom.js';
import { buildStyle } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

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

    const caption = figcaption({
      click: event => {
        event.preventDefault();
        event.stopPropagation();
      },
    }, [alt]);
    imageBlock.append(caption);
  }
};

export const main = async function () {
  pageModifications.register(`article ${imageBlockSelector} img[alt]`, processImages);
};

export const clean = async function () {
  pageModifications.unregister(processImages);

  removeElementsBySelector(`.${processedClass} figcaption`);
  removeClassName(processedClass);
};
