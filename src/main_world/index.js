'use strict';

{
  const moduleCache = {};
  const xkitMainWorldKey = Math.random();
  window.xkitMainWorldKey = xkitMainWorldKey;

  document.documentElement.addEventListener('xkit-injection-request', async event => {
    if (window.xkitMainWorldKey !== xkitMainWorldKey) return;
    const { detail, target } = event;
    const { id, path, args } = JSON.parse(detail);

    try {
      moduleCache[path] ??= await import(path);
      const func = moduleCache[path].default;

      if (target.isConnected === false) return;

      const result = await func.apply(target, args);
      target.dispatchEvent(
        new CustomEvent('xkit-injection-response', { detail: JSON.stringify({ id, result }) })
      );
    } catch (exception) {
      target.dispatchEvent(
        new CustomEvent('xkit-injection-response', {
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

  document.documentElement.dispatchEvent(new CustomEvent('xkit-injection-ready'));
}
