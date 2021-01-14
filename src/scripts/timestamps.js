(function () {
  let noteCountSelector;
  let reblogHeaderSelector;
  let reblogTimestamps;
  let alwaysShowYear;
  let headerTimestamps;
  const cache = {};
  const relativeTimeFormat = new Intl.RelativeTimeFormat(document.documentElement.lang, { style: 'long' });
  const thresholds = [
    { unit: 'year', denominator: 31557600 },
    { unit: 'month', denominator: 2629800 },
    { unit: 'day', denominator: 86400 },
    { unit: 'hour', denominator: 3600 },
    { unit: 'minute', denominator: 60 },
    { unit: 'second', denominator: 1 },
  ];

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

  const constructLongTimeString = function (unixTime) {
    const locale = document.documentElement.lang;
    const date = new Date(unixTime * 1000);

    return date.toLocaleString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const constructRelativeTimeString = function (unixTime) {
    const now = Math.floor(new Date().getTime() / 1000);
    let unixDiff = unixTime - now;

    const negative = unixDiff < 0;
    if (negative) { unixDiff = Math.abs(unixDiff); }

    for (const { unit, denominator } of thresholds) {
      if (unixDiff >= denominator) {
        const value = Math.floor(unixDiff / denominator);
        return relativeTimeFormat.format(negative ? -value : value, unit);
      }
    }
  };

  const addPostTimestamps = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');
    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');

    getPostElements({ excludeClass: 'xkit-timestamps-done' }).forEach(async postElement => {
      const { id } = postElement.dataset;

      const { timestamp, postUrl } = await timelineObjectMemoized(id);
      cache[id] = Promise.resolve(timestamp);

      const noteCountElement = postElement.querySelector(noteCountSelector);

      const relativeTimeString = constructRelativeTimeString(timestamp);

      const timestampElement = document.createElement('a');
      timestampElement.className = 'xkit-timestamp';
      timestampElement.href = postUrl;
      timestampElement.target = '_blank';
      timestampElement.textContent = constructTimeString(timestamp);
      timestampElement.title = relativeTimeString;

      $(noteCountElement).after(timestampElement);

      if (headerTimestamps) {
        const longTimestampElement = document.createElement('div');
        longTimestampElement.className = 'xkit-long-timestamp';
        longTimestampElement.textContent = `${constructLongTimeString(timestamp)} ・ ${relativeTimeString}`;

        $(postElement.querySelector('header')).after(longTimestampElement);
      }
    });
  };

  const removePostTimestamps = function () {
    $('.xkit-timestamp').remove();
    $('.xkit-long-timestamp').remove();
    $('.xkit-timestamps-done').removeClass('xkit-timestamps-done');
  };

  const addReblogTimestamps = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');
    const { timelineObjectMemoized } = await fakeImport('/util/react_props.js');
    const { apiFetch } = await fakeImport('/util/tumblr_helpers.js');

    getPostElements({ excludeClass: 'xkit-reblog-timestamps-done' }).forEach(async postElement => {
      let { trail } = await timelineObjectMemoized(postElement.dataset.id);
      if (!trail.length) {
        return;
      }

      const reblogHeaders = postElement.querySelectorAll(reblogHeaderSelector);

      if (reblogTimestamps === 'op') {
        trail = [trail[0]];
      }

      trail.forEach(async (trailItem, i) => {
        if (trailItem.blog === undefined || trailItem.blog.active === false || !reblogHeaders[i]) {
          return;
        }

        const { uuid } = trailItem.blog;
        const { id } = trailItem.post;

        const timestampElement = document.createElement('div');
        timestampElement.className = 'xkit-reblog-timestamp';
        reblogHeaders[i].appendChild(timestampElement);

        if (cache[id] === undefined) {
          cache[id] = apiFetch(`/v2/blog/${uuid}/posts/${id}`).then(({ response: { timestamp } }) => timestamp);
        }

        cache[id].then(result => {
          timestampElement.textContent = constructTimeString(result);
          timestampElement.title = constructRelativeTimeString(result);
        }).catch(exception => {
          timestampElement.textContent = (exception.body && exception.body.meta) ? exception.body.meta.msg : '';
        });
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
      'timestamps.preferences.headerTimestamps': headerTimestampsChanges,
      'timestamps.preferences.reblogTimestamps': reblogTimestampsChanges,
    } = changes;

    const { onNewPosts } = await fakeImport('/util/mutations.js');

    if (alwaysShowYearChanges) {
      ({ newValue: alwaysShowYear } = alwaysShowYearChanges);

      removePostTimestamps();
      removeReblogTimestamps();

      addPostTimestamps();
      if (reblogTimestamps !== 'none') {
        addReblogTimestamps();
      }
    }

    if (headerTimestampsChanges) {
      ({ newValue: headerTimestamps } = headerTimestampsChanges);

      removePostTimestamps();
      addPostTimestamps();
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
    const { getPreferences } = await fakeImport('/util/preferences.js');
    const { onNewPosts } = await fakeImport('/util/mutations.js');
    const { keyToCss } = await fakeImport('/util/css_map.js');

    ({ alwaysShowYear, headerTimestamps, reblogTimestamps } = await getPreferences('timestamps'));

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
    const { onNewPosts } = await fakeImport('/util/mutations.js');
    onNewPosts.removeListener(addPostTimestamps);
    onNewPosts.removeListener(addReblogTimestamps);
    removePostTimestamps();
    removeReblogTimestamps();
  };

  return { main, clean, stylesheet: true };
})();
