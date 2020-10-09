(function () {
  let addedStyles = [];

  const main = async function () {
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

  return { main, clean, autoRestart: true };
})();
