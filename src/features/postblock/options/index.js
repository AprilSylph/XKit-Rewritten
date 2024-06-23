const postsBlockedCount = document.getElementById('posts-blocked-count');
const blockedPostList = document.getElementById('blocked-posts');
const blockedPostTemplate = document.getElementById('blocked-post');

const storageKey = 'postblock.blockedPostRootIDs';

const unblockPost = async ({ currentTarget }) => {
  let { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  blockedPostRootIDs = blockedPostRootIDs.filter(id => id !== currentTarget.dataset.postId);
  await browser.storage.local.set({ [storageKey]: blockedPostRootIDs });

  currentTarget.remove();
};

const renderBlockedPosts = async () => {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  postsBlockedCount.textContent = `${blockedPostRootIDs.length} blocked ${blockedPostRootIDs.length === 1 ? 'post' : 'posts'}`;
  blockedPostList.textContent = '';

  for (const blockedPostID of blockedPostRootIDs) {
    const templateClone = blockedPostTemplate.content.cloneNode(true);
    const spanElement = templateClone.querySelector('span');
    const unblockButton = templateClone.querySelector('button');

    spanElement.textContent = blockedPostID;
    unblockButton.dataset.postId = blockedPostID;
    unblockButton.addEventListener('click', unblockPost);

    blockedPostList.append(templateClone);
  }
};

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    renderBlockedPosts();
  }
});

renderBlockedPosts();
