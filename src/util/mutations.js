(function() {
  const baseContainerNode = document.getElementById('base-container');
  const postSelector = '[data-id]';

  const onNewPosts = Object.freeze({
    listeners: [],
    addListener(callback) {
      if (this.listeners.includes(callback) === false) {
        this.listeners.push(callback);
      }
    },
    removeListener(callback) {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    },
  });

  const onPostsMutated = Object.freeze({
    listeners: [],
    addListener(callback) {
      if (this.listeners.includes(callback) === false) {
        this.listeners.push(callback);
      }
    },
    removeListener(callback) {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    },
  });

  const onBaseContainerMutated = Object.freeze({
    listeners: [],
    addListener(callback) {
      if (this.listeners.includes(callback) === false) {
        this.listeners.push(callback);
      }
    },
    removeListener(callback) {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    },
  });

  const debounce = (callback, ms) => {
    let timeoutID;
    return (...args) => {
      clearTimeout(timeoutID);
      timeoutID = setTimeout(() => callback(...args), ms);
    };
  };

  const runOnNewPosts = debounce(() => onNewPosts.listeners.forEach(callback => callback()), 100);
  const runOnPostsMutated = debounce(() => onPostsMutated.listeners.forEach(callback => callback()), 100);
  const runOnBaseContainerMutated = debounce(() => onBaseContainerMutated.listeners.forEach(callback => callback()), 100);

  const observer = new MutationObserver(mutations => {
    if (onNewPosts.listeners.length !== 0 || onPostsMutated.listeners.length !== 0) {
      const newPosts = mutations.some(({addedNodes}) => [...addedNodes]
        .filter(addedNode => addedNode instanceof HTMLElement)
        .some(addedNode => addedNode.matches(postSelector) || addedNode.querySelector(postSelector) !== null));

      if (newPosts) {
        runOnNewPosts();
        runOnPostsMutated();
      } else {
        const mutatedPosts = mutations.some(({target}) => target.matches(`${postSelector} ${target.tagName.toLowerCase()}`));
        if (mutatedPosts) {
          runOnPostsMutated();
        }
      }
    }

    if (onBaseContainerMutated.listeners.length !== 0) {
      const baseContainerMutated = mutations.some(({target}) => target === baseContainerNode);
      const baseContainerMutations = mutations.some(({target}) => baseContainerNode.contains(target));

      if (baseContainerMutated || baseContainerMutations) {
        runOnBaseContainerMutated();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return { onNewPosts, onPostsMutated, onBaseContainerMutated };
})();
