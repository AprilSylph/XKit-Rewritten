import { removeAttribute, removeChildrenByAttribute, removeElementsByAttribute } from '../../utils/cleanup.js';
import { keyToCss } from '../../utils/css_map.js';
import { button } from '../../utils/dom.js';
import { getIcon } from '../../utils/icons.js';
import { buildStyle, displayInlineFlexUnlessDisabledAttr } from '../../utils/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { memoize } from '../../utils/memoize.js';
import { showModal, hideModal, modalCancelButton } from '../../utils/modals.js';
import { onNewNotifications, pageModifications } from '../../utils/mutations.js';
import { noteObject, notificationObject, timelineObject } from '../../utils/react_props.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';
import { userBlogNames } from '../../utils/user.js';

const postsStorageKey = 'notificationblock.blockedPostTargetIDs';
const repliesStorageKey = 'notificationblock.blockedReplyIDs';

const hiddenAttribute = 'data-notificationblock-hidden';

const meatballButtonBlockId = 'notificationblock-block';
const meatballButtonBlockLabel = 'Block notifications';
const meatballButtonUnblockId = 'notificationblock-unblock';
const meatballButtonUnblockLabel = 'Unblock notifications';
const noteButtonAttribute = 'data-xkit-notificationblock-note-button';

let blockedPostTargetIDs = [];
let blockedReplyIDs = {};

// Remove outdated elements when loading module
removeElementsByAttribute(noteButtonAttribute);

export const styleElement = buildStyle(`
[${hiddenAttribute}] {
  display: none;
}
[${noteButtonAttribute}] {
  align-items: center;
  cursor: pointer;
}
[${noteButtonAttribute}="true"] {
  color: rgb(var(--red));
}
[${noteButtonAttribute}] > svg {
  width: 16px;
  height: 16px;
}
`);

const processReplyNotificationUrl = url => {
  const pathname = new URL(url).pathname;
  const inCommunity = pathname.startsWith('/communities/');
  const regex = inCommunity
    ? /^\/communities\/([a-z0-9-]{1,32})\/post\/([0-9]{1,20})\/(?:[^/]+\/)?comments\/([0-9]{1,20})(?:\/|$)/
    : /^\/@?([a-z0-9-]{1,32})\/([0-9]{1,20})\/(?:[^/]+\/)?replies\/([0-9]{1,20})(?:\/|$)/;

  const [, targetTumblelogName, targetPostId, targetReplyId] = regex.exec(pathname);

  return ({ inCommunity, targetTumblelogName, targetPostId, targetReplyId });
};

const getReplyParentId = memoize(async url => {
  const { inCommunity, targetTumblelogName, targetPostId, targetReplyId } = processReplyNotificationUrl(url);

  const { response } = await apiFetch(
    inCommunity
      ? `/v2/communities/${targetTumblelogName}/posts/${targetPostId}/replies/${targetReplyId}/permalink`
      : `/v2/blog/${targetTumblelogName}/post/${targetPostId}/replies/${targetReplyId}/permalink`,
  );

  for (const parent of response.timeline?.elements ?? []) {
    for (const child of parent.children?.elements ?? []) {
      if (child.id === targetReplyId) {
        return child.parentReplyId;
      }
    }
  }
  throw new Error('todo: write error');
});

const isAboutBlockedReply = async notification => {
  if (['reply_to_comment', 'reply_like'].includes(notification.subtype)) {
    const url = notification.actions?.tap?.href;
    if (!url) throw new Error('todo: write error 2');

    const { targetPostId, targetReplyId } = processReplyNotificationUrl(url);

    if (blockedReplyIDs[targetPostId]) {
      const relevantReplyId = notification.subtype === 'reply_to_comment'
        ? await getReplyParentId(url)
        : targetReplyId;

      return blockedReplyIDs[targetPostId].includes(relevantReplyId);
    }
  }
};

