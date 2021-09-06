import { getPrimaryBlogName } from '../../util/user_blogs.js';
import { onNewPosts } from '../../util/mutations.js';
import { addStyle, removeStyle, getPostElements } from '../../util/interface.js';
import { exposeTimelines, timelineObjectMemoized } from '../../util/react_props.js';

const excludeClass = 'xkit-tweaks-hide-my-posts-done';
const hiddenClass = 'xkit-tweaks-hide-my-posts-hidden';
const css = `.${hiddenClass} article { display: none; }`;

let primaryBlogName;

const processPosts = async function () {
  await exposeTimelines();
  getPostElements({ excludeClass, timeline: /\/v2\/timeline\/dashboard/ }).forEach(async postElement => {
    const { canEdit, isSubmission, postAuthor } = await timelineObjectMemoized(postElement.dataset.id);

    if (canEdit && (isSubmission || postAuthor === primaryBlogName || postAuthor === undefined)) {
      postElement.classList.add(hiddenClass);
    }
  });
};

export const main = async function () {
  primaryBlogName = await getPrimaryBlogName();

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
