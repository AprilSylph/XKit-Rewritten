const excludeClass = 'xkit-tweaks-hide-my-posts-done';
const hiddenClass = 'xkit-tweaks-hide-my-posts-hidden';
const css = `.${hiddenClass} article { display: none; }`;

let defaultBlog;

const processPosts = async function () {
  const { getPostElements } = await fakeImport('/util/interface.js');
  const { givenPath, timelineObjectMemoized } = await fakeImport('/util/react_props.js');

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
  const { fetchDefaultBlog } = await fakeImport('/util/user_blogs.js');
  const { onNewPosts } = await fakeImport('/util/mutations.js');
  const { addStyle } = await fakeImport('/util/interface.js');

  ({ name: defaultBlog } = await fetchDefaultBlog());

  onNewPosts.addListener(processPosts);
  processPosts();

  addStyle(css);
};

export const clean = async function () {
  const { onNewPosts } = await fakeImport('/util/mutations.js');
  const { removeStyle } = await fakeImport('/util/interface.js');

  onNewPosts.removeListener(processPosts);
  removeStyle(css);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
