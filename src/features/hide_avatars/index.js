import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { getPreferences } from '../../utils/preferences.js';

export const styleElement = buildStyle();

export const main = async function () {
  const { hiddenAvatars } = await getPreferences('hide_avatars');

  styleElement.textContent = hiddenAvatars
    .split(',')
    .map(blogname => `a:is([href="/${blogname.trim()}"], [title="${blogname.trim()}"]) img[alt="${translate('Avatar')}"] { filter: blur(64px); }`)
    .join('\n');
};
