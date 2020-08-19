(function() {
  let noteCountSelector;
  let reblogHeaderSelector;
  let reblogTimestampsSetting;

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
      year: sameYear ? undefined : 'numeric',
    });
  };

  const addPostTimestamps = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit_timestamps_done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit_timestamps_done');

      const post_id = postElement.dataset.id;
      const {timestamp, postUrl} = await timelineObject(post_id);

      const noteCountElement = postElement.querySelector(noteCountSelector);

      const timestampElement = document.createElement('a');
      timestampElement.className = 'xkit_timestamp';
      timestampElement.href = postUrl;
      timestampElement.target = '_blank';
      timestampElement.textContent = constructTimeString(timestamp);

      $(noteCountElement).after(timestampElement);
    });
  };

  const removePostTimestamps = function() {
    $('.xkit_timestamp').remove();
    $('.xkit_timestamps_done').removeClass('xkit_timestamps_done');
  };

  const addReblogTimestamps = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');
    const { apiFetch } = await fakeImport('/src/util/tumblr-helpers.js');

    [...document.querySelectorAll('[data-id]:not(.xkit_reblog_timestamps_done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit_reblog_timestamps_done');

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

        const {response: {timestamp}} = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);

        const timestampElement = document.createElement('div');
        timestampElement.className = 'xkit_reblog_timestamp';
        timestampElement.textContent = constructTimeString(timestamp);

        reblogHeaders[i].appendChild(timestampElement);
      });
    });
  };

  const removeReblogTimestamps = function() {
    $('.xkit_reblog_timestamp').remove();
    $('.xkit_reblog_timestamps_done').removeClass('xkit_reblog_timestamps_done');
  };

  const onStorageChanged = async function(changes, areaName) {
    const {'timestamps.preferences': preferences} = changes;
    if (!preferences || areaName !== 'local') {
      return;
    }

    const {newValue: {reblog_timestamps}} = preferences;
    reblogTimestampsSetting = reblog_timestamps;

    const { postListener } = await fakeImport('/src/util/mutations.js');

    postListener.removeListener(addReblogTimestamps);
    removeReblogTimestamps();

    if (reblog_timestamps !== 'none') {
      postListener.addListener(addReblogTimestamps);
      addReblogTimestamps();
    }
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { postListener } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css-map.js');
    noteCountSelector = await keyToCss('noteCount');
    reblogHeaderSelector = await keyToCss('reblogHeader');

    postListener.addListener(addPostTimestamps);
    addPostTimestamps();

    const {'timestamps.preferences': preferences = {
      reblog_timestamps: 'op',
    }} = await browser.storage.local.get('timestamps.preferences');

    if (preferences.reblog_timestamps !== 'none') {
      reblogTimestampsSetting = preferences.reblog_timestamps;
      postListener.addListener(addReblogTimestamps);
      addReblogTimestamps();
    }
  };

  const clean = async function() {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.removeListener(addPostTimestamps);
    postListener.removeListener(addReblogTimestamps);
    removePostTimestamps();
    removeReblogTimestamps();
  };

  const stylesheet = '/src/scripts/timestamps.css';

  return { main, clean, stylesheet };
})();
