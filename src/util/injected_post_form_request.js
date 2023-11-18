const doPostFormRequest = async (resource, body) =>
  fetch(resource, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body
  }).then(async response =>
    response.ok ? response.json() : Promise.reject(await response.json())
  );

export default doPostFormRequest;
