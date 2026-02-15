import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { blogViewSelector, displayBlockUnlessDisabledAttr } from './interface.js';
import { pageModifications } from './mutations.js';

$('#xkit-sidebar').remove();

const sidebarItems = dom('div', { id: 'xkit-sidebar', [displayBlockUnlessDisabledAttr]: '' });
const conditions = new Map();

const carrotSvg = dom('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 13 20.1',
  width: '12',
  height: '12',
}, null, [
  dom('path', {
    xmlns: 'http://www.w3.org/2000/svg',
    d: 'M0 2.9l7.2 7.2-7.1 7.1L3 20.1l7.1-7.1 2.9-2.9L2.9 0 0 2.9',
  }),
]);

/**
 * @typedef {object} sidebarRowOptions
 * @property {string} label Human-readable link text
 * @property {Function} onclick Click event handler for this row
 * @property {string} [href] Optional link URL for this row
 * @property {string} [count] Human-readable additional link text
 * @property {boolean} [carrot] Whether to include a right-facing arrow on the link (ignored if count is specified)
 */

/**
 * @param {sidebarRowOptions} options Sidebar row options
 * @returns {HTMLLIElement} The constructed sidebar row
 */
const buildSidebarRow = ({ label, onclick, href, count, carrot }) =>
  dom('li', null, null, [
    dom('a', { role: 'button', ...href ? { href } : {} }, { click: onclick }, [
      dom('span', null, null, [label]),
      count !== undefined
        ? dom('span', { class: 'count', 'data-count-for': label }, null, [count])
        : carrot === true
          ? carrotSvg.cloneNode(true)
          : '',
    ]),
  ]);

/**
 * @param {object} options Sidebar item options
 * @param {string} options.id Unique ID for the sidebar item
 * @param {string} options.title Human-readable sidebar item heading
 * @param {sidebarRowOptions[]} options.rows Row options objects to construct clickable links in the sidebar item
 * @param {Function} [options.visibility] Visibility condition function (called each time sidebar is added)
 * @returns {HTMLDivElement} The constructed sidebar item, for future referencing
 */
export const addSidebarItem = function ({ id, title, rows, visibility }) {
  const sidebarItem = dom('div', { id, class: 'xkit-sidebar-item' }, null, [
    dom('h1', null, null, [title]),
    dom('ul', null, null, rows.map(buildSidebarRow)),
  ]);

  if (visibility instanceof Function) {
    conditions.set(sidebarItem, visibility);
    sidebarItem.hidden = !visibility();
  }

  sidebarItems.replaceChildren(...[
    ...sidebarItems.children,
    sidebarItem,
  ].sort(({ id: firstId }, { id: secondId }) => firstId.localeCompare(secondId)));

  return sidebarItem;
};

export const removeSidebarItem = id => {
  const sidebarItem = sidebarItems.querySelector(`#${id}`);
  if (sidebarItem === null) return;

  conditions.delete(sidebarItem);
  sidebarItem.remove();
};

const mrecContainerSelector = `${keyToCss('mrecContainer')} *`;

// Sidebar on explore/search/hubs
const desktopContainerSelector = `aside ${keyToCss('desktopContainer', 'summary')}`;
// Sidebar on most other desktop pages
const sidebarItemSelector = keyToCss('sidebarItem', 'sidebarContent');
// Footer beneath sidebar area
const aboutFooterSelector = `${keyToCss('about')}${keyToCss('inSidebar')}`;
// Mobile drawer
const navItemSelector = `${keyToCss('drawerContent')} ${keyToCss('navigationLinks')} > ${keyToCss('navItem', 'subNav')}`;

const updateSidebarItemVisibility = () => [...sidebarItems.children]
  .filter(sidebarItem => conditions.has(sidebarItem))
  .forEach(sidebarItem => { sidebarItem.hidden = !conditions.get(sidebarItem)(); });

const addSidebarToPage = (siblingCandidates) => {
  if (/^\/settings/.test(location.pathname) || /^\/communities.*\/settings$/.test(location.pathname)) { return; }

  updateSidebarItemVisibility();

  const target = siblingCandidates
    .filter(target => !target.matches(blogViewSelector))
    .filter(target => !target.matches(mrecContainerSelector))[0];

  if (!target || target === sidebarItems) return;

  const insertAbove = getComputedStyle(target).position === 'sticky' ||
    target.matches(desktopContainerSelector) ||
    target.matches(aboutFooterSelector);

  target[insertAbove ? 'before' : 'after'](sidebarItems);
};

const addSidebarToDrawer = (navItems) => {
  updateSidebarItemVisibility();

  const lastNavItem = navItems.at(-1);
  lastNavItem?.after(sidebarItems);
};

pageModifications.register(`${desktopContainerSelector}, ${sidebarItemSelector}, ${aboutFooterSelector}`, addSidebarToPage);
pageModifications.register(navItemSelector, addSidebarToDrawer);
