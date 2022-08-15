import { removeClass } from '../../util/cleanup.js';
import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenClass = 'xkit-no-recommended-tag-carousels-hidden';

const styleElement = buildStyle(`
  .${hiddenClass} { position: relative; }
  .${hiddenClass} > div { visibility: hidden; position: absolute; max-width: 100%; }
  .${hiddenClass} > div img, .${hiddenClass} > div canvas { visibility: hidden; }
`);

const tagCardCarouselItemSelector = keyToCss('tagCardCarouselItem');
const listTimelineObjectSelector = keyToCss('listTimelineObject');
const carouselWrapperSelector = `${listTimelineObjectSelector} ${keyToCss('carouselWrapper')}`;

const hideTagCarousels = carouselWrappers => carouselWrappers
  .filter(carouselWrapper => carouselWrapper.querySelector(tagCardCarouselItemSelector) !== null)
  .map(carouselWrapper => carouselWrapper.closest(listTimelineObjectSelector))
  .forEach(listTimelineObject => {
    listTimelineObject.classList.add(hiddenClass);
    listTimelineObject.previousElementSibling.classList.add(hiddenClass);
  });

export const main = async function () {
  document.head.append(styleElement);
  pageModifications.register(carouselWrapperSelector, hideTagCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideTagCarousels);
  styleElement.remove();
  removeClass(hiddenClass);
};
