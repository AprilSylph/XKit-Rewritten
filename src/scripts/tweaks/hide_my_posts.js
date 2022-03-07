import { getPrimaryBlogName } from '../../util/user.js';
import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, filterPostElements } from '../../util/interface.js';
import { exposeTimelines, timelineObject } from '../../util/react_props.js';

const excludeClass = 'xkit-tweaks-hide-my-posts-done';
const timeline = /\/v2\/timeline\/dashboard/;

const hiddenClass = 'xkit-tweaks-hide-my-posts-hidden';
const styleElement = buildStyle(`.${hiddenClass} article { display: none; }`);

let primaryBlogName;

const processPosts = async function (postElements) {
  await exposeTimelines();
  filterPostElements(postElements, { excludeClass, timeline }).forEach(async postElement => {
    const { canEdit, isSubmission, postAuthor } = await timelineObject(postElement);

    if (canEdit && (isSubmission || postAuthor === primaryBlogName || postAuthor === undefined)) {
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

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
