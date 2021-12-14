import { keyToCss } from './css_map.js';
import { onBaseContainerMutated } from './mutations.js';

const sidebarItems = Object.assign(document.createElement('div'), { id: 'xkit-sidebar' });
const conditions = new Map();

/**
 * @typedef {object} sidebarRowOptions
 * @property {string} label - Human-readable link text
 * @property {Function} onclick - Click event handler for this row
 * @property {string} [count] - Human-readable additional link text
 * @property {boolean} [carrot] - Whether to include a right-facing arrow on the link (ignored if count is specified)
 * @param {sidebarRowOptions} options - Sidebar row options
 * @returns {HTMLLIElement} The constructed sidebar row
 */
const buildSidebarRow = function ({ label, onclick, count, carrot }) {
  const sidebarListItem = document.createElement('li');

  const button = document.createElement('button');
  button.addEventListener('click', onclick);
  sidebarListItem.append(button);

  const labelSpan = Object.assign(document.createElement('span'), { textContent: label });
  button.append(labelSpan);

  if (count !== undefined) {
    const countSpan = Object.assign(document.createElement('span'), {
      className: 'count',
      textContent: count
    });
    button.append(countSpan);
  } else if (carrot === true) {
    const carrotSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    carrotSvg.setAttribute('viewBox', '0 0 13 20.1');
    carrotSvg.setAttribute('width', '12');
    carrotSvg.setAttribute('height', '12');
    button.append(carrotSvg);

    const carrotPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    carrotPath.setAttribute('d', 'M0 2.9l7.2 7.2-7.1 7.1L3 20.1l7.1-7.1 2.9-2.9L2.9 0 0 2.9');
    carrotSvg.append(carrotPath);
  }

  return sidebarListItem;
};

/**
 * @param {object} options - Sidebar item options
 * @param {string} options.id - Unique ID for the sidebar item
 * @param {string} options.title - Human-readable sidebar item heading
 * @param {sidebarRowOptions[]} options.rows - Row options objects to construct clickable links in the sidebar item
 * @param {Function} [options.visibility] - Visibility condition function (called each time sidebar is added)
 * @returns {HTMLDivElement} The constructed sidebar item, for future referencing
 */
export const addSidebarItem = function ({ id, title, rows, visibility }) {
  const sidebarItem = Object.assign(document.createElement('div'), { id, className: 'xkit-sidebar-item' });
  const sidebarTitle = Object.assign(document.createElement('h1'), { textContent: title });
  const sidebarList = document.createElement('ul');

  sidebarItems.append(sidebarItem);
  sidebarItem.append(sidebarTitle, sidebarList);
  sidebarList.append(...rows.map(buildSidebarRow));

  if (visibility instanceof Function) {
    conditions.set(sidebarItem, visibility);
    conditions.hidden = visibility() === false;
  }

  return sidebarItem;
};

export const removeSidebarItem = id => {
  const sidebarItem = sidebarItems.querySelector(`#${id}`);
  if (sidebarItem === null) return;

  conditions.delete(sidebarItem);
  sidebarItem.remove();
};

(async () => {
  const sidebarItemSelector = await keyToCss('sidebarItem');
  const navSubHeaderSelector = await keyToCss('navSubHeader');

  const addSidebarToPage = () => {
    if (document.body.contains(sidebarItems)) { return; }
    const outdatedSidebarItems = document.getElementById('xkit-sidebar');
    outdatedSidebarItems?.remove();

    [...sidebarItems.children]
      .filter(sidebarItem => conditions.has(sidebarItem))
      .forEach(sidebarItem => { sidebarItem.hidden = conditions.get(sidebarItem)() === false; });

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

  onBaseContainerMutated.addListener(addSidebarToPage);
  addSidebarToPage();
})();
