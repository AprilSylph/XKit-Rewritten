(function () {
  const excludeClass = 'xkit-show-originals-done';
  const hiddenClass = 'xkit-show-originals-hidden';

  let showOwnReblogs;
  let showReblogsWithContributedContent;

  const processPosts = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');
    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');

    getPostElements({ excludeClass, includeFiltered: true }).forEach(async postElement => {
      const { rebloggedRootId, canEdit, content } = await timelineObjectMemoized(postElement.dataset.id);

      if (!rebloggedRootId) {
        return;
      }

      if (showOwnReblogs && canEdit) {
        return;
      }

      if (showReblogsWithContributedContent && content.length > 0) {
        return;
      }

      postElement.classList.add(hiddenClass);
    });
  };

  const main = async function () {
    const { getPreferences } = await fakeImport('/util/preferences.js');
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    ({ showOwnReblogs, showReblogsWithContributedContent } = await getPreferences('show_originals'));

    onNewPosts.addListener(processPosts);
    processPosts();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');
    onNewPosts.removeListener(processPosts);

    $(`.${excludeClass}`).removeClass(excludeClass);
    $(`.${hiddenClass}`).removeClass(hiddenClass);
  };

  return { main, clean, stylesheet: true, autoRestart: true };
})();
