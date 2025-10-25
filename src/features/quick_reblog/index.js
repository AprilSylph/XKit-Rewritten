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
import { popoverStackingContextFix } from '../../utils/post_popovers.js';

const blogSelector = dom('select');
const blogAvatar = dom('div', { class: 'avatar' });
const blogSelectorContainer = dom('div', { class: 'select-container' }, null, [
  blogAvatar,
  blogSelector
]);

const commentInput = dom('input', { placeholder: 'Comment', autocomplete: 'off' }, { keydown: event => event.stopPropagation() });

const quickTagsList = dom('div', { class: 'quick-tags', tabIndex: -1 });

const datalistId = 'quick-reblog-tag-suggestions';
const tagsInput = dom('input', { placeholder: 'Tags (comma separated)', autocomplete: 'off', list: datalistId }, { keydown: event => event.stopPropagation() });
const tagSuggestions = dom('datalist', { id: datalistId });

const reblogButton = dom('button', { 'data-state': 'published' }, null, ['Reblog']);
const queueButton = dom('button', { 'data-state': 'queue' }, null, ['Queue']);
const draftButton = dom('button', { 'data-state': 'draft' }, null, ['Draft']);
const actionButtons = dom('fieldset', { class: 'action-buttons' }, null, [
  reblogButton,
  queueButton,
  draftButton
]);

const popupElement = dom('div', { id: 'quick-reblog' }, null, [
  blogSelectorContainer,
  commentInput,
  quickTagsList,
  tagsInput,
  tagSuggestions,
  actionButtons
]);

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

const buttonSelector = `${postSelector} footer a, ${postSelector} footer button`;
const reblogButtonSelector = `${postSelector} footer :is(a[href*="/reblog/"], button:has(use[href="#managed-icon__ds-reblog-24"]))`;
const buttonDivSelector = `${keyToCss('controls', 'reblogsControl', 'engagementControls')} > *`;

export const styleElement = buildStyle(`
:has(${keyToCss('bubbles')}) > #quick-reblog {
  display: none;
}

${keyToCss('engagementAction', 'targetWrapperFlex')}:has(> #quick-reblog) {
  position: relative;
}
${keyToCss('engagementAction', 'targetWrapperFlex')}:has(> #quick-reblog) ${keyToCss('tooltip')} {
  display: none;
}

${popoverStackingContextFix}
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
  if (tags.some(tag => tag.length > 140)) {
    tagsInput.setCustomValidity('Tag is longer than 140 characters!');
    tagsInput.reportValidity();
  } else {
    tagsInput.setCustomValidity('');
  }
};
tagsInput.addEventListener('input', updateTagSuggestions);
tagsInput.addEventListener('input', doSmartQuotes);
tagsInput.addEventListener('input', checkLength);

const showPopupOnHover = async ({ currentTarget }) => {
  if (!currentTarget.matches(reblogButtonSelector)) return;

  const buttonDiv = currentTarget.closest(buttonDivSelector) ?? currentTarget.parentElement;
  if (buttonDiv.matches(':has([aria-expanded="true"])')) return;

  const thisPost = currentTarget.closest(postSelector);
  const { blog, canReblog } = await timelineObject(thisPost);
  if (canReblog === false || blog?.isPasswordProtected) return;

  clearTimeout(timeoutID);

  appendWithoutOverflow(popupElement, buttonDiv, popupPosition);
  popupElement.parentNode.addEventListener('click', removePopupOnClick, { once: true });
  popupElement.parentNode.addEventListener('mouseleave', removePopupOnLeave);

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

const removePopupOnClick = () => {
  clearTimeout(timeoutID);
  popupElement.parentNode?.removeEventListener('mouseleave', removePopupOnLeave);
  popupElement.remove();
};

const removePopupOnLeave = () => {
  timeoutID = setTimeout(() => {
    if (!popupElement.matches(':focus-within') && !popupElement.parentNode?.matches(':hover')) {
      popupElement.parentNode?.removeEventListener('click', removePopupOnClick);
      popupElement.parentNode?.removeEventListener('mouseleave', removePopupOnLeave);
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
[reblogButton, queueButton, draftButton].forEach(button => button.addEventListener('click', reblogPost));

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

const updateQuickTags = (changes) => {
  if (Object.keys(changes).includes(quickTagsStorageKey)) {
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

const preventLongPressMenu = ({ currentTarget, originalEvent: event }) => {
  if (!currentTarget.matches(reblogButtonSelector)) return;

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

  $(document.body).on('mouseenter', buttonSelector, showPopupOnHover);
  $(document.body).on('contextmenu', buttonSelector, preventLongPressMenu);

  if (quickTagsIntegration) {
    browser.storage.local.onChanged.addListener(updateQuickTags);
    renderQuickTags();
  }

  if (alreadyRebloggedEnabled) {
    onNewPosts.addListener(processPosts);
  }
};

export const clean = async function () {
  $(document.body).off('mouseenter', buttonSelector, showPopupOnHover);
  $(document.body).off('contextmenu', buttonSelector, preventLongPressMenu);
  popupElement.remove();

  blogSelector.removeEventListener('change', updateRememberedBlog);

  browser.storage.local.onChanged.removeListener(updateQuickTags);
  onNewPosts.removeListener(processPosts);
};

export const stylesheet = true;
