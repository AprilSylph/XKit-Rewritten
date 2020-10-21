(function () {
  let css;

  const cssTemplate = filteredScreen => `
    [data-id] .${filteredScreen} {
      flex-direction: row;
      justify-content: space-between;
      height: auto;
      padding-top: var(--post-header-vertical-padding);
      padding-bottom: var(--post-header-vertical-padding);
      overflow-x: auto;
    }

    [data-id] .${filteredScreen} > p {
        flex-shrink: 0;
    }

    [data-id] .${filteredScreen} > a {
        margin-right: auto;
        margin-left: 1ch;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    [data-id] .${filteredScreen} > button {
        flex-shrink: 0;
        margin-left: 1ch;
    }

    [data-id] .${filteredScreen} > button > span {
        margin-top: 0;
    }
  `;

  const main = async function () {
    const { keyToClasses } = await fakeImport('/util/css_map.js');
    const { addStyle } = await fakeImport('/util/interface.js');

    const [filteredScreen] = await keyToClasses('filteredScreen');
    css = cssTemplate(filteredScreen);
    addStyle(css);
  };

  const clean = async function () {
    const { removeStyle } = await fakeImport('/util/interface.js');
    removeStyle(css);
  };

  return { main, clean };
})();
