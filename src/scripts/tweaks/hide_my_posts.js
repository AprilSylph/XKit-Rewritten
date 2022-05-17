import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, filterPostElements } from '../../util/interface.js';
import { isMyPost } from '../../util/react_props.js';

const excludeClass = 'xkit-tweaks-hide-my-posts-done';
const timeline = /\/v2\/timeline\/dashboard/;

const hiddenClass = 'xkit-tweaks-hide-my-posts-hidden';
const styleElement = buildStyle(`.${hiddenClass} article { display: none; }`);

const processPosts = async function (postElements) {
  filterPostElements(postElements, { excludeClass, timeline }).forEach(async postElement => {
    const myPost = await isMyPost(postElement);

    if (myPost) {
      postElement.classList.add(hiddenClass);
    }
  });
};

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
