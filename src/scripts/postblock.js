import { getPostElements, registerMeatballItem, unregisterMeatballItem } from '../util/interface.js';
import { timelineObjectMemoized } from '../util/react_props.js';
import { onNewPosts } from '../util/mutations.js';

const meatballButtonLabel = 'Block this post';
const excludeClass = 'xkit-postblock-done';
const hiddenClass = 'xkit-postblock-hidden';
const storageKey = 'postblock.blockedPostRootIDs';

const processPosts = async function () {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  getPostElements({ excludeClass, includeFiltered: true }).forEach(async postElement => {
    const postID = postElement.dataset.id;
    const { rebloggedRootId } = await timelineObjectMemoized(postID);

    const rootID = rebloggedRootId || postID;

    if (blockedPostRootIDs.includes(rootID)) {
      postElement.classList.add(hiddenClass);
    } else {
      postElement.classList.remove(hiddenClass);
    }
  });
};

const onButtonClicked = async function ({ target }) {
  const postElement = target.closest('[data-id]');
  const postID = postElement.dataset.id;

  const { rebloggedRootId } = await timelineObjectMemoized(postID);
  const rootID = rebloggedRootId || postID;

  if (window.confirm('Block this post? All instances of this post (including reblogs) will be hidden.')) {
    const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
    blockedPostRootIDs.push(rootID);
    browser.storage.local.set({ [storageKey]: blockedPostRootIDs });

    postElement.classList.add(hiddenClass);
  }
};

const onStorageChanged = async function (changes, areaName) {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    $(`.${excludeClass}`).removeClass(excludeClass);
    processPosts();
  }
};

export const main = async function () {
  browser.storage.onChanged.addListener(onStorageChanged);

  registerMeatballItem(meatballButtonLabel, onButtonClicked);

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  browser.storage.onChanged.removeListener(onStorageChanged);

  unregisterMeatballItem(meatballButtonLabel);
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};

export const stylesheet = true;
