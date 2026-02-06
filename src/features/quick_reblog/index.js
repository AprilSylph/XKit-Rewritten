import { sha256 } from '../../utils/crypto.js';
import { keyToCss } from '../../utils/css_map.js';
import { div, select, input, fieldset, button, option, hr, span } from '../../utils/dom.js';
import { postSelector, filterPostElements, postType, appendWithoutOverflow, buildStyle } from '../../utils/interface.js';
import { showErrorModal } from '../../utils/modals.js';
import { onNewPosts } from '../../utils/mutations.js';
import { notify } from '../../utils/notifications.js';
import { popoverStackingContextFix } from '../../utils/post_popovers.js';
import { getPreferences } from '../../utils/preferences.js';
import { timelineObject } from '../../utils/react_props.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';
import { joinedCommunities, joinedCommunityUuids, primaryBlog, userBlogs } from '../../utils/user.js';

// Clean up previous instance after addon reload
document.getElementById('quick-reblog')?.remove();

const quickTagsTabId = 'xkit-quick-reblog-quick-tags-tab';
const quickTagsPanelId = 'xkit-quick-reblog-quick-tags-panel';
const suggestedTagsTabId = 'xkit-quick-reblog-suggested-tags-tab';
const suggestedTagsPanelId = 'xkit-quick-reblog-suggested-tags-panel';

const stopEventPropagation = event => event.stopPropagation();

const blogSelector = select({ change: onBlogSelectorChange });
const blogAvatar = div({ class: 'avatar' });
const blogSelectorContainer = div({ class: 'select-container' }, [blogAvatar, blogSelector]);
const commentInput = input({ autocomplete: 'off', placeholder: 'Comment', keydown: stopEventPropagation });
const tagsTabList = div({ role: 'tablist' }, [
  button({
    'aria-controls': quickTagsPanelId,
    click: onTabClick,
    id: quickTagsTabId,
    role: 'tab',
  }, ['Tag bundles']),
  button({
    'aria-controls': suggestedTagsPanelId,
    click: onTabClick,
    id: suggestedTagsTabId,
    role: 'tab',
  }, ['Suggestions']),
]);
const quickTagsPanel = div({ 'aria-labelledby': quickTagsTabId, id: quickTagsPanelId, role: 'tabpanel' });
const suggestedTagsPanel = div({ 'aria-labelledby': suggestedTagsTabId, id: suggestedTagsPanelId, role: 'tabpanel' });
const tagsInput = input({
  autocomplete: 'off',
  list: 'quick-reblog-tag-suggestions',
  placeholder: 'Tags (comma separated)',
  input: onTagsInput,
  keydown: stopEventPropagation,
});
const actionButtons = fieldset({ class: 'action-buttons' }, [
  button({ 'data-state': 'published', click: reblogPost }, ['Reblog']),
  button({ 'data-state': 'queue', click: reblogPost }, ['Queue']),
  button({ 'data-state': 'draft', click: reblogPost }, ['Draft']),
]);
const popupElement = div({ id: 'quick-reblog', click: stopEventPropagation }, [
  blogSelectorContainer,
  commentInput,
  tagsTabList,
  quickTagsPanel,
  suggestedTagsPanel,
  tagsInput,
  actionButtons,
]);

let lastPostID;
let timeoutID;
let accountKey;

let popupPosition;
let showBlogSelector;
let rememberLastBlog;
let showCommentInput;
let quickTagsIntegration;
let showTagSuggestions;
let showTagsInput;
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
const reblogButtonSelector = `${postSelector} footer :is(a[href*="/reblog/"], button:has(use[href="#managed-icon__ds-reblog-24"])):not(${keyToCss('reblog')} *)`;
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

/** blogSelector change event handler */
function onBlogSelectorChange () {
  blogAvatar.style.backgroundImage = `url(${avatarUrls.get(blogSelector.value)})`;
  actionButtons.classList.toggle('community-selected', joinedCommunityUuids.includes(blogSelector.value));
}

