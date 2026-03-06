import { dom } from '../../utils/dom.js';
import { getTimelineItemWrapper, filterPostElements } from '../../utils/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../../utils/modals.js';
import { onNewPosts, pageModifications } from '../../utils/mutations.js';
import { notify } from '../../utils/notifications.js';
import { timelineObject } from '../../utils/react_props.js';
import { postPermalinkTimelineFilter, timelineSelector } from '../../utils/timeline_id.js';
import { apiFetch, navigate } from '../../utils/tumblr_helpers.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenAttribute = 'data-postblock-hidden';
const warningClass = 'xkit-postblock-warning';
const storageKey = 'postblock.blockedPostRootIDs';
const uuidsStorageKey = 'postblock.uuids';

let uuids = {};

const addWarningElement = (postElement, rootID) => {
  const showButton = dom('button', null, {
    click: ({ currentTarget }) => {
      getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
      currentTarget.disabled = true;
    },
  }, 'show it');

  const unblockButton = dom('button', null, {
    click: () => {
      unblockPost(rootID);
      warningElement.remove();
    },
  }, 'unblock it');

  const warningElement = dom('div', { class: warningClass }, null, [
    'You have blocked this post!',
    dom('br'),
    showButton,
    ' / ',
    unblockButton,
  ]);
  postElement.closest(timelineSelector).before(warningElement);
};

let blockedPostRootIDs = [];

const processPosts = postElements =>
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const postID = postElement.dataset.id;
    const {
      rebloggedRootId,
      rebloggedRootUuid,
      id,
      blog: { uuid },
      rebloggedFromId,
      rebloggedFromUuid,
    } = await timelineObject(postElement);

    const rootID = rebloggedRootId || postID;

    if (blockedPostRootIDs.includes(rootID)) {
      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');

      if (postPermalinkTimelineFilter(rootID)(postElement.closest(timelineSelector))) {
        addWarningElement(postElement, rootID);
      }
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

const onButtonClicked = ({ currentTarget }) => {
  const { id, rebloggedRootId } = currentTarget.__timelineObjectData;
  const rootID = rebloggedRootId || id;

  showModal({
    title: 'Block this post?',
    message: [
      'All instances of this post (including reblogs) will be hidden.',
    ],
    buttons: [
      modalCancelButton,
      dom('button', { class: 'red' }, { click: () => blockPost(rootID) }, ['Block this post']),
    ],
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

export const onStorageChanged = async function (changes) {
  const { [storageKey]: blockedPostChanges, [uuidsStorageKey]: uuidsChanges } = changes;

  if (uuidsChanges) {
    ({ newValue: uuids } = uuidsChanges);
  }

  if (blockedPostChanges) {
    ({ newValue: blockedPostRootIDs = [] } = blockedPostChanges);
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey));
  ({ [uuidsStorageKey]: uuids = {} } = await browser.storage.local.get(uuidsStorageKey));

  registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });
  onNewPosts.addListener(processPosts);

  const blockedPostID = new URLSearchParams(location.search).get('xkit-postblock-open-post-id');
  if (blockedPostID) {
    // remove search param now, so it doesn't persist if after we successfully
    // navigate, the user dismisses peepr and returns to the dashboard
    navigate(location.pathname);

    try {
      const { response: { blog: { name } } } = await apiFetch(`/v2/blog/${uuids[blockedPostID]}/info`);
      navigate(`/@${name}/${blockedPostID}`);
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
