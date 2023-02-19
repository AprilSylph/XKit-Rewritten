import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';

const minSize = 300;

const container = `${keyToCss('bluespaceLayout')} > ${keyToCss('container')}:not(${keyToCss('mainContentIs4ColumnMasonry')})`;
const reblog = `${keyToCss('post')} ${keyToCss('reblog')}`;
const videoBlock = keyToCss('videoBlock');
const audioBlock = keyToCss('audioBlock');
const link = `${keyToCss('rows')} > ${keyToCss('link')}`;
const linkImage = `${keyToCss('header')}${keyToCss('withImage')}`;
const queueSettings = keyToCss('queueSettings');

const taggedPageColumn = `${keyToCss('postMasonry')} > ${keyToCss('postColumn')}`;

const blogBodySelector = '[style*="--blog-title-color"]';

const blogModalLayout = `${blogBodySelector} > ${keyToCss('layout')}`;
const blogModalBody = `${blogBodySelector} > ${keyToCss('layout')} > ${keyToCss('body')}`;

const blogModalDrawer = `${keyToCss('drawer')}${keyToCss('center')}`;
const embeddedBlogModalScrollContainer = `${keyToCss('container')} > ${blogBodySelector}`;

const styleElement = buildStyle();
styleElement.media = '(min-width: 576px)';

const mobileStyleElement = buildStyle();
mobileStyleElement.media = '(min-width: 576px) and (max-width: 989px)';

const standardStyleElement = buildStyle();
standardStyleElement.media = '(min-width: 990px)';

const modalStyleElementMobile = buildStyle();
modalStyleElementMobile.media = '(min-width: 576px) and (max-width: 989px)';

const modalStyleElementNoSidebar = buildStyle();
modalStyleElementNoSidebar.media = '(min-width: 990px) and (max-width: 1149px)';

const modalStyleElementWithSidebar = buildStyle();
modalStyleElementWithSidebar.media = '(min-width: 1150px)';

const styleElements = [
  styleElement,
  mobileStyleElement,
  standardStyleElement,
  modalStyleElementMobile,
  modalStyleElementNoSidebar,
  modalStyleElementWithSidebar
];

const avatarLeft = 85;
const avatarWidth = 64;
const avatarGutter = avatarLeft - avatarWidth;

const sidebarWidth = 320;
const sidebarSpacing = 30;
const defaultPostWidth = 540;

const minContainerWidth = avatarLeft + defaultPostWidth + sidebarWidth + sidebarSpacing;

const modalMainMargin = 20;
const modalSidebarWidth = 320;
const modalSidebarSpacing = 20;

const minModalWidthWithSidebar = modalSidebarWidth + modalSidebarSpacing * 5;

export const main = async () => {
  const { maxPostWidth: maxPostWidthPref } = await getPreferences('panorama');

  const maxPostWidth = maxPostWidthPref
    .trim()
    .replace('%', 'vw')
    .replace(/^(\d+)$/, '$&px') || '100vw';

  styleElement.textContent = `
    ${container} {
      justify-content: center;
    }

    ${container} > :first-child main article { max-width: 100%; }
    ${container} > :first-child main article > * { max-width: 100%; }

    ${reblog} { max-width: none; }
    ${videoBlock} { max-width: none; }
    ${videoBlock} iframe { max-width: none !important; }
    ${audioBlock} { max-width: none; }
    ${link} { max-width: none; }
    ${link} ${linkImage} { height: unset; }

    ${taggedPageColumn} { max-width: none; }

    ${queueSettings} {
      box-sizing: border-box;
      width: calc(100% - ${625 - 540}px);
    }
  `;

  mobileStyleElement.textContent = `

    #base-container > div > div > header,
    ${container} {
      max-width: 100vw;
    }

    ${container} > :first-child main { max-width: calc(100% - ${20 * 2}px); }

    ${container} > :first-child:not(${blogBodySelector}) {
      min-width: 0;
      max-width: max(${maxPostWidth} + ${40}px, ${minSize + 40}px);
      flex: 1;
    }
  `;

  standardStyleElement.textContent = `
    #base-container > div > div > header,
    ${container} {
      max-width: max(100vw - ${avatarGutter * 2}px, ${minContainerWidth}px);
      padding: 0
    }

    ${container} > :first-child:not(${blogBodySelector}) main { max-width: calc(100% - ${avatarLeft}px); }

    ${container} > :first-child:not(${blogBodySelector}) {
      min-width: 0;
      max-width: max(${maxPostWidth} + ${avatarLeft}px, ${minSize + avatarLeft}px);
      flex: 1;
    }
  `;

  modalStyleElementMobile.textContent = `
    ${blogModalLayout} { max-width: none; }
    ${blogModalBody} { max-width: none; }

    ${blogModalBody} main { max-width: calc(100% - ${modalMainMargin * 2}px); }
    ${blogModalBody} main article { max-width: 100%; }
    ${blogModalBody} main article > * { max-width: 100%; }

    ${blogModalDrawer} {
      max-width: max(${maxPostWidth} + ${modalMainMargin * 2}px, ${minSize + modalMainMargin * 2}px);
      width: calc(100% - 40px);
    }

    ${embeddedBlogModalScrollContainer} {
      max-width: max(${maxPostWidth} + ${modalMainMargin * 2}px, ${minSize + modalMainMargin * 2}px);
      width: calc(100% - 40px);
      margin-left: auto;
      margin-right: auto;
    }
  `;

  modalStyleElementNoSidebar.textContent = `
    ${blogModalLayout} { max-width: none; }
    ${blogModalBody} { max-width: none; }

    ${blogModalBody} main { max-width: calc(100% - ${modalMainMargin * 2}px); }
    ${blogModalBody} main article { max-width: 100%; }
    ${blogModalBody} main article > * { max-width: 100%; }

    ${blogModalDrawer} {
      max-width: max(${maxPostWidth} + ${modalMainMargin * 2}px, ${minSize + modalMainMargin * 2}px);
      width: calc(100% - 160px);
    }

    ${embeddedBlogModalScrollContainer} {
      max-width: max(${maxPostWidth} + ${modalMainMargin * 2}px, ${minSize + modalMainMargin * 2}px);
      width: calc(100% - 160px);
      margin-left: auto;
      margin-right: auto;
    }
  `;

  modalStyleElementWithSidebar.textContent = `
    ${blogModalLayout} { max-width: none; }
    ${blogModalBody} { max-width: none; }

    ${blogModalBody} main { max-width: calc(100% - ${modalMainMargin * 2}px); }
    ${blogModalBody} main article { max-width: 100%; }
    ${blogModalBody} main article > * { max-width: 100%; }

    ${blogModalDrawer} {
      max-width: max(${maxPostWidth} + ${minModalWidthWithSidebar}px, ${minSize + minModalWidthWithSidebar}px);
      width: calc(100% - 160px);
    }

    ${embeddedBlogModalScrollContainer} {
      max-width: max(${maxPostWidth} + ${minModalWidthWithSidebar}px, ${minSize + minModalWidthWithSidebar}px);
      width: calc(100% - 160px);
      margin-left: auto;
      margin-right: auto;
    }
  `;

  document.documentElement.append(...styleElements);
};

export const clean = async () => styleElements.forEach(el => el.remove());
