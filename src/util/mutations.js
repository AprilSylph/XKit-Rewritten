(function() {
  const baseContainerNode = document.getElementById('base-container');
  const postSelector = '[data-id]';

  const postListener = {
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

  const observer = new MutationObserver(mutations => {
    if (postListener.listeners.length !== 0) {
      const newPosts = mutations.some(({addedNodes}) =>
        [...addedNodes]
        .filter(addedNode => addedNode instanceof HTMLElement)
        .some(addedNode => addedNode.matches(postSelector))
      );

      const mutatedPosts = mutations.some(({target}) => target.matches(`${postSelector} ${target.tagName.toLowerCase()}`));

      if (newPosts || mutatedPosts) {
        postListener.listeners.forEach(callback => callback());
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

  return { postListener, baseContainerListener };

})();
