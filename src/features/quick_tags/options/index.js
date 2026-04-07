import { Sortable } from '../../../lib/sortable.esm.js';

/**
 * @typedef TagBundle
 * @property {string} title The display name of this tag bundle.
 * @property {string} tags  The tags in this tag bundle (comma-separated).
 */

const storageKey = 'quick_tags.preferences.tagBundles';

const bundlesList = document.getElementById('bundles');
const bundleTemplate = document.getElementById('bundle-template');
const editTemplate = document.getElementById('edit-template');

const saveNewBundle = async event => {
  event.preventDefault();
  const { currentTarget } = event;

  if (!currentTarget.reportValidity()) { return; }
  const { title, tags } = currentTarget.elements;

  const tagBundle = {
    title: title.value,
    tags: tags.value,
  };

  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
  tagBundles.push(tagBundle);
  await browser.storage.local.set({ [storageKey]: tagBundles });

  currentTarget.reset();
};

/** @type {(event: PointerEvent) => Promise<void>} */
async function onEditButtonClick ({ currentTarget }) {
  const bundleId = currentTarget.closest('[id]')?.id;
  if (!bundleId) return;

  /** @type {{ "quick_tags.preferences.tagBundles": TagBundle[] }} */
  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

  const index = parseInt(bundleId, 10);
  const tagBundle = tagBundles[index];
  if (!tagBundle) return;

  const editTemplateClone = editTemplate.content.cloneNode(true);

  const editForm = editTemplateClone.getElementById('edit-form');
  const editDialog = editTemplateClone.getElementById('edit-dialog');
  const editCancelButton = editTemplateClone.getElementById('edit-cancel');

  Object.entries(tagBundle).forEach(([key, value]) => {
    const formControlElement = editForm.elements.namedItem(key);
    if (formControlElement) formControlElement.value = value;
  });

  /** @type {(event: SubmitEvent) => Promise<void>} */
  const onEditSubmit = async (event) => {
    event.preventDefault();
    if (!editForm.reportValidity()) return;

    const formData = new FormData(editForm);
    for (const [key, value] of formData.entries()) {
      tagBundle[key] = value;
    }

    await browser.storage.local.set({ [storageKey]: tagBundles });

    editDialog.close();
  };

  editForm.addEventListener('submit', onEditSubmit);
  editDialog.addEventListener('close', () => editDialog.remove());
  editCancelButton.addEventListener('click', () => editDialog.close());

  document.body.append(editDialog);
  editDialog.showModal();
}

const deleteBundle = async ({ currentTarget }) => {
  const { parentNode: { parentNode } } = currentTarget;

  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
  const index = parseInt(parentNode.id, 10);
  tagBundles.splice(index, 1);
  browser.storage.local.set({ [storageKey]: tagBundles });
};

const renderBundles = async function () {
  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

  bundlesList.replaceChildren(...tagBundles.map(({ title, tags }, index) => {
    const bundleTemplateClone = bundleTemplate.content.cloneNode(true);
    bundleTemplateClone.querySelector('.bundle').id = index;

    const bundleLabel = bundleTemplateClone.querySelector('.label');
    bundleLabel.textContent = title;
    bundleLabel.title = bundleLabel.textContent;

    const bundleDescription = bundleTemplateClone.querySelector('.description');
    bundleDescription.textContent = tags.split(',').map(tag => `#${tag.trim()}`).join(' ');
    bundleDescription.title = bundleDescription.textContent;

    bundleTemplateClone.querySelector('.edit').addEventListener('click', onEditButtonClick);
    bundleTemplateClone.querySelector('.delete').addEventListener('click', deleteBundle);

    return bundleTemplateClone;
  }));
};

browser.storage.local.onChanged.addListener((changes) => {
  if (Object.keys(changes).includes(storageKey)) {
    renderBundles();
  }
});

document.getElementById('new-bundle').addEventListener('submit', saveNewBundle);

renderBundles();

Sortable.create(bundlesList, {
  dataIdAttr: 'id',
  handle: '.drag-handle',
  forceFallback: true,
  store: {
    set: async sortable => {
      const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

      const order = sortable.toArray().map(Number);
      const newTagBundles = order.map(i => tagBundles[i]);

      browser.storage.local.set({ [storageKey]: newTagBundles });
    },
  },
});
