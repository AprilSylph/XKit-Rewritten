const postsBlockedCount = document.getElementById('notification-blocked-count');
const blockedPostList = document.getElementById('notification-blocked-posts');
const blockedPostTemplate = document.getElementById('notification-blocked-post');

const storageKey = 'notificationblock.blockedPostTargetIDs';
const toOpenStorageKey = 'notificationblock.toOpen';

const unblockPost = async function ({ currentTarget }) {
  let { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  blockedPostRootIDs = blockedPostRootIDs.filter(id => id !== currentTarget.dataset.postId);
  await browser.storage.local.set({ [storageKey]: blockedPostRootIDs });

  currentTarget.remove();
};

const renderBlocked = async function () {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  postsBlockedCount.textContent = `${blockedPostRootIDs.length} ${blockedPostRootIDs.length === 1 ? 'post' : 'posts'} with blocked notifications`;
  blockedPostList.textContent = '';

  for (const blockedPostID of blockedPostRootIDs) {
    const templateClone = blockedPostTemplate.content.cloneNode(true);
    const anchorElement = templateClone.querySelector('a');
    const spanElement = templateClone.querySelector('span');
    const unblockButton = templateClone.querySelector('button');

    spanElement.textContent = blockedPostID;
    unblockButton.dataset.postId = blockedPostID;
    unblockButton.addEventListener('click', unblockPost);

    anchorElement.addEventListener('click', async () => {
      await browser.storage.local.set({
        [toOpenStorageKey]: { blockedPostID }
      });
      window.open('https://www.tumblr.com/');
    });

    blockedPostList.append(templateClone);
  }
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    renderBlocked();
  }
});

renderBlocked();
