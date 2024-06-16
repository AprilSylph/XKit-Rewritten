{
  const { dataset } = document.currentScript;

  const getNotificationProps = async function () {
    const notificationElement = document.currentScript.parentElement;
    const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
    let fiber = notificationElement[reactKey];

    while (fiber !== null) {
      const props = fiber.memoizedProps || {};
      if (props?.notification !== undefined) {
        return props;
      } else {
        fiber = fiber.return;
      }
    }
  };

  document.currentScript.isConnected && getNotificationProps()
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
