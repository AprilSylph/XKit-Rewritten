import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { onNewPosts } from '../../util/mutations.js';

const hiddenClass = 'xkit-tweaks-caught-up-line-title';
const borderClass = 'xkit-tweaks-caught-up-line-border';

const styleElement = buildStyle(`
  .${hiddenClass} { display: none; }
  .${borderClass} { border-top: 4px solid rgb(var(--white-on-dark)); height: 0px; }
`);

let tagChicletCarouselItemSelector;
let carouselWrapperSelector;
let listTimelineObjectSelector;

const createCaughtUpLine = async function () {
  [...document.querySelectorAll(tagChicletCarouselItemSelector)]
    .map(tagChicletCarouselItem => tagChicletCarouselItem.closest(carouselWrapperSelector))
    .forEach(carouselWrapper => {
      carouselWrapper?.classList.add(borderClass);
      carouselWrapper?.closest(listTimelineObjectSelector)?.previousElementSibling.classList.add(hiddenClass);
    });
};

export const main = async function () {
  tagChicletCarouselItemSelector = await keyToCss('tagChicletCarouselItem');
  carouselWrapperSelector = await keyToCss('carouselWrapper');
  listTimelineObjectSelector = await keyToCss('listTimelineObject');

  document.head.append(styleElement);

  onNewPosts.addListener(createCaughtUpLine);
  createCaughtUpLine();
};

export const clean = async function () {
  styleElement.remove();

  onNewPosts.removeListener(createCaughtUpLine);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $(`.${borderClass}`).removeClass(borderClass);
};
