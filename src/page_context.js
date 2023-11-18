'use strict';

{
  const fileCache = {};

  document.documentElement.addEventListener('xkitinjectionrequest', async event => {
    const { detail, target } = event;
    const { id, path, args } = JSON.parse(detail);

    try {
      fileCache[path] ??= await import(path);
      const func = fileCache[path].default;

      const result = await func(...args, target);
      target.dispatchEvent(
        new CustomEvent('xkitinjectionresponse', { detail: JSON.stringify({ id, result }) })
      );
    } catch (exception) {
      target.dispatchEvent(
        new CustomEvent('xkitinjectionresponse', {
          detail: JSON.stringify({
            id,
            exception: {
              message: exception.message,
              name: exception.name,
              stack: exception.stack,
              ...exception
            }
          })
        })
      );
    }
  });
}