/** @param {PointerEvent} event tagsTabList.children[*] click event object */
function onTabClick ({ currentTarget }) {
  const previousSelectedTab = [...tagsTabList.children].find(tabButton => tabButton.ariaSelected === 'true');
  if (previousSelectedTab) {
    previousSelectedTab.ariaSelected = 'false';
    previousSelectedTab.getAttribute('aria-controls').split(',')
      .map(elementId => document.getElementById(elementId))
      .forEach(tabPanel => tabPanel.setAttribute('hidden', ''));
  }

  currentTarget.ariaSelected = 'true';
  currentTarget.getAttribute('aria-controls').split(',')
    .map(elementId => document.getElementById(elementId))
    .forEach(tabPanel => tabPanel.removeAttribute('hidden'));
}

/** @param {InputEvent} event tagsInput input event object */
function onTagsInput ({ currentTarget }) {
  // Do smart quotes
  currentTarget.value = currentTarget.value
    .replace(/^"/, '\u201C')
    .replace(/ "/g, ' \u201C')
    .replace(/"/g, '\u201D');

  // Check length
  const tags = currentTarget.value.split(',').map(tag => tag.trim());
  if (tags.some(tag => tag.length > 140)) {
    tagsInput.setCustomValidity('Tag is longer than 140 characters!');
    tagsInput.reportValidity();
  } else {
    tagsInput.setCustomValidity('');
  }
}

const resetPopupState = () => {
  commentInput.value = '';
  tagsInput.value = '';

  [...tagsTabList.children].forEach(tabButton => {
    tabButton.ariaSelected = tabButton.id === quickTagsTabId ? 'true' : 'false';
  });
  [...quickTagsPanel.children, ...suggestedTagsPanel.children].forEach(tagsButton => {
    tagsButton.ariaPressed = 'false';
  });

  quickTagsPanel.hidden = !quickTagsIntegration;
  suggestedTagsPanel.hidden = quickTagsIntegration || !showTagSuggestions;
};

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
  document.body.addEventListener('touchend', removePopupOnOutsideTouch);

  const thisPostID = thisPost.dataset.id;
  if (thisPostID !== lastPostID) {
    if (!rememberLastBlog) {
      blogSelector.value = blogSelector.options[0].value;
      onBlogSelectorChange();
    }
    resetPopupState();
    timelineObject(thisPost).then(renderTagSuggestions);
  }
  lastPostID = thisPostID;
};

const removePopupOnClick = () => {
  clearTimeout(timeoutID);
  popupElement.parentNode?.removeEventListener('mouseleave', removePopupOnLeave);
  document.body.removeEventListener('touchend', removePopupOnOutsideTouch);
  popupElement.remove();
};

const removePopupOnLeave = () => {
  timeoutID = setTimeout(() => {
    if (!popupElement.matches(':focus-within') && !popupElement.parentNode?.matches(':hover')) {
      popupElement.parentNode?.removeEventListener('click', removePopupOnClick);
      popupElement.parentNode?.removeEventListener('mouseleave', removePopupOnLeave);
      document.body.removeEventListener('touchend', removePopupOnOutsideTouch);
      popupElement.remove();
    }
  }, 500);
};

const removePopupOnOutsideTouch = async ({ target }) => {
  if (!target.closest(reblogButtonSelector)) {
    removePopupOnLeave();
  }
};

const markPostReblogged = ({ footer, state }) => {
  footer.classList.remove('published', 'queue', 'draft');
  footer.classList.add(state);
};

/** @param {PointerEvent} event actionButtons.children[*] click event object */
async function reblogPost ({ currentTarget }) {
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
    ...(state === 'queue' && queueTag) ? [queueTag] : [],
  ].join(',');
  const { blog: { uuid: parentTumblelogUUID }, reblogKey, rebloggedRootId } = await timelineObject(postElement);

  const requestPath = `/v2/blog/${blog}/posts`;

  const requestBody = {
    content: commentInput.value ? [{ formatting: [], type: 'text', text: commentInput.value }] : [],
    tags,
    parent_post_id: postID,
    parent_tumblelog_uuid: parentTumblelogUUID,
    reblog_key: reblogKey,
    state,
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
}

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

const renderQuickTags = () => browser.storage.local.get(quickTagsStorageKey)
  .then(({ [quickTagsStorageKey]: tagBundles = [] }) =>
    quickTagsPanel.replaceChildren(
      ...tagBundles.map(tagBundle => button({
        'aria-pressed': 'false',
        'data-tags': tagBundle.tags,
        click: onTagsButtonClick,
      }, [
        span({}, [tagBundle.title]),
      ])),
    ),
  );

const renderTagSuggestions = ({ blogName, content, layout, postAuthor, rebloggedRootName, tags, trail }) => {
  const suggestedTags = new Set(tags);
  if (blogName) suggestedTags.add(blogName);
  if (postAuthor) suggestedTags.add(postAuthor);
  if (rebloggedRootName) suggestedTags.add(rebloggedRootName);
  suggestedTags.add(postType({ trail, content, layout }));

  suggestedTagsPanel.replaceChildren(
    ...[...suggestedTags].map(
      tag => button({
        'aria-pressed': 'false',
        'data-tags': tag,
        click: onTagsButtonClick,
      }, [
        span({}, [`#${tag}`]),
      ]),
    ),
  );
};

/** @param {PointerEvent} event (quickTagsPanel|suggestedTagsPanel).children[*] click event object */
function onTagsButtonClick ({ currentTarget }) {
  const { ariaPressed, dataset } = currentTarget;
  const bundleTags = dataset.tags.split(',').map(tag => tag.trim().toLowerCase());

  if (ariaPressed === 'true') {
    tagsInput.value = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => bundleTags.includes(tag.toLowerCase()) === false)
      .join(', ');
  } else {
    tagsInput.value.trim() === ''
      ? tagsInput.value = dataset.tags
      : tagsInput.value += `, ${dataset.tags}`;
  }

  currentTarget.ariaPressed = ariaPressed === 'false' ? 'true' : 'false';
}

const updateQuickTags = (changes) => {
  if (Object.keys(changes).includes(quickTagsStorageKey)) {
    renderQuickTags();
  }
};

const updateRememberedBlog = async ({ currentTarget: { value: selectedBlog } }) => {
  const {
    [rememberedBlogStorageKey]: rememberedBlogs = {},
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
    showTagSuggestions,
    showTagsInput,
    reblogTag,
    queueTag,
    alreadyRebloggedEnabled,
    alreadyRebloggedLimit,
  } = await getPreferences('quick_reblog'));

  blogSelector.replaceChildren(
    ...userBlogs.map(({ name, uuid }) => option({ value: uuid }, [name])),
    ...joinedCommunities.length ? [hr()] : [],
    ...joinedCommunities.map(({ title, uuid, blog: { name } }) => option({ value: uuid }, [`${title} (${name})`])),
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
      [rememberedBlogStorageKey]: rememberedBlogs = {},
    } = await browser.storage.local.get(rememberedBlogStorageKey);

    const savedBlogHash = rememberedBlogs[accountKey];
    const savedBlogUuid = [...blogHashes.keys()].find(uuid => blogHashes.get(uuid) === savedBlogHash);
    if (savedBlogUuid) blogSelector.value = savedBlogUuid;

    blogSelector.addEventListener('change', updateRememberedBlog);
  }

  blogSelectorContainer.hidden = !showBlogSelector;
  commentInput.hidden = !showCommentInput;
  tagsTabList.hidden = !(quickTagsIntegration && showTagSuggestions);
  tagsInput.hidden = !showTagsInput;

  onBlogSelectorChange();
  resetPopupState();

  $(document.body).on('mouseenter', buttonSelector, showPopupOnHover);
  $(document.body).on('pointercancel', buttonSelector, showPopupOnHover);
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
  $(document.body).off('pointercancel', buttonSelector, showPopupOnHover);
  $(document.body).off('contextmenu', buttonSelector, preventLongPressMenu);
  popupElement.remove();

  blogSelector.removeEventListener('change', updateRememberedBlog);

  browser.storage.local.onChanged.removeListener(updateQuickTags);
  onNewPosts.removeListener(processPosts);
};

export const stylesheet = true;
