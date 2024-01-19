import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';
import { getPreferences } from '../util/preferences.js';

const navigationWrapperBasis = 240;
const navigationWrapperMargin = 20;
const mainContentWrapperBasis = 966;

const styleElement = buildStyle();
styleElement.media = `(min-width: ${navigationWrapperBasis + navigationWrapperMargin + mainContentWrapperBasis}px)`;

const mainContentWrapper = `${keyToCss('mainContentWrapper')}:not(${keyToCss('mainContentIsMasonry', 'mainContentIs4ColumnMasonry', 'mainContentIsLive')})`;
const container = `${mainContentWrapper} > ${keyToCss('container')}`;
const mainElement = `${container} > ${keyToCss('main')}`;
const postColumn = `${mainElement} > ${keyToCss('postColumn', 'postsColumn')}`;
const patioWidePostColumn = `[id]${keyToCss('columnWide')}`;

const togglePanorama = async () => {
  const hasColumn = document.querySelector(postColumn);
  const hasPatioColumn = document.querySelector(patioWidePostColumn);

  const { maxPostWidth: maxPostWidthString } = await getPreferences('panorama');
  const maxPostWidth = Number(maxPostWidthString.trim().replace('px', '')) || 0;

  const enableOnPatio = true; // add preference when patio is released

  if (hasColumn || (hasPatioColumn && enableOnPatio)) {
    const sidebarMaxWidth = 320;
    const mainRightPadding = 20;
    const mainRightBorder = 1;
    const sidebarOffset = sidebarMaxWidth + mainRightPadding + mainRightBorder;
    const stickyContainerOffset = document.querySelector(keyToCss('reblogRedesignEnabled')) ? 0 : 85;

    const column = hasPatioColumn ? patioWidePostColumn : postColumn;

    styleElement.textContent = `
      ${
        hasPatioColumn
          ? `
              ${column} {
                width: ${Math.max(maxPostWidth, 540)}px;
              }
            `
          : `
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
              ${column} {
                max-width: calc(100% - ${stickyContainerOffset}px);
              }
            `
      }

      ${column}
        :is(
          ${keyToCss('cell')},
          article,
          article > header,
          article ${keyToCss('reblog', 'videoBlock', 'audioBlock', 'link')}
        ) {
        max-width: 100%;
      }

      ${column} article ${keyToCss('link')} ${keyToCss('header')}${keyToCss('withImage')} {
        height: unset;
        aspect-ratio: 2;
      }
      ${column} article ${keyToCss('videoBlock')} iframe {
        max-width: none !important;
      }
      ${column}
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
    `;
    document.documentElement.append(styleElement);
  } else {
    styleElement.remove();
  }
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
  Object.keys(changes).some(key => key.startsWith('panorama')) && togglePanorama();

export const main = async () => {
  pageModifications.register(`:is(${mainContentWrapper}, ${postColumn})`, togglePanorama);

  pageModifications.register(
    `${keyToCss('videoBlock')} iframe[style*="max-width"][style*="height"]`,
    processVideoIframes
  );
};

export const clean = async () => {
  pageModifications.unregister(togglePanorama);

  pageModifications.unregister(processVideoIframes);
  [...document.querySelectorAll(`iframe[style*="${aspectRatioVar}"]`)].forEach(el =>
    el.style.removeProperty(aspectRatioVar)
  );

  styleElement.remove();
};
