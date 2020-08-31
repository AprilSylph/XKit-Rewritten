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

  const observer = new MutationObserver(mutations => {
    if (onNewPosts.listeners.length !== 0 || onPostsMutated.listeners.length !== 0) {
      const newPosts = mutations.some(({addedNodes}) => [...addedNodes]
        .filter(addedNode => addedNode instanceof HTMLElement)
        .some(addedNode => addedNode.matches(postSelector) || addedNode.querySelector(postSelector) !== null));

      if (newPosts) {
        onNewPosts.listeners.forEach(callback => callback());
        onPostsMutated.listeners.forEach(callback => callback());
      } else {
        const mutatedPosts = mutations.some(({target}) => target.matches(`${postSelector} ${target.tagName.toLowerCase()}`));
        if (mutatedPosts) {
          onPostsMutated.listeners.forEach(callback => callback());
        }
      }
    }

    if (onBaseContainerMutated.listeners.length !== 0) {
      const baseContainerMutated = mutations.some(({target}) => target === baseContainerNode);
      const baseContainerMutations = mutations.some(({target}) => baseContainerNode.contains(target));

      if (baseContainerMutated || baseContainerMutations) {
        onBaseContainerMutated.listeners.forEach(callback => callback());
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return { onNewPosts, onPostsMutated, onBaseContainerMutated };
})();
