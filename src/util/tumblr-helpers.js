(function() {
  /**
   * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
   */
  const apiFetch = async function(...args) {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject(
      async (resource, init) => window.tumblr.apiFetch(resource, init),
      args,
    );
  };

  /**
   * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#getcssmap}
   */
  const getCssMap = async function() {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject(async () => window.tumblr.getCssMap());
  };

  /**
   * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#languagedata}
   */
  const getLanguageData = async function() {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject(async () => window.tumblr.languageData);
  };

  return { apiFetch, getCssMap, getLanguageData };
})();
