import { onBaseContainerMutated } from './mutations.js';

const toastContainer = Object.assign(document.createElement('div'), { id: 'xkit-toasts' });

const addToastContainerToPage = () => {
  const targetNode = document.body.querySelector('aside') || document.body;
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
