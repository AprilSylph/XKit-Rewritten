import { getPrimaryBlogName } from '../../util/user.js';
import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, filterPostElements } from '../../util/interface.js';
import { timelineObject } from '../../util/react_props.js';
import { keyToCss } from '../../util/css_map.js';

const timeline = /\/v2\/timeline\/dashboard/;

const hiddenClass = 'xkit-tweaks-hide-liked-posts-hidden';
const styleElement = buildStyle(`.${hiddenClass} article { display: none; }`);

let primaryBlogName;

const processPosts = async function (postElements) {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    const { canEdit, isSubmission, postAuthor } = await timelineObject(postElement);
    const isMyPost = canEdit && (isSubmission || postAuthor === primaryBlogName || postAuthor === undefined);

    if (postElement.querySelector(`footer ${keyToCss('liked')}`) && isMyPost === false) {
      postElement.classList.add(hiddenClass);
    }
  });
};

export const main = async function () {
  primaryBlogName = await getPrimaryBlogName();

  onNewPosts.addListener(processPosts);
  document.head.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
