import { keyToCss } from './css_map.js';
import { postSelector } from './interface.js';
const rootNode = document.getElementById('root');

const addedNodesPool = [];
let repaintQueued = false;
let timerId;

export const pageModifications = Object.freeze({
  listeners: new Map(),

  /**
   * Register a page modification
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
   * @param {Function} modifierFunction - Previously-registered function to remove
   */
  unregister (modifierFunction) {
    this.listeners.delete(modifierFunction);
  },

  /**
   * Run a page modification on all existing matching elements
   * @param {Function} modifierFunction - Previously-registered function to run
   * @returns {Promise<void>} Resolves when finished
   */
  async trigger (modifierFunction) {
    const selector = this.listeners.get(modifierFunction);
    if (!selector) return;

    if (modifierFunction.length === 0) {
      const shouldRun = rootNode.querySelector(selector) !== null;
      if (shouldRun) await modifierFunction();
      return;
    }

    const matchingElements = [...rootNode.querySelectorAll(selector)];
    if (matchingElements.length !== 0) {
      await modifierFunction(matchingElements);
    }
  }
});

export const onNewPosts = Object.freeze({
  addListener: callback => pageModifications.register(`${postSelector} article`, callback),
  removeListener: callback => pageModifications.unregister(callback)
});

const onBeforeRepaint = () => {
  repaintQueued = false;

  const addedNodes = addedNodesPool
    .splice(0)
    .filter(addedNode => addedNode.isConnected);

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
    ].filter((value, index, array) => index === array.indexOf(value));

    if (matchingElements.length !== 0) {
      modifierFunction(matchingElements);
    }
  }
};

const cellSelector = keyToCss('cell');

const observer = new MutationObserver(mutations => {
  const addedNodes = mutations
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);

  addedNodesPool.push(...addedNodes);

  if (addedNodes.some(addedNode => addedNode.parentElement?.matches(cellSelector))) {
    cancelAnimationFrame(timerId);
    onBeforeRepaint();
  } else if (repaintQueued === false) {
    timerId = requestAnimationFrame(onBeforeRepaint);
    repaintQueued = true;
  }
});

observer.observe(rootNode, { childList: true, subtree: true });
