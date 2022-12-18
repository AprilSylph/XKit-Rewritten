'use strict';

import('./injectable_functions.js').then(injectables =>
  document.documentElement.addEventListener('xkitinjectionrequest', async event => {
    const { detail: { id, name, args }, target } = event;

    const fallback = async () => new Error(`function "${name}" is not implemented in injected.js`);
    const func = injectables[name] ?? fallback;

    try {
      const result = await func(...args, target);
      target.dispatchEvent(
        new CustomEvent('xkitinjectionresponse', { detail: { id, result } })
      );
    } catch (exception) {
      const e = {
        message: exception.message,
        name: exception.name,
        stack: exception.stack,
        ...exception
      };
      target.dispatchEvent(
        new CustomEvent('xkitinjectionresponse', { detail: { id, exception: e } })
      );
    }
  })
);
