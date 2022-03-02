import { keyToCss } from './css_map.js';
import { buildSvg } from './remixicon.js';

const toastContainer = Object.assign(document.createElement('div'), { id: 'xkit-toasts' });

const drawerContentSelectorPromise = keyToCss('drawerContent');
const sidebarSelectorPromise = keyToCss('sidebar');

const addToastContainerToPage = async () => {
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
};

const createDismissButton = () => {
  const button = Object.assign(document.createElement('button'), {
    onclick: ({ currentTarget }) => currentTarget.parentElement.remove()
  });
  const svg = buildSvg('ri-close-fill');
  button.appendChild(svg);
  return button;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param {string} textContent - Text to display to the user as a notification
 * @param {boolean} persistent - Whether to persist the notification until the user closes it
 */
export const notify = async (textContent, persistent = false) => {
  await addToastContainerToPage();

  const toast = Object.assign(document.createElement('div'), { className: 'visible' });
  const text = Object.assign(document.createElement('div'), { textContent });
  toast.append(text);
  toastContainer.append(toast);

  if (persistent) {
    toast.append(createDismissButton());
    return;
  }

  await sleep(4000);
  toast.classList.remove('visible');

  await sleep(1000);
  toast.remove();
};
