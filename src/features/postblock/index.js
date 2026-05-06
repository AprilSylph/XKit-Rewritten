import { dom } from '../../utils/dom.js';
import { getTimelineItemWrapper, filterPostElements } from '../../utils/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../../utils/modals.js';
import { onNewPosts, pageModifications } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';
import { postPermalinkTimelineFilter, timelineSelector } from '../../utils/timeline_id.js';
import { navigate } from '../../utils/tumblr_helpers.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenAttribute = 'data-postblock-hidden';
const controlsClass = 'xkit-postblock-hidden-post-controls';
const controlledHiddenAttribute = 'data-xkit-postblock-hidden-controlled';
const storageKey = 'postblock.blockedPostRootIDs';
const blogUuidsStorageKey = 'postblock.blockedPostBlogUUIDs';

let blogUuids = {};

const addPermalinkPageControls = timelineElement => {
  const controlsElement = dom('div', { class: controlsClass }, null, [
    'You have hidden this post with PostBlock!',
    dom('br'),
    dom('button', null, { click: () => controlsElement.remove() }, 'show post anyway'),
  ]);
  timelineElement.prepend(controlsElement);
};

let blockedPostRootIDs = [];

const saveUuidPair = (postId, blogUuid) => {
  if (blockedPostRootIDs.includes(postId) && !blogUuids[postId]) {
    blogUuids[postId] = blogUuid;
    browser.storage.local.set({ [blogUuidsStorageKey]: blogUuids });
  }
};

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
      const timelineElement = postElement.closest(timelineSelector);
      if (postPermalinkTimelineFilter(postID)(timelineElement)) {
        getTimelineItemWrapper(postElement).setAttribute(controlledHiddenAttribute, '');
        addPermalinkPageControls(timelineElement);
      } else {
        getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
      }
    } else {
      getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
    }

    saveUuidPair(id, uuid);
    saveUuidPair(rebloggedFromId, rebloggedFromUuid);
    saveUuidPair(rebloggedRootId, rebloggedRootUuid);
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

export const onStorageChanged = async function (changes) {
  const { [storageKey]: blockedPostChanges, [blogUuidsStorageKey]: blogUuidsChanges } = changes;

  if (blogUuidsChanges) {
    ({ newValue: blogUuids } = blogUuidsChanges);
  }

  if (blockedPostChanges) {
    ({ newValue: blockedPostRootIDs = [] } = blockedPostChanges);
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey));
  ({ [blogUuidsStorageKey]: blogUuids = {} } = await browser.storage.local.get(blogUuidsStorageKey));

  registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });
  onNewPosts.addListener(processPosts);

  const blockedPostID = location.hash.match(/(?<=^#postblock:)\d{1,20}$/)?.[0];

  if (blockedPostID) {
    navigate(`./${blockedPostID}`);
  }
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`.${controlsClass}`).remove();
};

export const stylesheet = true;
