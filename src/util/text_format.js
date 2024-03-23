const thresholds = [
  { unit: 'year', denominator: 31557600 },
  { unit: 'month', denominator: 2629800 },
  { unit: 'week', denominator: 604800 },
  { unit: 'day', denominator: 86400 },
  { unit: 'hour', denominator: 3600 },
  { unit: 'minute', denominator: 60 },
  { unit: 'second', denominator: 1 }
];

const relativeTimeFormat = new Intl.RelativeTimeFormat(document.documentElement.lang, { style: 'long' });
export const constructRelativeTimeString = function (unixTime) {
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

export const dateTimeFormat = new Intl.DateTimeFormat(document.documentElement.lang, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  timeZoneName: 'short'
});

/**
 * Adds string elements between an array's items to format it as an English prose list.
 * The Oxford comma is included.
 * @param {any[]} array - Input array of any number of items
 * @param {string} andOr - String 'and' or 'or', used before the last item
 * @returns {any[]} An array alternating between the input items and strings
 */
export const elementsAsList = (array, andOr) =>
  array.flatMap((item, i) => {
    if (i === array.length - 1) return [item];
    if (i === array.length - 2) return array.length === 2 ? [item, ` ${andOr} `] : [item, `, ${andOr} `];
    return [item, ', '];
  });

export const constructDurationString = function (seconds) {
  const parts = [];

  for (const { unit, denominator } of thresholds) {
    if (seconds >= denominator) {
      const value = Math.trunc(seconds / denominator);
      seconds -= value * denominator;
      parts.push(
        new Intl.NumberFormat(document.documentElement.lang, {
          style: 'unit',
          unit,
          unitDisplay: 'long'
        }).format(value)
      );
    }
  }
  return elementsAsList(parts, 'and').join('');
};
