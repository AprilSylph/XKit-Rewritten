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

  for (const tagBundle of tagBundles) {
    const bundleTemplateClone = bundleTemplate.content.cloneNode(true);

    bundleTemplateClone.querySelector('.bundle').id = tagBundles.indexOf(tagBundle);

    bundleTemplateClone.querySelector('.title').value = tagBundle.title;
    bundleTemplateClone.querySelector('.tags').value = tagBundle.tags;

    bundleTemplateClone.querySelector('.edit').addEventListener('click', editTagBundle);
    bundleTemplateClone.querySelector('.delete').addEventListener('click', deleteBundle);

    bundlesList.appendChild(bundleTemplateClone);
  }
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    bundlesList.textContent = '';
    renderBundles();
  }
});

document.getElementById('new-bundle').addEventListener('submit', saveNewBundle);

renderBundles();
