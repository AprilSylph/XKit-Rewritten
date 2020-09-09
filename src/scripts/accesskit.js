(function() {
  const onStorageChanged = async function(changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const {
      'accesskit.preferences.blueLinks': blueLinksChanges,
      'accesskit.preferences.noUserColours': noUserColoursChanges,
    } = changes;

    if (blueLinksChanges) {
      const {newValue: blueLinks} = blueLinksChanges;
      const toggle = blueLinks ? 'add' : 'remove';
      document.body.classList[toggle]('accesskit-blue-links');
    }

    if (noUserColoursChanges) {
      const {newValue: noUserColours} = noUserColoursChanges;
      const toggle = noUserColours ? 'add' : 'remove';
      document.body.classList[toggle]('accesskit-no-user-colours');
    }
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');

    const {blueLinks, noUserColours} = await getPreferences('accesskit');

    if (blueLinks) {
      document.body.classList.add('accesskit-blue-links');
    }

    if (noUserColours) {
      document.body.classList.add('accesskit-no-user-colours');
    }
  };

  const clean = async function() {
    browser.storage.onChanged.removeListener(onStorageChanged);
    $(document.body).removeClass('accesskit-blue-links accesskit-no-user-colours');
  };

  return { main, clean, stylesheet: true };
})();
