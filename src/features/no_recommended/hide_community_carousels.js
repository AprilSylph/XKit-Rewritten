import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';

const hiddenAttribute = 'data-no-recommended-community-carousels-hidden';

export const styleElement = buildStyle(`
  [${hiddenAttribute}] { position: relative; }
  [${hiddenAttribute}] > div { visibility: hidden; position: absolute; max-width: 100%; }
  [${hiddenAttribute}] > div :is(img, video, canvas) { display: none }
`);

const carouselSelector = `${keyToCss('listTimelineObject')} ${keyToCss('carouselWrapper')}`;

const hideCommunityCarousels = carousels =>
  carousels.forEach(async carousel => {
    const { elements } = await timelineObject(carousel);
    if (elements.some(({ objectType }) => objectType === 'community_card')) {
      const timelineItem = getTimelineItemWrapper(carousel);
      timelineItem.setAttribute(hiddenAttribute, '');
      if (
        timelineItem.previousElementSibling.querySelector(keyToCss('titleObject')) ||
        timelineItem.previousElementSibling.dataset.cellId?.startsWith('timelineObject:title')
      ) {
        timelineItem.previousElementSibling.setAttribute(hiddenAttribute, '');
      }
    }
  });

export const main = async function () {
  pageModifications.register(carouselSelector, hideCommunityCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideCommunityCarousels);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
