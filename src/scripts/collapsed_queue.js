(function () {
  const excludeClass = 'xkit-collapsed-queue-done';
  const doneClass = 'xkit-collapsed-queue-collapsed';

  let footerSelector;

  const processPosts = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');
    const { givenPath } = await fakeImport('/util/react_props.js');

    getPostElements({ excludeClass }).forEach(async postElement => {
      const timeline = await givenPath(postElement);
      if (!timeline.endsWith('/posts/queue')) { return; }

      postElement.classList.add(doneClass);

      const $post = $(postElement).find('article').first();
      const $header = $post.find('header').first();

      $header.next().css('margin', 0);

      $header.nextUntil(footerSelector)
        .wrapAll('<div class="queue_plus_shrink_container"><div class="queue_plus_shrink_container_inner"></div></div>')
        .parent().before('<div class="queue_plus_shrink_container_shadow"></div>');
    });
  };

  const main = async function () {
    // const { getPreferences } = await fakeImport('/util/preferences.js');
    const { onNewPosts } = await fakeImport('/util/mutations.js');
    const { keyToCss } = await fakeImport('/util/css_map.js');

    // ({  } = await getPreferences('collapsed_queue'));
    footerSelector = await keyToCss('footerWrapper');

    onNewPosts.addListener(processPosts);
    processPosts();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');
    onNewPosts.removeListener(processPosts);

    $(`.${excludeClass}`).removeClass(excludeClass);
    $(`.${doneClass}`).removeClass(doneClass);
  };

  return { main, clean, stylesheet: true, autoRestart: true };
})();
