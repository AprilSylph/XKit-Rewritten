(function() {
  let css;

  const cssTemplate = filteredScreen => `
    .${filteredScreen} {
      flex-direction: row;
      justify-content: space-between;
      height: auto;
      padding-top: var(--post-header-vertical-padding);
      padding-bottom: var(--post-header-vertical-padding);
      overflow-x: auto;
    }

    .${filteredScreen} > p {
        flex-shrink: 0;
    }

    .${filteredScreen} > a {
        margin-right: auto;
        margin-left: 1ch;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .${filteredScreen} > button {
        flex-shrink: 0;
        margin-left: 1ch;
    }

    .${filteredScreen} > button > span {
        margin-top: 0;
    }
  `;

  const run = async function() {
    const { keyToClasses } = await fakeImport('/src/util/css-map.js');
    const { addStyle } = await fakeImport('/src/util/misc.js');

    const [filteredScreen] = await keyToClasses('filteredScreen');
    css = cssTemplate(filteredScreen);
    addStyle(css);
  };

  const destroy = async function() {
    const { removeStyle } = await fakeImport('/src/util/misc.js');
    removeStyle(css);
  };

  return { run, destroy };
})();
