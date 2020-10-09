(function () {
  const excludeClass = 'xkit-seen-posts-done';
  const dimClass = 'xkit-seen-posts-seen';

  const dimPosts = async function () {
    const storageKey = 'seen_posts.seenPosts';
    const { [storageKey]: seenPosts = [] } = await browser.storage.local.get(storageKey);

    const { getPostElements } = await fakeImport('/src/util/interface.js');

    getPostElements({ excludeClass, noPeepr: true, includeFiltered: true }).forEach(postElement => {
      const { id } = postElement.dataset;

      if (seenPosts.includes(id)) {
        postElement.classList.add(dimClass);
      } else {
        seenPosts.push(id);
      }
    });

    if (seenPosts.length >= 10000) {
      seenPosts.splice(0, 1000);
    }

    browser.storage.local.set({ [storageKey]: seenPosts });
  };

  const main = async function () {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    onNewPosts.addListener(dimPosts);
    dimPosts();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    onNewPosts.removeListener(dimPosts);
    $(`.${excludeClass}`).removeClass(excludeClass);
    $(`.${dimClass}`).removeClass(dimClass);
  };

  return { main, clean, stylesheet: true };
})();
