import { keyToCss } from '../utils/css_map.js';
import { dom } from '../utils/dom.js';
import { inject } from '../utils/inject.js';
import { showErrorModal } from '../utils/modals.js';
import { notificationSelector } from '../utils/interface.js';
import { pageModifications } from '../utils/mutations.js';
import { notify } from '../utils/notifications.js';
import { getPreferences } from '../utils/preferences.js';
import { buildSvg } from '../utils/remixicon.js';
import { apiFetch, navigate } from '../utils/tumblr_helpers.js';
import { userBlogNames, userBlogs } from '../utils/user.js';
import { registerReplyMeatballItem, unregisterReplyMeatballItem } from '../utils/meatballs.js';
import { timelineObject } from '../utils/react_props.js';

const storageKey = 'quote_replies.draftLocation';
const buttonClass = 'xkit-quote-replies';
const meatballButtonId = 'quote_replies';
const dropdownButtonClass = 'xkit-quote-replies-dropdown';

const originalPostTagStorageKey = 'quick_tags.preferences.originalPostTag';

const activitySelector = `${keyToCss('notification')} > ${keyToCss('activity')}`;

const dropdownSelector = '[role="tabpanel"] *';

let originalPostTag;
let tagReplyingBlog;
let newTab;

const processNotifications = notifications => notifications.forEach(async notification => {
  const { notification: notificationProps, tumblelogName } = await inject(
    '/main_world/get_notification_props.js',
    [],
    notification
  );

  if (!['reply', 'reply_to_comment', 'note_mention'].includes(notificationProps.type)) return;
  if (notificationProps.community) return;

  const activityElement = notification.querySelector(activitySelector);
  if (!activityElement) return;

  activityElement.after(dom(
    'button',
    {
      class: `${buttonClass} ${notification.matches(dropdownSelector) ? dropdownButtonClass : ''}`,
      title: 'Quote this reply'
    },
    {
      click () {
        this.disabled = true;
        quoteReply(tumblelogName, notificationProps)
          .catch(showErrorModal)
          .finally(() => { this.disabled = false; });
      }
    },
    [buildSvg('ri-chat-quote-line')]
  ));
});

const quoteReply = async (tumblelogName, notificationProps) => {
  const uuid = userBlogs.find(({ name }) => name === tumblelogName).uuid;
  const { type, targetPostId, targetPostSummary, postUrl, targetTumblelogUuid, timestamp } = notificationProps;

  const { response } = await apiFetch(
    `/v2/blog/${targetTumblelogUuid}/post/${targetPostId}/notes/timeline`,
    { queryParams: { mode: 'replies', before_timestamp: `${timestamp + 1}000000` } }
  );

  const reply = response?.timeline?.elements?.[0];

  if (!reply) throw new Error('No replies found on target post.');
  if (Math.floor(reply.timestamp) !== timestamp) throw new Error('Reply not found.');

  const replyingBlogName = reply.blog.name;
  const replyingBlogUuid = reply.blog.uuid;

  openQuoteReplyPost({ type, replyingBlogName, replyingBlogUuid, reply, postSummary: targetPostSummary, postUrl, targetBlogUuid: uuid, targetBlogName: tumblelogName });
};

const openQuoteReplyPost = async ({ type, replyingBlogName, replyingBlogUuid, postSummary, postUrl, reply, targetBlogUuid, targetBlogName }) => {
  const verbiage = {
    reply: 'replied to your post',
    reply_to_comment: 'replied to you in a post',
    note_mention: 'mentioned you on a post'
  }[type];
  const text = `@${replyingBlogName} ${verbiage} \u201C${postSummary.replace(/\n/g, ' ')}\u201D:`;
  const formatting = [
    { start: 0, end: replyingBlogName.length + 1, type: 'mention', blog: { uuid: replyingBlogUuid } },
    { start: text.indexOf('\u201C'), end: text.length - 1, type: 'link', url: postUrl }
  ];

  const content = [
    { type: 'text', text, formatting },
    Object.assign(reply.content[0], { subtype: 'indented' }),
    { type: 'text', text: '\u200B' }
  ];
  const tags = [
    ...originalPostTag ? [originalPostTag] : [],
    ...tagReplyingBlog ? [replyingBlogName] : []
  ].join(',');

  const { response: { id: responseId, displayText } } = await apiFetch(`/v2/blog/${targetBlogUuid}/posts`, { method: 'POST', body: { content, state: 'draft', tags } });

  const currentDraftLocation = `/edit/${targetBlogName}/${responseId}`;

  if (newTab) {
    await browser.storage.local.set({ [storageKey]: currentDraftLocation });

    const openedTab = window.open(`/blog/${targetBlogName}/drafts`);
    if (openedTab === null) {
      browser.storage.local.remove(storageKey);
      notify(displayText);
    }
  } else {
    navigate(currentDraftLocation);
  }
};

