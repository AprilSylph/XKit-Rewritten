import { onBaseContainerMutated } from './mutations.js';
import { keyToCss } from './css_map.js';

const toastContainer = Object.assign(document.createElement('div'), { id: 'xkit-toasts' });
const peeprSelectorPromise = keyToCss('peepr');

const addToastContainerToPage = async () => {
  const peeprSelector = await peeprSelectorPromise;
  const targetNode = document.body.querySelector(peeprSelector) || document.body.querySelector('aside') || document.body;
  if (targetNode.contains(toastContainer) === false) {
    targetNode.appendChild(toastContainer);
  }
};

onBaseContainerMutated.addListener(addToastContainerToPage);
addToastContainerToPage();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const notify = async textContent => {
  const toast = Object.assign(document.createElement('div'), { textContent, className: 'visible' });
  toastContainer.appendChild(toast);
  await sleep(4000);
  toast.classList.remove('visible');
  await sleep(1000);
  toastContainer.removeChild(toast);
};
