(function () {
  let blockedPostRootIDs = [];

  const meatballButtonLabel = 'Block this post';
  const excludeClass = 'xkit-postblock-done';

  const processPosts = async function () {
    const { getPostElements } = await fakeImport('/src/util/interface.js');
    const { timelineObjectMemoized } = await fakeImport('/src/util/react_props.js');

    getPostElements({ excludeClass }).forEach(async postElement => {
      const postID = postElement.dataset.id;
      const { rebloggedRootId } = await timelineObjectMemoized(postID);

      const rootID = rebloggedRootId || postID;

      if (blockedPostRootIDs.includes(rootID)) {
        postElement.classList.add('xkit-postblock-hidden');
      }
    });
  };

  const onButtonClicked = async function ({ target }) {
    const { timelineObjectMemoized } = await fakeImport('/src/util/react_props.js');
    const postElement = $(target).parents('[data-id]')[0];
    const postID = postElement.dataset.id;

    const { rebloggedRootId } = await timelineObjectMemoized(postID);
    const rootID = rebloggedRootId || postID;

    if (window.confirm('Block this post? All instances of this post (including reblogs) will be hidden.')) {
      blockedPostRootIDs.push(rootID);
      browser.storage.local.set({ 'postblock.blockedPostRootIDs': blockedPostRootIDs });
      postElement.classList.add('xkit-postblock-hidden');

      $(`.${excludeClass}`).removeClass(excludeClass);
      processPosts();
    }
  };

  const main = async function () {
    const { registerMeatballItem } = await fakeImport('/src/util/interface.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    registerMeatballItem(meatballButtonLabel, onButtonClicked);

    ({ 'postblock.blockedPostRootIDs': blockedPostRootIDs = [] } = await browser.storage.local.get('postblock.blockedPostRootIDs'));

    onNewPosts.addListener(processPosts);
    processPosts();
  };

  const clean = async function () {
    const { unregisterMeatballItem } = await fakeImport('/src/util/interface.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    unregisterMeatballItem(meatballButtonLabel);
    onNewPosts.removeListener(processPosts);

    $(`.${excludeClass}`).removeClass(excludeClass);
    $('.xkit-postblock-hidden').removeClass('xkit-postblock-hidden');
  };

  return { main, clean, stylesheet: true };
})();
