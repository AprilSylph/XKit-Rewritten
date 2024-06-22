{
  const { dataset } = document.currentScript;

  const getLanguageData = async () => window.tumblr.languageData;

  getLanguageData()
    .then(result => { dataset.result = JSON.stringify(result ?? null); })
    .catch(exception => {
      dataset.exception = JSON.stringify({
        message: exception.message,
        name: exception.name,
        stack: exception.stack,
        ...exception
      });
    });
}
