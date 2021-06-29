import { onBaseContainerMutated } from './mutations.js';

const sidebarItems = Object.assign(document.createElement('div'), { id: 'xkit-sidebar' });

/**
 * @typedef {object} sidebarRowOptions
 * @property {string} label - Human-readable link text
 * @property {string} [href] - Link address for this item
 * @property {Function} [onclick] - Click event handler for this item (ignored if href is specified)
 * @property {string} [count] - Human-readable additional link text
 * @property {boolean} [carrot] - Whether to include a right-facing arrow on the link (ignored if count is specified)
 * @param {object} options - Destructured
 * @param {string} options.id - Unique ID for the sidebar section
 * @param {string} options.title - Human-readable sidebar section heading
 * @param {sidebarRowOptions[]} options.rows - Row options objects to construct clickable links in the sidebar item
 * @returns {HTMLDivElement} The constructed sidebar item, for future referencing
 */
export const addSidebarItem = function ({ id, title, rows }) {
  const sidebarItem = document.createElement('div');
  sidebarItem.classList.add('xkit-sidebar-item');
  sidebarItem.id = id;

  const sidebarTitle = document.createElement('h1');
  sidebarTitle.classList.add('xkit-sidebar-title');
  sidebarTitle.textContent = title;
  sidebarItem.appendChild(sidebarTitle);

  const sidebarList = document.createElement('ul');
  sidebarItem.appendChild(sidebarList);

  for (const row of rows) {
    const sidebarListItem = document.createElement('li');
    sidebarList.appendChild(sidebarListItem);

    const link = document.createElement('a');
    if (row.href) {
      link.href = row.href;
    } else if (row.onclick instanceof Function) {
      link.href = '#';
      link.addEventListener('click', event => {
        event.preventDefault();
        row.onclick(event);
      });
    }
    sidebarListItem.appendChild(link);

    const label = document.createElement('span');
    label.textContent = row.label;
    link.appendChild(label);

    if (row.count !== undefined) {
      const count = document.createElement('span');
      count.classList.add('count');
      count.textContent = row.count;
      link.appendChild(count);
    } else if (row.carrot === true) {
      const carrot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      carrot.setAttribute('viewBox', '0 0 13 20.1');
      carrot.setAttribute('width', '12');
      carrot.setAttribute('height', '12');
      link.appendChild(carrot);

      const carrotPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      carrotPath.setAttribute('d', 'M0 2.9l7.2 7.2-7.1 7.1L3 20.1l7.1-7.1 2.9-2.9L2.9 0 0 2.9');
      carrot.appendChild(carrotPath);
    }
  }

  sidebarItems.appendChild(sidebarItem);
  return sidebarItem;
};

export const removeSidebarItem = id => sidebarItems.removeChild(sidebarItems.querySelector(`#${id}`));

const addSidebarToPage = () => {
  const aside = document.querySelector('aside');
  if (aside.querySelector('#xkit-sidebar') !== null) { return; }

  let target;

  if (getComputedStyle(aside.children[0]).position === 'sticky') {
    target = aside.children[0];
  } else {
    target = aside.children[1] || null;
  }

  aside.insertBefore(sidebarItems, target);

  if (aside.querySelector(':scope > div > aside') !== null) {
    sidebarItems.classList.add('in-channel');
  } else {
    sidebarItems.classList.remove('in-channel');
  }
};

onBaseContainerMutated.addListener(addSidebarToPage);
addSidebarToPage();
