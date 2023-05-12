
const postsBlockedCount = document.getElementById('notification-blocked-count');
const blockedPostList = document.getElementById('notification-blocked-posts');
const blockedPostTemplate = document.getElementById('notification-blocked-post');

const storageKey = 'notificationblock.blockedPostTargetIDs';
const namesStorageKey = 'notificationblock.names';
const toOpenStorageKey = 'notificationblock.toOpen';

const unblockPost = async function ({ currentTarget }) {
  let { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  blockedPostRootIDs = blockedPostRootIDs.filter(id => id !== currentTarget.dataset.postId);
  await browser.storage.local.set({ [storageKey]: blockedPostRootIDs });

  currentTarget.remove();
};

const renderBlocked = async function () {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
  const { [namesStorageKey]: names = {} } = await browser.storage.local.get(namesStorageKey);

  postsBlockedCount.textContent = `${blockedPostRootIDs.length} ${blockedPostRootIDs.length === 1 ? 'post' : 'posts'} with blocked notifications`;
  blockedPostList.textContent = '';

  for (const blockedPostID of blockedPostRootIDs) {
    const templateClone = blockedPostTemplate.content.cloneNode(true);
    const spanElement = templateClone.querySelector('span');
    const unblockButton = templateClone.querySelector('button');

    spanElement.textContent = blockedPostID;
    unblockButton.dataset.postId = blockedPostID;
    unblockButton.addEventListener('click', unblockPost);

    if (names[blockedPostID]) {
      const a = document.createElement('a');
      a.href = 'javascript:void(0);';
      a.addEventListener('click', async () => {
        await browser.storage.local.set({
          [toOpenStorageKey]: { name: names[blockedPostID], blockedPostID }
        });
        window.open('https://www.tumblr.com/');
      });
      spanElement.replaceWith(a);
      spanElement.textContent = `${names[blockedPostID]}/${blockedPostID}`;
      a.append(spanElement);
    }

    blockedPostList.append(templateClone);
  }
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (
    areaName === 'local' &&
    (Object.keys(changes).includes(storageKey) || Object.keys(changes).includes(namesStorageKey))
  ) {
    renderBlocked();
  }
});

renderBlocked();
