import fs from 'fs';
import { get } from 'https';
import path from 'path';

const ALPINE_VERSION = '3.13.3';
const URL = `https://cdn.jsdelivr.net/npm/alpinejs@${ALPINE_VERSION}/dist/cdn.min.js`;
const TARGET_DIR = 'public/js';
const TARGET_FILE = path.join(TARGET_DIR, 'alpine.js');

console.log(`Descargando Alpine.js v${ALPINE_VERSION}...`);

if (!fs.existsSync(TARGET_DIR)){
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const file = fs.createWriteStream(TARGET_FILE);

get(URL, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Error al descargar: Estado ${response.statusCode}`);
        response.resume();
        return;
    }

    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log(`Completado: ${TARGET_FILE}`);
    });
}).on('error', (err) => {
    fs.unlink(TARGET_FILE, () => {});
    console.error('Error de red:', err.message);
});
