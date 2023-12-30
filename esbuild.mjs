import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

const options = {
  entryPoints: ['src/content_scripts/main.js', 'src/browser_action/*.js'],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  loader: { '.js': 'jsx' },
  jsxFactory: 'jsx',
  plugins: [
    copy({
      assets: {
        from: [
          './src/**/*.json',
          './src/**/*.html',
          './src/**/*.png',
          './src/**/*.css',
          './src/**/*.svg',
          './src/**/*.min.js',
          './src/**/*.eot',
          './src/**/*.ttf',
          './src/**/*.woff',
          './src/**/*.woff2'
        ],
        to: ['./']
      },
      watch: true
    })
  ]
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(options);
  ctx.watch();
} else {
  esbuild.build(options);
}
