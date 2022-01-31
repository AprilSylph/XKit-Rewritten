import { timelineObjectMemoized } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';
import { getPostElements, postType } from '../util/interface.js';
import { getUserBlogs } from '../util/user_blogs.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';

const popupElement = Object.assign(document.createElement('div'), { id: 'quick-reblog' });
const blogSelector = document.createElement('select');
const commentInput = Object.assign(document.createElement('input'), {
  placeholder: 'Comment',
  autocomplete: 'off',
  onkeydown: event => event.stopPropagation()
});
const quickTagsList = Object.assign(document.createElement('div'), {
  className: 'quick-tags',
  tabIndex: -1
});
const tagsInput = Object.assign(document.createElement('input'), {
  placeholder: 'Tags (comma separated)',
  autocomplete: 'off',
  onkeydown: event => event.stopPropagation()
});
tagsInput.setAttribute('list', 'quick-reblog-tag-suggestions');
const tagSuggestions = Object.assign(document.createElement('datalist'), { id: 'quick-reblog-tag-suggestions' });
const actionButtons = Object.assign(document.createElement('fieldset'), { className: 'action-buttons' });
const reblogButton = Object.assign(document.createElement('button'), { textContent: 'Reblog' });
reblogButton.dataset.state = 'published';
const queueButton = Object.assign(document.createElement('button'), { textContent: 'Queue' });
queueButton.dataset.state = 'queue';
const draftButton = Object.assign(document.createElement('button'), { textContent: 'Draft' });
draftButton.dataset.state = 'draft';
[blogSelector, commentInput, quickTagsList, tagsInput, tagSuggestions, actionButtons].forEach(element => popupElement.appendChild(element));

let lastPostID;
let timeoutID;
let suggestableTags;

let popupPosition;
let showBlogSelector;
let rememberLastBlog;
let showCommentInput;
let quickTagsIntegration;
let showTagsInput;
let showTagSuggestions;
let queueTag;
let alreadyRebloggedEnabled;
let alreadyRebloggedLimit;

const storageKey = 'quick_reblog.alreadyRebloggedList';
const excludeClass = 'xkit-quick-reblog-alreadyreblogged-done';

const quickTagsStorageKey = 'quick_tags.preferences.tagBundles';

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

  tagSuggestions.append(
    ...tagsToSuggest.map(value => Object.assign(document.createElement('option'), { value }))
  );
};

const updateTagSuggestions = () => {
  if (tagsInput.value.trim().endsWith(',') || tagsInput.value.trim() === '') {
    renderTagSuggestions();
  }
};

tagsInput.addEventListener('input', updateTagSuggestions);

