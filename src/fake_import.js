// Adapted from https://stackoverflow.com/a/50764428
/* eslint-disable no-new-func */
{
  const modules = {};
  fakeImport = async function (path) { // eslint-disable-line no-global-assign
    return modules[path] || (modules[path] = (async () => {
      const url = browser.runtime.getURL(path);
      const file = await fetch(url);
      const fakeModule = await file.text();
      return new Function(`'use strict'; return ${fakeModule} //# sourceURL=${url}`)();
    })());
  };
}
