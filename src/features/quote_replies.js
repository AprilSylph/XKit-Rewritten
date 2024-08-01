import { keyToCss } from '../utils/css_map.js';
import { dom } from '../utils/dom.js';
import { inject } from '../utils/inject.js';
import { hideModal, modalCancelButton, showErrorModal, showModal } from '../utils/modals.js';
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
let enableReblogReplies;

const processNotifications = notifications => notifications.forEach(async notification => {
  const { notification: notificationProps, tumblelogName } = await inject(
    '/main_world/get_notification_props.js',
    [],
    notification
  );

  if (!['reply', 'note_mention'].includes(notificationProps.type)) return;

  const activityElement = notification.querySelector(activitySelector);
  if (!activityElement) return;

  const button = dom(
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
  );
  const reblogButton = dom(
    'button',
    {
      class: `${buttonClass} ${notification.matches(dropdownSelector) ? dropdownButtonClass : ''}`,
      title: 'Reblog and quote this reply'
    },
    {
      click () {
        this.disabled = true;
        quoteReply(tumblelogName, notificationProps, true)
          .catch(showErrorModal)
          .finally(() => { this.disabled = false; });
      }
    },
    [buildSvg('ri-repeat-line')]
  );

  enableReblogReplies ? activityElement.after(button, reblogButton) : activityElement.after(button);
});

const quoteReply = async (tumblelogName, notificationProps, asReblog = false) => {
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

  let result;

  if (asReblog) {
    const text = `@${reply.blog.name} replied:`;
    const formatting = [
      { start: 0, end: reply.blog.name.length + 1, type: 'mention', blog: { uuid: reply.blog.uuid } }
    ];

    const content = [
      { type: 'text', text, formatting },
      Object.assign(reply.content[0], { subtype: 'indented' }),
      { type: 'text', text: '\u200B' }
    ];
    const tags = [
      ...tagReplyingBlog ? [reply.blog.name] : []
    ].join(',');

    const { response: { canReblog, blog: { uuid: parentTumblelogUUID }, reblogKey } } = await apiFetch(`/v2/blog/${targetTumblelogUuid}/posts/${targetPostId}`);

    if (canReblog === false) {
      showModal({
        title: 'Cannot reblog',
        message: ['The target post cannot be reblogged!'],
        buttons: [
          modalCancelButton,
          dom('button', { class: 'blue' }, {
            click () {
              hideModal();
              quoteReply(tumblelogName, notificationProps);
            }
          }, ['Reply in a new post'])
        ]
      });
      return;
    }

    result = await apiFetch(`/v2/blog/${uuid}/posts`, {
      method: 'POST',
      body: {
        content,
        state: 'draft',
        tags,
        parent_post_id: targetPostId,
        parent_tumblelog_uuid: parentTumblelogUUID,
        reblog_key: reblogKey
      }
    });
  } else {
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

    result = await apiFetch(`/v2/blog/${uuid}/posts`, {
      method: 'POST',
      body: {
        content,
        state: 'draft',
        tags
      }
    });
  }

  const { response: { id: responseId, displayText } } = result;

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
  ({ tagReplyingBlog, newTab, enableReblogReplies } = await getPreferences('quote_replies'));

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
  if (Object.keys(changes).some(key => key.startsWith('quote_replies.preferences'))) {
    clean().then(main);
  } else if (Object.keys(changes).includes(originalPostTagStorageKey)) {
    ({ [originalPostTagStorageKey]: { newValue: originalPostTag } } = changes);
  }
};

export const stylesheet = true;
