(function () {
  const cache = {};

  /**
   * @param {string} postID - The post ID of an on-screen post
   * @returns {object} - The post's buried timelineObject property (cached; use
   *  timelineObject if you need up-to-date properties that may have changed)
   */
  const timelineObjectMemoized = async function (postID) {
    if (Object.prototype.hasOwnProperty.call(cache, postID)) {
      return cache[postID];
    }
    return timelineObject(postID);
  };

  /**
   * @param {string} postID - The post ID of an on-screen post
   * @returns {object} - The post's buried timelineObject property
   */
  const timelineObject = async function (postID) {
    const { inject } = await fakeImport('/src/util/inject.js');
    cache[postID] = inject(async id => {
      const postElement = document.querySelector(`[data-id="${id}"]`);
      const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactInternalInstance'));
      let fiber = postElement[reactKey];
      let tries = 0;

      while (fiber.memoizedProps.timelineObject === undefined && tries <= 10) {
        fiber = fiber.return;
        tries++;
      }

      return fiber.memoizedProps.timelineObject;
    }, [postID]);
    return cache[postID];
  };

  return { timelineObject, timelineObjectMemoized };
})();
