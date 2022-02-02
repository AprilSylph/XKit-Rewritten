import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, filterPostElements } from '../../util/interface.js';

import { timelineObjectMemoized } from '../../util/react_props.js';

const excludeClass = 'xkit-tweaks-hide-filtered-posts-done';
const includeFiltered = true;

const hiddenClass = 'xkit-tweaks-hide-filtered-posts-hidden';
const styleElement = buildStyle(`.${hiddenClass} article { display: none; }`);

const processPosts = postElements => filterPostElements(postElements, { excludeClass, includeFiltered }).forEach(async postElement => {
  const { filtered } = await timelineObjectMemoized(postElement.dataset.id);

  if (filtered !== undefined && Object.keys(filtered).length !== 0) {
    postElement.classList.add(hiddenClass);
  }
});

export const main = async function () {
  onNewPosts.addListener(processPosts);
  document.head.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
