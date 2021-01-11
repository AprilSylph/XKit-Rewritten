(function () {
  const storageKey = 'tag_tracking_plus.trackedTagTimestamps';
  const excludeClass = 'xkit-tag-tracking-plus-done';

  let searchResultSelector;
  let tagTextSelector;
  let tagsYouFollowString;

  const processPosts = async function () {
    const { searchParams } = new URL(location);
    if (!location.pathname.startsWith('/tagged/') || searchParams.get('sort') === 'top') {
      return;
    }

    const { apiFetch } = await fakeImport('/util/tumblr_helpers.js');
    const { getPostElements } = await fakeImport('/util/interface.js');
    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');

    const currentTag = decodeURIComponent(location.pathname.split('/')[2].replace(/\+/g, ' '));
    const { response: { following } } = await apiFetch('/v2/user/tags/following', { queryParams: { tag: currentTag } });
    if (!following) { return; }

    const { [storageKey]: timestamps = {} } = await browser.storage.local.get(storageKey);
    for (const postElement of getPostElements({ excludeClass, noPeepr: true, includeFiltered: true })) {
      const { timestamp } = await timelineObjectMemoized(postElement.dataset.id);
      const savedTimestamp = timestamps[currentTag] || 0;

      if (timestamp > savedTimestamp) {
        timestamps[currentTag] = timestamp;
      }
    }
    browser.storage.local.set({ [storageKey]: timestamps });
  };

  const processTagLinks = async function () {
    const searchResultElement = document.querySelector(searchResultSelector);
    if (!searchResultElement || searchResultElement.classList.contains(excludeClass)) { return; }

    searchResultElement.classList.add(excludeClass);
    const { [storageKey]: timestamps = {} } = await browser.storage.local.get(storageKey);

    const tagsYouFollowHeading = [...searchResultElement.querySelectorAll('h3')].find(h3 => h3.textContent === tagsYouFollowString);
    if (!tagsYouFollowHeading) { return; }
    tagsYouFollowHeading.dataset.followedTags = true;

    const tagLinkElements = searchResultElement.querySelectorAll('[data-followed-tags] ~ [href^="/tagged/"]');
    if (!tagLinkElements) { return; }

    const { apiFetch } = await fakeImport('/util/tumblr_helpers.js');

    tagLinkElements.forEach(async tagLinkElement => {
      const tag = tagLinkElement.querySelector(tagTextSelector).textContent;
      const savedTimestamp = timestamps[tag] || 0;

      const { response: { timeline: { elements } } } = await apiFetch(`/v2/hubs/${tag}/timeline`, { queryParams: { limit: 20, sort: 'recent' } });
      let unreadCount = 0;

      for (const post of elements) {
        const { timestamp } = post;
        if (timestamp <= savedTimestamp) {
          break;
        } else {
          unreadCount++;
        }
      }

      if (unreadCount === elements.length) {
        unreadCount += '+';
      }

      const unreadCountElement = Object.assign(document.createElement('span'), {
        style: 'margin-left: auto; margin-right: 1ch; opacity: 0.65;',
        textContent: `${unreadCount}`,
      });

      tagLinkElement.firstElementChild.appendChild(unreadCountElement);
    });
  };

  const main = async function () {
    const { keyToCss } = await fakeImport('/util/css_map.js');
    const { onNewPosts, onBaseContainerMutated } = await fakeImport('/util/mutations.js');
    const { translate } = await fakeImport('/util/language_data.js');

    searchResultSelector = await keyToCss('searchResult');
    tagTextSelector = await keyToCss('tagText');
    tagsYouFollowString = await translate('Tags you follow');

    onNewPosts.addListener(processPosts);
    processPosts();

    onBaseContainerMutated.addListener(processTagLinks);
    processTagLinks();
  };

  const clean = async function () {
    const { onNewPosts, onBaseContainerMutated } = await fakeImport('/util/mutations.js');

    onNewPosts.removeListener(processPosts);
    onBaseContainerMutated.removeListener(processTagLinks);
  };

  return { main, clean };
})();
