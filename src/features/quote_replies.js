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
import { userBlogs } from '../utils/user.js';

const storageKey = 'quote_replies.draftLocation';
const buttonClass = 'xkit-quote-replies';
const dropdownButtonClass = 'xkit-quote-replies-dropdown';

const originalPostTagStorageKey = 'quick_tags.preferences.originalPostTag';

const activitySelector = `${keyToCss('notification')} > ${keyToCss('activity')}`;

const dropdownSelector = '[role="tabpanel"] *';

let originalPostTag;
let tagReplyingBlog;
let newTab;

const processNotifications = notifications => notifications.forEach(async notification => {
  const { notification: notificationProps, tumblelogName } = await inject(
    '/features/quote_replies/get_notification_props.js',
    [],
    notification
  );

  if (!['reply', 'note_mention'].includes(notificationProps.type)) return;

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
  const { type, targetPostId, targetPostSummary, targetTumblelogName, targetTumblelogUuid, timestamp } = notificationProps;

  const isReply = type === 'reply';
  const { response } = await apiFetch(
    `/v2/blog/${targetTumblelogUuid}/post/${targetPostId}/notes/timeline`,
    { queryParams: { mode: 'replies', before_timestamp: `${timestamp + 1}000000` } }
  );

  const reply = response?.timeline?.elements?.[0];

  if (!reply) throw new Error('No replies found on target post.');
  if (Math.floor(reply.timestamp) !== timestamp) throw new Error('Reply not found.');

  const text = isReply
    ? `@${reply.blog.name} replied to your post \u201C${targetPostSummary.replace(/\n/g, ' ')}\u201D:`
    : `@${reply.blog.name} mentioned you on a post \u201C${targetPostSummary.replace(/\n/g, ' ')}\u201D:`;
  const formatting = [
    { start: 0, end: reply.blog.name.length + 1, type: 'mention', blog: { uuid: reply.blog.uuid } },
    { start: text.indexOf('\u201C'), end: text.length - 1, type: 'link', url: `https://${targetTumblelogName}.tumblr.com/post/${targetPostId}` }
  ];

  const content = [
    { type: 'text', text, formatting },
    Object.assign(reply.content[0], { subtype: 'indented' }),
    { type: 'text', text: '\u200B' }
  ];
  const tags = [
    ...originalPostTag ? [originalPostTag] : [],
    ...tagReplyingBlog ? [reply.blog.name] : []
  ].join(',');

  const { response: { id: responseId, displayText } } = await apiFetch(`/v2/blog/${uuid}/posts`, { method: 'POST', body: { content, state: 'draft', tags } });

  const currentDraftLocation = `/edit/${tumblelogName}/${responseId}`;

  if (newTab) {
    await browser.storage.local.set({ [storageKey]: currentDraftLocation });

    const openedTab = window.open(`/blog/${tumblelogName}/drafts`);
    if (openedTab === null) {
      browser.storage.local.remove(storageKey);
      notify(displayText);
    }
  } else {
    navigate(currentDraftLocation);
  }
};

export const main = async function () {
  ({ [originalPostTagStorageKey]: originalPostTag } = await browser.storage.local.get(originalPostTagStorageKey));
  ({ tagReplyingBlog, newTab } = await getPreferences('quote_replies'));

  pageModifications.register(notificationSelector, processNotifications);

  const { [storageKey]: draftLocation } = await browser.storage.local.get(storageKey);
  browser.storage.local.remove(storageKey);

  if (newTab && draftLocation !== undefined && /^\/blog\/.+\/drafts/.test(location.pathname)) {
    navigate(draftLocation);
  }
};

export const clean = async function () {
  pageModifications.unregister(processNotifications);
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
