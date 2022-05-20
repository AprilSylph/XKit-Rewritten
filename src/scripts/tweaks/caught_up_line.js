import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenClass = 'xkit-tweaks-caught-up-line-title';
const borderClass = 'xkit-tweaks-caught-up-line-border';

const styleElement = buildStyle(`
  .${hiddenClass} > div { display: none; }
  .${borderClass} > div {
    box-sizing: content-box;
    height: 0px;
    overflow-y: hidden;
    border-top: 4px solid rgb(var(--white-on-dark));
  }
`);

const createCaughtUpLine = tagChicletCarouselItems => tagChicletCarouselItems
  .map(tagChicletCarouselItem => tagChicletCarouselItem.closest(keyToCss('listTimelineObject')))
  .filter((element, index, array) => array.indexOf(element) === index)
  .forEach(listTimelineObject => {
    listTimelineObject.classList.add(borderClass);
    listTimelineObject.previousElementSibling.classList.add(hiddenClass);
  });

export const main = async function () {
  document.head.append(styleElement);

  const tagChicletCarouselItemSelector = `${keyToCss('listTimelineObject')} ${keyToCss('tagChicletCarouselItem')}`;
  pageModifications.register(tagChicletCarouselItemSelector, createCaughtUpLine);
};

export const clean = async function () {
  pageModifications.unregister(createCaughtUpLine);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $(`.${borderClass}`).removeClass(borderClass);
};
