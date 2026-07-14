import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const furnitureImageDir = path.resolve(__dirname, 'src/furniture/image');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function serveFurnitureImage(req, res, next) {
  const urlPath = req.url ? req.url.split('?')[0] : '';
  if (!urlPath.startsWith('/__furniture-images__/')) {
    next();
    return;
  }

  const requestedName = decodeURIComponent(urlPath.slice('/__furniture-images__/'.length));
  const safeName = path.basename(requestedName);
  const filePath = path.join(furnitureImageDir, safeName);

  if (!safeName.endsWith('.png') || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(filePath).pipe(res);
}

function handleSaveImage(req, res, next) {
  if (req.url !== '/api/save-image' || req.method !== 'POST') {
    next();
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    try {
      const { type, image } = JSON.parse(body);
      const base64Data = image.replace(/^data:image\/png;base64,/, '');
      if (!fs.existsSync(furnitureImageDir)) {
        fs.mkdirSync(furnitureImageDir, { recursive: true });
      }
      const filePath = path.join(furnitureImageDir, `${type}.png`);
      fs.writeFileSync(filePath, base64Data, 'base64');
      console.log(`Successfully saved: ${type}.png`);
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Error saving image:', e);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(e.toString());
    }
  });
}

export default defineConfig(({ command }) => ({
  root: 'example',
  base: command === 'serve' ? '/' : '/blueprint3d-babylon/example/',
  optimizeDeps: {
    include: [
      '@babylonjs/core',
      '@babylonjs/gui',
      'blueprint3d-babylon/babylon-runtime'
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.pengyg.top', 'pengyg.top'],
    watch: {
      ignored: [
        '**/dist-temp/**',
        '**/downloads/**',
        '**/*.log'
      ]
    },
    warmup: {
      clientFiles: [
        './index.html',
        './main.js',
        './app.js',
        './styles.css',
        './js/EditorUi.js',
        './js/MaterialManager.js',
        './js/Render2D.js',
        './js/Viewer3D.js',
        './js/Viewer3DHandles.js'
      ]
    },
    configureServer(server) {
      server.middlewares.use(serveFurnitureImage);
      server.middlewares.use(handleSaveImage);
    }
  },
  resolve: {
    alias: [
      {
        find: 'blueprint3d-babylon/babylon-runtime',
        replacement: path.resolve(__dirname, 'src/core/babylon.production.js')
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ]
  }
}));
