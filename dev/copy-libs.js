#!/usr/bin/env node

import { copyFile, open, readFile } from 'node:fs/promises';

/** @type {(props: { packageName: string; fileNames: string[]; includeHeader: boolean; }) => Promise<void>} */
const copyLibrary = async ({ packageName, fileNames = [], includeHeader = false }) => {
  const packageBuffer = await readFile(`node_modules/${packageName}/package.json`);
  const packageString = packageBuffer.toString();
  const { version, license } = JSON.parse(packageString);

  fileNames.forEach(async fileName => {
    const sourcePath = `node_modules/${packageName}/${fileName}`;
    const destinationPath = `src/lib/${sourcePath.split('/').at(-1)}`;

    if (includeHeader) {
      const destinationHandle = await open(destinationPath, 'w');
      destinationHandle.writeFile(`/* https://www.npmjs.com/package/${packageName}/v/${version} | License: ${license} */` + '\n');

      const sourceBuffer = await readFile(sourcePath);
      await destinationHandle.writeFile(sourceBuffer);
    } else {
      await copyFile(sourcePath, destinationPath);
    }
  });
};

[
  {
    packageName: '@melloware/coloris',
    fileNames: ['dist/coloris.css', 'dist/esm/coloris.js'],
    includeHeader: false,
  },
  {
    packageName: 'jquery',
    fileNames: ['dist/jquery.slim.min.js'],
    includeHeader: false,
  },
  {
    packageName: 'modern-normalize',
    fileNames: ['modern-normalize.css'],
    includeHeader: false,
  },
  {
    packageName: 'moment',
    fileNames: ['dist/moment.js'],
    includeHeader: false,
  },
  {
    packageName: 'sortablejs',
    fileNames: ['modular/sortable.esm.js'],
    includeHeader: false,
  },
].forEach(copyLibrary);
