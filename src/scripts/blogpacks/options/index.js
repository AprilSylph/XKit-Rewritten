const storageKey = 'blogpacks.preferences.packs';

const packList = document.getElementById('packs');
const packTemplate = document.getElementById('pack-template');

const getLink = (blogs) => 'https://www.tumblr.com/timeline/blogpack?blogs=' + blogs;

const sanitizeString = (str) => {
  str = str.replace(/[^a-z0-9,-]/gim, '');
  return str.trim();
};

const saveNewPack = async event => {
  event.preventDefault();
  const { currentTarget } = event;

  if (!currentTarget.reportValidity()) {
    return;
  }
  const { title, blogs } = currentTarget.elements;

  const blogpack = {
    title: title.value,
    blogs: sanitizeString(blogs.value)
  };

  const { [storageKey]: blogpacks = [] } = await browser.storage.local.get(storageKey);
  blogpacks.push(blogpack);
  await browser.storage.local.set({ [storageKey]: blogpacks });

  currentTarget.reset();
};

const movePack = async ({ currentTarget }) => {
  const { [storageKey]: blogpacks = [] } = await browser.storage.local.get(storageKey);
  const currentIndex = parseInt(currentTarget.closest('[id]').id);
  const targetIndex = currentIndex + (currentTarget.className === 'down' ? 1 : -1);

  [blogpacks[currentIndex], blogpacks[targetIndex]] = [blogpacks[targetIndex], blogpacks[currentIndex]];

  browser.storage.local.set({ [storageKey]: blogpacks });
};

const openBlogpack = async ({ currentTarget }) => {
  const { parentNode: { parentNode } } = currentTarget;

  const { [storageKey]: blogpacks = [] } = await browser.storage.local.get(storageKey);
  const index = parseInt(parentNode.id);
  open(getLink(blogpacks[index].blogs), '_blank', 'noopener noreferrer');
};

const editBlogpack = async ({ currentTarget }) => {
  const { parentNode: { parentNode } } = currentTarget;
  const inputs = [...parentNode.querySelectorAll('input')];

  if (currentTarget.title === 'Edit blog pack') {
    currentTarget.title = 'Save blog pack';
    currentTarget.firstElementChild.className = 'ri-save-3-fill';
    inputs.forEach(input => {
      input.disabled = false;
    });
  } else {
    if (inputs.some(input => input.reportValidity() === false)) {
      return;
    }
    currentTarget.title = 'Edit blog pack';
    currentTarget.firstElementChild.className = 'ri-pencil-line';

    const { [storageKey]: blogpacks = [] } = await browser.storage.local.get(storageKey);
    const index = parseInt(parentNode.id);
    const blogpack = blogpacks[index];

    for (const input of inputs) {
      input.disabled = true;
      blogpack[input.className] = input.className === 'blogs' ? sanitizeString(input.value) : input.value;
    }

    browser.storage.local.set({ [storageKey]: blogpacks });
  }
};

const deletePack = async ({ currentTarget }) => {
  const { parentNode: { parentNode } } = currentTarget;

  const { [storageKey]: blogpacks = [] } = await browser.storage.local.get(storageKey);
  const index = parseInt(parentNode.id);
  blogpacks.splice(index, 1);
  browser.storage.local.set({ [storageKey]: blogpacks });
};

const renderPacks = async function () {
  const { [storageKey]: blogpacks = [] } = await browser.storage.local.get(storageKey);

  packList.append(...blogpacks.map(({ title, blogs }, index) => {
    const packTemplateClone = packTemplate.content.cloneNode(true);

    packTemplateClone.querySelector('.pack').id = index;

    packTemplateClone.querySelector('.up').disabled = index === 0;
    packTemplateClone.querySelector('.up').addEventListener('click', movePack);
    packTemplateClone.querySelector('.down').disabled = index === (blogpacks.length - 1);
    packTemplateClone.querySelector('.down').addEventListener('click', movePack);

    packTemplateClone.querySelector('.title').value = title;
    packTemplateClone.querySelector('.blogs').value = blogs;

    packTemplateClone.querySelector('.open').addEventListener('click', openBlogpack);
    packTemplateClone.querySelector('.edit').addEventListener('click', editBlogpack);
    packTemplateClone.querySelector('.delete').addEventListener('click', deletePack);

    return packTemplateClone;
  }));
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    packList.textContent = '';
    renderPacks();
  }
});

document.getElementById('new-pack').addEventListener('submit', saveNewPack);

renderPacks();
