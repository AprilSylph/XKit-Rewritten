const fs = require('fs');
const parser = require('fast-xml-parser');

const inputPath = './node_modules/remixicon/fonts/remixicon.symbol.svg';
const outputPath = './src/lib/remixicon_svg.json';

const remixSvg = fs.readFileSync(inputPath, { encoding: 'utf8' });
const jsonObj = parser.parse(remixSvg, {
  ignoreAttributes: false
});

const symbols = {};

for (const symbol of jsonObj.svg.symbol) {
  if (symbol.g !== undefined && symbol.g.path !== undefined && symbol.g.path instanceof Array) {
    symbols[symbol['@_id']] = symbol.g.path[1]['@_d'];
  } else if (symbol.path !== undefined && symbol.path instanceof Array) {
    symbols[symbol['@_id']] = symbol.path[1]['@_d'];
  }
}

fs.writeFileSync(outputPath, JSON.stringify(symbols, null, 2) + '\n', { encoding: 'utf8' });
console.log('Finished!');
