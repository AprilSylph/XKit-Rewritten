import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, filterPostElements } from '../../util/interface.js';
import { isMyPost } from '../../util/react_props.js';
import { keyToCss, resolveExpressions } from '../../util/css_map.js';

const timeline = /\/v2\/timeline\/dashboard/;

const hiddenClass = 'xkit-tweaks-hide-liked-posts-hidden';
const styleElement = buildStyle(`.${hiddenClass} article { display: none; }`);

let likedSelector;

const processPosts = async function (postElements) {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    const myPost = await isMyPost(postElement);

    if (postElement.querySelector(likedSelector) && myPost === false) {
      postElement.classList.add(hiddenClass);
    }
  });
};

export const main = async function () {
  likedSelector = await resolveExpressions`footer ${keyToCss('liked')}`;

  onNewPosts.addListener(processPosts);
  document.head.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
