import { keyToCss } from '../../util/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';
import { timelineObject } from '../../util/react_props.js';

const hiddenAttribute = 'data-no-recommended-blog-carousels-hidden';

/*
const styleElement = buildStyle(`
  [${hiddenAttribute}] { position: relative; }
  [${hiddenAttribute}] > div { visibility: hidden; position: absolute; max-width: 100%; }
  [${hiddenAttribute}] > div :is(img, video, canvas) { display: none }
`);
*/
const styleElement = buildStyle(`
  [${hiddenAttribute}] { outline: 4px solid red; }
`);

const blogCarouselSelector = `${keyToCss('listTimelineObject')} ${keyToCss('carouselWrapper')}`;

const hideBlogCarousels = blogCarousels =>
  blogCarousels.forEach(async blogCarousel => {
    const { elements } = await timelineObject(blogCarousel);
    if (elements.some(({ objectType }) => objectType === 'blog')) {
      const timelineItem = getTimelineItemWrapper(blogCarousel);
      if (timelineItem.previousElementSibling.querySelector(keyToCss('titleObject'))) {
        timelineItem.setAttribute(hiddenAttribute, '');
        timelineItem.previousElementSibling.setAttribute(hiddenAttribute, '');
      }
    }
  });

export const main = async function () {
  document.documentElement.append(styleElement);
  pageModifications.register(blogCarouselSelector, hideBlogCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideBlogCarousels);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
