{
  const { dataset } = document.currentScript;

  const unburyNotification = async () => {
    const notificationElement = document.currentScript.parentElement;
    const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
    let fiber = notificationElement[reactKey];

    while (fiber !== null) {
      const { notification } = fiber.memoizedProps || {};
      if (notification !== undefined) {
        return notification;
      } else {
        fiber = fiber.return;
      }
    }
  };

  document.currentScript.isConnected && unburyNotification()
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
