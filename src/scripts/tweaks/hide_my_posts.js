const excludeClass = 'xkit-tweaks-hide-my-posts-done';
const hiddenClass = 'xkit-tweaks-hide-my-posts-hidden';
const css = `.${hiddenClass} article { display: none; }`;

let defaultBlog;

const processPosts = async function () {
  const { getPostElements } = await import('../../util/interface.js');
  const { givenPath, timelineObjectMemoized } = await import('../../util/react_props.js');

  getPostElements({ excludeClass }).forEach(async postElement => {
    const timeline = await givenPath(postElement);
    if (timeline !== '/v2/timeline/dashboard') { return; }

    const { canEdit, isSubmission, postAuthor } = await timelineObjectMemoized(postElement.dataset.id);

    if (canEdit && (isSubmission || postAuthor === defaultBlog || postAuthor === undefined)) {
      postElement.classList.add(hiddenClass);
    }
  });
};

export const main = async function () {
  const { fetchDefaultBlog } = await import('../../util/user_blogs.js');
  const { onNewPosts } = await import('../../util/mutations.js');
  const { addStyle } = await import('../../util/interface.js');

  ({ name: defaultBlog } = await fetchDefaultBlog());

  onNewPosts.addListener(processPosts);
  processPosts();

  addStyle(css);
};

export const clean = async function () {
  const { onNewPosts } = await import('../../util/mutations.js');
  const { removeStyle } = await import('../../util/interface.js');

  onNewPosts.removeListener(processPosts);
  removeStyle(css);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
