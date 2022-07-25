import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';
import { relatedPosts } from '../../util/react_props.js';

const hiddenClass = 'xkit-no-recommended-related-posts-hidden';

const styleElement = buildStyle(`
  .${hiddenClass} { position: relative; }
  .${hiddenClass} > div { visibility: hidden; position: absolute; max-width: 100%; }
  .${hiddenClass} > div :is(img, video, canvas) { display: none }
`);

const listTimelineObjectSelector = keyToCss('listTimelineObject');

const hideRelatedRows = chicletRows => chicletRows
  .forEach(async chicletRow => {
    const relatedPostsData = await relatedPosts(chicletRow);
    if (relatedPostsData) {
      const listTimelineObject = chicletRow.closest(listTimelineObjectSelector);
      listTimelineObject.classList.add(hiddenClass);
      listTimelineObject.previousElementSibling.classList.add(hiddenClass);
    }
  });

export const main = async function () {
  document.head.append(styleElement);
  pageModifications.register(keyToCss('chicletRow'), hideRelatedRows);
};

export const clean = async function () {
  pageModifications.unregister(hideRelatedRows);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
