import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle, postSelector } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenClass = 'xkit-no-recommended-blog-carousels-hidden';

const styleElement = buildStyle(`
  .${hiddenClass} { position: relative; }
  .${hiddenClass} > div { visibility: hidden; position: absolute; max-width: 100%; }
  .${hiddenClass} > div img { visibility: hidden; }
`);

let listTimelineObjectSelector;

const hideBlogCarousels = blogCarousels => blogCarousels
  .map(blogCarousel => blogCarousel.closest(listTimelineObjectSelector))
  .forEach(listTimelineObject => {
    listTimelineObject.classList.add(hiddenClass);
    listTimelineObject.previousElementSibling.classList.add(hiddenClass);
  });

export const main = async function () {
  document.head.append(styleElement);

  listTimelineObjectSelector = await keyToCss('listTimelineObject');
  const blogCarouselSelector = await resolveExpressions`${postSelector} ~ ${listTimelineObjectSelector} ${keyToCss('blogCarousel')}`;
  pageModifications.register(blogCarouselSelector, hideBlogCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideBlogCarousels);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
