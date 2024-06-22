import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';

const hiddenAttribute = 'data-no-recommended-blog-carousels-hidden';

const styleElement = buildStyle(`
  [${hiddenAttribute}] { position: relative; }
  [${hiddenAttribute}] > div { visibility: hidden; position: absolute; max-width: 100%; }
  [${hiddenAttribute}] > div :is(img, video, canvas) { display: none }
`);

const carouselSelector = `${keyToCss('listTimelineObject')} ${keyToCss('carouselWrapper')}`;

const hideBlogCarousels = carousels =>
  carousels.forEach(async carousel => {
    const { elements } = await timelineObject(carousel);
    if (elements.some(({ objectType }) => objectType === 'blog')) {
      const timelineItem = getTimelineItemWrapper(carousel);
      if (timelineItem.previousElementSibling.querySelector(keyToCss('titleObject'))) {
        timelineItem.setAttribute(hiddenAttribute, '');
        timelineItem.previousElementSibling.setAttribute(hiddenAttribute, '');
      }
    }
  });

export const main = async function () {
  document.documentElement.append(styleElement);
  pageModifications.register(carouselSelector, hideBlogCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideBlogCarousels);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
