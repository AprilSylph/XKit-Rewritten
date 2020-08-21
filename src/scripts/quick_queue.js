(function() {
  let controlsSelector;
  const queuePath = '<path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-8h4v2h-6V7h2v5z"/>';
  const errorCrossPath = '<path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"/>';
  const loadPath = '<path d="M5.463 4.433A9.961 9.961 0 0 1 12 2c5.523 0 10 4.477 10 10 0 2.136-.67 4.116-1.81 5.74L17 12h3A8 8 0 0 0 6.46 6.228l-.997-1.795zm13.074 15.134A9.961 9.961 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.136.67-4.116 1.81-5.74L7 12H4a8 8 0 0 0 13.54 5.772l.997 1.795z"/>';
  const draftPath = '<path d="M21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995L21 8zm-2 1h-5V4H5v16h14V9z"/>';

  const quickQueue = async function(event) {
    const postElement = event.target.closest('div[data-id]');
    if (!postElement) {
      event.target.innerHTML = errorCrossPath;
      event.target.setAttribute('fill', 'var(--red)');
      return;
    }
    event.target.innerHTML = loadPath;
    const post_id = postElement.dataset.id;

    const { apiFetch } = await fakeImport('/src/util/tumblr-helpers.js');
    const { timelineObject } = await fakeImport('/src/util/react-props.js');
    const { fetchDefaultBlog } = await fakeImport('/src/util/user-blogs.js');

    const {uuid: defaultBlogUuid = ''} = await fetchDefaultBlog();

    const {blog, content, layout, reblogKey} = await timelineObject(post_id);
    try {
      const response = await apiFetch(`/v2/blog/${defaultBlogUuid}/posts`, {method: 'POST',
        body: {
          content,
          layout,
          state: 'queue',
          parent_tumblelog_uuid: blog.uuid,
          parent_post_id: post_id,
          reblog_key: reblogKey,
        }});
      if ([200, 201].includes(response.meta.status)) {
        event.target.innerHTML = queuePath;
        event.target.setAttribute('fill', 'var(--green)');
      } else {
        event.target.innerHTML = errorCrossPath;
        event.target.setAttribute('fill', 'var(--red)');
      }
    } catch (e) {
      if (e.status === 400) {
        try {
          const draftResponse = await apiFetch(`/v2/blog/${defaultBlogUuid}/posts`, {method: 'POST',
            body: {
              content,
              layout,
              state: 'draft',
              parent_tumblelog_uuid: blog.uuid,
              parent_post_id: post_id,
              reblog_key: reblogKey,
            }});
          if ([200, 201].includes(draftResponse.meta.status)) {
            event.target.innerHTML = draftPath;
            event.target.setAttribute('fill', 'var(--green)');
          } else {
            event.target.innerHTML = errorCrossPath;
            event.target.setAttribute('fill', 'var(--red)');
          }
        } catch (err) {
          event.target.innerHTML = errorCrossPath;
          event.target.setAttribute('fill', 'var(--red)');
          console.error(err.body);
        }
      } else {
        event.target.innerHTML = errorCrossPath;
        event.target.setAttribute('fill', 'var(--red)');
        console.error(e.body);
      }
    }
  };

  const addButtons = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');
    const { translate } = await fakeImport('/src/util/language-data.js');

    const reblogButtonAriaLabel = await translate('Reblog');

    [...document.querySelectorAll('[data-id]:not(.xkit_quick_queue_done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit_quick_queue_done');

      const post_id = postElement.dataset.id;
      const {canReblog} = await timelineObject(post_id);

      if (canReblog) {
        const controls = postElement.querySelector(controlsSelector);

        const queueButtonContainer = document.createElement('div');
        queueButtonContainer.classList.add('xkit_quick_queue_container');

        const queueButtonContainerSpan = document.createElement('span');
        queueButtonContainerSpan.classList.add('xkit_quick_queue_container_span');

        const queueButton = document.createElement('button');
        queueButton.classList.add('xkit_quick_queue_button');
        queueButton.addEventListener('click', quickQueue);
        queueButton.tabIndex = 0;

        const queueButtonInner = document.createElement('span');
        queueButtonInner.classList.add('xkit_quick_queue_button_inner');
        queueButtonInner.tabIndex = -1;
        queueButtonInner.innerHTML = `<svg viewBox="2 2 20 20" width="21" height="21" fill="var(--gray-65)">${queuePath}</svg>`;

        queueButton.appendChild(queueButtonInner);
        queueButtonContainerSpan.appendChild(queueButton);
        queueButtonContainer.appendChild(queueButtonContainerSpan);

        const reblogButton = postElement.querySelector(`[aria-label="${reblogButtonAriaLabel}"]`).parentElement;
        controls.insertBefore(queueButtonContainer, reblogButton);
      }
    });
  };

  const main = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css-map.js');
    controlsSelector = await keyToCss('controls');

    postListener.addListener(addButtons);
    addButtons();
  };

  const clean = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.removeListener(addButtons);
    $('.xkit_quick_queue_container').remove();
  };

  const stylesheet = 'src/scripts/quick_queue.css';

  return { main, clean, stylesheet };
})();
