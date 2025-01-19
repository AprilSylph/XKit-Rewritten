import moment from '../lib/moment.js';
import { keyToCss } from '../utils/css_map.js';
import { buildStyle } from '../utils/interface.js';
import { pageModifications } from '../utils/mutations.js';
import { getPreferences } from '../utils/preferences.js';

let format;
let displayRelative;

export const styleElement = buildStyle(`
[data-formatted-time] {
  font-size: 0px !important;
}

[data-formatted-time]::before {
  content: attr(data-formatted-time);
  font-size: .78125rem;
}

[data-formatted-relative-time]::after {
  content: attr(data-formatted-relative-time);
  font-size: .78125rem;
  display: inline-block;
}

[data-formatted-time][title]::before,
[data-formatted-time][title]::after {
  cursor: help;
}

${keyToCss('blogLinkWrapper')}:has(+ [data-formatted-time]) {
  flex: none;
}

${keyToCss('blogLinkWrapper')} + [data-formatted-time] {
  white-space: nowrap;
  overflow-x: hidden;
}
`);

const relativeTimeFormat = new Intl.RelativeTimeFormat(document.documentElement.lang, { style: 'long' });
const thresholds = [
  { unit: 'year', denominator: 31557600 },
  { unit: 'month', denominator: 2629800 },
  { unit: 'week', denominator: 604800 },
  { unit: 'day', denominator: 86400 },
  { unit: 'hour', denominator: 3600 },
  { unit: 'minute', denominator: 60 },
  { unit: 'second', denominator: 1 }
];

const constructRelativeTimeString = unixTime => {
  const now = Math.trunc(new Date().getTime() / 1000);
  const unixDiff = unixTime - now;
  const unixDiffAbsolute = Math.abs(unixDiff);

  for (const { unit, denominator } of thresholds) {
    if (unixDiffAbsolute >= denominator) {
      const value = Math.trunc(unixDiff / denominator);
      return relativeTimeFormat.format(value, unit);
    }
  }

  return relativeTimeFormat.format(-0, 'second');
};

const formatTimeElements = timeElements => {
  timeElements.forEach(timeElement => {
    const momentDate = moment(timeElement.dateTime, moment.ISO_8601);
    timeElement.dataset.formattedTime = momentDate.format(format);
    if (displayRelative) {
      timeElement.dataset.formattedTime += '\u2002\u00B7\u2002';
      timeElement.dataset.formattedRelativeTime = constructRelativeTimeString(momentDate.unix());
    }
  });
};

export const main = async () => {
  ({ format, displayRelative } = await getPreferences('timeformat'));
  pageModifications.register(`${keyToCss('timestamp')}[datetime]`, formatTimeElements);
};

export const clean = async () => {
  pageModifications.unregister(formatTimeElements);
  $('[data-formatted-time]').removeAttr('data-formatted-time');
  $('[data-formatted-relative-time]').removeAttr('data-formatted-relative-time');
};
