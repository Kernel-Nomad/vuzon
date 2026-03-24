import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const CLIENT_SOURCE_DIR = path.resolve(process.env.VUZON_CLIENT_SOURCE_DIR || 'src/client');
const PUBLIC_SOURCE_DIR = path.resolve(process.env.VUZON_PUBLIC_SOURCE_DIR || 'public');
const OUTPUT_DIR = path.resolve(process.env.VUZON_BUILD_OUT_DIR || path.join('dist', 'public'));

function ensureDir(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function copyFile(sourceFile, destinationFile) {
  ensureDir(path.dirname(destinationFile));
  fs.copyFileSync(sourceFile, destinationFile);
}

function copyDirectory(sourceDir, destinationDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      continue;
    }

    copyFile(sourcePath, destinationPath);
  }
}

function requireSourceFile(sourceFile) {
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Falta el fichero requerido para el build: ${sourceFile}`);
  }
}

async function buildClient() {
  const dashboardEntry = path.join(CLIENT_SOURCE_DIR, 'entrypoints', 'dashboard.js');
  const loginEntry = path.join(CLIENT_SOURCE_DIR, 'entrypoints', 'login.js');
  const compatDestSelectionEntry = path.join(CLIENT_SOURCE_DIR, 'compat', 'public-utils', 'destSelection.js');
  const compatErrorEntry = path.join(CLIENT_SOURCE_DIR, 'compat', 'public-utils', 'error.js');
  const compatVerificationEntry = path.join(CLIENT_SOURCE_DIR, 'compat', 'public-utils', 'verification.js');
  const indexPage = path.join(PUBLIC_SOURCE_DIR, 'pages', 'index.html');
  const loginPage = path.join(PUBLIC_SOURCE_DIR, 'pages', 'login.html');
  const uiStyles = path.join(PUBLIC_SOURCE_DIR, 'styles', 'ui.css');
  const alpineVendor = path.join(PUBLIC_SOURCE_DIR, 'vendor', 'alpine.js');
  const publicAssetsDir = path.join(PUBLIC_SOURCE_DIR, 'assets');
  const manifestFile = path.join(PUBLIC_SOURCE_DIR, 'site.webmanifest');

  [
    dashboardEntry,
    loginEntry,
    compatDestSelectionEntry,
    compatErrorEntry,
    compatVerificationEntry,
    indexPage,
    loginPage,
    uiStyles,
    alpineVendor,
  ].forEach(requireSourceFile);

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  ensureDir(OUTPUT_DIR);

  await build({
    absWorkingDir: path.resolve('.'),
    bundle: true,
    entryPoints: {
      app: dashboardEntry,
      'js/login': loginEntry,
      'utils/destSelection': compatDestSelectionEntry,
      'utils/error': compatErrorEntry,
      'utils/verification': compatVerificationEntry,
    },
    format: 'esm',
    outdir: OUTPUT_DIR,
    platform: 'browser',
    target: 'es2020',
    write: true,
  });

  copyFile(indexPage, path.join(OUTPUT_DIR, 'index.html'));
  copyFile(loginPage, path.join(OUTPUT_DIR, 'login.html'));
  copyFile(uiStyles, path.join(OUTPUT_DIR, 'ui.css'));
  copyFile(alpineVendor, path.join(OUTPUT_DIR, 'js', 'alpine.js'));
  copyDirectory(publicAssetsDir, path.join(OUTPUT_DIR, 'assets'));

  if (fs.existsSync(manifestFile)) {
    copyFile(manifestFile, path.join(OUTPUT_DIR, 'site.webmanifest'));
  }
}

buildClient().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
