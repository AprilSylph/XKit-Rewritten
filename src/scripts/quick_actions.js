(function() {
  let controlsSelector;

  const quickQueue = async function(event) {
    const postElement = event.target.closest('div[data-id]');
    if (!postElement) {
      event.target.setAttribute('fill', 'var(--red)');
      return;
    }
    event.target.setAttribute('fill', 'var(--pink)');
    const post_id = postElement.dataset.id;

    const { apiFetch } = await fakeImport('/src/util/tumblr-helpers.js');
    const { timelineObject } = await fakeImport('/src/util/react-props.js');
    const { fetchDefaultBlog } = await fakeImport('/src/util/user-blogs.js');

    const {name: defaultBlog = ''} = await fetchDefaultBlog();

    const {blog, content, layout, reblogKey} = await timelineObject(post_id);
    try {
      const response = await apiFetch(`/v2/blog/${defaultBlog}.tumblr.com/posts`, {method: 'POST',
        body: {
          content,
          layout,
          state: 'queue',
          parent_tumblelog_uuid: blog.uuid,
          parent_post_id: post_id,
          reblog_key: reblogKey,
        }});
      if ([200, 201].includes(response.meta.status)) {
        event.target.setAttribute('fill', 'var(--purple)');
      } else {
        event.target.setAttribute('fill', 'var(--red)');
      }
    } catch (e) {
      if (e.status === 400) {
        event.target.setAttribute('fill', 'var(--blue)');
        try {
          const draftResponse = await apiFetch(`/v2/blog/${defaultBlog}.tumblr.com/posts`, {method: 'POST',
            body: {
              content,
              layout,
              state: 'draft',
              parent_tumblelog_uuid: blog.uuid,
              parent_post_id: post_id,
              reblog_key: reblogKey,
            }});
          if ([200, 201].includes(draftResponse.meta.status)) {
            event.target.setAttribute('fill', 'var(--green)');
          } else {
            event.target.setAttribute('fill', 'var(--red)');
          }
        } catch (err) {
          event.target.setAttribute('fill', 'var(--red)');
          console.error(err.body);
        }
      } else {
        event.target.setAttribute('fill', 'var(--red)');
        console.error(e.body);
      }
    }
  };

  const addButtons = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit_quick_actions_done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit_quick_actions_done');

      const post_id = postElement.dataset.id;
      const {canReblog} = await timelineObject(post_id);

      if (canReblog) {
        const controls = postElement.querySelector(controlsSelector);

        const queueButtonContainer = document.createElement('div');
        queueButtonContainer.classList.add('xkit_quick_actions_container');

        const queueButtonContainerSpan = document.createElement('span');
        queueButtonContainerSpan.classList.add('xkit_quick_actions_container_span');

        const queueButton = document.createElement('button');
        queueButton.classList.add('xkit_quick_actions_button');
        queueButton.addEventListener('click', quickQueue);
        queueButton.tabIndex = 0;

        const queueButtonInner = document.createElement('span');
        queueButtonInner.classList.add('xkit_quick_actions_button_inner');
        queueButtonInner.tabIndex = -1;
        queueButtonInner.innerHTML = '<svg viewBox="2 2 20 20" width="21" height="21" fill="var(--gray-65)"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-8h4v2h-6V7h2v5z"></path></svg>';

        queueButton.appendChild(queueButtonInner);
        queueButtonContainerSpan.appendChild(queueButton);
        queueButtonContainer.appendChild(queueButtonContainerSpan);
        controls.insertBefore(queueButtonContainer, controls.firstChild);
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
    $('.xkit_quick_actions_container').remove();
  };

  const stylesheet = 'src/scripts/quick_actions.css';

  return { main, clean, stylesheet };
})();
