import { getPreferences } from '../util/preferences.js';
import { translate } from '../util/language_data.js';
import { buildStyle } from '../util/interface.js';

export const styleElement = buildStyle();

export const main = async function () {
  const { hiddenAvatars } = await getPreferences('hide_avatars');

  styleElement.textContent = hiddenAvatars
    .split(',')
    .map(username => `[title="${username.trim()}"] img[alt="${translate('Avatar')}"] { display: none; }`)
    .join('\n');
};
