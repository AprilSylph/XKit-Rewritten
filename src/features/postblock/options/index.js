const postsBlockedCount = document.getElementById('posts-blocked-count');
const blockedPostList = document.getElementById('blocked-posts');
const blockedPostTemplate = document.getElementById('blocked-post');

const storageKey = 'postblock.blockedPostRootIDs';
const shortUrlsStorageKey = 'postblock.shortUrls';

const unblockPost = async function ({ currentTarget }) {
  let { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  blockedPostRootIDs = blockedPostRootIDs.filter(id => id !== currentTarget.dataset.postId);
  await browser.storage.local.set({ [storageKey]: blockedPostRootIDs });

  currentTarget.remove();
};

const renderBlockedPosts = async function () {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
  const { [shortUrlsStorageKey]: shortUrls = {} } = await browser.storage.local.get(shortUrlsStorageKey);

  postsBlockedCount.textContent = `${blockedPostRootIDs.length} blocked ${blockedPostRootIDs.length === 1 ? 'post' : 'posts'}`;
  blockedPostList.replaceChildren(...blockedPostRootIDs.map(blockedPostID => {
    const templateClone = blockedPostTemplate.content.cloneNode(true);
    const spanElement = templateClone.querySelector('span');
    const unblockButton = templateClone.querySelector('button');

    spanElement.textContent = blockedPostID;
    unblockButton.dataset.postId = blockedPostID;
    unblockButton.addEventListener('click', unblockPost);

    if (shortUrls[blockedPostID]) {
      const a = document.createElement('a');
      a.href = shortUrls[blockedPostID];
      a.target = '_blank';
      spanElement.replaceWith(a);
      a.append(spanElement);
    }

    return templateClone;
  }));
};

browser.storage.local.onChanged.addListener((changes) => {
  if (Object.keys(changes).includes(storageKey) || Object.keys(changes).includes(shortUrlsStorageKey)) {
    renderBlockedPosts();
  }
});

renderBlockedPosts();
