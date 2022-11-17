import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenClass = 'xkit-no-recommended-blog-carousels-hidden';

/*
const styleElement = buildStyle(`
  .${hiddenClass} { position: relative; }
  .${hiddenClass} > div { visibility: hidden; position: absolute; max-width: 100%; }
  .${hiddenClass} > div :is(img, video, canvas) { display: none }
`);
*/
const styleElement = buildStyle(`
  .${hiddenClass} { outline: 1px solid red; }
`);

const listTimelineObjectSelector = keyToCss('listTimelineObject');
const blogCarouselSelector = `${listTimelineObjectSelector} ${keyToCss('blogCarousel')}`;

const hideBlogCarousels = blogCarousels => blogCarousels
  .map(blogCarousel => blogCarousel.closest(listTimelineObjectSelector))
  .filter(listTimelineObject =>
    listTimelineObject.previousElementSibling.querySelector(keyToCss('titleObject'))
  )
  .forEach(listTimelineObject => {
    listTimelineObject.classList.add(hiddenClass);
    listTimelineObject.previousElementSibling.classList.add(hiddenClass);
  });

export const main = async function () {
  document.head.append(styleElement);
  pageModifications.register(blogCarouselSelector, hideBlogCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideBlogCarousels);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
