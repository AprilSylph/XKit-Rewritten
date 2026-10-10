import { keyToCss } from '../../utils/css_map.js';
import { blogViewSelector, buildStyle } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const hiddenAttribute = 'data-no-recommended-blogs-modal-hidden';

export const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const desktopContainerSelector = keyToCss('desktopContainer');
const recommendedBlogsSelector = keyToCss('recommendedBlogs');
const sidebarSectionSelector = `${desktopContainerSelector}:is(${blogViewSelector}):has(${recommendedBlogsSelector})`;

/** @type {(sidebarSections: HTMLElement[]) => void} */
const hideSidebarSections = sidebarSections => sidebarSections.forEach(
  sidebarSection => sidebarSection.toggleAttribute(hiddenAttribute, true),
);

export const main = async function () {
  pageModifications.register(sidebarSectionSelector, hideSidebarSections);
};

export const clean = async function () {
  pageModifications.unregister(hideSidebarSections);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
