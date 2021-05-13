import { getPreferences } from '../util/preferences.js';
import { translate } from '../util/language_data.js';
import { addStyle, removeStyle } from '../util/interface.js';

let addedStyles = [];

export const main = async function () {
  const avatarText = await translate('Avatar');

  const { hiddenAvatars } = await getPreferences('hide_avatars');
  hiddenAvatars.split(',').forEach(username => {
    const style = `[title="${username.trim()}"] img[alt="${avatarText}"] { display: none; }`;
    addStyle(style);
    addedStyles.push(style);
  });
};

export const clean = async function () {
  addedStyles.forEach(style => removeStyle(style));
  addedStyles = [];
};
