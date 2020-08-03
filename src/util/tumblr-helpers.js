(function() {
  const apiFetch = async function(...args) {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject(
      async (pathname, queryParams, body) => await window.tumblr.apiFetch(pathname, queryParams, body),
      args,
    );
  }

  const getCssMap = async function() {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject(async () => await window.tumblr.getCssMap());
  }

  return { apiFetch, getCssMap };
})();
