(function () {
  let popupElement;
  let lastPostID;

  let alreadyRebloggedEnabled;
  let alreadyRebloggedLimit;

  const storageKey = 'quick_reblog.alreadyRebloggedList';
  const excludeClass = 'xkit-quick-reblog-alreadyreblogged-done';

  const showPopupOnHover = ({ target }) => {
    const messageDialog = popupElement.querySelector('.message');
    if (messageDialog.textContent === 'Working...') {
      return;
    }

    $(target).parents('div')[0].appendChild(popupElement);

    const thisPostID = $(target).parents('[data-id]')[0].dataset.id;
    if (thisPostID !== lastPostID) {
      messageDialog.textContent = '';

      const blogSelector = popupElement.querySelector('#blog');
      blogSelector.value = blogSelector.options[0].value;

      const tagsInput = popupElement.querySelector('#tags');
      tagsInput.value = '';
    }
    lastPostID = thisPostID;
  };

  const removePopupOnClick = ({ target }) => {
    if (popupElement.contains(target)) {
      return;
    }

    if (popupElement.querySelector('.message').textContent === 'Working...') {
      return;
    }

    if (popupElement.parentNode) {
      popupElement.parentNode.removeChild(popupElement);
    }
  };

  const makeButtonReblogged = ({ buttonDiv, state }) => {
    ['published', 'queue', 'draft'].forEach(className => buttonDiv.classList.remove(className));
    buttonDiv.classList.add(state);
  };

  const reblogPost = async function (event) {
    const messageDialog = popupElement.querySelector('.message');
    messageDialog.textContent = 'Working...';

    const postID = lastPostID;
    lastPostID = null;

    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');
    const { apiFetch } = await fakeImport('/util/tumblr_helpers.js');

    const { state } = event.target.dataset;

    const blog = popupElement.querySelector('#blog').value;
    const tags = popupElement.querySelector('#tags').value;
    const { blog: { uuid: parentTumblelogUUID }, reblogKey, rebloggedRootId } = await timelineObjectMemoized(postID);

    const requestPath = `/v2/blog/${blog}/posts`;

    const requestBody = {
      content: [],
      tags,
      parent_post_id: postID,
      parent_tumblelog_uuid: parentTumblelogUUID,
      reblog_key: reblogKey,
      state,
    };

    try {
      const { meta, response } = await apiFetch(requestPath, { method: 'POST', body: requestBody });
      if (meta.status === 201) {
        makeButtonReblogged({ buttonDiv: popupElement.parentNode, state });
        messageDialog.textContent = response.displayText;
        setTimeout(() => popupElement.parentNode.removeChild(popupElement), 2000);

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
    } catch (exception) {
      console.error(exception);
    }
  };

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
        alreadyRebloggedList.splice(0, alreadyRebloggedList.length - alreadyRebloggedLimit);
        storageModified = true;
      }

      if (alreadyRebloggedList.includes(rootID)) {
        const reblogLink = postElement.querySelector('footer a[href^="https://www.tumblr.com/reblog/"]');
        const buttonDiv = reblogLink.parentNode;
        makeButtonReblogged({ buttonDiv, state: 'published' });
      }
    }

    if (storageModified) {
      browser.storage.local.set({ [storageKey]: alreadyRebloggedList });
    }
  };

  const main = async function () {
    const { fetchUserBlogs } = await fakeImport('/util/user_blogs.js');
    const { getPreferences } = await fakeImport('/util/preferences.js');

    const blogSelector = document.createElement('select');
    blogSelector.id = 'blog';
    const userBlogs = await fetchUserBlogs();
    for (const { name, uuid } of userBlogs) {
      const option = document.createElement('option');
      option.value = uuid;
      option.textContent = name;
      blogSelector.appendChild(option);
    }

    const tagsInput = document.createElement('input');
    tagsInput.id = 'tags';
    tagsInput.placeholder = 'Tags (comma separated)';
    tagsInput.autocomplete = 'off';
    tagsInput.addEventListener('keydown', event => event.stopPropagation());

    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');

    const reblogButton = document.createElement('button');
    reblogButton.textContent = 'Reblog';
    reblogButton.dataset.state = 'published';

    const queueButton = document.createElement('button');
    queueButton.textContent = 'Queue';
    queueButton.dataset.state = 'queue';

    const draftButton = document.createElement('button');
    draftButton.textContent = 'Draft';
    draftButton.dataset.state = 'draft';

    [reblogButton, queueButton, draftButton].forEach(button => {
      button.addEventListener('click', reblogPost);
      actionButtons.appendChild(button);
    });

    const messageDialog = document.createElement('div');
    messageDialog.classList.add('message');

    popupElement = document.createElement('div');
    popupElement.classList.add('quick-reblog');
    [messageDialog, blogSelector, tagsInput, actionButtons].forEach(element => popupElement.appendChild(element));

    $(document.body).on('mouseover', '[data-id] a[href^="https://www.tumblr.com/reblog/"]', showPopupOnHover);
    document.body.addEventListener('click', removePopupOnClick);

    ({ alreadyRebloggedEnabled, alreadyRebloggedLimit } = await getPreferences('quick_reblog'));

    if (alreadyRebloggedEnabled) {
      const { onNewPosts } = await fakeImport('/util/mutations.js');
      onNewPosts.addListener(processPosts);
    }
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    $(document.body).off('mouseover', '[data-id] a[href^="https://www.tumblr.com/reblog/"]', showPopupOnHover);
    document.body.removeEventListener('click', removePopupOnClick);

    if (popupElement.parentNode) {
      popupElement.parentNode.removeChild(popupElement);
    }

    onNewPosts.removeListener(processPosts);
    $(`.${excludeClass}`).removeClass(excludeClass);
  };

  return { main, clean, stylesheet: true, autoRestart: true };
})();
