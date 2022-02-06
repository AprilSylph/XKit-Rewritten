import { keyToCss, resolveExpressions } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';

/*
import { pageModifications } from '../util/mutations.js';
import { translate } from '../util/language_data.js';

const hiddenClass = 'xkit-anti-capitalism';
const shownClass = 'xkit-anti-capitalism-allowed';

const liteStyleElement = buildStyle();
resolveExpressions`
  ${keyToCss('mrecContainer')}, .${hiddenClass} {
    display: none !important;
  }
  .${shownClass} {
    outline: 3px solid RGBA(var(--white-on-dark), 0.3)
  }
`.then(css => { liteStyleElement.textContent = css; });

const adSelector = keyToCss('adTimelineObject', 'instreamAd', 'nativeIponWebAd', 'takeoverBanner');
let sponsoredText;

const processAds = (adElements) => {
  adElements.forEach(adElement => {
    const text = adElement?.innerText?.trim() || '';
    if (text.length <= sponsoredText.length) {
      adElement.classList.add(hiddenClass);
    } else {
      adElement.classList.add(shownClass);
    }
  });
};
*/

const thirdPartyAds = ['adTimelineObject', 'instreamAd', 'mrecContainer'];
const firstPartyAds = ['nativeIponWebAd', 'takeoverBanner'];
const liteStyleElement = buildStyle();
resolveExpressions`
  ${keyToCss(...thirdPartyAds)} {
    display: none !important;
  }
  [data-id] ${keyToCss(...thirdPartyAds)} {
    display: inherit !important;
    outline: 3px solid RGBA(var(--white-on-dark), 0.3)
  }
  ${keyToCss(...firstPartyAds)} {
    outline: 3px solid RGBA(var(--white-on-dark), 0.3)
  }
`.then(css => { liteStyleElement.textContent = css; });

const styleElement = buildStyle();
keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner')
  .then(selector => {
    styleElement.textContent = `${selector} { display: none !important; }`;
  });

export const main = async () => {
  const { allowFirstParty } = await getPreferences('anti_capitalism');

  if (allowFirstParty) {
    document.head.append(liteStyleElement);
    // sponsoredText = await translate('Sponsored');
    // pageModifications.register(await adSelector, processAds);
  } else {
    document.head.append(styleElement);
  }
};

export const clean = async () => {
  styleElement.remove();
  liteStyleElement.remove();
  // pageModifications.unregister(processAds);
};
