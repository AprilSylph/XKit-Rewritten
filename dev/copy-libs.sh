cp node_modules/@melloware/coloris/dist/coloris.min.css src/lib/
cp node_modules/@melloware/coloris/dist/esm/coloris.min.js src/lib/
cp node_modules/jquery/dist/jquery.min.js src/lib/
cp node_modules/moment/dist/moment.js src/lib/
cp node_modules/remixicon/fonts/*.{css,eot,woff2,woff,ttf,svg} src/lib/remixicon/
cp node_modules/sortablejs/modular/sortable.esm.js src/lib/
cp node_modules/webextension-polyfill/dist/browser-polyfill.min.js src/lib/

curl "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js" --output-dir src/lib/ --remote-name --silent

chmod +x src/lib/**.js
