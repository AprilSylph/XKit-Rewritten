(function () {
  const buttonClass = 'xkit-quick-tags-button';
  const excludeClass = 'xkit-quick-tags-done';

  const popupElement = Object.assign(document.createElement('div'), { id: 'quick-tags' });

  let controlButtonTemplate;

  const storageKey = 'quick_tags.preferences.tagBundles';

  const populatePopup = async function () {
    popupElement.textContent = '';

    const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
    for (const tagBundle of tagBundles) {
      const bundleButton = document.createElement('button');
      bundleButton.textContent = tagBundle.title;
      bundleButton.dataset.tags = tagBundle.tags;
      popupElement.appendChild(bundleButton);
    }
  };

  const onStorageChanged = async function (changes, areaName) {
    if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
      populatePopup();
    }
  };

  const togglePopupDisplay = async function ({ target, currentTarget }) {
    if (target === popupElement || popupElement.contains(target)) { return; }

    const appendOrRemove = currentTarget.contains(popupElement) ? 'removeChild' : 'appendChild';
    currentTarget[appendOrRemove](popupElement);
  };

  const processBundleClick = async function ({ target }) {
    if (target.tagName !== 'BUTTON') { return; }
    const tagsToAdd = target.dataset.tags;

    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');
    const { apiFetch } = await fakeImport('/util/tumblr_helpers.js');

    const postElement = $(target).parents('[data-id]')[0];
    popupElement.parentNode.removeChild(popupElement);

    const postId = postElement.dataset.id;
    const { blog: { uuid } } = await timelineObjectMemoized(postId);

    const {
      response: {
        content = {},
        date,
        hide_trail: hideTrail = false,
        placement_id: placementId = '',
        slug = '',
        tags = []
      }
    } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`);

    tags.push(...tagsToAdd.split(','));

    const { response: { displayText } } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`, {
      method: 'PUT',
      body: {
        content,
        date,
        hide_trail: hideTrail,
        placement_id: placementId,
        slug,
        tags: tags.join(',')
      }
    });

    window.alert(displayText);
  };

  const processPosts = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');
    const { cloneControlButton } = await fakeImport('/util/control_buttons.js');

    getPostElements({ excludeClass }).forEach(async postElement => {
      const editButton = postElement.querySelector('footer a[href*="/edit/"]');
      if (!editButton) { return; }

      const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: togglePopupDisplay });
      editButton.parentNode.parentNode.insertBefore(clonedControlButton, editButton.parentNode);
    });
  };

  const main = async function () {
    const { createControlButtonTemplate } = await fakeImport('/util/control_buttons.js');
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    controlButtonTemplate = await createControlButtonTemplate('ri-price-tag-3-line', buttonClass);

    onNewPosts.addListener(processPosts);
    processPosts();

    browser.storage.onChanged.addListener(onStorageChanged);
    populatePopup();

    popupElement.addEventListener('click', processBundleClick);
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    onNewPosts.removeListener(processPosts);

    $(`.${buttonClass}`).remove();
    $(`.${excludeClass}`).removeClass(excludeClass);

    browser.storage.onChanged.removeListener(onStorageChanged);
  };

  return { main, clean, stylesheet: true };
})();
