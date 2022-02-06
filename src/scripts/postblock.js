import { filterPostElements } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObjectMemoized } from '../util/react_props.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenClass = 'xkit-postblock-hidden';
const storageKey = 'postblock.blockedPostRootIDs';

const processPosts = async function (postElements) {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
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

const onButtonClicked = async function ({ currentTarget }) {
  const postElement = currentTarget.closest('[data-id]');
  const postID = postElement.dataset.id;

  const { rebloggedRootId } = await timelineObjectMemoized(postID);
  const rootID = rebloggedRootId || postID;

  showModal({
    title: 'Block this post?',
    message: [
      'All instances of this post (including reblogs) will be hidden.'
    ],
    buttons: [
      modalCancelButton,
      Object.assign(document.createElement('button'), {
        textContent: 'Block this post',
        className: 'red',
        onclick: () => blockPost(rootID)
      })
    ]
  });
};

const blockPost = async rootID => {
  hideModal();
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
  blockedPostRootIDs.push(rootID);
  browser.storage.local.set({ [storageKey]: blockedPostRootIDs });
};

export const onStorageChanged = async function (changes, areaName) {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`.${hiddenClass}`).removeClass(hiddenClass);
};

export const stylesheet = true;
