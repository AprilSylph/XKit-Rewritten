const baseContainerNode = document.getElementById('base-container');
const dialogSelector = '[role="dialog"][aria-modal="true"]';
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
  register (selector, modifierFunction) {
    if (this.listeners.has(modifierFunction) === false) {
      this.listeners.set(modifierFunction, selector);
      modifierFunction([...document.querySelectorAll(selector)]);
    }
  },
  unregister (modifierFunction) {
    this.listeners.delete(modifierFunction);
  }
});

const onBeforeRepaint = () => {
  repaintQueued = false;

  const addedNodes = mutationsPool
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);
  mutationsPool = [];

  for (const [modifierFunction, selector] of pageModifications.listeners) {
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
export const onPostsMutated = Object.freeze(new ListenerTracker());
export const onBaseContainerMutated = Object.freeze(new ListenerTracker());
export const onGlassContainerMutated = Object.freeze(new ListenerTracker());

const debounce = (func, ms) => {
  let timeoutID;
  return (...args) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), ms);
  };
};

const runOnNewPosts = debounce(() => onNewPosts.trigger(), 10);
const runOnPostsMutated = debounce(() => onPostsMutated.trigger(), 100);
const runOnBaseContainerMutated = debounce(() => onBaseContainerMutated.trigger(), 100);
const runOnGlassContainerMutated = debounce(() => onGlassContainerMutated.trigger(), 100);

const observer = new MutationObserver(mutations => {
  if (pageModifications.listeners.size !== 0) {
    mutationsPool.push(...mutations);
    if (repaintQueued === false) {
      window.requestAnimationFrame(onBeforeRepaint);
      repaintQueued = true;
    }
  }

  if (onNewPosts.listeners.length !== 0 || onPostsMutated.listeners.length !== 0) {
    const newPosts = mutations.some(({ addedNodes }) => [...addedNodes]
      .filter(addedNode => addedNode instanceof HTMLElement)
      .some(addedNode => addedNode.matches(postSelector) || addedNode.matches(`${postSelector} > div`) || addedNode.matches(`${postSelector} article`) || addedNode.querySelector(postSelector) !== null));

    if (newPosts) {
      runOnNewPosts();
      runOnPostsMutated();
    } else {
      const mutatedPosts = mutations.some(({ target }) => target.matches(`${postSelector} ${target.tagName.toLowerCase()}`));
      if (mutatedPosts) {
        runOnPostsMutated();
      }
    }
  }

  if (onBaseContainerMutated.listeners.length !== 0) {
    const baseContainerMutated = mutations.some(({ target }) => target === baseContainerNode);
    const baseContainerMutations = mutations.some(({ target }) => baseContainerNode.contains(target));

    if (baseContainerMutated || baseContainerMutations) {
      runOnBaseContainerMutated();
    }
  }

  if (onGlassContainerMutated.listeners.length !== 0) {
    const glassContainerNode = document.getElementById('glass-container') || document.querySelector(dialogSelector)?.parentNode;

    const glassContainerMutated = mutations.some(({ target }) => target === glassContainerNode);
    const glassContainerMutations = mutations.some(({ target }) => target.matches(`${dialogSelector}, ${dialogSelector} ${target.tagName.toLowerCase()}`));

    if (glassContainerMutated || glassContainerMutations) {
      runOnGlassContainerMutated();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
