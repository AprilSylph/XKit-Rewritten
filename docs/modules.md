# Modules system
XKit Rewritten uses a custom modules system, with syntax similar to ES6 modules, and specifically **dynamic imports**, which the project was originally designed to use. However, dynamic imports do not work in content scripts across every major browser yet.

#### `fakeImport()`
The easiest part of the custom modules system to explain is the `fakeImport()` function. Its syntax is essentially identical to the dynamic `import()` syntax; it returns a `Promise` which resolves with an object of module exports.

Example usage:

```js
const { getPostElements } = await fakeImport('/src/util/interface.js');
```

Note: the argument path is automatically fed into `browser.runtime.getURL()` to retrieve the URL starting at the extension's root. This means it is impossible to use externally-hosted modules with this function, even if they follow the same custom module syntax.

#### Custom module syntax
Since `import()` is unavailable in content scripts, the modules themselves cannot use `export`, and so their exports must be returned in a different way. The magic here is that `fakeImport()` actually fetches and evaluates any modules it hasn't yet fetched and evaluated (using the more secure `new Function()` syntax, rather than `eval()`). So, all the module file needs to be is an IIFE that returns an object of exports when evaluated:

```js
(function () {
  const hello = "world";

  const main = async function () {
    console.log(`Hello, ${hello}!`);
  };

  const clean = async function () {
    // Nothing to undo here
  };

  return { main, clean, stylesheet: true };
})();
```

This means that there are no such thing as default exports, that a single named export doesn't have a shorter-hand syntax, and that all exports must be done in one go.
