import moment from '../../lib/moment.js';
import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';

let format;
let displayRelative;

export const styleElement = buildStyle(`
[data-formatted-time] {
  font-size: 0px !important;

  /* fixes hover when covered by the "permalink" <a> element */
  isolation: isolate;
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

${keyToCss('userRow')} [data-formatted-time] {
  display: flex;
  flex-wrap: wrap;
}

${keyToCss('userRow', 'timestampLink')} [data-formatted-time]::before,
${keyToCss('userRow', 'timestampLink')} [data-formatted-relative-time]::after {
  font-size: .875rem;
}

[data-formatted-time][title]::before,
[data-formatted-time][title]::after {
  cursor: help;
}

${keyToCss('userRow')} ${keyToCss('subheader')}:has([data-formatted-time]) {
  flex-wrap: wrap;
}

${keyToCss('userRow')} ${keyToCss('timestamp')}:has([data-formatted-time]) {
  display: flex;
  flex-wrap: nowrap;
}

${keyToCss('blogLinkWrapper')}:has(+ [data-formatted-time]),
${keyToCss('blogLinkWrapper')}:has(+ a > [data-formatted-time]) {
  flex: none;
}

${keyToCss('blogLinkWrapper')} + [data-formatted-time],
${keyToCss('blogLinkWrapper')} + a:has(> [data-formatted-time]) {
  white-space: nowrap;
  overflow-x: hidden;
}

${keyToCss('timestampLink')} [data-formatted-time]:is(:focus, :hover) {
  text-decoration: none;
}

${keyToCss('timestampLink')} [data-formatted-time]:is(:focus, :hover)::before,
${keyToCss('timestampLink')} [data-formatted-time]:is(:focus, :hover)::after {
  text-decoration: underline;
}

${keyToCss('timestampLink')} [data-formatted-relative-time]::after {
  display: inline;
}

${keyToCss('timestampLink')} [data-formatted-time][title]::before,
${keyToCss('timestampLink')} [data-formatted-time][title]::after {
  cursor: pointer;
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
  { unit: 'second', denominator: 1 },
];

const constructRelativeTimeString = function (unixTime) {
  const now = Math.trunc(Date.now() / 1000);
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

const updateRelativeTime = timeElement => {
  timeElement.dataset.formattedRelativeTime = constructRelativeTimeString(timeElement.unixTime);
};

const observer = new MutationObserver(mutations =>
  mutations.forEach(({ target: { parentElement: timeElement } }) => timeElement?.unixTime && updateRelativeTime(timeElement)),
);

const formatTimeElements = function (timeElements) {
  timeElements.forEach(timeElement => {
    const momentDate = moment(timeElement.dateTime, moment.ISO_8601);
    timeElement.dataset.formattedTime = momentDate.format(format);
    if (displayRelative) {
      timeElement.dataset.formattedTime += '\u00A0\u00B7\u00A0';
      timeElement.unixTime = momentDate.unix();
      updateRelativeTime(timeElement);
      observer.observe(timeElement, { characterData: true, subtree: true });
    }
  });
};

export const main = async function () {
  ({ format, displayRelative } = await getPreferences('timeformat'));
  pageModifications.register(`${keyToCss('timestamp')}[datetime], ${keyToCss('timestamp')} > [datetime]`, formatTimeElements);
};

export const clean = async function () {
  observer.disconnect();
  pageModifications.unregister(formatTimeElements);
  $('[data-formatted-time]').removeAttr('data-formatted-time');
  $('[data-formatted-relative-time]').removeAttr('data-formatted-relative-time');
};
