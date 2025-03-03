import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';

const hiddenAttribute = 'data-tweaks-hide-mini-follow-hidden';

export const styleElement = buildStyle(`
article ${keyToCss('followButton')}:not(${keyToCss('postMeatballsContainer')} *), [${hiddenAttribute}] { display: none; }
`);

const processButtons = buttons => buttons.forEach(async button => {
  const postElement = button.closest(postSelector);
  if (!postElement) { return; }

  const { headerCta } = await timelineObject(postElement);
  headerCta?.action?.action === 'follow' && button.setAttribute(hiddenAttribute, '');
});

export const main = async () => {
  pageModifications.register(`${postSelector} ${keyToCss('rightContent')} > button`, processButtons);
};

export const clean = async () => {
  pageModifications.unregister(processButtons);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
