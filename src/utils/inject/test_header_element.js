{
  const { dataset } = document.currentScript;

  const testHeaderElement = async (selector) => {
    const menuElement = document.currentScript.parentElement;
    const reactKey = Object.keys(menuElement).find(key => key.startsWith('__reactFiber'));
    let fiber = menuElement[reactKey];

    while (fiber !== null) {
      if (fiber.elementType === 'header') {
        return fiber.stateNode.matches(selector);
      } else {
        fiber = fiber.return;
      }
    }
  };

  if (document.currentScript.isConnected) {
    testHeaderElement(...JSON.parse(dataset.arguments))
      .then(result => { dataset.result = JSON.stringify(result ?? null); })
      .catch(exception => {
        dataset.exception = JSON.stringify({
          message: exception.message,
          name: exception.name,
          stack: exception.stack,
          ...exception
        });
      });
  } else {
    dataset.disconnected = true;
  }
}
