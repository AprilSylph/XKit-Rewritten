const mutedBlogList = document.getElementById('muted-blogs');
const noMutedBlogText = document.getElementById('no-muted-blogs');
const mutedBlogTemplate = document.getElementById('muted-blog');

const storageKey = 'mute.mutedblogs';

const unmuteUser = async function ({ currentTarget }) {
  const { [storageKey]: mutedBlogs = {} } = await browser.storage.local.get(storageKey);
  const { uuid } = currentTarget.closest('li').dataset;

  delete mutedBlogs[uuid];
  browser.storage.local.set({ [storageKey]: mutedBlogs });
};

const updateMode = async function (event) {
  const { [storageKey]: mutedBlogs = {} } = await browser.storage.local.get(storageKey);
  const { uuid, name } = event.target.closest('li').dataset;
  const { value } = event.target;

  mutedBlogs[uuid] = [name, value];
  browser.storage.local.set({ [storageKey]: mutedBlogs });
};

const renderMutedBlogs = async function () {
  const { [storageKey]: mutedblogs = [] } = await browser.storage.local.get(storageKey);

  mutedBlogList.textContent = '';
  noMutedBlogText.style.display = Object.entries(mutedBlogs).length ? 'none' : 'block';

  for (const [uuid, [name, mode]] of Object.entries(mutedblogs)) {
    const templateClone = mutedBlogTemplate.content.cloneNode(true);
    const li = templateClone.querySelector('li');
    const linkElement = templateClone.querySelector('a');
    const modeSelect = templateClone.querySelector('select');
    const unmuteButton = templateClone.querySelector('button');

    li.dataset.uuid = uuid;
    li.dataset.name = name;

    linkElement.textContent = name;
    linkElement.href = `https://www.tumblr.com/blog/view/${uuid}`;

    modeSelect.value = mode;
    modeSelect.addEventListener('change', updateMode);

    unmuteButton.addEventListener('click', unmuteUser);

    mutedBlogList.append(templateClone);
  }
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    renderMutedBlogs();
  }
});

renderMutedBlogs();
