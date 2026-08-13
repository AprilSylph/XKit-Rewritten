#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const toCopy = {
  'src/lib/': [
    'node_modules/@melloware/coloris/dist/coloris.css',
    'node_modules/@melloware/coloris/dist/esm/coloris.js',
    'node_modules/jquery/dist/jquery.slim.min.js',
    'node_modules/modern-normalize/modern-normalize.css',
    'node_modules/moment/dist/moment.js',
    'node_modules/sortablejs/modular/sortable.esm.js',
  ],
  'src/lib/remixicon/': [
    'node_modules/remixicon/fonts/*.{css,eot,woff2,woff,ttf,svg}',
  ],
};

for (const [destination, sources] of Object.entries(toCopy)) {
  fs.mkdirSync(destination, { recursive: true });
  for (const source of sources) {
    for (const match of fs.globSync(source)) {
      fs.copyFileSync(match, path.join(destination, path.basename(match)));
    }
  }
}
