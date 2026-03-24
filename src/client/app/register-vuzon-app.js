import { createVuzonApp } from './create-vuzon-app.js';

export function registerVuzonApp() {
  document.addEventListener('alpine:init', () => {
    Alpine.data('vuzonApp', () => createVuzonApp());
  });
}
