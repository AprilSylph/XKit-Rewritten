(function() {

  /**
   * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
   */
  const apiFetch = async function(...args) {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject(
      async (resource, init) => await window.tumblr.apiFetch(resource, init),
      args,
    );
  }

  /**
   * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#getcssmap}
   */
  const getCssMap = async function() {
    const { inject } = await fakeImport('/src/util/inject.js');
    return inject(async () => await window.tumblr.getCssMap());
  }

  /**
   * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#languagedata}
   */
  const getLanguageData = async function() {
    const { inject } = await fakeImport('/src/util/inject.js');
    return await inject(async () => window.tumblr.languageData);
  }

  return { apiFetch, getCssMap, getLanguageData };
})();
