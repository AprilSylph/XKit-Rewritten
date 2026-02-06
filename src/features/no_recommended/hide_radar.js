import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';

const hiddenAttribute = 'data-no-recommended-radar-hidden';

export const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const checkForRadar = function (sidebarTitles) {
  sidebarTitles
    .filter(h1 => h1.textContent === translate('Radar'))
    .forEach(h1 => h1.closest('aside > *').setAttribute(hiddenAttribute, ''));
};

export const main = async function () {
  pageModifications.register('aside h1', checkForRadar);
};

export const clean = async function () {
  pageModifications.unregister(checkForRadar);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
