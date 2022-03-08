import { keyToCss, resolveExpressions } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { hideModal, showModal } from '../util/modals.js';
import { pageModifications } from '../util/mutations.js';
import { userInfo } from '../util/user.js';

const hiddenClass = 'xkit-anti-capitalism-hidden';

let listTimelineObjectInnerSelector;

const styleElement = buildStyle(`.${hiddenClass} { display: none !important; }\n`);
keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner')
  .then(selector => {
    styleElement.textContent += `${selector} { display: none !important; }`;
  });

const processVideoCTAs = videoCTAs => videoCTAs
  .map(videoCTA => videoCTA.closest(listTimelineObjectInnerSelector))
  .filter(Boolean)
  .forEach(({ classList }) => classList.add(hiddenClass));

const showPremiumPlea = async () => {
  const storageKey = 'anti_capitalism.hasShownPlea';
  const { [storageKey]: hasShownPlea } = await browser.storage.local.get(storageKey);
  browser.storage.local.set({ [storageKey]: true });
  if (hasShownPlea) return;

  const { response: { user: { hasTumblrPremium, usedToHaveTumblrPremium } } } = await userInfo;
  if (hasTumblrPremium || usedToHaveTumblrPremium) return;

  const goAwayButton = Object.assign(document.createElement('button'), {
    textContent: 'Go away'
  });
  const premiumLink = Object.assign(document.createElement('a'), {
    href: 'https://www.tumblr.com/settings/ad-free-browsing',
    target: '_blank',
    className: 'blue',
    textContent: 'Tell me more'
  });

  goAwayButton.addEventListener('click', hideModal);
  premiumLink.addEventListener('click', hideModal);

  showModal({
    title: 'Want to hide ads on all platforms?',
    message: [
      `XKit can only hide ads on the web.

      To hide ads on both the web and mobile apps, subscribe to Tumblr Ad-Free Browsing today for $4.99/month or $39.99/year!

      Every subscription helps offset Tumblr's operating costs, which they need to do to stay up and running.`,
      Object.assign(document.createElement('small'), {
        textContent: '\n\nThis message will only be shown once. The link will open in a new tab.'
      })
    ],
    buttons: [goAwayButton, premiumLink]
  });
};

export const main = async () => {
  document.head.append(styleElement);

  listTimelineObjectInnerSelector = await keyToCss('listTimelineObjectInner');
  const videoCTASelector = await resolveExpressions`${listTimelineObjectInnerSelector}:first-child ${keyToCss('videoCTA')}`;
  pageModifications.register(videoCTASelector, processVideoCTAs);

  showPremiumPlea().catch(() => {});
};

export const clean = async () => {
  styleElement.remove();
  pageModifications.unregister(processVideoCTAs);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
