(function() {
  const apiFetch = async function(...args) {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject( /* globals tumblr */
      async (pathname, queryParams, body) => await tumblr.apiFetch(pathname, queryParams, body),
      args,
    );
  }

  return { apiFetch };
})();