const showPopupOnHover = ({ currentTarget }) => {
  clearTimeout(timeoutID);

  currentTarget.closest('div').appendChild(popupElement);
  popupElement.parentNode.addEventListener('mouseleave', removePopupOnLeave);

  const thisPostID = currentTarget.closest('[data-id]').dataset.id;
  if (thisPostID !== lastPostID) {
    if (!rememberLastBlog) {
      blogSelector.value = blogSelector.options[0].value;
    }
    commentInput.value = '';
    tagsInput.value = '';
    timelineObjectMemoized(thisPostID).then(({ tags, trail, content, layout, blogName, rebloggedRootName }) => {
      suggestableTags = tags;
      if (blogName) suggestableTags.push(blogName);
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

const makeButtonReblogged = ({ buttonDiv, state }) => {
  ['published', 'queue', 'draft'].forEach(className => buttonDiv.classList.remove(className));
  buttonDiv.classList.add(state);
};

const reblogPost = async function ({ currentTarget }) {
  const currentReblogButton = popupElement.parentNode;

  currentTarget.blur();
  actionButtons.disabled = true;
  lastPostID = null;

  const postID = currentTarget.closest('[data-id]').dataset.id;
  const { state } = currentTarget.dataset;

  const blog = blogSelector.value;
  const tags = (state === 'queue' && queueTag) ? `${tagsInput.value}, ${queueTag}` : tagsInput.value;
  const { blog: { uuid: parentTumblelogUUID }, reblogKey, rebloggedRootId } = await timelineObjectMemoized(postID);

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
      makeButtonReblogged({ buttonDiv: currentReblogButton, state });
      if (lastPostID === null) {
        popupElement.remove();
      }

      notify(response.displayText);

      if (alreadyRebloggedEnabled) {
        const { [storageKey]: alreadyRebloggedList = [] } = await browser.storage.local.get(storageKey);
        const rootID = rebloggedRootId || postID;

        if (alreadyRebloggedList.includes(rootID) === false) {
          alreadyRebloggedList.push(rootID);
          alreadyRebloggedList.splice(0, alreadyRebloggedList.length - alreadyRebloggedLimit);
          await browser.storage.local.set({ [storageKey]: alreadyRebloggedList });
        }
      }
    }
  } catch ({ body }) {
    notify(body.errors[0].detail);
  } finally {
    actionButtons.disabled = false;
  }
};

[reblogButton, queueButton, draftButton].forEach(button => {
  button.addEventListener('click', reblogPost);
  actionButtons.appendChild(button);
});

const processPosts = async function () {
  const { [storageKey]: alreadyRebloggedList = [] } = await browser.storage.local.get(storageKey);
  for (const postElement of getPostElements({ excludeClass })) {
    const { id } = postElement.dataset;
    const { rebloggedRootId } = await timelineObjectMemoized(id);

    const rootID = rebloggedRootId || id;

    if (alreadyRebloggedList.includes(rootID)) {
      const reblogLink = postElement.querySelector('footer a[href*="/reblog/"]');
      if (!reblogLink) { continue; }
      const buttonDiv = reblogLink.parentNode;
      makeButtonReblogged({ buttonDiv, state: 'published' });
    }
  }
};

const renderQuickTags = async function () {
  quickTagsList.textContent = '';

  const { [quickTagsStorageKey]: tagBundles = [] } = await browser.storage.local.get(quickTagsStorageKey);
  tagBundles.forEach(tagBundle => {
    const bundleButton = document.createElement('button');
    bundleButton.textContent = tagBundle.title;
    bundleButton.addEventListener('click', event => {
      tagsInput.value.trim() === ''
        ? tagsInput.value = tagBundle.tags
        : tagsInput.value += `, ${tagBundle.tags}`;
    });

    quickTagsList.appendChild(bundleButton);
  });
};

const updateQuickTags = (changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(quickTagsStorageKey)) {
    renderQuickTags();
  }
};

export const main = async function () {
  ({
    popupPosition,
    showBlogSelector,
    rememberLastBlog,
    showCommentInput,
    quickTagsIntegration,
    showTagsInput,
    showTagSuggestions,
    queueTag,
    alreadyRebloggedEnabled,
    alreadyRebloggedLimit
  } = await getPreferences('quick_reblog'));

  popupElement.className = popupPosition;

  const userBlogs = await getUserBlogs();
  for (const { name, uuid } of userBlogs) {
    const option = document.createElement('option');
    option.value = uuid;
    option.textContent = name;
    blogSelector.appendChild(option);
  }

  blogSelector.hidden = !showBlogSelector;
  commentInput.hidden = !showCommentInput;
  quickTagsList.hidden = !quickTagsIntegration || !showTagsInput;
  tagsInput.hidden = !showTagsInput;

  $(document.body).on('mouseenter', '[data-id] footer a[href*="/reblog/"]', showPopupOnHover);

  if (quickTagsIntegration) {
    browser.storage.onChanged.addListener(updateQuickTags);
    renderQuickTags();
  }

  if (alreadyRebloggedEnabled) {
    onNewPosts.addListener(processPosts);
    processPosts();
  }
};

export const clean = async function () {
  $(document.body).off('mouseenter', '[data-id] footer a[href*="/reblog/"]', showPopupOnHover);

  popupElement.remove();

  blogSelector.textContent = '';

  browser.storage.onChanged.removeListener(updateQuickTags);

  onNewPosts.removeListener(processPosts);
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
