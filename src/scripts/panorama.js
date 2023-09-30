import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';
import { getPreferences } from '../util/preferences.js';

const navigationWrapperBasis = 240;
const navigationWrapperMargin = 20;
const mainContentWrapperBasis = 966;

const styleElement = buildStyle();
styleElement.media = `(min-width: ${navigationWrapperBasis + navigationWrapperMargin + mainContentWrapperBasis}px)`;

const sidebarMaxWidth = 320;
const mainRightPadding = 20;
const mainRightBorder = 1;
const sidebarOffset = sidebarMaxWidth + mainRightPadding + mainRightBorder;
const stickyContainerOffset = 85;

const mainContentWrapper = `${keyToCss('mainContentWrapper')}:not(${keyToCss('mainContentIsMasonry', 'mainContentIs4ColumnMasonry', 'mainContentIsLive')})`;
const container = `${mainContentWrapper} > ${keyToCss('container')}`;
const mainElement = `${container} > ${keyToCss('main')}`;
const postColumn = `${mainElement} > ${keyToCss('postColumn', 'postsColumn')}`;

const updateStyle = async () => {
  const { maxPostWidth: maxPostWidthString } = await getPreferences('panorama');
  const maxPostWidth = Number(maxPostWidthString.trim().replace('px', '')) || 0;

  styleElement.textContent = `
    ${mainContentWrapper} {
      flex-grow: 1;
      max-width: ${Math.max(maxPostWidth, 540) + stickyContainerOffset + sidebarOffset}px;
    }
    ${container} {
      max-width: unset;
    }
    ${mainElement} {
      max-width: calc(100% - ${sidebarOffset}px);
    }
    ${postColumn} {
      max-width: calc(100% - ${stickyContainerOffset}px);
    }

    ${postColumn}
      :is(
        ${keyToCss('cell')},
        article,
        article > header,
        article ${keyToCss('reblog', 'videoBlock', 'audioBlock', 'link')}
      ) {
      max-width: 100%;
    }

    ${postColumn} article ${keyToCss('link')} ${keyToCss('header')}${keyToCss('withImage')} {
      height: unset;
      aspect-ratio: 2;
    }
    ${postColumn} article ${keyToCss('videoBlock')} iframe {
      max-width: none !important;
    }
    ${postColumn}
      :is(
        [data-is-resizable="true"][style="width: 540px;"],
        ${keyToCss('takeoverBanner')}
      ) {
      width: unset !important;
    }
    ${keyToCss('queueSettings')} {
      box-sizing: border-box;
      width: 100%;
    }
    iframe[style*="${aspectRatioVar}"] {
      aspect-ratio: var(${aspectRatioVar});
      height: unset !important;
    }

    /* embedded blog view visual corruption fix */
    ${container} > [style*="--blog-title-color"] {
      max-width: 960px;
    }
  `;
};

const aspectRatioVar = '--panorama-aspect-ratio';

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
  Object.keys(changes).some(key => key.startsWith('panorama')) && updateStyle();

export const main = async () => {
  updateStyle();
  document.documentElement.append(styleElement);

  pageModifications.register(
    `${keyToCss('videoBlock')} iframe[style*="max-width"][style*="height"]`,
    processVideoIframes
  );
};

export const clean = async () => {
  pageModifications.unregister(processVideoIframes);
  [...document.querySelectorAll(`iframe[style*="${aspectRatioVar}"]`)].forEach(el =>
    el.style.removeProperty(aspectRatioVar)
  );

  styleElement.remove();
};
