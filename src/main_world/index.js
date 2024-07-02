const moduleCache = {};

document.documentElement.addEventListener('xkitinjectionrequest', async event => {
  const { detail, target } = event;
  const { id, path, args } = JSON.parse(detail);

  try {
    moduleCache[path] ??= await import(path);
    const func = moduleCache[path].default;

    const result = await func.apply(target, args);
    target.dispatchEvent(
      new CustomEvent('xkitinjectionresponse', { detail: { id, result } })
    );
  } catch (exception) {
    target.dispatchEvent(
      new CustomEvent('xkitinjectionresponse', { detail: { id, exception } })
    );
  }
});
