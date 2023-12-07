import { keyToCss } from '../../util/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenAttribute = 'data-no-recommended-blog-carousels-hidden';

const styleElement = buildStyle(`
  [${hiddenAttribute}] { position: relative; }
  [${hiddenAttribute}] > div { visibility: hidden; position: absolute; max-width: 100%; }
  [${hiddenAttribute}] > div :is(img, video, canvas) { display: none }
`);

const listTimelineObjectSelector = keyToCss('listTimelineObject');
const blogCarouselSelector = `${listTimelineObjectSelector} ${keyToCss('blogRecommendation')}`;

const hideBlogCarousels = blogCarousels => blogCarousels
  .map(getTimelineItemWrapper)
  .filter(timelineItem =>
    timelineItem.previousElementSibling.querySelector(keyToCss('titleObject'))
  )
  .forEach(timelineItem => {
    timelineItem.setAttribute(hiddenAttribute, '');
    timelineItem.previousElementSibling.setAttribute(hiddenAttribute, '');
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
