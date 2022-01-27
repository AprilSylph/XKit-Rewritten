const rootNode = document.getElementById('root');
const postSelector = '[tabindex="-1"][data-id]';

const ListenerTracker = function () {
  this.listeners = [];

  this.addListener = function (callback) {
    if (this.listeners.includes(callback) === false) {
      this.listeners.push(callback);
    }
  };

  this.removeListener = function (callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  };

  this.trigger = function () {
    this.listeners.forEach(callback => callback());
  };
};

let mutationsPool = [];
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

const onBeforeRepaint = () => {
  repaintQueued = false;

  const addedNodes = mutationsPool
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);
  mutationsPool = [];

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

export const onNewPosts = Object.freeze(new ListenerTracker());

const debounce = (func, ms) => {
  let timeoutID;
  return (...args) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), ms);
  };
};

const runOnNewPosts = debounce(() => onNewPosts.trigger(), 10);

const observer = new MutationObserver(mutations => {
  if (pageModifications.listeners.size !== 0) {
    mutationsPool.push(...mutations);
    if (repaintQueued === false) {
      window.requestAnimationFrame(onBeforeRepaint);
      repaintQueued = true;
    }
  }

  if (onNewPosts.listeners.length !== 0) {
    const newPosts = mutations.some(({ addedNodes }) => [...addedNodes]
      .filter(addedNode => addedNode instanceof HTMLElement)
      .some(addedNode => addedNode.matches(postSelector) || addedNode.matches(`${postSelector} > div`) || addedNode.matches(`${postSelector} article`) || addedNode.querySelector(postSelector) !== null));

    if (newPosts) runOnNewPosts();
  }
});

observer.observe(rootNode, { childList: true, subtree: true });
