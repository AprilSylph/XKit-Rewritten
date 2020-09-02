// Adapted from https://stackoverflow.com/a/50764428
/* eslint-disable no-implicit-globals */
/* eslint-disable no-new-func */
{
  const modules = {};
  fakeImport = async function(path) { // eslint-disable-line no-global-assign
    if (!Object.prototype.hasOwnProperty.call(modules, path)) {
      const url = browser.runtime.getURL(path);
      const file = await fetch(url);
      const fakeModule = await file.text();
      const returnedFakeModule = new Function(`'use strict'; return ${fakeModule} //# sourceURL=${url}`)();

      modules[path] = modules[path] || returnedFakeModule;
    }

    return modules[path];
  };
}
