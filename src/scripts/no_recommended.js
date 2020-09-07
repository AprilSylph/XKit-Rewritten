(function() {
  let showSearches;

  const removeRecommended = async function() {
    const { timelineObject } = await fakeImport('/src/util/react_props.js');

    [...document.querySelectorAll('#base-container [data-id]:not(.xkit-no-recommended-done)')]
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

  const showRecommended = function() {
    $('.xkit-no-recommended-hidden, .xkit-no-recommended-done')
    .removeClass('xkit-no-recommended-hidden')
    .removeClass('xkit-no-recommended-done');
  };

  const onStorageChanged = function(changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const {
      'no_recommended.preferences.showSearches': showSearchesChanges,
    } = changes;

    if (showSearchesChanges) {
      ({newValue: showSearches} = showSearchesChanges);

      showRecommended();
      removeRecommended();
    }
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    ({showSearches} = await getPreferences('no_recommended'));

    onNewPosts.addListener(removeRecommended);
    removeRecommended();
  };

  const clean = async function() {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(removeRecommended);
    showRecommended();
  };

  const stylesheet = '/src/scripts/no_recommended.css';

  return { main, clean, stylesheet };
})();
