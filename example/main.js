import './styles.css';

export async function bootstrap() {
  return import('./app.js');
}

bootstrap().catch((error) => {
  console.error('Application bootstrap failed:', error);
  document.body.dataset.bootstrapError = 'true';
});
