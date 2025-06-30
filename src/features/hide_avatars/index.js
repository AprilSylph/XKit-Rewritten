import { getPreferences } from '../../utils/preferences.js';
import { translate } from '../../utils/language_data.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle();

export const main = async function () {
  const { hiddenAvatars } = await getPreferences('hide_avatars');

  styleElement.textContent = hiddenAvatars
    .split(',')
    .map(username => `[title="${username.trim()}"] img[alt="${translate('Avatar')}"] { display: none; }`)
    .join('\n');
};
