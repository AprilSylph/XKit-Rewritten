import { cssMap, keyToCss } from '../../utils/css_map.js';
const rootNode = document.getElementById('root');

const addedNodesPool = [];
const attributeTargetsPool = [];
let repaintQueued = false;
let timerId;

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

const onBeforeRepaint = () => {
  repaintQueued = false;
  disconnect();

  const addedNodes = addedNodesPool
    .splice(0)
    .filter(addedNode => addedNode.isConnected);

  const attributeTargets = attributeTargetsPool
    .splice(0)
    .filter(addedNode => addedNode.isConnected);

  const selector = '[class]';

  const matchingElements = [
    ...addedNodes.filter(addedNode => addedNode.matches(selector)),
    ...addedNodes.flatMap(addedNode => [...addedNode.querySelectorAll(selector)]),
    ...attributeTargets
  ].filter((value, index, array) => index === array.indexOf(value));

  processElements(matchingElements);

  observe();
};

const cellSelector = keyToCss('cell');

const observer = new MutationObserver(mutations => {
  const addedNodes = mutations
    .filter(({ type }) => type === 'childList')
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);

  const attributeTargets = mutations
    .filter(({ type }) => type === 'attributes')
    .map(({ target }) => target);

  addedNodesPool.push(...addedNodes);
  attributeTargetsPool.push(...attributeTargets);

  if (addedNodes.some(addedNode => addedNode.parentElement?.matches(cellSelector))) {
    cancelAnimationFrame(timerId);
    onBeforeRepaint();
  } else if (repaintQueued === false) {
    requestAnimationFrame(onBeforeRepaint);
    repaintQueued = true;
  }
});

const observe = () =>
  observer.observe(rootNode, {
    childList: true,
    subtree: true,
    attributeFilter: ['class']
  });
const disconnect = () => observer.disconnect();

export const main = async () => {
  processElements([...rootNode.querySelectorAll('[class]')]);
  onBeforeRepaint();
};

export const clean = async () => {
  cancelAnimationFrame(timerId);
  disconnect();
  [...rootNode.querySelectorAll(`.${markerClass}`)].forEach(element => {
    const toRemove = [...element.classList].filter(className => className.startsWith('ⓣ'));
    element.classList.remove(markerClass, ...toRemove);
  });
};
