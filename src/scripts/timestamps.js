(function () {
  let noteCountSelector;
  let reblogHeaderSelector;
  let reblogTimestamps;
  let alwaysShowYear;

  const constructTimeString = function (unixTime) {
    const locale = document.documentElement.lang;
    const date = new Date(unixTime * 1000);
    const now = new Date();

    const sameDate = date.toDateString() === now.toDateString();
    const sameYear = date.getFullYear() === now.getFullYear();

    if (sameDate) {
      return date.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: 'numeric',
      });
    }

    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: sameYear && !alwaysShowYear ? undefined : 'numeric',
    });
  };

  const addPostTimestamps = async function () {
    const { getPostElements } = await fakeImport('/src/util/interface.js');
    const { timelineObject } = await fakeImport('/src/util/react_props.js');

    getPostElements({ excludeClass: 'xkit-timestamps-done' }).forEach(async postElement => {
      const { timestamp, postUrl } = await timelineObject(postElement.dataset.id);

      const noteCountElement = postElement.querySelector(noteCountSelector);

      const timestampElement = document.createElement('a');
      timestampElement.className = 'xkit-timestamp';
      timestampElement.href = postUrl;
      timestampElement.target = '_blank';
      timestampElement.textContent = constructTimeString(timestamp);

      $(noteCountElement).after(timestampElement);
    });
  };

  const removePostTimestamps = function () {
    $('.xkit-timestamp').remove();
    $('.xkit-timestamps-done').removeClass('xkit-timestamps-done');
  };

  const addReblogTimestamps = async function () {
    const { getPostElements } = await fakeImport('/src/util/interface.js');
    const { timelineObject } = await fakeImport('/src/util/react_props.js');
    const { apiFetch } = await fakeImport('/src/util/tumblr_helpers.js');

    getPostElements({ excludeClass: 'xkit-reblog-timestamps-done' }).forEach(async postElement => {
      let { trail } = await timelineObject(postElement.dataset.id);

      const reblogHeaders = postElement.querySelectorAll(reblogHeaderSelector);

      if (reblogTimestamps === 'op') {
        trail = [trail[0]];
      }

      trail.forEach(async (trailItem, i) => {
        if (trailItem.blog === undefined || trailItem.blog.active === false) {
          return;
        }

        const { uuid } = trailItem.blog;
        const { id } = trailItem.post;

        const timestampElement = document.createElement('div');
        timestampElement.className = 'xkit-reblog-timestamp';

        try {
          const { response: { timestamp } } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);
          timestampElement.textContent = constructTimeString(timestamp);
        } catch (exception) {
          timestampElement.textContent = exception.body.meta.msg;
        }

        reblogHeaders[i].appendChild(timestampElement);
      });
    });
  };

  const removeReblogTimestamps = function () {
    $('.xkit-reblog-timestamp').remove();
    $('.xkit-reblog-timestamps-done').removeClass('xkit-reblog-timestamps-done');
  };

  const onStorageChanged = async function (changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const {
      'timestamps.preferences.alwaysShowYear': alwaysShowYearChanges,
      'timestamps.preferences.reblogTimestamps': reblogTimestampsChanges,
    } = changes;

    if (!alwaysShowYearChanges && !reblogTimestampsChanges) {
      return;
    }

    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    if (alwaysShowYearChanges) {
      ({ newValue: alwaysShowYear } = alwaysShowYearChanges);

      onNewPosts.removeListener(addPostTimestamps);
      onNewPosts.removeListener(addReblogTimestamps);
      removePostTimestamps();
      removeReblogTimestamps();

      onNewPosts.addListener(addPostTimestamps);
      addPostTimestamps();

      if (reblogTimestamps !== 'none') {
        onNewPosts.addListener(addReblogTimestamps);
        addReblogTimestamps();
      }
    }

    if (reblogTimestampsChanges) {
      ({ newValue: reblogTimestamps } = reblogTimestampsChanges);

      onNewPosts.removeListener(addReblogTimestamps);
      removeReblogTimestamps();

      if (reblogTimestamps !== 'none') {
        onNewPosts.addListener(addReblogTimestamps);
        addReblogTimestamps();
      }
    }
  };

  const main = async function () {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css_map.js');

    ({ alwaysShowYear, reblogTimestamps } = await getPreferences('timestamps'));

    noteCountSelector = await keyToCss('noteCount');
    reblogHeaderSelector = await keyToCss('reblogHeader');

    onNewPosts.addListener(addPostTimestamps);
    addPostTimestamps();

    if (reblogTimestamps !== 'none') {
      onNewPosts.addListener(addReblogTimestamps);
      addReblogTimestamps();
    }
  };

  const clean = async function () {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(addPostTimestamps);
    onNewPosts.removeListener(addReblogTimestamps);
    removePostTimestamps();
    removeReblogTimestamps();
  };

  return { main, clean, stylesheet: true };
})();
