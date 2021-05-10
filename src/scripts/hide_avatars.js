let addedStyles = [];

export const main = async function () {
  const { getPreferences } = await fakeImport('/util/preferences.js');
  const { translate } = await fakeImport('/util/language_data.js');
  const { addStyle } = await fakeImport('/util/interface.js');

  const avatarText = await translate('Avatar');

  const { hiddenAvatars } = await getPreferences('hide_avatars');
  hiddenAvatars.split(',').forEach(username => {
    const style = `[title="${username.trim()}"] img[alt="${avatarText}"] { display: none; }`;
    addStyle(style);
    addedStyles.push(style);
  });
};

export const clean = async function () {
  const { removeStyle } = await fakeImport('/util/interface.js');
  addedStyles.forEach(style => removeStyle(style));
  addedStyles = [];
};

export const autoRestart = true;
