(function() {
  let controlsSelector;
  let queueSetting;
  let draftSetting;

  const quickQueue = async function(event) {
    let postElement = event.target.closest('div[data-id]');
    if (!postElement) {
      event.target.setAttribute("fill", "red");
      return;
    }
    const post_id = postElement.dataset.id;

    const { apiFetch } = await fakeImport('/src/util/tumblr-helpers.js');
    const { timelineObject } = await fakeImport('/src/util/react-props.js');

    const {blog} = await timelineObject(post_id);
    const postObject = await apiFetch(`/v2/blog/${blog.uuid}/posts?id=${post_id}`);
    await apiFetch('/v2/blog/invalidcards.tumblr.com/post/reblog', {method: 'POST', body: {
      id: post_id,
      reblog_key: postObject.reblog_key
    }});
    event.target.setAttribute("fill", "magenta");
  }

  const quickDraft = async function(event) {
    console.log(event);
  }

  const addButtons = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit_quick_actions_done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit_quick_actions_done');

      const post_id = postElement.dataset.id;
      const {canReblog} = await timelineObject(post_id);

      if (canReblog) {
        const controls = postElement.querySelector(controlsSelector);
        if (queueSetting) {
          var queueButtonContainer = document.createElement('div');
          queueButtonContainer.classList.add('xkit_quick_actions_container');
          var queueButtonContainerSpan = document.createElement('span');
          queueButtonContainerSpan.classList.add('xkit_quick_actions_container_span');
          var queueButton = document.createElement('button');
          queueButton.classList.add('xkit_quick_actions_button');
          queueButton.addEventListener('click', quickQueue);
          queueButton.tabIndex = 0;
          var queueButtonInner = document.createElement('span');
          queueButtonInner.classList.add('xkit_quick_actions_button_inner');
          queueButtonInner.tabIndex = -1;
          queueButtonInner.innerHTML = '<svg viewBox="2 2 20 20" width="21" height="21" fill="var(--gray-65)"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-8h4v2h-6V7h2v5z"></path></svg>';
          queueButton.appendChild(queueButtonInner);
          queueButtonContainerSpan.appendChild(queueButton);
          queueButtonContainer.appendChild(queueButtonContainerSpan);
          controls.insertBefore(queueButtonContainer, controls.firstChild);
        }

        if (draftSetting) {
          var draftButtonContainer = document.createElement('div');
          draftButtonContainer.classList.add('xkit_quick_actions_container');
          var draftButtonContainerSpan = document.createElement('span');
          draftButtonContainerSpan.classList.add('xkit_quick_actions_container_span');
          var draftButton = document.createElement('button');
          draftButton.classList.add('xkit_quick_actions_button');
          draftButton.addEventListener('click', quickDraft);
          draftButton.tabIndex = 0;
          var draftButtonInner = document.createElement('span');
          draftButtonInner.classList.add('xkit_quick_actions_button_inner');
          draftButtonInner.tabIndex = -1;
          draftButtonInner.innerHTML = '<svg viewBox="2 2 20 20" width="21" height="21" fill="var(--gray-65)"><path d="M21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995L21 8zm-2 1h-5V4H5v16h14V9z"></path></svg>';
          draftButton.appendChild(draftButtonInner);
          draftButtonContainerSpan.appendChild(draftButton);
          draftButtonContainer.appendChild(draftButtonContainerSpan);
          controls.insertBefore(draftButtonContainer, controls.firstChild);
        }
      }
    });
  }

  const main = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css-map.js');
    controlsSelector = await keyToCss('controls');

    const {'quick_actions.preferences': preferences = {}} = await browser.storage.local.get('quick_actions.preferences');
    const {show_queue = true, show_draft = true} = preferences;

    if (show_queue || show_draft) {
      queueSetting = show_queue;
      draftSetting = show_draft;
      postListener.addListener(addButtons);
      addButtons();
    }
  }

  const clean = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.removeListener(addButtons);
    $('.xkit_quick_actions_container').remove();
  }

  const stylesheet = 'src/scripts/quick_actions.css';

  return { main, clean, stylesheet };
})();
