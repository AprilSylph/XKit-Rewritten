// adapted from https://stackoverflow.com/a/50764428
/* eslint-disable no-unused-vars */

let fakeImport;

{
  const modules = {};
  fakeImport = async function(path) {
    if (!Object.prototype.hasOwnProperty.call(modules, path)) {
      const url = browser.runtime.getURL(path);
      const file = await fetch(url);
      const fakeModule = await file.text();

      modules[path] = (new Function(`'use strict'; return ${fakeModule} //# sourceURL=${url}`))();
    }

    return modules[path];
  };
}
