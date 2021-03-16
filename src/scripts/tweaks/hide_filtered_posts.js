(function () {
  const excludeClass = 'xkit-tweaks-hide-filtered-posts-done';
  const includeFiltered = true;
  const hiddenClass = 'xkit-tweaks-hide-filtered-posts-hidden';
  const css = `.${hiddenClass} article { display: none; }`;

  const processPosts = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');
    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');

    getPostElements({ excludeClass, includeFiltered }).forEach(async postElement => {
      const { filtered } = await timelineObjectMemoized(postElement.dataset.id);

      if (filtered !== undefined && Object.keys(filtered).length !== 0) {
        postElement.classList.add(hiddenClass);
      }
    });
  };

  const main = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');
    const { addStyle } = await fakeImport('/util/interface.js');

    onNewPosts.addListener(processPosts);
    processPosts();

    addStyle(css);
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');
    const { removeStyle } = await fakeImport('/util/interface.js');

    onNewPosts.removeListener(processPosts);
    removeStyle(css);

    $(`.${excludeClass}`).removeClass(excludeClass);
    $(`.${hiddenClass}`).removeClass(hiddenClass);
  };

  return { main, clean };
})();
