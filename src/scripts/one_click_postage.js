(function() {
  let popupElement;
  let lastPostID;

  const removePopup = event => {
    if (!popupElement.contains(event.target)) {
      popupElement.parentNode.removeChild(popupElement);
    }
  };

  const reblogPost = async function(event) {
    popupElement.classList.add('working');

    const postID = lastPostID;
    lastPostID = null;

    const { timelineObject } = await fakeImport('/src/util/react_props.js');
    const { apiFetch } = await fakeImport('/src/util/tumblr_helpers.js');

    const {state} = event.target.dataset;

    const uuid = popupElement.querySelector('select').value;
    const tags = popupElement.querySelector('input').value;
    const {blog: {uuid: parentTumblelogUUID}, reblogKey} = await timelineObject(postID);

    const requestPath = `/v2/blog/${uuid}/posts`;

    const requestBody = {
      content: [],
      tags,
      parent_post_id: postID,
      parent_tumblelog_uuid: parentTumblelogUUID,
      reblog_key: reblogKey,
      state,
    };

    try {
      const {meta, response} = await apiFetch(requestPath, { method: 'POST', body: requestBody });
      if (meta.status === 201) {
        popupElement.parentNode.removeChild(popupElement);
        alert(response.displayText);
      }
    } catch (exception) {
      console.error(exception);
    }
  };

  const main = async function() {
    const { fetchUserBlogs } = await fakeImport('/src/util/user_blogs.js');

    const blogSelector = document.createElement('select');
    const userBlogs = await fetchUserBlogs();
    for (const {name, uuid} of userBlogs) {
      const option = document.createElement('option');
      option.value = uuid;
      option.textContent = name;
      blogSelector.appendChild(option);
    }

    const tagsInput = document.createElement('input');
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

    popupElement = document.createElement('div');
    popupElement.classList.add('one-click-postage-popup');
    [blogSelector, tagsInput, actionButtons].forEach(element => popupElement.appendChild(element));

    $(document.body).on('mouseover', '[data-id] a[href^="https://www.tumblr.com/reblog/"]', event => {
      const {target} = event;
      $(target).parents('div')[0].appendChild(popupElement);

      const thisPostID = $(target).parents('[data-id]')[0].dataset.id;
      if (thisPostID !== lastPostID) {
        popupElement.querySelector('select').value = userBlogs[0].uuid;
        popupElement.querySelector('input').value = '';
        popupElement.classList.remove('working');
      }
      lastPostID = thisPostID;
    });

    document.body.addEventListener('click', removePopup);
  };

  const clean = async function() {
    $(document.body).off('mouseover', '[data-id] a[href^="https://www.tumblr.com/reblog/"]');
    popupElement.parentNode.removeChild(popupElement);
  };

  return { main, clean, stylesheet: true };
})();
