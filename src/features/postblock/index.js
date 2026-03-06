import { dom } from '../../utils/dom.js';
import { getTimelineItemWrapper, filterPostElements } from '../../utils/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../../utils/modals.js';
import { onNewPosts, pageModifications } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';
import { postPermalinkTimelineFilter, timelineSelector } from '../../utils/timeline_id.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenAttribute = 'data-postblock-hidden';
const warningClass = 'xkit-postblock-warning';
const storageKey = 'postblock.blockedPostRootIDs';
const shortUrlsStorageKey = 'postblock.shortUrls';

let shortUrls = {};

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
    const { id, shortUrl, rebloggedRootId, rebloggedRootUuid } = await timelineObject(postElement);

    const rootID = rebloggedRootId || postID;

    if (blockedPostRootIDs.includes(rootID)) {
      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');

      if (postPermalinkTimelineFilter(postID)(postElement.closest(timelineSelector))) {
        addWarningElement(postElement, rootID);
      }
    } else {
      getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
    }

    if (blockedPostRootIDs.includes(id) && shortUrls[id] !== shortUrl) {
      shortUrls[id] = shortUrl;
      browser.storage.local.set({ [shortUrlsStorageKey]: shortUrls });
    }

    if (rebloggedRootId && blockedPostRootIDs.includes(rebloggedRootId) && shortUrls[rebloggedRootId] === undefined) {
      try {
        const { response: { shortUrl } } = await apiFetch(`/v2/blog/${rebloggedRootUuid}/posts/${rebloggedRootId}`);
        shortUrls[rebloggedRootId] = shortUrl;
      } catch (exception) {
        console.error(exception);
        // don't try to fetch this root post again
        shortUrls[rebloggedRootId] = false;
      }
      browser.storage.local.set({ [shortUrlsStorageKey]: shortUrls });
    }
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
  const { [storageKey]: blockedPostChanges, [shortUrlsStorageKey]: shortUrlsChanges } = changes;

  if (shortUrlsChanges) {
    ({ newValue: shortUrls } = shortUrlsChanges);
  }

  if (blockedPostChanges) {
    ({ newValue: blockedPostRootIDs = [] } = blockedPostChanges);
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey));
  ({ [shortUrlsStorageKey]: shortUrls = {} } = await browser.storage.local.get(shortUrlsStorageKey));

  registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`.${warningClass}`).remove();
};

export const stylesheet = true;
