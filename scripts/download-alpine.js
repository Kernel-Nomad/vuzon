import crypto from 'crypto';
import fs from 'fs';
import { get } from 'https';
import path from 'path';

const ALPINE_VERSION = process.env.ALPINE_VERSION || '3.13.3';
const URL = process.env.ALPINE_DOWNLOAD_URL || `https://cdn.jsdelivr.net/npm/alpinejs@${ALPINE_VERSION}/dist/cdn.min.js`;
const TARGET_FILE = process.env.ALPINE_TARGET_FILE || path.join('public/vendor', 'alpine.js');
const ALPINE_SHA256 = process.env.ALPINE_DOWNLOAD_SHA256 || 'c8fa8ff457abdcd212f37a07ef2f292c999011dffabcaa577fb1e1e0076ca658';
const TARGET_DIR = path.dirname(TARGET_FILE);
let hasFailed = false;

function cleanupPartialDownload(targetFile) {
  try {
    fs.rmSync(targetFile, { force: true });
  } catch {
    // No-op: intentamos dejar el fichero parcial fuera del árbol de trabajo.
  }
}

function failDownload(file, message) {
  if (hasFailed) {
    return;
  }

  hasFailed = true;
  if (!file.destroyed) {
    file.destroy();
  }
  cleanupPartialDownload(TARGET_FILE);
  console.error(message);
  process.exitCode = 1;
}

function verifyDownloadedFile(targetFile) {
  const fileBuffer = fs.readFileSync(targetFile);
  const digest = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  if (digest !== ALPINE_SHA256) {
    throw new Error(`Checksum SHA-256 inesperado para Alpine.js (${digest})`);
  }
}

function useExistingDownloadIfValid(targetFile) {
  if (!fs.existsSync(targetFile)) {
    return false;
  }

  try {
    verifyDownloadedFile(targetFile);
    console.log(`Reutilizando Alpine.js existente en ${targetFile}`);
    return true;
  } catch {
    cleanupPartialDownload(targetFile);
    return false;
  }
}

console.log(`Descargando Alpine.js v${ALPINE_VERSION}...`);

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

if (useExistingDownloadIfValid(TARGET_FILE)) {
  process.exit(0);
}

const file = fs.createWriteStream(TARGET_FILE);

file.on('error', () => {
  failDownload(file, `Error al escribir ${TARGET_FILE}`);
});

get(URL, (response) => {
  if (response.statusCode !== 200) {
    response.resume();
    failDownload(file, `Error al descargar: Estado ${response.statusCode}`);
    return;
  }

  response.on('error', (err) => {
    failDownload(file, `Error de red durante la descarga: ${err.message}`);
  });

  file.on('finish', () => {
    file.close(() => {
      try {
        verifyDownloadedFile(TARGET_FILE);
        console.log(`Completado: ${TARGET_FILE}`);
      } catch (err) {
        failDownload(file, err.message);
      }
    });
  });

  response.pipe(file);
}).on('error', (err) => {
  failDownload(file, `Error de red: ${err.message}`);
});