const isAboutBlockedPost = notification => {
  const { targetRootPostId, targetPostId } = notification;

  // available on "replied to your post" notifications, which appear to always target the root post
  const blockablePostId = notification.actions?.longTap?.meta?.postId;

  return blockedPostTargetIDs.includes(targetRootPostId || targetPostId || blockablePostId);
};

const processNotifications = notificationElements =>
  notificationElements.forEach(async notificationElement => {
    const notification = await notificationObject(notificationElement);
    if (!notification) throw new Error('todo: write error 3');

    const isBlocked = isAboutBlockedPost(notification) || await isAboutBlockedReply(notification);
    notificationElement.toggleAttribute(hiddenAttribute, !!isBlocked);
  });

const onNoteButtonClicked = ({ postId, noteData }) => {
  const shouldBlockNotifications = !blockedReplyIDs[postId]?.includes(noteData.replyId);

  const title = shouldBlockNotifications
    ? '[XKit] Block this reply\'s notifications?'
    : '[XKit] Unblock this reply\'s notifications?';
  const message = shouldBlockNotifications
    ? ['Notifications for this reply will be hidden from your activity feed.']
    : ['Notifications for this reply will appear in your activity feed again.'];

  const textContent = shouldBlockNotifications
    ? 'Block notifications'
    : 'Unblock notifications';
  const className = shouldBlockNotifications
    ? 'red'
    : 'blue';
  const saveNotificationPreference = shouldBlockNotifications
    ? () => {
        blockedReplyIDs[postId] ??= [];
        blockedReplyIDs[postId].push(noteData.replyId);
        browser.storage.local.set({ [repliesStorageKey]: blockedReplyIDs });
      }
    : () => {
        blockedReplyIDs[postId] = blockedReplyIDs[postId].filter(blockedId => blockedId !== noteData.replyId);
        if (blockedReplyIDs[postId].length === 0) delete blockedReplyIDs[postId];
        browser.storage.local.set({ [repliesStorageKey]: blockedReplyIDs });
      };

  const click = () => {
    hideModal();
    saveNotificationPreference();
  };

  showModal({
    title,
    message,
    buttons: [
      modalCancelButton,
      button({ class: className, click }, [textContent]),
    ],
  });
};

const processNoteReplyButtons = noteReplyButtons => noteReplyButtons.forEach(async noteReplyButton => {
  const noteData = await noteObject(noteReplyButton);
  const timelineObjectData = await timelineObject(noteReplyButton);

  removeChildrenByAttribute(noteReplyButton.parentElement, noteButtonAttribute);

  if (userBlogNames.includes(noteData.blogName)) {
    // The correct post id is for the post a notification would link to. Normally that should be the root post, but in a reblog into a community, it's the reblog, because they have community-specific replies sections.
    const postId = timelineObjectData.community
      ? timelineObjectData.id
      : timelineObjectData.rebloggedRootId || timelineObjectData.id;
    const isBlocked = !!blockedReplyIDs[postId]?.includes(noteData.replyId);

    noteReplyButton.parentElement.append(button({
      [noteButtonAttribute]: isBlocked,
      [displayInlineFlexUnlessDisabledAttr]: '',
      title: isBlocked ? meatballButtonUnblockLabel : meatballButtonBlockLabel,
      click () {
        onNoteButtonClicked({ postId, noteData });
      },
    }, [getIcon('notificationblock')]));
  }
});

const muteNotificationsMessage = [
  '\n\n',
  'Unlike Tumblr\'s option to "Mute notifications", this will not prevent notifications for this post from being created, so they will still increment your unread notification count.',
  '\n\n',
  'You can use "Mute Notifications" in addition to or instead of this feature. ',
  'It will completely prevent the post from generating notifications while it is enabled, and can be applied temporarily or permanently.',
];

