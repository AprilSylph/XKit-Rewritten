{
  const { dataset } = document.currentScript;

  const navigate = async () => window.tumblr.navigate(...JSON.parse(dataset.arguments));

  navigate()
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
