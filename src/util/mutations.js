import { postSelector } from './interface.js';
const rootNode = document.getElementById('root');

const mutationsPool = [];
let repaintQueued = false;

export const pageModifications = Object.freeze({
  listeners: new Map(),

  /**
   * Register a page modification
   *
   * @param {string} selector - CSS selector for elements to target
   * @param {Function} modifierFunction - Function to handle matching elements (accepts one Element[] argument)
   */
  register (selector, modifierFunction) {
    if (this.listeners.has(modifierFunction) === false) {
      this.listeners.set(modifierFunction, selector);
      this.trigger(modifierFunction);
    }
  },

  /**
   * Unregister a page modification
   *
   * @param {Function} modifierFunction - Previously-registered function to remove
   */
  unregister (modifierFunction) {
    this.listeners.delete(modifierFunction);
  },

  /**
   * Run a page modification on all existing matching elements
   *
   * @param {Function} modifierFunction - Previously-registered function to run
   */
  trigger (modifierFunction) {
    const selector = this.listeners.get(modifierFunction);
    if (!selector) return;

    if (modifierFunction.length === 0) {
      const shouldRun = rootNode.querySelector(selector) !== null;
      if (shouldRun) modifierFunction();
      return;
    }

    const matchingElements = [...rootNode.querySelectorAll(selector)];
    if (matchingElements.length !== 0) {
      modifierFunction(matchingElements);
    }
  }
});

export const onNewPosts = Object.freeze({
  addListener: callback => pageModifications.register(`${postSelector} article`, callback),
  removeListener: callback => pageModifications.unregister(callback)
});

const onBeforeRepaint = () => {
  repaintQueued = false;

  const addedNodes = mutationsPool
    .splice(0)
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);

  if (addedNodes.length === 0) return;

  for (const [modifierFunction, selector] of pageModifications.listeners) {
    if (modifierFunction.length === 0) {
      const shouldRun = addedNodes.some(addedNode => addedNode.matches(selector) || addedNode.querySelector(selector) !== null);
      if (shouldRun) modifierFunction();
      continue;
    }

    const matchingElements = [
      ...addedNodes.filter(addedNode => addedNode.matches(selector)),
      ...addedNodes.flatMap(addedNode => [...addedNode.querySelectorAll(selector)])
    ];
    if (matchingElements.length !== 0) {
      modifierFunction(matchingElements);
    }
  }
};

const test = {};

const observer = new MutationObserver(mutations => {
  mutationsPool.push(...mutations);
  if (repaintQueued === false) {
    const id = Math.random();
    const timer = performance.now();

    Promise.race([
      new Promise(resolve => window.requestAnimationFrame(() => {
        console.log(id, 'time until rAF:', performance.now() - timer);
        test[id] = true;
        resolve();
      })),
      new Promise(resolve => setTimeout(() => {
        if (test[id]) {
          // console.log(id, 'unneeded setTimeout');
        } else {
          console.log('wow the repaint is still queued at the end of setTimeout');
          console.log(id, 'time until setTimeout, which was first:', performance.now() - timer);
          performance.mark(Math.random());
        }
        resolve();
      }, 500))
    ]).then(onBeforeRepaint);
    repaintQueued = true;
  }
});

observer.observe(rootNode, { childList: true, subtree: true });
