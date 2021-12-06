import { onBaseContainerMutated } from './mutations.js';
import { keyToCss } from './css_map.js';

const toastContainer = Object.assign(document.createElement('div'), { id: 'xkit-toasts' });

const drawerContentSelectorPromise = keyToCss('drawerContent');
const sidebarSelectorPromise = keyToCss('sidebar');

const addToastContainerToPage = async () => {
  const drawerContentSelector = await drawerContentSelectorPromise;
  const sidebarSelector = await sidebarSelectorPromise;

  const targetNode =
    document.body.querySelector(drawerContentSelector) ||
    document.body.querySelector(sidebarSelector) ||
    document.body;

  if (targetNode.contains(toastContainer) === false) {
    toastContainer.dataset.inSidebar = targetNode.matches(sidebarSelector);
    targetNode.append(toastContainer);
  }
};

onBaseContainerMutated.addListener(addToastContainerToPage);
addToastContainerToPage();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param {string} textContent - Text to display to the user as a notification
 */
export const notify = async textContent => {
  const toast = Object.assign(document.createElement('div'), { textContent, className: 'visible' });
  toastContainer.append(toast);
  await sleep(4000);
  toast.classList.remove('visible');
  await sleep(1000);
  toast.remove();
};
