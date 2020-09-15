(function () {
  let addedStyles = [];

  const onStorageChanged = function (changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    if (Object.keys(changes).some(key => key.startsWith('hide_avatars'))) {
      clean().then(main);
    }
  };

  const main = async function () {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');
    const { translate } = await fakeImport('/src/util/language_data.js');
    const { addStyle } = await fakeImport('/src/util/interface.js');

    const avatarText = await translate('Avatar');

    const { hiddenAvatars } = await getPreferences('hide_avatars');
    hiddenAvatars.split(',').forEach(username => {
      const style = `[title="${username.trim()}"] img[alt="${avatarText}"] { display: none; }`;
      addStyle(style);
      addedStyles.push(style);
    });
  };

  const clean = async function () {
    const { removeStyle } = await fakeImport('/src/util/interface.js');
    addedStyles.forEach(style => removeStyle(style));
    addedStyles = [];
  };

  return { main, clean };
})();
