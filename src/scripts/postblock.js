import { getTimelineItemWrapper, filterPostElements } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { dom } from '../util/dom.js';
import { apiFetch, navigate } from '../util/tumblr_helpers.js';
import { notify } from '../util/notifications.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenAttribute = 'data-postblock-hidden';
const warningClass = 'xkit-postblock-warning';
const storageKey = 'postblock.blockedPostRootIDs';
const uuidsStorageKey = 'postblock.uuids';
const toOpenStorageKey = 'postblock.toOpen';

let uuids = {};

const addWarningElement = (postElement, rootID) => {
  const showButton = dom('button', null, {
    click: ({ currentTarget }) => {
      getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
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
      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');

      const { timeline } = postElement.closest('[data-timeline]').dataset;
      timeline.includes(`posts/${rootID}/permalink`) && addWarningElement(postElement, rootID);
    } else {
      getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
    }

    const saveUuidPair = (id, uuid) => {
      if (blockedPostRootIDs.includes(id) && !uuids[id]) {
        uuids[id] = uuid;
        browser.storage.local.set({ [uuidsStorageKey]: uuids });
      }
    };

    saveUuidPair(rebloggedRootId, rebloggedRootUuid);
    saveUuidPair(id, uuid);
    saveUuidPair(rebloggedFromId, rebloggedFromUuid);
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

  const { [toOpenStorageKey]: toOpen } = await browser.storage.local.get(toOpenStorageKey);
  if (toOpen) {
    browser.storage.local.remove(toOpenStorageKey);

    try {
      const { uuid, blockedPostID } = toOpen;
      const { response: { blog: { name } } } = await apiFetch(`/v2/blog/${uuid}/info`);
      navigate(`/${name}/${blockedPostID}`);
    } catch (e) {
      notify('Failed to open blocked post!');
    }
  }
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`.${warningClass}`).remove();
};

export const stylesheet = true;
