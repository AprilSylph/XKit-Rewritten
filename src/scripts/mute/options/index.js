const mutedBlogList = document.getElementById('muted-blogs');
const mutedBlogTemplate = document.getElementById('muted-blog');

const blogNamesStorageKey = 'mute.blogNames';
const mutedBlogsEntriesStorageKey = 'mute.mutedBlogEntries';

const getBlogNames = async () => {
  const { [blogNamesStorageKey]: blogNames = {} } = await browser.storage.local.get(blogNamesStorageKey);
  return blogNames;
};
const getMutedBlogs = async () => {
  const { [mutedBlogsEntriesStorageKey]: mutedBlogsEntries } = await browser.storage.local.get(mutedBlogsEntriesStorageKey);
  return Object.fromEntries(mutedBlogsEntries ?? []);
};
const setMutedBlogs = mutedBlogs =>
  browser.storage.local.set({ [mutedBlogsEntriesStorageKey]: Object.entries(mutedBlogs) });

const unmuteUser = async function ({ currentTarget }) {
  const mutedBlogs = await getMutedBlogs();

  const { uuid } = currentTarget.closest('li').dataset;

  delete mutedBlogs[uuid];
  setMutedBlogs(mutedBlogs);
};

const updateMode = async function (event) {
  const mutedBlogs = await getMutedBlogs();

  const { uuid } = event.target.closest('li').dataset;
  const { value } = event.target;

  mutedBlogs[uuid] = value;
  setMutedBlogs(mutedBlogs);
};

const renderMutedBlogs = async function () {
  const mutedBlogs = await getMutedBlogs();
  const blogNames = await getBlogNames();

  mutedBlogList.textContent = '';

  for (const [uuid, mode] of Object.entries(mutedBlogs)) {
    const templateClone = mutedBlogTemplate.content.cloneNode(true);
    const li = templateClone.querySelector('li');
    const linkElement = templateClone.querySelector('a');
    const modeSelect = templateClone.querySelector('select');
    const unmuteButton = templateClone.querySelector('button');

    li.dataset.uuid = uuid;

    linkElement.textContent = blogNames[uuid] ?? uuid;
    linkElement.href = `https://www.tumblr.com/blog/view/${uuid}`;

    modeSelect.value = mode;
    modeSelect.addEventListener('change', updateMode);

    unmuteButton.addEventListener('click', unmuteUser);

    mutedBlogList.append(templateClone);
  }
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (
    areaName === 'local' &&
    (Object.keys(changes).includes(mutedBlogsEntriesStorageKey) ||
      Object.keys(changes).includes(blogNamesStorageKey))
  ) {
    renderMutedBlogs();
  }
});

renderMutedBlogs();
