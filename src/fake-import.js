// adapted from https://stackoverflow.com/a/50764428
/* eslint-disable no-unused-vars */

let fakeImport;

{
  const modules = {};
  fakeImport = async function(path) {
    if (!Object.prototype.hasOwnProperty.call(modules, path)) {
      const file = await fetch(browser.runtime.getURL(path));
      const fakeModule = await file.text();

      modules[path] = (new Function(`return ${fakeModule}`))();
    }

    return modules[path];
  };
}
