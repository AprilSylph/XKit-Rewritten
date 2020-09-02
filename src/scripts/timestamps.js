(function() {
  let noteCountSelector;
  let reblogHeaderSelector;
  let reblogTimestampsSetting;
  let alwaysShowYearSetting;

  const constructTimeString = function(unixTime) {
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
      year: sameYear && !alwaysShowYearSetting ? undefined : 'numeric',
    });
  };

  const addPostTimestamps = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit-timestamps-done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit-timestamps-done');

      const post_id = postElement.dataset.id;
      const {timestamp, postUrl} = await timelineObject(post_id);

      const noteCountElement = postElement.querySelector(noteCountSelector);

      const timestampElement = document.createElement('a');
      timestampElement.className = 'xkit-timestamp';
      timestampElement.href = postUrl;
      timestampElement.target = '_blank';
      timestampElement.textContent = constructTimeString(timestamp);

      $(noteCountElement).after(timestampElement);
    });
  };

  const removePostTimestamps = function() {
    $('.xkit-timestamp').remove();
    $('.xkit-timestamps-done').removeClass('xkit-timestamps-done');
  };

  const addReblogTimestamps = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');
    const { apiFetch } = await fakeImport('/src/util/tumblr-helpers.js');

    [...document.querySelectorAll('[data-id]:not(.xkit-reblog-timestamps-done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit-reblog-timestamps-done');

      const post_id = postElement.dataset.id;
      let {trail} = await timelineObject(post_id);

      const reblogHeaders = postElement.querySelectorAll(reblogHeaderSelector);

      if (reblogTimestampsSetting === 'op') {
        trail = [trail[0]];
      }

      trail.forEach(async (trailItem, i) => {
        if (trailItem.blog === undefined || trailItem.blog.active === false) {
          return;
        }

        const {uuid} = trailItem.blog;
        const {id} = trailItem.post;

        const timestampElement = document.createElement('div');
        timestampElement.className = 'xkit-reblog-timestamp';

        try {
          const {response: {timestamp}} = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);
          timestampElement.textContent = constructTimeString(timestamp);
        } catch (exception) {
          timestampElement.textContent = exception.body.meta.msg;
        }

        reblogHeaders[i].appendChild(timestampElement);
      });
    });
  };

  const removeReblogTimestamps = function() {
    $('.xkit-reblog-timestamp').remove();
    $('.xkit-reblog-timestamps-done').removeClass('xkit-reblog-timestamps-done');
  };

  const onStorageChanged = async function(changes, areaName) {
    const {'timestamps.preferences': preferences} = changes;
    if (!preferences || areaName !== 'local') {
      return;
    }

    const {newValue: {always_show_year, reblog_timestamps}} = preferences;

    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    if (always_show_year !== alwaysShowYearSetting) {
      alwaysShowYearSetting = always_show_year;

      onNewPosts.removeListener(addPostTimestamps);
      removePostTimestamps();

      onNewPosts.addListener(addPostTimestamps);
      addPostTimestamps();
    }

    reblogTimestampsSetting = reblog_timestamps;

    onNewPosts.removeListener(addReblogTimestamps);
    removeReblogTimestamps();

    if (reblog_timestamps !== 'none') {
      onNewPosts.addListener(addReblogTimestamps);
      addReblogTimestamps();
    }
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css-map.js');
    noteCountSelector = await keyToCss('noteCount');
    reblogHeaderSelector = await keyToCss('reblogHeader');

    onNewPosts.addListener(addPostTimestamps);
    addPostTimestamps();

    const {'timestamps.preferences': preferences = {}} = await browser.storage.local.get('timestamps.preferences');
    const {always_show_year = false} = preferences;
    const {reblog_timestamps = 'op'} = preferences;

    alwaysShowYearSetting = always_show_year;

    if (reblog_timestamps !== 'none') {
      reblogTimestampsSetting = reblog_timestamps;
      onNewPosts.addListener(addReblogTimestamps);
      addReblogTimestamps();
    }
  };

  const clean = async function() {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(addPostTimestamps);
    onNewPosts.removeListener(addReblogTimestamps);
    removePostTimestamps();
    removeReblogTimestamps();
  };

  const stylesheet = '/src/scripts/timestamps.css';

  return { main, clean, stylesheet };
})();
