import { pageModifications } from '../../util/mutations.js';

const processModals = modals =>
  modals.forEach(modal => {
    modal.parentElement.style.display = 'none';
  });

export const main = async function () {
  pageModifications.register('#after-post-actions', processModals);
};

export const clean = async function () {
  pageModifications.unregister(processModals);
};
