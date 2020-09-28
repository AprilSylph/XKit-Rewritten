(function () {
  const createSidebarItem = function ({ id, title, items }) {
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
      link.href = item.href || '#';
      sidebarListItem.appendChild(link);

      const label = document.createElement('span');
      label.textContent = item.label;
      link.appendChild(label);

      if (item.count !== undefined) {
        const count = document.createElement('span');
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

    return sidebarItem;
  };

  return { createSidebarItem };
})();
