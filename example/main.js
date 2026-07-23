import './styles.css';

function registerImageCache() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  // Vite's BASE_URL keeps this working both on GitHub Pages and custom domains.
  const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js`;
  navigator.serviceWorker.register(serviceWorkerUrl, { scope: import.meta.env.BASE_URL })
    .catch((error) => console.warn('Image cache registration failed:', error));
}

registerImageCache();

export async function bootstrap() {
  return import('./app.js');
}

bootstrap().catch((error) => {
  console.error('Application bootstrap failed:', error);
  document.body.dataset.bootstrapError = 'true';
});
