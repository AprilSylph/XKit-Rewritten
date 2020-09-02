(function() {
  /**
   * @param {String} post_id - The post ID of an on-screen post
   * @return {Object} - The post's buried timelineObject property
   */
  const timelineObject = async function(post_id) {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject(async id => {
      const postElement = document.querySelector(`[data-id="${id}"]`);
      const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactInternalInstance'));
      let fiber = postElement[reactKey];
      let tries = 0;

      while (fiber.memoizedProps.timelineObject === undefined && tries <= 10) {
        fiber = fiber.return;
        tries++;
      }

      return fiber.memoizedProps.timelineObject;
    }, [post_id]);
  };

  return { timelineObject };
})();
