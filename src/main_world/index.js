'use strict';

{
  const moduleCache = {};
  const injectKey = Math.random();

  document.documentElement.addEventListener('xkitinjectionrequest', async event => {
    const { detail, target } = event;
    const { injectKey: requestInjectKey, id, path, args } = JSON.parse(detail);
    if (injectKey !== requestInjectKey) return;

    try {
      moduleCache[path] ??= await import(path);
      const func = moduleCache[path].default;

      if (target.isConnected === false) return;

      const result = await func.apply(target, args);
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

  document.documentElement.dispatchEvent(new CustomEvent('xkitinjectionready', { detail: JSON.stringify({ injectKey }) }));
}
