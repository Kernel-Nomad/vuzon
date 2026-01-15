import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  const distDir = path.resolve(__dirname, '../public/dist');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  try {
    // Bundle and minify JS
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, '../public/app.js')],
      bundle: true,
      minify: true,
      outfile: path.join(distDir, 'bundle.js'),
      target: ['es2020'],
      format: 'esm', // Keep it as ESM for module script
    });
    console.log('✅ JS Bundled and Minified');

    // Minify CSS
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, '../public/ui.css')],
      minify: true,
      outfile: path.join(distDir, 'style.css'),
    });
    console.log('✅ CSS Minified');

  } catch (e) {
    console.error('❌ Build failed:', e);
    process.exit(1);
  }
}

build();
