{
  const { dataset } = document.currentScript;

  const unburyBlog = async () => {
    const element = document.currentScript.parentElement;
    const reactKey = Object.keys(element).find(key => key.startsWith('__reactFiber'));
    let fiber = element[reactKey];

    while (fiber !== null) {
      const { blog, blogSettings } = fiber.memoizedProps || {};
      if (blog ?? blogSettings) {
        return blog ?? blogSettings;
      } else {
        fiber = fiber.return;
      }
    }
  };

  document.currentScript.isConnected && unburyBlog()
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
