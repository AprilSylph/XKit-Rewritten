import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { onNewPosts } from '../../util/mutations.js';

const hiddenClass = 'xkit-tweaks-caught-up-line-title';
const borderClass = 'xkit-tweaks-caught-up-line-border';

const styleElement = buildStyle(`
  .${hiddenClass} > div { display: none; }
  .${borderClass} > div {
    box-sizing: content-box;
    height: 0px;
    overflow-y: hidden;
    border-top: 4px solid rgb(var(--white-on-dark));
  }
`);

let tagChicletCarouselItemSelector;
let listTimelineObjectSelector;

const createCaughtUpLine = async function () {
  [...document.querySelectorAll(tagChicletCarouselItemSelector)]
    .map(tagChicletCarouselItem => tagChicletCarouselItem.closest(listTimelineObjectSelector))
    .filter((element, index, array) => array.indexOf(element) === index)
    .forEach(listTimelineObject => {
      listTimelineObject?.classList.add(borderClass);
      listTimelineObject?.previousElementSibling.classList.add(hiddenClass);
    });
};

export const main = async function () {
  tagChicletCarouselItemSelector = await keyToCss('tagChicletCarouselItem');
  listTimelineObjectSelector = await keyToCss('listTimelineObject');

  document.head.append(styleElement);

  onNewPosts.addListener(createCaughtUpLine);
};

export const clean = async function () {
  styleElement.remove();

  onNewPosts.removeListener(createCaughtUpLine);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $(`.${borderClass}`).removeClass(borderClass);
};
