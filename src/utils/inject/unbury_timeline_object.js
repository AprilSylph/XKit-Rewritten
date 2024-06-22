{
  const { dataset } = document.currentScript;

  const unburyTimelineObject = async () => {
    const postElement = document.currentScript.parentElement;
    const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactFiber'));
    let fiber = postElement[reactKey];

    while (fiber !== null) {
      const { timelineObject } = fiber.memoizedProps || {};
      if (timelineObject !== undefined) {
        return timelineObject;
      } else {
        fiber = fiber.return;
      }
    }
  };

  unburyTimelineObject()
    .then(result => { dataset.result = JSON.stringify(result ?? null); })
    .catch(exception => {
      dataset.exception = JSON.stringify({
        message: exception.message,
        name: exception.name,
        stack: exception.stack,
        ...exception
      });
    });
}
