import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, filterPostElements } from '../../util/interface.js';
import { isMyPost, timelineObject } from '../../util/react_props.js';

const timeline = '/v2/timeline/dashboard';

const hiddenClass = 'xkit-tweaks-hide-liked-posts-hidden';
const styleElement = buildStyle(`.${hiddenClass} article { display: none; }`);

const processPosts = async function (postElements) {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    const { liked } = await timelineObject(postElement);
    const myPost = await isMyPost(postElement);

    if (liked && !myPost) postElement.classList.add(hiddenClass);
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  document.head.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
