(function () {
  const popupElement = Object.assign(document.createElement('div'), { id: 'quick-reblog' });
  const blogSelector = document.createElement('select');
  const commentInput = Object.assign(document.createElement('input'), {
    placeholder: 'Comment',
    autocomplete: 'off',
    onkeydown: event => event.stopPropagation()
  });
  const quickTagsList = Object.assign(document.createElement('div'), { className: 'quick-tags' });
  const tagsInput = Object.assign(document.createElement('input'), {
    placeholder: 'Tags (comma separated)',
    autocomplete: 'off',
    onkeydown: event => event.stopPropagation()
  });
  const actionButtons = Object.assign(document.createElement('fieldset'), { className: 'action-buttons' });
  const reblogButton = Object.assign(document.createElement('button'), { textContent: 'Reblog' });
  reblogButton.dataset.state = 'published';
  const queueButton = Object.assign(document.createElement('button'), { textContent: 'Queue' });
  queueButton.dataset.state = 'queue';
  const draftButton = Object.assign(document.createElement('button'), { textContent: 'Draft' });
  draftButton.dataset.state = 'draft';
  [blogSelector, commentInput, quickTagsList, tagsInput, actionButtons].forEach(element => popupElement.appendChild(element));

  let lastPostID;
  let timeoutID;

  let popupPosition;
  let showBlogSelector;
  let showCommentInput;
  let quickTagsIntegration;
  let showTagsInput;
  let alreadyRebloggedEnabled;
  let alreadyRebloggedLimit;

  const storageKey = 'quick_reblog.alreadyRebloggedList';
  const excludeClass = 'xkit-quick-reblog-alreadyreblogged-done';

  const quickTagsStorageKey = 'quick_tags.preferences.tagBundles';

  const showPopupOnHover = ({ target }) => {
    clearTimeout(timeoutID);

    $(target).parents('div')[0].appendChild(popupElement);
    popupElement.parentNode.addEventListener('mouseleave', removePopupOnLeave);

    const thisPostID = $(target).parents('[data-id]')[0].dataset.id;
    if (thisPostID !== lastPostID) {
      blogSelector.value = blogSelector.options[0].value;
      commentInput.value = '';
      tagsInput.value = '';
    }
    lastPostID = thisPostID;
  };

  const removePopupOnLeave = ({ target }) => {
    timeoutID = setTimeout(() => {
      const { parentNode } = popupElement;
      if (!parentNode) { return; }

      if (parentNode.matches(':hover')) { return; }

      if (parentNode.querySelector(':focus, :active') !== null) { return; }

      parentNode.removeEventListener('mouseleave', removePopupOnLeave);
      parentNode.removeChild(popupElement);
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

    const postID = lastPostID;
    lastPostID = null;

    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');
    const { apiFetch } = await fakeImport('/util/tumblr_helpers.js');

    const { state } = currentTarget.dataset;

    const blog = blogSelector.value;
    const tags = tagsInput.value;
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
          popupElement.parentNode.removeChild(popupElement);
        }

        browser.runtime.sendMessage({
          command: 'notifications:create',
          arguments: {
            options: { type: 'basic', title: 'XKit', message: response.displayText }
          }
        });

        if (alreadyRebloggedEnabled) {
          const { [storageKey]: alreadyRebloggedList = [] } = await browser.storage.local.get(storageKey);
          const rootID = rebloggedRootId || postID;

          if (alreadyRebloggedList.includes(rootID) === false) {
            alreadyRebloggedList.push(rootID);
            alreadyRebloggedList.splice(0, alreadyRebloggedList.length - alreadyRebloggedLimit);
            browser.storage.local.set({ [storageKey]: alreadyRebloggedList });
          }
        }
      }
    } catch ({ body }) {
      browser.runtime.sendMessage({
        command: 'notifications:create',
        arguments: {
          options: { type: 'basic', title: 'XKit', message: body.errors[0].detail }
        }
      });
    } finally {
      actionButtons.disabled = false;
    }
  };

  [reblogButton, queueButton, draftButton].forEach(button => {
    button.addEventListener('click', reblogPost);
    actionButtons.appendChild(button);
  });

  const processPosts = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');
    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');

    const { [storageKey]: alreadyRebloggedList = [] } = await browser.storage.local.get(storageKey);
    let storageModified = false;

    for (const postElement of getPostElements({ excludeClass })) {
      const { id } = postElement.dataset;
      const { rebloggedRootId, canEdit } = await timelineObjectMemoized(id);

      const rootID = rebloggedRootId || id;
      const ownReblog = rebloggedRootId !== undefined && canEdit === true;

      if (ownReblog && alreadyRebloggedList.includes(rootID) === false) {
        alreadyRebloggedList.push(rootID);
        storageModified = true;
      }

      if (alreadyRebloggedList.includes(rootID)) {
        const reblogLink = postElement.querySelector('footer a[href*="/reblog/"]');
        const buttonDiv = reblogLink.parentNode;
        makeButtonReblogged({ buttonDiv, state: 'published' });
      }
    }

    if (storageModified) {
      alreadyRebloggedList.splice(0, alreadyRebloggedList.length - alreadyRebloggedLimit);
      browser.storage.local.set({ [storageKey]: alreadyRebloggedList });
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

  const main = async function () {
    const { fetchUserBlogs } = await fakeImport('/util/user_blogs.js');
    const { getPreferences } = await fakeImport('/util/preferences.js');

    ({
      popupPosition,
      showBlogSelector,
      showCommentInput,
      quickTagsIntegration,
      showTagsInput,
      alreadyRebloggedEnabled,
      alreadyRebloggedLimit
    } = await getPreferences('quick_reblog'));

    popupElement.className = popupPosition;

    const userBlogs = await fetchUserBlogs();
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
      const { onNewPosts } = await fakeImport('/util/mutations.js');
      onNewPosts.addListener(processPosts);
      processPosts();
    }
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    $(document.body).off('mouseenter', '[data-id] footer a[href*="/reblog/"]', showPopupOnHover);

    if (popupElement.parentNode) {
      popupElement.parentNode.removeChild(popupElement);
    }

    blogSelector.textContent = '';

    browser.storage.onChanged.removeListener(updateQuickTags);

    onNewPosts.removeListener(processPosts);
    $(`.${excludeClass}`).removeClass(excludeClass);
  };

  return { main, clean, stylesheet: true, autoRestart: true };
})();
