#!/usr/bin/env node

import fs from 'node:fs/promises';

const getCssMapKeys = async () => {
  const cssMapUrl = /(?<="cssMapUrl":")[^"]+.json(?=")/.exec(
    await fetch('https://www.tumblr.com/').then(response => response.text()),
  )[0];
  const cssMap = await fetch(cssMapUrl).then(response => response.json());
  return new Set(Object.keys(cssMap));
};

const getUsedCssKeys = async () => {
  const sourceFilePaths = await Array.fromAsync(fs.glob('src/**/*.js'));
  const sourceFileContents = await Promise.all(
    sourceFilePaths.map(path => fs.readFile(path, 'utf8')),
  );
  const keyToCssArgsStrings = sourceFileContents.flatMap(file =>
    [...file.matchAll(/(?<=keyToCss\()[a-zA-Z'\s,]+(?=\))/g)].map(match => match[0]),
  );
  return new Set(
    keyToCssArgsStrings.flatMap(string =>
      [...string.matchAll(/(?<=')[a-zA-Z]+(?=')/g)].map(match => match[0]),
    ),
  );
};

Promise.all([getCssMapKeys(), getUsedCssKeys()]).then(([cssMapKeys, usedCssKeys]) => {
  const invalidCssKeys = usedCssKeys.difference(cssMapKeys);
  if (invalidCssKeys.size) {
    console.log('keyToCss is called with outdated/invalid key arguments:');
    invalidCssKeys.forEach(key => console.log('-', key));
  } else {
    console.log('all keyToCss keys are valid!');
  }
});
