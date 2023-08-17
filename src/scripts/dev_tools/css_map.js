import { cssMap } from '../../util/css_map.js';
import { pageModifications } from '../../util/mutations.js';

const markerClass = '•';

const reverseCssMap = {};
for (const [key, values] of Object.entries(cssMap)) {
  for (const value of values) {
    reverseCssMap[value] = key;
  }
}

const processElements = elements =>
  elements.forEach(element => {
    const classes = [];
    for (const css of element.classList.values()) {
      const mappedCss = reverseCssMap[css];
      if (mappedCss) {
        classes.push(`ⓣ${mappedCss}`);
      }
    }
    classes.length && element.classList.add(markerClass, ...classes);
  });

export const main = async () => {
  pageModifications.register('[class]', processElements);
};

export const clean = async () => {
  pageModifications.unregister(processElements);
  // class removal omitted
};
