import { cssMap } from '../../util/css_map.js';

const markerClass = '•';

const reverseCssMap = {};
for (const [key, values] of Object.entries(cssMap)) {
  for (const value of values) {
    reverseCssMap[value] = key;
  }
}

const processEverything = () => {
  disconnect();
  const elements = document.body.querySelectorAll(`[class]:not(.${markerClass})`);
  for (const element of elements) {
    const classes = [];
    for (const css of element.classList.values()) {
      const mappedCss = reverseCssMap[css];
      if (mappedCss) {
        classes.push(`ⓣ${mappedCss}`);
      }
    }
    classes.length && element.classList.add(markerClass, ...classes);
  }
  observe();
};

const throttle = func => {
  let running = false;
  return (...args) => {
    if (!running) {
      running = true;
      requestAnimationFrame(() => {
        running = false;
        func(...args);
      });
    }
  };
};

const throttledProcessEverything = throttle(processEverything);

const cssObserver = new MutationObserver(throttledProcessEverything);
const observe = () =>
  cssObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributeFilter: ['class']
  });
const disconnect = () => cssObserver.disconnect();

observe();

export const main = async () => {
  throttledProcessEverything();
  observe();
};

export const clean = async () => {
  disconnect();
  // class removal omitted
};
