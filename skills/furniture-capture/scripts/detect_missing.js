import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 家具定义目录和缩略图图片目录
const furnitureDir = path.resolve(__dirname, '../../../src/furniture');
const imageDir = path.resolve(__dirname, '../../../src/furniture/image');

// 1. 获取所有已有的缩略图名称 (去掉 .png 后缀)
const existingImages = new Set();
if (fs.existsSync(imageDir)) {
  fs.readdirSync(imageDir).forEach(file => {
    if (file.endsWith('.png')) {
      const type = path.basename(file, '.png');
      existingImages.add(type);
    }
  });
}

// 2. 遍历 JS 文件提取家具定义
const allFurniture = [];

const files = fs.readdirSync(furnitureDir);
files.forEach(file => {
  if (!file.endsWith('.js') || file === 'index.js' || file === '_helpers.js') {
    return;
  }

  const filePath = path.join(furnitureDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let currentFurniture = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测顶层变量定义，如 export const xxx = {
    if (line.trim().startsWith('export const ') && (line.includes('{') || (i + 1 < lines.length && lines[i + 1].includes('{')))) {
      if (currentFurniture && currentFurniture.type) {
        allFurniture.push(currentFurniture);
      }
      currentFurniture = { file };
      continue;
    }

    // 匹配 2 个空格缩进的 type 属性
    const typeMatch = line.match(/^  type:\s*['"]([^'"]+)['"]/);
    if (typeMatch && currentFurniture) {
      currentFurniture.type = typeMatch[1];
      continue;
    }

    // 匹配 2 个空格缩进的 name 属性
    const nameMatch = line.match(/^  name:\s*['"]([^'"]+)['"]/);
    if (nameMatch && currentFurniture) {
      currentFurniture.name = nameMatch[1];
      continue;
    }
  }

  // 最后一个家具定义
  if (currentFurniture && currentFurniture.type) {
    allFurniture.push(currentFurniture);
  }
});

// 3. 统计和比对结果
const missingThumbnails = [];
allFurniture.forEach(item => {
  if (!existingImages.has(item.type)) {
    missingThumbnails.push(item);
  }
});

console.log('==================================================');
console.log(`总检测到家具定义: ${allFurniture.length} 个`);
console.log(`已有缩略图数量: ${existingImages.size} 个`);
console.log(`缺少缩略图数量: ${missingThumbnails.length} 个`);
console.log('==================================================');

if (missingThumbnails.length > 0) {
  console.log('\n以下家具缺少缩略图:\n');
  missingThumbnails.forEach((item, index) => {
    console.log(`${index + 1}. [${item.name || '未知名称'}] (类型: ${item.type}) - 文件: ${item.file}`);
  });
} else {
  console.log('\n恭喜！所有家具均有缩略图。');
}
console.log('==================================================');