const processNoteProps = ([noteProps, parentNoteProps]) => {
  if (userBlogNames.includes(noteProps.note.blogName) || noteProps.communityId) {
    return false;
  }
  if (parentNoteProps && userBlogNames.includes(parentNoteProps.note.blogName)) {
    return {
      type: 'reply_to_comment',
      targetBlogName: parentNoteProps.note.blogName
    };
  }
  if (userBlogNames.includes(noteProps.blog.name)) {
    return {
      type: 'reply',
      targetBlogName: noteProps.blog.name
    };
  }
  for (const { formatting } of noteProps.note.content) {
    for (const { type, blog } of formatting ?? []) {
      if (type === 'mention' && userBlogNames.includes(blog.name)) {
        return {
          type: 'note_mention',
          targetBlogName: blog.name
        };
      }
    }
  }
  return false;
};

const meatballButtonLabel = notePropsObjects => {
  const mode = processNoteProps(notePropsObjects);

  return `Quote this reply (mode: ${mode})`;
};

const onMeatballButtonClicked = async ({ currentTarget }) => {
  const [{ note: reply }] = currentTarget.__notePropsData;

  const { type, targetBlogName } = processNoteProps(currentTarget.__notePropsData);
  const targetBlogUuid = userBlogs.find(({ name }) => name === targetBlogName).uuid;

  const { summary: postSummary, postUrl } = await timelineObject(currentTarget.closest(keyToCss('meatballMenu')));

  const replyingBlogName = reply.blogName;
  const replyingBlogUuid = await apiFetch(`/v2/blog/${replyingBlogName}/info?fields[blogs]=uuid`)
    .then(({ response: { blog: { uuid } } }) => uuid);

  openQuoteReplyPost({ type, replyingBlogName, replyingBlogUuid, reply, postSummary, postUrl, targetBlogUuid, targetBlogName });
};

export const main = async function () {
  ({ [originalPostTagStorageKey]: originalPostTag } = await browser.storage.local.get(originalPostTagStorageKey));
  ({ tagReplyingBlog, newTab } = await getPreferences('quote_replies'));

  pageModifications.register(notificationSelector, processNotifications);

  registerReplyMeatballItem({
    id: meatballButtonId,
    label: meatballButtonLabel,
    notePropsFilter: notePropsData => Boolean(processNoteProps(notePropsData)),
    onclick: event => onMeatballButtonClicked(event).catch(showErrorModal)
  });

  const { [storageKey]: draftLocation } = await browser.storage.local.get(storageKey);
  browser.storage.local.remove(storageKey);

  if (newTab && draftLocation !== undefined && /^\/blog\/.+\/drafts/.test(location.pathname)) {
    navigate(draftLocation);
  }
};

export const clean = async function () {
  pageModifications.unregister(processNotifications);
  unregisterReplyMeatballItem(meatballButtonId);

  $(`.${buttonClass}`).remove();
};

export const onStorageChanged = async function (changes) {
  if (Object.keys(changes).includes(originalPostTagStorageKey)) {
    ({ [originalPostTagStorageKey]: { newValue: originalPostTag } } = changes);
  }

  if (Object.keys(changes).some(key => key.startsWith('quote_replies.preferences'))) {
    ({ tagReplyingBlog, newTab } = await getPreferences('quote_replies'));
  }
};

export const stylesheet = true;
