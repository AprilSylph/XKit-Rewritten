import { onNewPosts } from '../../util/mutations.js';
import { addStyle, removeStyle, getPostElements } from '../../util/interface.js';

import { timelineObjectMemoized } from '../../util/react_props.js';

const excludeClass = 'xkit-tweaks-hide-filtered-posts-done';
const includeFiltered = true;
const hiddenClass = 'xkit-tweaks-hide-filtered-posts-hidden';
const css = `.${hiddenClass} article { display: none; }`;

const processPosts = async function () {
  getPostElements({ excludeClass, includeFiltered }).forEach(async postElement => {
    const { filtered } = await timelineObjectMemoized(postElement.dataset.id);

    if (filtered !== undefined && Object.keys(filtered).length !== 0) {
      postElement.classList.add(hiddenClass);
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  processPosts();

  addStyle(css);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  removeStyle(css);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
