export default function apiFetch (resource, init = {}) {
  // add XKit header to all API requests
  init.headers ??= {};
  init.headers['X-XKit'] = '1';

  // convert all keys in the body to snake_case
  if (init.body !== undefined) {
    const objects = [init.body];

    while (objects.length !== 0) {
      const currentObjects = objects.splice(0);

      currentObjects.forEach(obj => {
        Object.keys(obj).forEach(key => {
          const snakeCaseKey = key
            .replace(/^[A-Z]/, match => match.toLowerCase())
            .replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);

          if (snakeCaseKey !== key) {
            obj[snakeCaseKey] = obj[key];
            delete obj[key];
          }
        });
      });

      objects.push(
        ...currentObjects
          .flatMap(Object.values)
          .filter(value => value instanceof Object),
      );
    }
  }

  const result = window.tumblr.apiFetch(resource, init);

  const requestTime = Date.now();
  const showWarning = succeeded =>
    console.log(`XKit Rewritten: API fetch of ${resource} ${succeeded ? 'took' : 'failed after'} ${Date.now() - requestTime} seconds!`);
  const timeoutId = setTimeout(
    () => console.log(`XKit Rewritten: API fetch of ${resource} is still pending after 5 seconds!`),
    5000,
  );
  result
    .then(() => clearTimeout(timeoutId))
    .then(() => Date.now() - requestTime > 1500 && showWarning(true))
    .catch(() => showWarning(false));

  return result;
}
