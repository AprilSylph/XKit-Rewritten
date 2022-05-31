import { keyToCss, resolveExpressions } from '../util/css_map.js';
import { dom } from '../util/dom.js';
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
  if (hasShownPlea) return;

  if (userInfo === undefined) return;
  const { hasTumblrPremium, usedToHaveTumblrPremium } = userInfo;
  if (hasTumblrPremium || usedToHaveTumblrPremium) {
    browser.storage.local.set({ [storageKey]: true });
    return;
  }

  showModal({
    title: 'Want to hide ads on all platforms?',
    message: [
      'XKit can only hide ads on the web.\n\n',
      'To hide ads on both the web and mobile apps, subscribe to Tumblr Ad-Free Browsing today for $4.99/month or $39.99/year!\n\n',
      'Every subscription helps offset Tumblr\u2019s operating costs, which they need to do to stay up and running.\n\n',
      dom('small', null, null, ['This message will only be shown once. The link will open in a new tab.'])
    ],
    buttons: [
      dom('button', null, { click: hideModal }, ['Go away']),
      dom('a', {
        class: 'blue',
        href: 'https://www.tumblr.com/settings/ad-free-browsing',
        target: '_blank'
      }, {
        click: hideModal
      }, [
        'Tell me more'
      ])
    ]
  });

  browser.storage.local.set({ [storageKey]: true });
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
