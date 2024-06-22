import { getTimelineItemWrapper, filterPostElements } from '../utils/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../utils/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../utils/modals.js';
import { timelineObject } from '../utils/react_props.js';
import { onNewPosts, pageModifications } from '../utils/mutations.js';
import { dom } from '../utils/dom.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenAttribute = 'data-postblock-hidden';
const storageKey = 'postblock.blockedPostRootIDs';

let blockedPostRootIDs = [];

const processPosts = async function (postElements) {
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const postID = postElement.dataset.id;
    const { rebloggedRootId } = await timelineObject(postElement);

    const rootID = rebloggedRootId || postID;

    if (blockedPostRootIDs.includes(rootID)) {
      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
    } else {
      getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
    }
  });
};

const onButtonClicked = async function ({ currentTarget }) {
  const { id, rebloggedRootId } = currentTarget.__timelineObjectData;
  const rootID = rebloggedRootId || id;

  showModal({
    title: 'Block this post?',
    message: [
      'All instances of this post (including reblogs) will be hidden.'
    ],
    buttons: [
      modalCancelButton,
      dom('button', { class: 'red' }, { click: () => blockPost(rootID) }, ['Block this post'])
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
  if (Object.keys(changes).includes(storageKey)) {
    ({ newValue: blockedPostRootIDs = [] } = changes[storageKey]);
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey));

  registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};

export const stylesheet = true;
