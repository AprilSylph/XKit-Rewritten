import { keyToCss } from '../../util/css_map.js';
import { buildStyle, closestTimelineItem } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenAttribute = 'data-tweaks-caught-up-line-title';
const borderAttribute = 'data-tweaks-caught-up-line-border';

const styleElement = buildStyle(`
  [${hiddenAttribute}] > div { display: none; }
  [${borderAttribute}] > div {
    box-sizing: content-box;
    height: 0px;
    overflow-y: hidden;
    border-top: 4px solid rgb(var(--white-on-dark));
  }
`);

const listTimelineObjectSelector = keyToCss('listTimelineObject');
const tagChicletCarouselItemSelector = `${listTimelineObjectSelector} ${keyToCss('tagChicletCarouselItem')}`;

const createCaughtUpLine = tagChicletCarouselItems => tagChicletCarouselItems
  .map(closestTimelineItem)
  .filter((element, index, array) => array.indexOf(element) === index)
  .forEach(listTimelineObject => {
    listTimelineObject.setAttribute(borderAttribute, '');
    listTimelineObject.previousElementSibling.setAttribute(hiddenAttribute, '');
  });

export const main = async function () {
  document.documentElement.append(styleElement);
  pageModifications.register(tagChicletCarouselItemSelector, createCaughtUpLine);
};

export const clean = async function () {
  pageModifications.unregister(createCaughtUpLine);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`[${borderAttribute}]`).removeAttr(borderAttribute);
};
