import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';

const hiddenAttribute = 'data-no-recommended-tag-carousels-hidden';

export const styleElement = buildStyle(`
  [${hiddenAttribute}] { position: relative; }
  [${hiddenAttribute}] > div { visibility: hidden; position: absolute; max-width: 100%; }
  [${hiddenAttribute}] > div img, [${hiddenAttribute}] > div canvas { visibility: hidden; }
`);

const carouselSelector = `${keyToCss('listTimelineObject')} ${keyToCss('carouselWrapper')}`;

const hideTagCarousels = carousels =>
  carousels.forEach(async carousel => {
    const { elements } = await timelineObject(carousel);
    if (elements.some(({ objectType }) => objectType === 'tag_carousel_card')) {
      const timelineItem = getTimelineItemWrapper(carousel);
      if (
        timelineItem.previousElementSibling.querySelector(keyToCss('titleObject')) ||
        timelineItem.previousElementSibling.dataset.cellId?.startsWith('timelineObject:title')
      ) {
        timelineItem.toggleAttribute(hiddenAttribute, true);
        timelineItem.previousElementSibling.toggleAttribute(hiddenAttribute, true);
      }
    }
  });

export const main = async function () {
  pageModifications.register(carouselSelector, hideTagCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideTagCarousels);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
