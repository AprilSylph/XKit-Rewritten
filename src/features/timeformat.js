import moment from '../lib/moment.js';
import { keyToCss } from '../utils/css_map.js';
import { buildStyle } from '../utils/interface.js';
import { pageModifications } from '../utils/mutations.js';
import { getPreferences } from '../utils/preferences.js';
import { constructRelativeTimeString } from '../utils/text_format.js';

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

const formatTimeElements = function (timeElements) {
  timeElements.forEach(timeElement => {
    const momentDate = moment(timeElement.dateTime, moment.ISO_8601);
    timeElement.dataset.formattedTime = momentDate.format(format);
    if (displayRelative) {
      timeElement.dataset.formattedTime += '\u2002\u00B7\u2002';
      timeElement.dataset.formattedRelativeTime = constructRelativeTimeString(momentDate.unix());
    }
  });
};

export const main = async function () {
  ({ format, displayRelative } = await getPreferences('timeformat'));
  pageModifications.register(`${keyToCss('timestamp')}[datetime]`, formatTimeElements);
};

export const clean = async function () {
  pageModifications.unregister(formatTimeElements);
  $('[data-formatted-time]').removeAttr('data-formatted-time');
  $('[data-formatted-relative-time]').removeAttr('data-formatted-relative-time');
};
