import { Sortable } from '../../../lib/sortable.esm.js';

const storageKey = 'quick_tags.preferences.tagBundles';

const bundlesList = document.getElementById('bundles');
const bundleTemplate = document.getElementById('bundle-template');

const saveNewBundle = async event => {
  event.preventDefault();
  const { currentTarget } = event;

  if (!currentTarget.reportValidity()) { return; }
  const { title, tags } = currentTarget.elements;

  const tagBundle = {
    title: title.value,
    tags: tags.value
  };

  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
  tagBundles.push(tagBundle);
  await browser.storage.local.set({ [storageKey]: tagBundles });

  currentTarget.reset();
};

const moveBundle = async ({ currentTarget }) => {
  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
  const currentIndex = parseInt(currentTarget.closest('[id]').id);
  const targetIndex = currentIndex + (currentTarget.className === 'down' ? 1 : -1);

  [tagBundles[currentIndex], tagBundles[targetIndex]] = [tagBundles[targetIndex], tagBundles[currentIndex]];

  browser.storage.local.set({ [storageKey]: tagBundles });
};

Sortable.create(bundlesList, {
  dataIdAttr: 'id',
  handle: '.drag-handle',
  store: {
    set: async sortable => {
      const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

      const order = sortable.toArray().map(Number);
      const newTagBundles = order.map(i => tagBundles[i]);

      browser.storage.local.set({ [storageKey]: newTagBundles });
    }
  }
});

const editTagBundle = async ({ currentTarget }) => {
  const { parentNode: { parentNode } } = currentTarget;
  const inputs = [...parentNode.querySelectorAll('input')];

  if (currentTarget.title === 'Edit tag bundle') {
    currentTarget.title = 'Save tag bundle';
    currentTarget.firstElementChild.className = 'ri-save-3-fill';
    inputs.forEach(input => { input.disabled = false; });
  } else {
    if (inputs.some(input => input.reportValidity() === false)) { return; }
    currentTarget.title = 'Edit tag bundle';
    currentTarget.firstElementChild.className = 'ri-pencil-line';

    const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
    const index = parseInt(parentNode.id);
    const tagBundle = tagBundles[index];

    for (const input of inputs) {
      input.disabled = true;
      tagBundle[input.className] = input.value;
    }

    browser.storage.local.set({ [storageKey]: tagBundles });
  }
};

const deleteBundle = async ({ currentTarget }) => {
  const { parentNode: { parentNode } } = currentTarget;

  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
  const index = parseInt(parentNode.id);
  tagBundles.splice(index, 1);
  browser.storage.local.set({ [storageKey]: tagBundles });
};

const renderBundles = async function () {
  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

  bundlesList.append(...tagBundles.map(({ title, tags }, index) => {
    const bundleTemplateClone = bundleTemplate.content.cloneNode(true);

    bundleTemplateClone.querySelector('.bundle').id = index;

    bundleTemplateClone.querySelector('.up').disabled = index === 0;
    bundleTemplateClone.querySelector('.up').addEventListener('click', moveBundle);
    bundleTemplateClone.querySelector('.down').disabled = index === (tagBundles.length - 1);
    bundleTemplateClone.querySelector('.down').addEventListener('click', moveBundle);

    bundleTemplateClone.querySelector('.title').value = title;
    bundleTemplateClone.querySelector('.tags').value = tags;

    bundleTemplateClone.querySelector('.edit').addEventListener('click', editTagBundle);
    bundleTemplateClone.querySelector('.delete').addEventListener('click', deleteBundle);

    return bundleTemplateClone;
  }));
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    bundlesList.textContent = '';
    renderBundles();
  }
});

document.getElementById('new-bundle').addEventListener('submit', saveNewBundle);

renderBundles();
