import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  // 设置 CORS 头，解决跨域问题
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/save-image' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { type, image } = JSON.parse(body);
        const base64Data = image.replace(/^data:image\/png;base64,/, '');
        
        // 自动保存至项目 src/furniture/image 目录下
        const dir = path.resolve(__dirname, '../../../src/furniture/image');
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, `${type}.png`);
        fs.writeFileSync(filePath, base64Data, 'base64');
        console.log(`Saved: ${type}.png`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        console.error('Save error:', e);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(e.toString());
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3001, () => {
  console.log('Image Saver listening on port 3001');
});
