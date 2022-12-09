import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { inject } from '../util/inject.js';
import { pageModifications } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { getPreferences } from '../util/preferences.js';
import { buildSvg } from '../util/remixicon.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const storageKey = 'quote_replies.currentResponseId';
const buttonClass = 'xkit-quote-replies';

const originalPostTagStorageKey = 'quick_tags.preferences.originalPostTag';

const activitySelector = `${keyToCss('notification')} > ${keyToCss('activity')}`;

let originalPostTag;
let tagReplyingBlog;

const getNotificationProps = function () {
  const notificationElement = document.currentScript.parentElement;
  const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
  let fiber = notificationElement[reactKey];

  while (fiber !== null) {
    const { notification } = fiber.memoizedProps || {};
    if (notification !== undefined) {
      return notification;
    } else {
      fiber = fiber.return;
    }
  }
};

const processNotifications = notifications => notifications.forEach(async notification => {
  const {
    targetPostId: id,
    targetPostSummary: summary,
    targetTumblelogName: name,
    targetTumblelogUuid: uuid,
    timestamp,
    type
  } = await inject(getNotificationProps, [], notification);

  if (type !== 'reply') return;

  const activityElement = notification.querySelector(activitySelector);
  if (!activityElement) return;

  activityElement.after(dom(
    'button',
    { class: buttonClass, title: 'Quote this reply' },
    {
      click () {
        this.disabled = true;
        quoteReply({ id, summary, name, uuid, timestamp })
          .catch(showError)
          .finally(() => { this.disabled = false; });
      }
    },
    [buildSvg('ri-chat-quote-line')]
  ));
});

const quoteReply = async ({ id, summary, name, uuid, timestamp }) => {
  const { response } = await apiFetch(
    `/v2/blog/${uuid}/post/${id}/notes/timeline`,
    { queryParams: { mode: 'replies', before_timestamp: `${timestamp + 1}000000` } }
  );

  const reply = response?.timeline?.elements?.[0];

  if (!reply) throw new Error('No replies found on target post.');
  if (Math.floor(reply.timestamp) !== timestamp) throw new Error('Reply not found.');

  const text = `@${reply.blog.name} replied to your post \u201C${summary.replace(/\n/g, ' ')}\u201D:`;
  const formatting = [
    { start: 0, end: reply.blog.name.length + 1, type: 'mention', blog: { uuid: reply.blog.uuid } },
    { start: text.indexOf('\u201C'), end: text.length - 1, type: 'link', url: `https://${name}.tumblr.com/post/${id}` }
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
  await browser.storage.local.set({ [storageKey]: responseId });

  const openedTab = window.open(`/blog/${name}/drafts`);
  if (openedTab === null) {
    browser.storage.local.remove(storageKey);
    notify(displayText);
  }
};

const showError = exception => notify(exception.body?.errors?.[0]?.detail || exception.message);

export const main = async function () {
  ({ [originalPostTagStorageKey]: originalPostTag } = await browser.storage.local.get(originalPostTagStorageKey));
  ({ tagReplyingBlog } = await getPreferences('quote_replies'));

  const notificationSelector = `section${keyToCss('notifications')} > ${keyToCss('notification')}`;
  pageModifications.register(notificationSelector, processNotifications);

  const { [storageKey]: responseId } = await browser.storage.local.get(storageKey);
  browser.storage.local.remove(storageKey);

  if (responseId !== undefined && /^\/blog\/.+\/drafts/.test(location.pathname)) {
    document.querySelector(`[href*="/edit/"][href$="/${responseId}"]`)?.click();
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
    ({ tagReplyingBlog } = await getPreferences('quote_replies'));
  }
};

export const stylesheet = true;
