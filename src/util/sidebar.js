(function () {
  const sidebarItems = Object.assign(document.createElement('div'), { id: 'xkit-sidebar' });

  /* eslint-disable jsdoc/check-param-names */
  /**
   * @param {object} options - Destructured, not used directly
   * @param {string} options.id - Unique ID for the sidebar section
   * @param {string} options.title - Human-readable sidebar section heading
   * @param {object[]} options.items - Array of item objects to construct clickable links in the sidebar section
   * @param {string} options.items.label - Human-readable link text
   * @param {string} [options.items.href] - Link address for this item
   * @param {Function} [options.items.onClick] - Click event handler for this item (ignored if href is specified)
   * @param {string} [options.items.count] - Human-readable additional link text
   * @param {boolean} [options.items.carrot] - Whether to include a right-facing arrow on the link (ignored if count is specified)
   * @returns {HTMLDivElement} - The constructed sidebar section
   */
  const addSidebarItem = function ({ id, title, items }) {
    const sidebarItem = document.createElement('div');
    sidebarItem.classList.add('xkit-sidebar-item');
    sidebarItem.id = id;

    const sidebarTitle = document.createElement('h1');
    sidebarTitle.classList.add('xkit-sidebar-title');
    sidebarTitle.textContent = title;
    sidebarItem.appendChild(sidebarTitle);

    const sidebarList = document.createElement('ul');
    sidebarItem.appendChild(sidebarList);

    for (const item of items) {
      const sidebarListItem = document.createElement('li');
      sidebarList.appendChild(sidebarListItem);

      const link = document.createElement('a');
      if (item.href) {
        link.href = item.href;
      } else if (item.onClick instanceof Function) {
        link.href = '#';
        link.addEventListener('click', event => {
          event.preventDefault();
          item.onClick(event);
        });
      }
      sidebarListItem.appendChild(link);

      const label = document.createElement('span');
      label.textContent = item.label;
      link.appendChild(label);

      if (item.count !== undefined) {
        const count = document.createElement('span');
        count.classList.add('count');
        count.textContent = item.count;
        link.appendChild(count);
      } else if (item.carrot === true) {
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

  const removeSidebarItem = id => sidebarItems.removeChild(sidebarItems.querySelector(`#${id}`));

  (async function () {
    const { onBaseContainerMutated } = await fakeImport('/src/util/mutations.js');

    const addSidebarToPage = () => {
      const aside = document.querySelector('aside');
      const target = aside.children[1] || null;

      if (aside.querySelector('#xkit-sidebar') === null) {
        aside.insertBefore(sidebarItems, target);
      }

      if (aside.querySelector(':scope > div > aside') !== null) {
        sidebarItems.classList.add('in-channel');
      } else {
        sidebarItems.classList.remove('in-channel');
      }
    };

    onBaseContainerMutated.addListener(addSidebarToPage);
    addSidebarToPage();
  })();

  return { addSidebarItem, removeSidebarItem };
})();
