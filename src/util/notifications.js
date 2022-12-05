import { keyToCss } from './css_map.js';
import { dom } from './dom.js';

const toastContainer = dom('div', { id: 'xkit-toasts' });

const drawerContentSelectorPromise = keyToCss('drawerContent');
const sidebarSelectorPromise = keyToCss('sidebar');

export const addToastContainerToPage = async () => {
  const drawerContentSelector = await drawerContentSelectorPromise;
  const sidebarSelector = await sidebarSelectorPromise;

  const targetNode = [
    document.body.querySelector(`${drawerContentSelector} ${sidebarSelector}`),
    document.body.querySelector(drawerContentSelector),
    document.body.querySelector(sidebarSelector),
    document.body
  ].find(candidateNode => candidateNode !== null && getComputedStyle(candidateNode).display !== 'none');

  if ([...targetNode.children].includes(toastContainer) === false) {
    toastContainer.dataset.inSidebar = targetNode.matches(sidebarSelector);
    targetNode.append(toastContainer);
  }

  return toastContainer;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param {string} textContent - Text to display to the user as a notification
 */
export const notify = async textContent => {
  await addToastContainerToPage();

  const toast = dom('div', { class: 'visible' }, null, [textContent]);
  toastContainer.append(toast);

  await sleep(4000);
  toast.classList.remove('visible');

  await sleep(1000);
  toast.remove();
};
