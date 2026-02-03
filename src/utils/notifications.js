import { keyToCss } from './css_map.js';
import { div } from './dom.js';

const toastContainerId = 'xkit-toasts';
const toastContainer = div({ id: toastContainerId });

const desktopLayoutSelector = keyToCss('desktopLayout');
const drawerContentSelector = keyToCss('drawerContent');
const sidebarSelector = keyToCss('sidebar', 'layoutSidebar');

const addToastContainerToPage = () => {
  const targetNode = [
    document.body.querySelector(`${drawerContentSelector} ${sidebarSelector}`),
    document.body.querySelector(drawerContentSelector),
    document.body.querySelector(`${desktopLayoutSelector} ${sidebarSelector}`),
    document.body,
  ].find(candidateNode => candidateNode !== null && getComputedStyle(candidateNode).display !== 'none');

  if (targetNode.children.namedItem(toastContainerId) === null) {
    const targetNodeIsSidebar = targetNode.matches(sidebarSelector);
    toastContainer.dataset.inSidebar = targetNodeIsSidebar;
    toastContainer.style.width = targetNodeIsSidebar ? `${targetNode.clientWidth}px` : '';

    targetNode.append(toastContainer);
  }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param {string} textContent Text to display to the user as a notification
 */
export const notify = async textContent => {
  addToastContainerToPage();

  const toast = div({ class: 'visible' }, [textContent]);
  toastContainer.append(toast);

  await sleep(4000);
  toast.classList.remove('visible');

  await sleep(1000);
  toast.remove();
};
