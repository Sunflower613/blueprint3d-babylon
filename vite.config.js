import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: 'example',
  server: {
    port: 3000,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save-image' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { type, image } = JSON.parse(body);
              const base64Data = image.replace(/^data:image\/png;base64,/, '');
              const dir = path.resolve(__dirname, 'src/furniture/image');
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              const filePath = path.join(dir, `${type}.png`);
              fs.writeFileSync(filePath, base64Data, 'base64');
              console.log(`Successfully saved: ${type}.png`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              console.error('Error saving image:', e);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end(e.toString());
            }
          });
        } else {
          next();
        }
      });
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
