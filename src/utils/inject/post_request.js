{
  const { dataset } = document.currentScript;

  const postRequest = async (resource, body) =>
    fetch(resource, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body
    }).then(async response =>
      response.ok ? response.json() : Promise.reject(await response.json())
    );

  postRequest(...JSON.parse(dataset.arguments))
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
