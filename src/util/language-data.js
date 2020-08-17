(function() {
  let languageData;

  /**
   * @param {String} rootString - The English string to translate
   * @return {String} - The translated string in the current Tumblr locale
   */
  const translate = async function(rootString) {
    if (!languageData) {
      const { getLanguageData } = await fakeImport('/src/util/tumblr-helpers.js');
      languageData = await getLanguageData();
    }

    return languageData.translations[rootString] || rootString;
  };

  return { translate };
})();
