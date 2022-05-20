import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { pageModifications } from './mutations.js';

const sidebarItems = dom('div', { id: 'xkit-sidebar' });
const conditions = new Map();

const carrotSvg = dom('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 13 20.1',
  width: '12',
  height: '12'
}, null, [
  dom('path', {
    xmlns: 'http://www.w3.org/2000/svg',
    d: 'M0 2.9l7.2 7.2-7.1 7.1L3 20.1l7.1-7.1 2.9-2.9L2.9 0 0 2.9'
  })
]);

/**
 * @typedef {object} sidebarRowOptions
 * @property {string} label - Human-readable link text
 * @property {Function} onclick - Click event handler for this row
 * @property {string} [count] - Human-readable additional link text
 * @property {boolean} [carrot] - Whether to include a right-facing arrow on the link (ignored if count is specified)
 */

/**
 * @param {sidebarRowOptions} options - Sidebar row options
 * @returns {HTMLLIElement} The constructed sidebar row
 */
const buildSidebarRow = ({ label, onclick, count, carrot }) =>
  dom('li', null, null, [
    dom('button', null, { click: onclick }, [
      dom('span', null, null, [label]),
      count !== undefined
        ? dom('span', { class: 'count' }, null, [count])
        : carrot === true
          ? carrotSvg.cloneNode(true)
          : ''
    ])
  ]);

/**
 * @param {object} options - Sidebar item options
 * @param {string} options.id - Unique ID for the sidebar item
 * @param {string} options.title - Human-readable sidebar item heading
 * @param {sidebarRowOptions[]} options.rows - Row options objects to construct clickable links in the sidebar item
 * @param {Function} [options.visibility] - Visibility condition function (called each time sidebar is added)
 * @returns {HTMLDivElement} The constructed sidebar item, for future referencing
 */
export const addSidebarItem = function ({ id, title, rows, visibility }) {
  const sidebarItem = dom('div', { id, class: 'xkit-sidebar-item' }, null, [
    dom('h1', null, null, [title]),
    dom('ul', null, null, rows.map(buildSidebarRow))
  ]);

  if (visibility instanceof Function) {
    conditions.set(sidebarItem, visibility);
    sidebarItem.hidden = !visibility();
  }

  sidebarItems.replaceChildren(...[
    ...sidebarItems.children,
    sidebarItem
  ].sort(({ id: firstId }, { id: secondId }) => firstId.localeCompare(secondId)));

  return sidebarItem;
};

export const removeSidebarItem = id => {
  const sidebarItem = sidebarItems.querySelector(`#${id}`);
  if (sidebarItem === null) return;

  conditions.delete(sidebarItem);
  sidebarItem.remove();
};

(async () => {
  const sidebarItemSelector = keyToCss('sidebarItem');
  const navSubHeaderSelector = keyToCss('navSubHeader');

  const addSidebarToPage = () => {
    if (document.body.contains(sidebarItems)) { return; }
    const outdatedSidebarItems = document.getElementById('xkit-sidebar');
    outdatedSidebarItems?.remove();

    [...sidebarItems.children]
      .filter(sidebarItem => conditions.has(sidebarItem))
      .forEach(sidebarItem => { sidebarItem.hidden = !conditions.get(sidebarItem)(); });

    const firstSidebarItem = document.querySelector(sidebarItemSelector);
    const firstNavSubHeader = document.querySelector(navSubHeaderSelector);

    if (firstSidebarItem) {
      const target = getComputedStyle(firstSidebarItem).position === 'sticky'
        ? firstSidebarItem
        : firstSidebarItem.nextElementSibling;
      firstSidebarItem.parentNode.insertBefore(sidebarItems, target);
    } else if (firstNavSubHeader) {
      firstNavSubHeader.parentNode.insertBefore(sidebarItems, firstNavSubHeader);
    }
  };

  pageModifications.register(`${sidebarItemSelector}, ${navSubHeaderSelector}`, addSidebarToPage);
})();
