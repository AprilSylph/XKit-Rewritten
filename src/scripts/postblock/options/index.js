const postsBlockedCount = document.getElementById('posts-blocked-count');
const unblockLastPostButton = document.getElementById('unblock-last-post');

const storageKey = 'postblock.blockedPostRootIDs';

const updatePostsBlockedCount = async function () {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
  postsBlockedCount.textContent = `${blockedPostRootIDs.length} blocked posts`;
};

const unblockLastPost = async function () {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
  blockedPostRootIDs.pop();
  browser.storage.local.set({ [storageKey]: blockedPostRootIDs });
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    updatePostsBlockedCount();
  }
});

unblockLastPostButton.addEventListener('click', unblockLastPost);

updatePostsBlockedCount();
