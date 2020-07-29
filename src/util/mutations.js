(function() {
  const baseContainerNode = document.getElementById('base-container');
  const postSelector = '[data-id]';

  const newPostListener = {
    listeners: [],
    addListener(callback) {
      this.listeners.push(callback);
    },
    removeListener(callback) {
      this.listeners = this.listeners.filter(x => x !== callback);
    }
  };

  const mutatedPostListener = {
    listeners: [],
    addListener(callback) {
      this.listeners.push(callback);
    },
    removeListener(callback) {
      this.listeners = this.listeners.filter(x => x !== callback);
    }
  };

  const baseContainerListener = {
    listeners: [],
    addListener(callback) {
      this.listeners.push(callback);
    },
    removeListener(callback) {
      this.listeners = this.listeners.filter(x => x !== callback);
    }
  };

  Object.freeze(newPostListener);
  Object.freeze(mutatedPostListener);
  Object.freeze(baseContainerListener);

  const observer = new MutationObserver(mutations => {
    if (newPostListener.listeners.length !== 0) {
      const newPosts = mutations.some(({addedNodes}) =>
        [...addedNodes]
        .filter(addedNode => addedNode instanceof HTMLElement)
        .some(addedNode => addedNode.matches(postSelector))
      );

      if (newPosts) {
        newPostListener.listeners.forEach(callback => callback());
      }
    }

    if (mutatedPostListener.listeners.length !== 0) {
      const mutatedPosts = mutations.some(({target}) => target.matches(`${postSelector} ${target.tagName.toLowerCase()}`));

      if (mutatedPosts) {
        mutatedPostListener.listeners.forEach(callback => callback());
      }
    }

    if (baseContainerListener.listeners.length !== 0) {
      const baseContainerMutated = mutations.some(({target}) => target === baseContainerNode);
      const baseContainerMutations = mutations.some(({target}) => baseContainerNode.contains(target));

      if (baseContainerMutated || baseContainerMutations) {
        baseContainerListener.listeners.forEach(callback => callback());
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return { newPostListener, mutatedPostListener, baseContainerListener };

})();
