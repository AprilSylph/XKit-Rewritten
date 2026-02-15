import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { inject } from '../../utils/inject.js';
import { buildStyle, displayInlineFlexUnlessDisabledAttr, notificationSelector } from '../../utils/interface.js';
import { showErrorModal } from '../../utils/modals.js';
import { pageModifications } from '../../utils/mutations.js';
import { notify } from '../../utils/notifications.js';
import { getPreferences } from '../../utils/preferences.js';
import { buildSvg } from '../../utils/remixicon.js';
import { apiFetch, navigate } from '../../utils/tumblr_helpers.js';
import { userBlogs } from '../../utils/user.js';

const storageKey = 'quote_replies.draftLocation';
const buttonClass = 'xkit-quote-replies';
const dropdownButtonClass = 'xkit-quote-replies-dropdown';

// Remove outdated elements when loading module
$(`.${buttonClass}`).remove();

export const styleElement = buildStyle(`
button.xkit-quote-replies {
  position: relative;
  align-self: center;
  transform: translateY(-2px);

  align-items: center;
  margin: 0 6px;

  cursor: pointer;
}

button.xkit-quote-replies svg {
  width: 21.5px;
  height: 21.5px;

  fill: rgb(var(--blue));
  transition: all .25s ease-out .4s;
}

button.xkit-quote-replies:disabled svg {
  fill: rgba(var(--black), 0.65);
  transition-property: none;
}

button.xkit-quote-replies-dropdown {
  align-self: flex-start;
  margin: 10px 0 0;
}

@media (hover: hover) {
  button.xkit-quote-replies svg {
    opacity: 0;
    transform: scale(0);
  }

  ${notificationSelector}:is(:hover, :focus-within) button.xkit-quote-replies svg {
    opacity: 1;
    transform: scale(1);
  }
}
`);

const originalPostTagStorageKey = 'quick_tags.preferences.originalPostTag';

const activitySelector = `:is(${keyToCss('notification')} > ${keyToCss('activity')}, ${keyToCss('activityContent')})`;

const dropdownSelector = '[role="tabpanel"] *';

let originalPostTag;
let tagReplyingBlog;
let newTab;

const processNotifications = notifications => notifications.forEach(async notification => {
  const [notificationProps, tumblelogName] = await Promise.all([
    inject('/main_world/get_notification_props.js', [], notification),
    inject('/main_world/get_tumblelogname_prop.js', [], notification),
  ]);

  if (!['reply', 'reply_to_comment', 'note_mention'].includes(notificationProps.type === 'generic' ? notificationProps.subtype : notificationProps.type)) return;
  if (notificationProps.community) return;
  if (notificationProps.actions?.tap?.href && new URL(notificationProps.actions.tap.href).pathname.startsWith('/communities/')) return;

  const activityElement = notification.querySelector(activitySelector);
  if (!activityElement) return;

  activityElement.after(dom(
    'button',
    {
      class: `${buttonClass} ${notification.matches(dropdownSelector) ? dropdownButtonClass : ''}`,
      [displayInlineFlexUnlessDisabledAttr]: '',
      title: 'Quote this reply',
    },
    {
      click () {
        this.disabled = true;
        quoteReply(tumblelogName, notificationProps)
          .catch(showErrorModal)
          .finally(() => { this.disabled = false; });
      },
    },
    [buildSvg('ri-chat-quote-line')],
  ));
});

const processGenericReply = async (notificationProps) => {
  const {
    subtype: type,
    timestamp,
    title: { textContent: titleContent },
    body: { content: [bodyDescriptionContent, bodyQuoteContent] },
    actions,
  } = notificationProps;
  const summaryFormatting = bodyDescriptionContent.formatting?.find(({ type }) => type === 'semantic_color');

  try {
    const [, targetTumblelogName, targetPostId] =
      /^\/@?([a-z0-9-]{1,32})\/([0-9]{1,20})(\/|$)/.exec(new URL(actions.tap.href).pathname);

    const targetPostSummary = summaryFormatting
      ? bodyDescriptionContent.text.slice(summaryFormatting.start + 1, summaryFormatting.end - 1)
      : bodyDescriptionContent.text;

    return await processReply({ type, timestamp, targetPostId, targetTumblelogName, targetPostSummary });
  } catch (exception) {
    console.error(exception);
    console.debug('[XKit] Falling back to generic quote content due to fetch/parse failure');
  }

  const replyingBlog = titleContent.formatting.find(({ type }) => type === 'mention').blog;

  const content = [
    {
      type: 'text',
      text: `@${replyingBlog.name}`,
      formatting: [
        { start: 0, end: replyingBlog.name.length + 1, type: 'mention', blog: { uuid: replyingBlog.uuid } }],
    },
    {
      type: 'text',
      text: bodyDescriptionContent.text,
      formatting: summaryFormatting
        ? [{ start: summaryFormatting.start, end: summaryFormatting.end, type: 'link', url: actions.tap.href }]
        : [],
    },
    bodyQuoteContent,
    { type: 'text', text: '\u200B' },
  ];
  const tags = [
    ...originalPostTag ? [originalPostTag] : [],
    ...tagReplyingBlog ? [replyingBlog.name] : [],
  ].join(',');

  return { content, tags };
};

const processReply = async ({ type, timestamp, targetPostId, targetTumblelogName, targetPostSummary }) => {
  const { response } = await apiFetch(
    `/v2/blog/${targetTumblelogName}/post/${targetPostId}/notes/timeline`,
    { queryParams: { mode: 'replies', before_timestamp: `${timestamp + 1}000000` } },
  );

  const reply = response?.timeline?.elements?.[0];

  if (!reply) throw new Error('No replies found on target post.');
  if ([Math.floor(reply.timestamp), Math.round(reply.timestamp)].includes(timestamp) === false) {
    throw new Error('Reply not found.');
  }

  const verbiage = {
    reply: 'replied to your post',
    reply_to_comment: 'replied to you in a post',
    note_mention: 'mentioned you on a post',
  }[type];
  const text = `@${reply.blog.name} ${verbiage} \u201C${targetPostSummary.replace(/\n/g, ' ')}\u201D:`;
  const formatting = [
    { start: 0, end: reply.blog.name.length + 1, type: 'mention', blog: { uuid: reply.blog.uuid } },
    { start: text.indexOf('\u201C'), end: text.length - 1, type: 'link', url: `https://${targetTumblelogName}.tumblr.com/post/${targetPostId}` },
  ];

  const content = [
    { type: 'text', text, formatting },
    Object.assign(reply.content[0], { subtype: 'indented' }),
    { type: 'text', text: '\u200B' },
  ];
  const tags = [
    ...originalPostTag ? [originalPostTag] : [],
    ...tagReplyingBlog ? [reply.blog.name] : [],
  ].join(',');

  return { content, tags };
};

const quoteReply = async (tumblelogName, notificationProps) => {
  const uuid = userBlogs.find(({ name }) => name === tumblelogName).uuid;

  const { content, tags } = notificationProps.type === 'generic'
    ? await processGenericReply(notificationProps)
    : await processReply(notificationProps);

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
