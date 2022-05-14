import { getPrimaryBlogName } from '../../util/user.js';
import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, filterPostElements } from '../../util/interface.js';
import { timelineObject } from '../../util/react_props.js';
import { keyToCss, resolveExpressions } from '../../util/css_map.js';

const excludeClass = 'xkit-tweaks-hide-liked-posts-done';
const timeline = /\/v2\/timeline\/dashboard/;

const hiddenClass = 'xkit-tweaks-hide-liked-posts-hidden';
const styleElement = buildStyle(`.${hiddenClass} article { display: none; }`);

let primaryBlogName;
let likedSelector;

const processPosts = async function (postElements) {
  filterPostElements(postElements, { excludeClass, timeline }).forEach(async postElement => {
    const { canEdit, isSubmission, postAuthor } = await timelineObject(postElement);
    const isMyPost = canEdit && (isSubmission || postAuthor === primaryBlogName || postAuthor === undefined);

    if (postElement.querySelector(likedSelector) && isMyPost === false) {
      postElement.classList.add(hiddenClass);
    }
  });
};

export const main = async function () {
  primaryBlogName = await getPrimaryBlogName();
  likedSelector = await resolveExpressions`footer ${keyToCss('liked')}`;

  onNewPosts.addListener(processPosts);
  document.head.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
