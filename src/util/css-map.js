(function() {
  let cssMap;

  const keyToClasses = async function(key) {
    if (cssMap === undefined) {
      const { getCssMap } = await fakeImport('/src/util/tumblr-helpers.js');
      cssMap = await getCssMap();
    }

    return cssMap[key];
  }

  const keyToCss = async function(key) {
    const classes = await keyToClasses(key);
    if (classes !== undefined) {
      return classes.map(className => `.${className}`).join(', ');
    }
  }

  const descendantSelector = async function(...keys) {
    const { cartesian } = await fakeImport('/src/util/misc.js');
    let sets = [];

    for (const key of keys) {
      const set = await keyToClasses(key);
      sets.push(set.map(className => `.${className}`));
    }

    return cartesian(...sets).map(selectors => selectors.join(' ')).join(', ');
  }

  return { keyToClasses, keyToCss, descendantSelector };
})();
