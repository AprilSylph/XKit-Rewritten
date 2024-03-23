import { pageModifications } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { buildStyle } from '../../util/interface.js';

const hiddenAttribute = 'data-no-recommended-radar-hidden';

const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const checkForRadar = function (sidebarTitles) {
  sidebarTitles
    .filter(h1 => h1.textContent === translate('Radar'))
    .forEach(h1 => h1.closest('aside > *').setAttribute(hiddenAttribute, ''));
};

export const main = async function () {
  pageModifications.register('aside h1', checkForRadar);
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(checkForRadar);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
