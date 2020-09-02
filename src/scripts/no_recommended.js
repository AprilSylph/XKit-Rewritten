(function() {
  let showSearches;

  const removeRecommended = async function() {
    const { timelineObject } = await fakeImport('/src/util/react_props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit-no-recommended-done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit-no-recommended-done');

      const {recommendationReason} = await timelineObject(postElement.dataset.id);

      if (!recommendationReason || !Object.keys(recommendationReason).includes('loggingReason')) {
        return;
      }

      const {loggingReason} = recommendationReason;
      const isSearch = loggingReason.startsWith('search:');
      const isPinned = loggingReason.startsWith('pin:');

      if (isSearch && showSearches === true) {
        return;
      }

      if (isPinned) {
        return;
      }

      postElement.classList.add('xkit-no-recommended-hidden');
    });
  };

  const onStorageChanged = function(changes, areaName) {
    const {'no_recommended.preferences': preferences} = changes;
    if (!preferences || areaName !== 'local') {
      return;
    }

    clean().then(main); // eslint-disable-line no-use-before-define
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const {'no_recommended.preferences': preferences = {}} = await browser.storage.local.get('no_recommended.preferences');
    ({showSearches = false} = preferences);

    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.addListener(removeRecommended);
    removeRecommended();
  };

  const clean = async function() {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(removeRecommended);

    $('.xkit-no-recommended-hidden, .xkit-no-recommended-done')
    .removeClass('xkit-no-recommended-hidden')
    .removeClass('xkit-no-recommended-done');
  };

  const stylesheet = '/src/scripts/no_recommended.css';

  return { main, clean, stylesheet };
})();
