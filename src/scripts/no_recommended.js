(function () {
  let showSearches;

  const excludeClass = 'xkit-no-recommended-done';

  const removeRecommended = async function () {
    const { getPostElements } = await fakeImport('/src/util/interface.js');
    const { timelineObject } = await fakeImport('/src/util/react_props.js');

    getPostElements({ excludeClass, noPeepr: true }).forEach(async postElement => {
      const { recommendationReason } = await timelineObject(postElement.dataset.id);

      if (!recommendationReason || !Object.keys(recommendationReason).includes('loggingReason')) {
        return;
      }

      const { loggingReason } = recommendationReason;
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

  const showRecommended = function () {
    $(`.${excludeClass}`).removeClass(excludeClass);
    $('.xkit-no-recommended-hidden').removeClass('xkit-no-recommended-hidden');
  };

  const onStorageChanged = function (changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const {
      'no_recommended.preferences.showSearches': showSearchesChanges,
    } = changes;

    if (showSearchesChanges) {
      ({ newValue: showSearches } = showSearchesChanges);

      showRecommended();
      removeRecommended();
    }
  };

  const main = async function () {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    ({ showSearches } = await getPreferences('no_recommended'));

    onNewPosts.addListener(removeRecommended);
    removeRecommended();
  };

  const clean = async function () {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(removeRecommended);
    showRecommended();
  };

  return { main, clean, stylesheet: true };
})();
