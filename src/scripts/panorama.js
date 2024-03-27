import { keyToCss } from '../util/css_map.js';
import { buildStyle, postSelector } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';
import { getPreferences } from '../util/preferences.js';

const navigationWrapperBasis = 240;
const navigationWrapperMargin = 20;
const mainContentWrapperMinWidth = 902;
const widenDashMinWidth = navigationWrapperBasis + navigationWrapperMargin + mainContentWrapperMinWidth;

const sidebarMaxWidth = 320;
const mainRightPadding = 20;
const mainRightBorder = 1;
const sidebarOffset = sidebarMaxWidth + mainRightPadding + mainRightBorder;

const mainEnableClass = 'xkit-panorama-main';
const patioEnableClass = 'xkit-panorama-patio';
const expandClass = 'xkit-panorama-expand-media';

const maxPostWidthVar = '--xkit-panorama-post-width';
const aspectRatioVar = '--xkit-panorama-aspect-ratio';

const mainContentWrapper =
  `body.${mainEnableClass} ${keyToCss('mainContentWrapper')}:not(${keyToCss('mainContentIsMasonry', 'mainContentIsFullWidth')})`;
const mainPostColumn = `main${keyToCss('postColumn', 'postsColumn')}`;
const patioPostColumn = `[id]${keyToCss('columnWide')}`;

const mainStyleElement = buildStyle(`
${mainContentWrapper}:has(> div > div > ${mainPostColumn}) {
  flex-grow: 1;
  max-width: calc(var(${maxPostWidthVar}) + ${sidebarOffset}px);
}
${mainContentWrapper} > div:has(> div > ${mainPostColumn}) {
  max-width: unset;
}
${mainContentWrapper} > div > div:has(> ${mainPostColumn}) {
  max-width: calc(100% - ${sidebarOffset}px);
}
${mainContentWrapper} > div > div > ${mainPostColumn} {
  max-width: 100%;
}
body.${mainEnableClass} ${keyToCss('queueSettings')} {
  box-sizing: border-box;
  width: 100%;
}
`);
mainStyleElement.media = `(min-width: ${widenDashMinWidth}px)`;

const styleElement = buildStyle(`
body.${patioEnableClass} ${patioPostColumn} {
  width: min(var(${maxPostWidthVar}), 100vw);
}

/* Widen posts */
${keyToCss('cell')}, ${postSelector}
  :is(
    article,
    article > header,
    article ${keyToCss('reblog')}
  ) {
  max-width: unset;
}

/* Center non-expanded content */
body:not(.${expandClass}) ${postSelector}
  :is(
    ${keyToCss('videoBlock', 'audioBlock', 'link', 'pollBlock', 'imageBlockLink')},
    figure${keyToCss('imageBlock')}:not(${keyToCss('unstretched')})
  ) {
  margin: 0 auto;
  max-width: 540px;
}

/* Widen + lock aspect ratios of expanded content */
body.${expandClass} ${postSelector}
  :is(
    ${keyToCss('videoBlock', 'audioBlock', 'link', 'pollBlock')},
    ${keyToCss('videoBlock')} iframe
  ) {
  max-width: unset !important;
}
body.${expandClass} ${postSelector} ${keyToCss('videoBlock')} iframe[style*="${aspectRatioVar}"] {
  aspect-ratio: var(${aspectRatioVar});
  height: unset !important;
}
body.${expandClass} ${postSelector} a > ${keyToCss('withImage')} {
  aspect-ratio: 2;
  height: unset !important;
}

/* Fix ad containers */
${keyToCss('adTimelineObject', 'instreamAd', 'nativeIponWebAd', 'takeoverBanner')},
${keyToCss('adTimelineObject', 'instreamAd', 'nativeIponWebAd', 'takeoverBanner')} header {
  max-width: unset;
}
[data-is-resizable="true"][style="width: 540px;"],
${keyToCss('takeoverBanner')} {
  width: unset !important;
}
`);

const processVideoIframes = iframes => iframes.forEach(iframe => {
  const { maxWidth, height } = iframe.style;
  if (maxWidth && height) {
    iframe.style.setProperty(
      aspectRatioVar,
      `${maxWidth.replace('px', '')} / ${height.replace('px', '')}`
    );
  }
});

export const onStorageChanged = async (changes, areaName) =>
  Object.keys(changes).some(key => key.startsWith('panorama')) && main();

export const main = async () => {
  const {
    maxPostWidth: maxPostWidthString,
    expandPostMedia,
    mainEnable,
    patioEnable
  } = await getPreferences('panorama');

  const maxPostWidth = Number(maxPostWidthString.trim().replace('px', '')) || 0;
  document.body.style.setProperty(maxPostWidthVar, `${Math.max(maxPostWidth, 540)}px`);
  document.body.classList[mainEnable ? 'add' : 'remove'](mainEnableClass);
  document.body.classList[patioEnable ? 'add' : 'remove'](patioEnableClass);
  document.body.classList[expandPostMedia ? 'add' : 'remove'](expandClass);

  document.documentElement.append(styleElement, mainStyleElement);

  pageModifications.register(
    `${postSelector} ${keyToCss('videoBlock')} iframe[style*="max-width"][style*="height"]`,
    processVideoIframes
  );
};

export const clean = async () => {
  pageModifications.unregister(processVideoIframes);
  [...document.querySelectorAll(`iframe[style*="${aspectRatioVar}"]`)].forEach(el =>
    el.style.removeProperty(aspectRatioVar)
  );

  document.body.style.removeProperty(maxPostWidthVar);
  document.body.classList.remove(mainEnableClass, patioEnableClass, expandClass);

  styleElement.remove();
  mainStyleElement.remove();
};
