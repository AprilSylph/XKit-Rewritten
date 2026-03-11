import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';

const widenDashMinWidth = 1162;

const sidebarMaxWidth = 320;
const mainRightPadding = 20;
const mainRightBorder = 1;
const sidebarOffset = sidebarMaxWidth + mainRightPadding + mainRightBorder;

const communityGap = 20;
const communitySidebarMinWidth = 280;
const communitySidebarMaxWidth = 360;

const expandMediaClass = 'xkit-panorama-expand-media';

const maxPostWidthVar = '--xkit-panorama-post-width';
const aspectRatioVar = '--xkit-panorama-aspect-ratio';

const mainContentWrapper =
  `${keyToCss('mainContentWrapper')}:not(${keyToCss('mainContentIsMasonry', 'mainContentIsFullWidth')})`;
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
${keyToCss('queueSettings')} {
  box-sizing: border-box;
  width: 100%;
}
`);
mainStyleElement.media = `(min-width: ${widenDashMinWidth}px)`;

const communityStyleElement = buildStyle(`
${keyToCss('grid')}${keyToCss('community')} {
  grid-template-columns:
    min(calc(100% - ${communityGap * 3}px - ${communitySidebarMaxWidth}px), var(${maxPostWidthVar}))

    /* not modified from tumblr style */
    minmax(${communitySidebarMinWidth}px, ${communitySidebarMaxWidth}px);
}
${keyToCss('grid')}${keyToCss('community')} ${keyToCss('newPostBar')} > ${keyToCss('bar')},
${keyToCss('grid')}${keyToCss('community')} ${keyToCss('timeline')} {
  max-width: unset;
}
`);
communityStyleElement.media = `(min-width: ${widenDashMinWidth + communityGap * 2}px)`;

const patioStyleElement = buildStyle(`
${patioPostColumn} {
  width: min(var(${maxPostWidthVar}), 100vw);
}
`);

const expandableImage = `${keyToCss('imageBlockButton', 'imageBlockLink', 'imageBlockGifAttribution')}:not(${keyToCss('unstretched')})`;

const styleElement = buildStyle(`
/* Widen posts */
${keyToCss('cell')}, ${postSelector}
  :is(
    article,
    article > header,
    article ${keyToCss('reblog')}
  ) {
  max-width: unset !important;
}

/* Center non-expanded content */
:root:not(.${expandMediaClass}) ${postSelector} ${keyToCss('row')}:has(> ${expandableImage}) {
  justify-content: center;
}
:root:not(.${expandMediaClass}) ${postSelector} ${expandableImage} {
  max-width: 540px;
}
:root:not(.${expandMediaClass}) ${postSelector} ${keyToCss('rows')}
  > :is(
    div:has(${keyToCss('videoBlock', 'audioBlock')}),
    ${keyToCss('link', 'pollBlock')}
  ) {
  margin: 0 auto;
  max-width: 556px;
}

/* Widen + lock aspect ratios of expanded content */
:root.${expandMediaClass} ${postSelector}
  :is(
    ${keyToCss('videoBlock', 'audioBlock', 'link', 'pollBlock')},
    ${keyToCss('videoBlock')} iframe
  ) {
  max-width: unset !important;
}
:root.${expandMediaClass} ${postSelector} ${keyToCss('videoBlock')} iframe[style*="${aspectRatioVar}"] {
  aspect-ratio: var(${aspectRatioVar});
  height: unset !important;
}
:root.${expandMediaClass} ${postSelector} a > ${keyToCss('withImage')} {
  aspect-ratio: 2;
  height: unset !important;
}

/* Fix ad containers */
${keyToCss('adTimelineObject', 'instreamAd', 'nativeIponWebAd', 'takeoverBanner')},
${keyToCss('adTimelineObject', 'instreamAd', 'nativeIponWebAd', 'takeoverBanner')} header {
  max-width: unset !important;
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
      `${maxWidth.replace('px', '')} / ${height.replace('px', '')}`,
    );
  }
});

const modifiedSizesAttr = 'data-panorama-original-sizes';
const processPostImages = images => images.forEach(image => {
  if (image.sizes?.includes('max-width: 540px)') && image.loading === 'lazy') {
    image.setAttribute(modifiedSizesAttr, image.sizes);
    image.sizes = 'auto';
  }
});

export const onStorageChanged = async (changes) =>
  Object.keys(changes).some(key => key.startsWith('panorama')) && main();

export const main = async () => {
  const {
    maxPostWidth,
    expandPostMedia,
    mainEnable,
    communitiesEnable,
    patioEnable,
  } = await getPreferences('panorama');

  document.documentElement.style.setProperty(maxPostWidthVar, maxPostWidth);
  document.documentElement.classList.toggle(expandMediaClass, expandPostMedia);

  document.documentElement.append(styleElement);
  mainEnable ? document.documentElement.append(mainStyleElement) : mainStyleElement.remove();
  communitiesEnable ? document.documentElement.append(communityStyleElement) : communityStyleElement.remove();
  patioEnable ? document.documentElement.append(patioStyleElement) : patioStyleElement.remove();

  pageModifications.register(
    `${postSelector} ${keyToCss('videoBlock')} iframe[style*="max-width"][style*="height"]`,
    processVideoIframes,
  );
  pageModifications.register('figure img', processPostImages);
};

export const clean = async () => {
  pageModifications.unregister(processVideoIframes);
  pageModifications.unregister(processPostImages);
  [...document.querySelectorAll(`iframe[style*="${aspectRatioVar}"]`)].forEach(el =>
    el.style.removeProperty(aspectRatioVar),
  );
  [...document.querySelectorAll(`[${modifiedSizesAttr}]`)].forEach(image => {
    image.sizes = image.getAttribute(modifiedSizesAttr);
    image.removeAttribute(modifiedSizesAttr);
  });

  document.documentElement.style.removeProperty(maxPostWidthVar);
  document.documentElement.classList.remove(expandMediaClass);

  styleElement.remove();
  mainStyleElement.remove();
  communityStyleElement.remove();
  patioStyleElement.remove();
};
