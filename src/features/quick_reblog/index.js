import { sha256 } from '../../utils/crypto.js';
import { timelineObject } from '../../utils/react_props.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';
import { postSelector, filterPostElements, postType, appendWithoutOverflow, buildStyle } from '../../utils/interface.js';
import { joinedCommunities, joinedCommunityUuids, primaryBlog, userBlogs } from '../../utils/user.js';
import { getPreferences } from '../../utils/preferences.js';
import { onNewPosts } from '../../utils/mutations.js';
import { notify } from '../../utils/notifications.js';
import { dom } from '../../utils/dom.js';
import { showErrorModal } from '../../utils/modals.js';
import { keyToCss } from '../../utils/css_map.js';

const popupElement = dom('div', { id: 'quick-reblog' }, { click: event => event.stopPropagation() });
const blogSelector = dom('select');
const blogAvatar = dom('div', { class: 'avatar' });
const blogSelectorContainer = dom('div', { class: 'select-container' }, null, [blogAvatar, blogSelector]);
const commentInput = dom(
  'input',
  {
    placeholder: 'Comment',
    autocomplete: 'off'
  },
  { keydown: event => event.stopPropagation() }
);
const quickTagsList = dom('div', {
  class: 'quick-tags',
  tabIndex: -1
});
const tagsInput = dom(
  'input',
  {
    placeholder: 'Tags (comma separated)',
    autocomplete: 'off',
    list: 'quick-reblog-tag-suggestions'
  },
  { keydown: event => event.stopPropagation() }
);
const tagSuggestions = dom('datalist', { id: 'quick-reblog-tag-suggestions' });
const actionButtons = dom('fieldset', { class: 'action-buttons' });
const reblogButton = dom('button', null, null, ['Reblog']);
reblogButton.dataset.state = 'published';
const queueButton = dom('button', null, null, ['Queue']);
queueButton.dataset.state = 'queue';
const draftButton = dom('button', null, null, ['Draft']);
draftButton.dataset.state = 'draft';
[blogSelectorContainer, commentInput, quickTagsList, tagsInput, tagSuggestions, actionButtons].forEach(element => popupElement.appendChild(element));

let lastPostID;
let timeoutID;
let suggestableTags;
let accountKey;

let popupPosition;
let showBlogSelector;
let rememberLastBlog;
let showCommentInput;
let quickTagsIntegration;
let showTagsInput;
let showTagSuggestions;
let reblogTag;
let queueTag;
let alreadyRebloggedEnabled;
let alreadyRebloggedLimit;

const alreadyRebloggedStorageKey = 'quick_reblog.alreadyRebloggedList';
const rememberedBlogStorageKey = 'quick_reblog.rememberedBlogs';
const quickTagsStorageKey = 'quick_tags.preferences.tagBundles';
const blogHashes = new Map();
const avatarUrls = new Map();

const reblogButtonSelector = `${postSelector} footer a[href*="/reblog/"]`;
const buttonDivSelector = `${keyToCss('controls')} > *, ${keyToCss('engagementAction')}`;

export const styleElement = buildStyle(`
${keyToCss('engagementAction', 'targetWrapperFlex')}:has(> #quick-reblog) {
  position: relative;
}
${keyToCss('engagementAction', 'targetWrapperFlex')}:has(> #quick-reblog) ${keyToCss('tooltip')} {
  display: none;
}
`);

const onBlogSelectorChange = () => {
  blogAvatar.style.backgroundImage = `url(${avatarUrls.get(blogSelector.value)})`;
  actionButtons.classList[joinedCommunityUuids.includes(blogSelector.value) ? 'add' : 'remove']('community-selected');
};
blogSelector.addEventListener('change', onBlogSelectorChange);

const renderTagSuggestions = () => {
  tagSuggestions.textContent = '';
  if (!showTagSuggestions) return;

  const currentTags = tagsInput.value
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag !== '');

  const includeSpace = !tagsInput.value.endsWith(' ') && tagsInput.value.trim() !== '';

  const tagsToSuggest = suggestableTags
    .filter(tag => !currentTags.includes(tag.toLowerCase()))
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .map(tag => `${tagsInput.value}${includeSpace ? ' ' : ''}${tag}`);

  tagSuggestions.append(...tagsToSuggest.map(value => dom('option', { value })));
};

const updateTagSuggestions = () => {
  if (tagsInput.value.trim().endsWith(',') || tagsInput.value.trim() === '') {
    renderTagSuggestions();
  }
};

