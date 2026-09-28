#!/usr/bin/env node

import { createReadStream, createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { pipeline } from 'node:stream/promises';

/** @type {(props: { packageName: string; fileNames: string[]; includeHeader: boolean; }) => Promise<void>} */
const copyLibrary = async ({ packageName, fileNames, includeHeader = false }) => {
  const packagePath = join('node_modules', packageName, 'package.json');
  const packageString = await readFile(packagePath, { encoding: 'utf-8' });
  const { version, license } = JSON.parse(packageString);

  for (const fileName of fileNames) {
    const source = createReadStream(join('node_modules', packageName, fileName), { encoding: 'utf-8' });
    const destination = createWriteStream(join('src', 'lib', basename(fileName)), { encoding: 'utf-8' });

    if (includeHeader) {
      destination.write(`/* https://www.npmjs.com/package/${packageName}/v/${version} | License: ${license} */` + '\n');
    }

    await pipeline(source, destination);
  }
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