/** @param {PointerEvent & { currentTarget: HTMLButtonElement }} event `click` event for the "Block notifications"/"Unblock notifications" menu item */
const onButtonClicked = async function ({ currentTarget }) {
  const { id, rebloggedRootId, blog: { uuid } } = currentTarget.__timelineObjectData;
  const { response: { muted } } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);

  const rootId = rebloggedRootId || id;
  const shouldBlockNotifications = blockedPostTargetIDs.includes(rootId) === false;

  const title = shouldBlockNotifications
    ? '[XKit] Block this post\'s notifications?'
    : '[XKit] Unblock this post\'s notifications?';
  const message = shouldBlockNotifications
    ? [
        'Notifications for this post will be hidden from your activity feed.',
        ...(muted ? [] : muteNotificationsMessage),
      ]
    : ['Notifications for this post will appear in your activity feed again.'];

  const textContent = shouldBlockNotifications
    ? 'Block notifications'
    : 'Unblock notifications';
  const className = shouldBlockNotifications
    ? 'red'
    : 'blue';
  const closeMeatballMenu = () =>
    currentTarget.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
  const saveNotificationPreference = shouldBlockNotifications
    ? () => {
        blockedPostTargetIDs.push(rootId);
        browser.storage.local.set({ [postsStorageKey]: blockedPostTargetIDs });
      }
    : () => {
        blockedPostTargetIDs = blockedPostTargetIDs.filter(blockedId => blockedId !== rootId);
        browser.storage.local.set({ [postsStorageKey]: blockedPostTargetIDs });
      };

  const click = () => {
    hideModal();
    closeMeatballMenu();
    saveNotificationPreference();
  };

  showModal({
    title,
    message,
    buttons: [
      modalCancelButton,
      button({ class: className, click }, [textContent]),
    ],
  });
};

const blockPostFilter = async ({ blogName, rebloggedRootName, rebloggedFromName, id, rebloggedRootId, community, postAuthor }) => {
  const rootId = rebloggedRootId || id;
  const canReceiveActivity = userBlogNames.includes(blogName) ||
    userBlogNames.includes(rebloggedFromName) ||
    userBlogNames.includes(rebloggedRootName) ||
    (community && userBlogNames.includes(postAuthor));

  return canReceiveActivity && blockedPostTargetIDs.includes(rootId) === false;
};

const unblockPostFilter = async ({ id, rebloggedRootId }) => {
  const rootId = rebloggedRootId || id;
  return blockedPostTargetIDs.includes(rootId);
};

export const onStorageChanged = async function (changes) {
  const {
    [postsStorageKey]: blockedPostChanges,
    [repliesStorageKey]: blockedReplyChanges,
  } = changes;

  if (blockedPostChanges) {
    ({ newValue: blockedPostTargetIDs = [] } = blockedPostChanges);
  }
  if (blockedReplyChanges) {
    ({ newValue: blockedReplyIDs = {} } = blockedReplyChanges);
    pageModifications.trigger(processNoteReplyButtons);
  }
  if (blockedPostChanges || blockedReplyChanges) {
    pageModifications.trigger(processNotifications);
  }
};

export const main = async function () {
  ({
    [postsStorageKey]: blockedPostTargetIDs = [],
    [repliesStorageKey]: blockedReplyIDs = {},
  } = await browser.storage.local.get([postsStorageKey, repliesStorageKey]));

  onNewNotifications.addListener(processNotifications);

  registerMeatballItem({ id: meatballButtonBlockId, label: meatballButtonBlockLabel, onclick: onButtonClicked, postFilter: blockPostFilter });
  registerMeatballItem({ id: meatballButtonUnblockId, label: meatballButtonUnblockLabel, onclick: onButtonClicked, postFilter: unblockPostFilter });

  pageModifications.register(`${keyToCss('replyCountButton')}:has(use[href="#managed-icon__ds-reply-outline-16"]):not(${keyToCss('reblog')} *)`, processNoteReplyButtons);
};

export const clean = async function () {
  onNewNotifications.removeListener(processNotifications);
  unregisterMeatballItem(meatballButtonBlockId);
  unregisterMeatballItem(meatballButtonUnblockId);
  pageModifications.unregister(processNoteReplyButtons);

  removeAttribute(hiddenAttribute);
  removeElementsByAttribute(noteButtonAttribute);
};
