import { keyToCss } from '../../util/css_map.js';
import { buildStyle, filterPostElements } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { onNewPosts } from '../../util/mutations.js';

const hiddenClass = 'xkit-blaze-hidden';
let controlIconSelector;
let blazeIconSelector;

const styleElement = buildStyle(`.${hiddenClass} { display: none; }`);

const processPosts = postElements => filterPostElements(postElements).forEach(postElement => {
  const blazeIcon = postElement.querySelector(blazeIconSelector);
  blazeIcon?.closest(controlIconSelector)?.classList.add(hiddenClass);
});

export const main = async function () {
  document.head.append(styleElement);
  controlIconSelector = await keyToCss('controlIcon');
  const blazeLabel = await translate('Blaze');
  blazeIconSelector = `${controlIconSelector} [aria-label="${blazeLabel}"]`;

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
