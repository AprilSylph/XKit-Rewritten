/**
 * This module is run in the page's "main" execution environment. It receives function call request events from the inject utility, loads and executes the requested functions, and sends back the results.
 */

const moduleCache = {};

// Remove outdated event listeners when loading module
window.removeXKitListener?.();

const controller = new AbortController();
window.removeXKitListener = () => controller.abort();

document.documentElement.addEventListener('xkit-injection-request', async event => {
  const { detail, target } = event;
  const { id, path, args } = JSON.parse(detail);

  try {
    moduleCache[path] ??= await import(path);
    const func = moduleCache[path].default;

    if (target.isConnected === false) return;

    const result = await func.apply(target, args);

    if (result instanceof Element) {
      result.dispatchEvent(
        new CustomEvent('xkit-injection-element-response', { detail: JSON.stringify({ id }), bubbles: true }),
      );
    } else {
      document.documentElement.dispatchEvent(
        new CustomEvent('xkit-injection-response', { detail: JSON.stringify({ id, result }) }),
      );
    }
  } catch (exception) {
    target.dispatchEvent(
      new CustomEvent('xkit-injection-response', {
        detail: JSON.stringify({
          id,
          exception: {
            message: exception.message,
            name: exception.name,
            stack: exception.stack,
            ...exception,
          },
        }),
      }),
    );
  }
}, { signal: controller.signal });

document.documentElement.dispatchEvent(new CustomEvent('xkit-injection-ready'));
