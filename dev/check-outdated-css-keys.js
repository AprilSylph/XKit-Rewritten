#!/usr/bin/env node

import fs from 'node:fs/promises';

const getCssMap = async () => {
  const cssMapUrl = /(?<="cssMapUrl":")[^"]+.json(?=")/.exec(
    await fetch('https://www.tumblr.com/').then(response => response.text())
  )[0];
  return fetch(cssMapUrl).then(response => response.json());
};

const getUsedCssKeys = async () => {
  const sourceFilePaths = await Array.fromAsync(fs.glob('src/**/*.js'));
  const sourceFileContents = await Promise.all(
    sourceFilePaths.map(path => fs.readFile(path, 'utf8'))
  );
  const keyToCssArgsStrings = sourceFileContents.flatMap(file =>
    [...file.matchAll(/(?<=keyToCss\()[a-zA-Z'\s,]+(?=\))/g)].map(match => match[0])
  );
  const usedCssKeysSet = new Set(
    keyToCssArgsStrings.flatMap(string =>
      [...string.matchAll(/(?<=')[a-zA-Z]+(?=')/g)].map(match => match[0])
    )
  );
  return [...usedCssKeysSet];
};

Promise.all([getCssMap(), getUsedCssKeys()]).then(([cssMap, usedCssKeys]) => {
  const invalidCssKeys = usedCssKeys.filter(key => !cssMap[key]);
  if (invalidCssKeys.length) {
    console.log('keyToCss is called with outdated/invalid key arguments:');
    invalidCssKeys.forEach(arg => console.log('-', arg));
  } else {
    console.log('all keyToCss keys are valid!');
  }
});
