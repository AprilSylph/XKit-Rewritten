import { pageModifications } from '../../util/mutations.js';
import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle, postSelector } from '../../util/interface.js';

const hiddenClass = 'xkit-tweaks-hide-filtered-posts-hidden';
const styleElement = buildStyle(`.${hiddenClass} > * { display: none; }`);

const hideFilteredPosts = filteredScreens => filteredScreens
  .map(filteredScreen => filteredScreen.closest(postSelector))
  .forEach(postElement => postElement.classList.add(hiddenClass));

export const main = async function () {
  const filteredScreenSelector = await resolveExpressions`article ${keyToCss('filteredScreen')}`;
  pageModifications.register(filteredScreenSelector, hideFilteredPosts);
  document.head.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(hideFilteredPosts);
  styleElement.remove();

  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
