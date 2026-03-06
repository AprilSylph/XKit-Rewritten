import { keyToCss } from '../../utils/css_map.js';
import { getPostElements } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { timelineObject } from '../../utils/react_props.js';
import { constructRelativeTimeString } from '../../utils/text_format.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';

const noteCountSelector = keyToCss('noteCount');
const reblogHeaderSelector = keyToCss('reblogHeader');
const engagementControlsSelector = keyToCss('engagementControls');

let alwaysShowYear;
let headerTimestamps;
let isoFormat;
let reblogTimestamps;

const cache = {};

const locale = document.documentElement.lang;
const currentDayTimeFormat = new Intl.DateTimeFormat(locale, {
  hour: 'numeric',
  minute: 'numeric',
});
const currentYearTimeFormat = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'short',
});
const shortTimeFormat = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const longTimeFormat = new Intl.DateTimeFormat(locale, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

const constructTimeString = function (unixTime) {
  const date = new Date(unixTime * 1000);
  const now = new Date();

  const sameDate = date.toDateString() === now.toDateString();
  const sameYear = date.getFullYear() === now.getFullYear();

  if (sameDate) {
    return currentDayTimeFormat.format(date);
  }

  return sameYear && !alwaysShowYear ? currentYearTimeFormat.format(date) : shortTimeFormat.format(date);
};

const constructLongTimeString = function (unixTime) {
  const date = new Date(unixTime * 1000);
  return longTimeFormat.format(date);
};

const constructISOString = function (unixTime) {
  const date = new Date(unixTime * 1000);

  const fourDigitYear = date.getFullYear().toString().padStart(4, '0');
  const twoDigitMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  const twoDigitDate = date.getDate().toString().padStart(2, '0');

  const twoDigitHours = date.getHours().toString().padStart(2, '0');
  const twoDigitMinutes = date.getMinutes().toString().padStart(2, '0');
  const twoDigitSeconds = date.getSeconds().toString().padStart(2, '0');

  const timezoneOffset = date.getTimezoneOffset();

  const timezoneOffsetAbsolute = Math.abs(timezoneOffset);
  const timezoneOffsetIsNegative = timezoneOffset === 0 || Math.sign(timezoneOffset) === -1;

  const twoDigitTimezoneOffsetHours = Math.trunc(timezoneOffsetAbsolute / 60).toString().padStart(2, '0');
  const twoDigitTimezoneOffsetMinutes = Math.trunc(timezoneOffsetAbsolute % 60).toString().padStart(2, '0');

  return `${fourDigitYear}-${twoDigitMonth}-${twoDigitDate}T${twoDigitHours}:${twoDigitMinutes}:${twoDigitSeconds}${timezoneOffsetIsNegative ? '+' : '-'}${twoDigitTimezoneOffsetHours}:${twoDigitTimezoneOffsetMinutes}`;
};

const addPostTimestamps = async function () {
  getPostElements({ excludeClass: 'xkit-timestamps-done' }).forEach(async postElement => {
    const { id } = postElement.dataset;

    const { timestamp, postUrl } = await timelineObject(postElement);
    cache[id] = Promise.resolve(timestamp);

    const noteCountElement = postElement.querySelector(noteCountSelector);
    const engagementControlsElement = postElement.querySelector(engagementControlsSelector);

    const relativeTimeString = constructRelativeTimeString(timestamp);

    const timestampElement = document.createElement('a');
    timestampElement.className = 'xkit-timestamp';
    timestampElement.href = postUrl;
    timestampElement.target = '_blank';
    timestampElement.textContent = constructTimeString(timestamp);
    timestampElement.title = relativeTimeString;

    if (noteCountElement) {
      noteCountElement.after(timestampElement);
    } else if (engagementControlsElement) {
      timestampElement.classList.add('in-new-footer');
      engagementControlsElement.before(timestampElement);
    }

    if (headerTimestamps) {
      const longTimestampElement = document.createElement('div');
      longTimestampElement.className = 'xkit-long-timestamp';
      longTimestampElement.textContent = `${isoFormat ? constructISOString(timestamp) : constructLongTimeString(timestamp)} ・ ${relativeTimeString}`;

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
  getPostElements({ excludeClass: 'xkit-reblog-timestamps-done' }).forEach(async postElement => {
    let { trail } = await timelineObject(postElement);
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
        timestampElement.textContent = exception.body?.meta?.msg ?? '';
      });
    });
  });
};

const removeReblogTimestamps = function () {
  $('.xkit-reblog-timestamp').remove();
  $('.xkit-reblog-timestamps-done').removeClass('xkit-reblog-timestamps-done');
};

const preferenceHandlers = {
  'timestamps.preferences.alwaysShowYear': () => {
    removePostTimestamps();
    removeReblogTimestamps();

    addPostTimestamps();
    if (reblogTimestamps !== 'none') {
      addReblogTimestamps();
    }
  },
  'timestamps.preferences.headerTimestamps': () => {
    removePostTimestamps();
    addPostTimestamps();
  },
  'timestamps.preferences.isoFormat': () => {
    removePostTimestamps();
    addPostTimestamps();
  },
  'timestamps.preferences.reblogTimestamps': () => {
    onNewPosts.removeListener(addReblogTimestamps);
    removeReblogTimestamps();

    if (reblogTimestamps !== 'none') {
      onNewPosts.addListener(addReblogTimestamps);
    }
  },
};

export const onStorageChanged = async function (changes) {
  ({ alwaysShowYear, headerTimestamps, isoFormat, reblogTimestamps } = await getPreferences('timestamps'));

  const changesKeys = Object.keys(changes);

  Object.keys(preferenceHandlers)
    .filter(preferenceKey => changesKeys.includes(preferenceKey))
    .filter(preferenceKey => changes[preferenceKey].oldValue !== undefined)
    .filter(preferenceKey => changes[preferenceKey].newValue !== changes[preferenceKey].oldValue)
    .forEach(preferenceKey => preferenceHandlers[preferenceKey]());
};

export const main = async function () {
  ({ alwaysShowYear, headerTimestamps, isoFormat, reblogTimestamps } = await getPreferences('timestamps'));

  onNewPosts.addListener(addPostTimestamps);

  if (reblogTimestamps !== 'none') {
    onNewPosts.addListener(addReblogTimestamps);
  }
};

export const clean = async function () {
  onNewPosts.removeListener(addPostTimestamps);
  onNewPosts.removeListener(addReblogTimestamps);
  removePostTimestamps();
  removeReblogTimestamps();
};

export const stylesheet = true;