const doSmartQuotes = ({ currentTarget }) => {
  const { value } = currentTarget;
  currentTarget.value = value
    .replace(/^"/, '\u201C')
    .replace(/ "/g, ' \u201C')
    .replace(/"/g, '\u201D');
};

const checkLength = ({ currentTarget }) => {
  const { value } = currentTarget;
  const tags = value.split(',').map(tag => tag.trim());

  const validityMessage = tags.some(tag => tag.length > 140)
    ? 'Tag is longer than 140 characters!'
    : '';

  if (currentTarget.dataset.validityMessage !== validityMessage) {
    currentTarget.dataset.validityMessage = validityMessage;
    tagsInput.setCustomValidity(validityMessage);
    tagsInput.reportValidity();
  }
};

tagsInput.addEventListener('input', updateTagSuggestions);
tagsInput.addEventListener('input', doSmartQuotes);
tagsInput.addEventListener('input', checkLength);

const showPopupOnHover = ({ currentTarget }) => {
  clearTimeout(timeoutID);

  appendWithoutOverflow(popupElement, currentTarget.closest(buttonDivSelector), popupPosition);
  popupElement.parentNode.addEventListener('mouseleave', removePopupOnLeave);

  const thisPost = currentTarget.closest(postSelector);
  const thisPostID = thisPost.dataset.id;
  if (thisPostID !== lastPostID) {
    if (!rememberLastBlog) {
      blogSelector.value = blogSelector.options[0].value;
      onBlogSelectorChange();
    }
    commentInput.value = '';
    [...quickTagsList.children].forEach(({ dataset }) => delete dataset.checked);
    tagsInput.value = '';
    timelineObject(thisPost).then(({ tags, trail, content, layout, blogName, postAuthor, rebloggedRootName }) => {
      suggestableTags = tags;
      if (blogName) suggestableTags.push(blogName);
      if (postAuthor) suggestableTags.push(postAuthor);
      if (rebloggedRootName) suggestableTags.push(rebloggedRootName);
      suggestableTags.push(postType({ trail, content, layout }));
      renderTagSuggestions();
    });
  }
  lastPostID = thisPostID;
};

const removePopupOnLeave = () => {
  timeoutID = setTimeout(() => {
    const { parentNode } = popupElement;
    if (parentNode?.matches(':hover, :active, :focus-within') === false) {
      parentNode?.removeEventListener('mouseleave', removePopupOnLeave);
      popupElement.remove();
    }
  }, 500);
};

const markPostReblogged = ({ footer, state }) => {
  footer.classList.remove('published', 'queue', 'draft');
  footer.classList.add(state);
};

const reblogPost = async function ({ currentTarget }) {
  const footer = popupElement.closest('footer');

  currentTarget.blur();
  actionButtons.disabled = true;

  const postElement = currentTarget.closest(postSelector);
  const postID = postElement.dataset.id;
  const { state } = currentTarget.dataset;

  const blog = blogSelector.value;
  const tags = [
    ...tagsInput.value.split(','),
    ...reblogTag ? [reblogTag] : [],
    ...(state === 'queue' && queueTag) ? [queueTag] : []
  ].join(',');
  const { blog: { uuid: parentTumblelogUUID }, reblogKey, rebloggedRootId } = await timelineObject(postElement);

  const requestPath = `/v2/blog/${blog}/posts`;

  const requestBody = {
    content: commentInput.value ? [{ formatting: [], type: 'text', text: commentInput.value }] : [],
    tags,
    parent_post_id: postID,
    parent_tumblelog_uuid: parentTumblelogUUID,
    reblog_key: reblogKey,
    state
  };

  try {
    const { meta, response } = await apiFetch(requestPath, { method: 'POST', body: requestBody });
    if (meta.status === 201) {
      markPostReblogged({ footer, state });

      if (lastPostID === postID) {
        popupElement.remove();
        lastPostID = null;
      } else {
        // popup was moved to another post during apiFetch
      }

      notify(response.displayText);

      if (alreadyRebloggedEnabled) {
        const { [alreadyRebloggedStorageKey]: alreadyRebloggedList = [] } = await browser.storage.local.get(alreadyRebloggedStorageKey);
        const rootID = rebloggedRootId || postID;

        if (alreadyRebloggedList.includes(rootID) === false) {
          alreadyRebloggedList.push(rootID);
          alreadyRebloggedList.splice(0, alreadyRebloggedList.length - alreadyRebloggedLimit);
          await browser.storage.local.set({ [alreadyRebloggedStorageKey]: alreadyRebloggedList });
        }
      }
    }
  } catch (exception) {
    showErrorModal(exception);
  } finally {
    actionButtons.disabled = false;
  }
};

[reblogButton, queueButton, draftButton].forEach(button => {
  button.addEventListener('click', reblogPost);
  actionButtons.appendChild(button);
});

const processPosts = async function (postElements) {
  const { [alreadyRebloggedStorageKey]: alreadyRebloggedList = [] } = await browser.storage.local.get(alreadyRebloggedStorageKey);
  filterPostElements(postElements).forEach(async postElement => {
    const { id } = postElement.dataset;
    const { rebloggedRootId } = await timelineObject(postElement);

    const rootID = rebloggedRootId || id;

    if (alreadyRebloggedList.includes(rootID)) {
      const reblogLink = postElement.querySelector(reblogButtonSelector);
      const footer = reblogLink?.closest('footer');
      if (footer) markPostReblogged({ footer, state: 'published' });
    }
  });
};

const renderQuickTags = async function () {
  quickTagsList.textContent = '';

  const { [quickTagsStorageKey]: tagBundles = [] } = await browser.storage.local.get(quickTagsStorageKey);
  tagBundles.forEach(tagBundle => {
    const bundleTags = tagBundle.tags.split(',').map(tag => tag.trim().toLowerCase());
    const bundleButton = dom('button', null, null, [tagBundle.title]);
    bundleButton.addEventListener('click', ({ currentTarget: { dataset } }) => {
      const checked = dataset.checked === 'true';

      if (checked) {
        tagsInput.value = tagsInput.value
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => bundleTags.includes(tag.toLowerCase()) === false)
          .join(', ');
      } else {
        tagsInput.value.trim() === ''
          ? tagsInput.value = tagBundle.tags
          : tagsInput.value += `, ${tagBundle.tags}`;
      }

      dataset.checked = !checked;
    });

    quickTagsList.appendChild(bundleButton);
  });
};

const updateQuickTags = (changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(quickTagsStorageKey)) {
    renderQuickTags();
  }
};

const updateRememberedBlog = async ({ currentTarget: { value: selectedBlog } }) => {
  const {
    [rememberedBlogStorageKey]: rememberedBlogs = {}
  } = await browser.storage.local.get(rememberedBlogStorageKey);

  const selectedBlogHash = blogHashes.get(selectedBlog);

  rememberedBlogs[accountKey] = selectedBlogHash;
  browser.storage.local.set({ [rememberedBlogStorageKey]: rememberedBlogs });
};

/**
 * Chromium passes a full PointerEvent here; Firefox passes a MouseEvent.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/mozInputSource
 */
const MOZ_SOURCE_TOUCH = 5;

const preventLongPressMenu = ({ originalEvent: event }) => {
  const isTouchEvent = event.pointerType === 'touch';
  const firefoxIsTouchEvent = event.mozInputSource === MOZ_SOURCE_TOUCH;

  if (isTouchEvent || firefoxIsTouchEvent) {
    event.preventDefault();
  }
};

export const main = async function () {
  if (!primaryBlog) return;
  ({
    popupPosition,
    showBlogSelector,
    rememberLastBlog,
    showCommentInput,
    quickTagsIntegration,
    showTagsInput,
    showTagSuggestions,
    reblogTag,
    queueTag,
    alreadyRebloggedEnabled,
    alreadyRebloggedLimit
  } = await getPreferences('quick_reblog'));

  blogSelector.replaceChildren(
    ...userBlogs.map(({ name, uuid }) => dom('option', { value: uuid }, null, [name])),
    ...joinedCommunities.length ? [dom('hr')] : [],
    ...joinedCommunities.map(({ title, uuid, blog: { name } }) => dom('option', { value: uuid }, null, [`${title} (${name})`]))
  );

  [...userBlogs, ...joinedCommunities].forEach((data) => {
    const avatar = data.avatarImage ?? data.avatar;
    const { url } = avatar.at(-1);
    avatarUrls.set(data.uuid, url);
  });

  if (rememberLastBlog) {
    for (const { uuid } of [...userBlogs, ...joinedCommunities]) {
      blogHashes.set(uuid, await sha256(uuid));
    }

    accountKey = blogHashes.get(primaryBlog.uuid);

    const {
      [rememberedBlogStorageKey]: rememberedBlogs = {}
    } = await browser.storage.local.get(rememberedBlogStorageKey);

    const savedBlogHash = rememberedBlogs[accountKey];
    const savedBlogUuid = [...blogHashes.keys()].find(uuid => blogHashes.get(uuid) === savedBlogHash);
    if (savedBlogUuid) blogSelector.value = savedBlogUuid;

    blogSelector.addEventListener('change', updateRememberedBlog);
  }
  onBlogSelectorChange();

  blogSelectorContainer.hidden = !showBlogSelector;
  commentInput.hidden = !showCommentInput;
  quickTagsList.hidden = !quickTagsIntegration;
  tagsInput.hidden = !showTagsInput;

  $(document.body).on('mouseenter', reblogButtonSelector, showPopupOnHover);
  $(document.body).on('contextmenu', reblogButtonSelector, preventLongPressMenu);

  if (quickTagsIntegration) {
    browser.storage.onChanged.addListener(updateQuickTags);
    renderQuickTags();
  }

  if (alreadyRebloggedEnabled) {
    onNewPosts.addListener(processPosts);
  }
};

export const clean = async function () {
  $(document.body).off('mouseenter', reblogButtonSelector, showPopupOnHover);
  $(document.body).off('contextmenu', reblogButtonSelector, preventLongPressMenu);
  popupElement.remove();

  blogSelector.removeEventListener('change', updateRememberedBlog);

  browser.storage.onChanged.removeListener(updateQuickTags);
  onNewPosts.removeListener(processPosts);
};

export const stylesheet = true;
