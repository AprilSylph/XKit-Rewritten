import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';

const hiddenAttribute = 'data-tweaks-hide-mini-follow-hidden';

export const styleElement = buildStyle(`
article ${keyToCss('followButton')}:not(${keyToCss('postMeatballsContainer')} *), [${hiddenAttribute}] { display: none; }
`);

const processButtons = buttons => buttons.forEach(button => {
  if (button.textContent === translate('Follow')) {
    button.setAttribute(hiddenAttribute, '');
  }
});

export const main = async () => {
  pageModifications.register(`${postSelector} ${keyToCss('rightContent')} > button`, processButtons);
};

export const clean = async () => {
  pageModifications.unregister(processButtons);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
