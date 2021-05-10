const excludeClass = 'xkit-show-originals-done';
const hiddenClass = 'xkit-show-originals-hidden';

let showOwnReblogs;
let showReblogsWithContributedContent;
let whitelistedUsernames;

const processPosts = async function () {
  const { getPostElements } = await import('../util/interface.js');
  const { timelineObjectMemoized, givenPath } = await import('../util/react_props.js');

  const whitelist = whitelistedUsernames.split(',').map(username => username.trim());

  getPostElements({ excludeClass, includeFiltered: true }).forEach(async postElement => {
    const timeline = await givenPath(postElement);
    if (timeline !== '/v2/timeline/dashboard') { return; }

    const { rebloggedRootId, canEdit, content, blogName } = await timelineObjectMemoized(postElement.dataset.id);

    if (!rebloggedRootId) {
      return;
    }

    if (showOwnReblogs && canEdit) {
      return;
    }

    if (showReblogsWithContributedContent && content.length > 0) {
      return;
    }

    if (whitelist.includes(blogName)) {
      return;
    }

    postElement.classList.add(hiddenClass);
  });
};

export const main = async function () {
  const { getPreferences } = await import('../util/preferences.js');
  const { onNewPosts } = await import('../util/mutations.js');

  ({ showOwnReblogs, showReblogsWithContributedContent, whitelistedUsernames } = await getPreferences('show_originals'));

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  const { onNewPosts } = await import('../util/mutations.js');
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};

export const stylesheet = true;
export const autoRestart = true;
