import { filterPostElements } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { dom } from '../util/dom.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenClass = 'xkit-postblock-hidden';
const warningClass = 'xkit-postblock-warning';
const storageKey = 'postblock.blockedPostRootIDs';
const uuidsStorageKey = 'postblock.uuids';

let uuids = {};

const saveUuid = (id, uuid, blockedPostRootIDs) => {
  if (blockedPostRootIDs.includes(id) && !uuids[id]) {
    uuids[id] = uuid;
    browser.storage.local.set({ [uuidsStorageKey]: uuids });
  }
};

const addWarningElement = (postElement, rootID) => {
  const { timeline } = postElement.closest('[data-timeline]').dataset;

  if (timeline.includes(`posts/${rootID}/permalink`)) {
    const showButton = dom('button', null, {
      click: ({ currentTarget }) => {
        postElement.classList.remove(hiddenClass);
        currentTarget.disabled = true;
      }
    }, 'show it');

    const unblockButton = dom('button', null, {
      click: () => {
        unblockPost(rootID);
        warningElement.remove();
      }
    }, 'unblock it');

    const warningElement = dom('div', { class: warningClass }, null, [
      'You have blocked this post!',
      dom('br'),
      showButton,
      ' / ',
      unblockButton
    ]);
    postElement.before(warningElement);
  }
};

const processPosts = async function (postElements) {
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const postID = postElement.dataset.id;
    const {
      rebloggedRootId,
      rebloggedRootUuid,
      id,
      blog: { uuid },
      rebloggedFromId,
      rebloggedFromUuid
    } = await timelineObject(postElement);

    const rootID = rebloggedRootId || postID;

    if (blockedPostRootIDs.includes(rootID)) {
      postElement.classList.add(hiddenClass);
      addWarningElement(postElement, rootID);
    } else {
      postElement.classList.remove(hiddenClass);
    }

    saveUuid(rebloggedRootId, rebloggedRootUuid, blockedPostRootIDs);
    saveUuid(id, uuid, blockedPostRootIDs);
    saveUuid(rebloggedFromId, rebloggedFromUuid, blockedPostRootIDs);
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

const unblockPost = async rootID => {
  let { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
  blockedPostRootIDs = blockedPostRootIDs.filter(id => id !== rootID);
  browser.storage.local.set({ [storageKey]: blockedPostRootIDs });
};

export const onStorageChanged = async function (changes, areaName) {
  const { [storageKey]: blockedPostChanges, [uuidsStorageKey]: uuidsChanges } = changes;

  if (uuidsChanges) {
    ({ newValue: uuids } = uuidsChanges);
  }

  if (blockedPostChanges) {
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ [uuidsStorageKey]: uuids = {} } = await browser.storage.local.get(uuidsStorageKey));

  registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $(`.${warningClass}`).remove();
};

export const stylesheet = true;
