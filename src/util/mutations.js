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

const runOnNewPosts = debounce(() => onNewPosts.listeners.forEach(callback => callback()), 10);
const runOnPostsMutated = debounce(() => onPostsMutated.listeners.forEach(callback => callback()), 100);
const runOnBaseContainerMutated = debounce(() => onBaseContainerMutated.listeners.forEach(callback => callback()), 100);
const runOnGlassContainerMutated = debounce(() => onGlassContainerMutated.listeners.forEach(callback => callback(), 100));

const observer = new MutationObserver(mutations => {
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
    const glassContainerMutations = mutations.some(({ target }) => target.matches(`${dialogSelector}, ${dialogSelector} ${target.tagName.toLowerCase()}`));

    if (glassContainerMutations) {
      runOnGlassContainerMutated();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
