import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const INCHES_PER_UNIT = 39.37;

// 获取当前脚本所在目录以及内置家具定义的绝对路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const furnitureDir = path.resolve(__dirname, '../../src/furniture');

/**
 * 将英寸转换为米
 * @param {number|string} inch 
 * @returns {number}
 */
function inchesToMeters(inch) {
  const raw = Number(inch) / INCHES_PER_UNIT;
  if (raw === 0) return 0;
  
  // 智能分级：小于 25 厘米的微型摆件使用 1 厘米(0.01米)步长；常规家具使用 5 厘米(0.05米)步长
  const step = raw < 0.25 ? 0.01 : 0.05;
  
  const rounded = Math.round(raw / step) * step;
  if (rounded === 0) {
    return Number(raw.toFixed(2));
  }
  return Number(rounded.toFixed(2));
}

/**
 * 转换 defaultSize 的正则替换函数，并自动插入 unit: 'm'
 * @param {string} content 
 * @returns {string}
 */
function convertDefaultSize(content) {
  // 匹配形如 defaultSize: { width: X, depth: Y, height: Z } (允许空格和换行)
  const regex = /defaultSize:\s*\{\s*width:\s*([\d.-]+)\s*,\s*depth:\s*([\d.-]+)\s*,\s*height:\s*([\d.-]+)\s*\}/g;
  return content.replace(regex, (match, w, d, h) => {
    const wm = inchesToMeters(w);
    const dm = inchesToMeters(d);
    const hm = inchesToMeters(h);
    // 转换为米制后，在定义中显式补充 unit: 'm'
    return `unit: 'm',\n  defaultSize: { width: ${wm}, depth: ${dm}, height: ${hm} }`;
  });
}

/**
 * 转换所有 lightSource 中的 offset 和 range 属性，避免多层嵌套括号干扰
 * @param {string} content 
 * @returns {string}
 */
function convertLightSources(content) {
  let idx = 0;
  while (true) {
    idx = content.indexOf('lightSource:', idx);
    if (idx === -1) break;
    
    // 找到 lightSource 标记后的第一个左花括号 "{"
    const startBrace = content.indexOf('{', idx);
    if (startBrace === -1) {
      idx += 12;
      continue;
    }
    
    // 栈匹配寻找闭合右花括号 "}"
    let braceCount = 1;
    let endBrace = startBrace + 1;
    while (braceCount > 0 && endBrace < content.length) {
      const char = content[endBrace];
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      endBrace++;
    }
    
    if (braceCount > 0) {
      // 括号匹配失败，跳过
      idx += 12;
      continue;
    }
    
    // 截取整个 lightSource 配置块的子文本
    const blockContent = content.substring(startBrace, endBrace);
    
    // 1. 转换块内的 offset: { x: X, y: Y, z: Z } 为米制
    let updatedBlock = blockContent.replace(/offset:\s*\{\s*x:\s*([\d.-]+)\s*,\s*y:\s*([\d.-]+)\s*,\s*z:\s*([\d.-]+)\s*\}/g, (match, x, y, z) => {
      const xm = inchesToMeters(x);
      const ym = inchesToMeters(y);
      const zm = inchesToMeters(z);
      return `offset: { x: ${xm}, y: ${ym}, z: ${zm} }`;
    });
    
    // 2. 转换块内的 range: R 为米制
    updatedBlock = updatedBlock.replace(/range:\s*([\d.]+)/g, (match, r) => {
      const rm = inchesToMeters(r);
      return `range: ${rm}`;
    });
    
    // 替换原文本中对应的 lightSource 配置块
    content = content.substring(0, startBrace) + updatedBlock + content.substring(endBrace);
    
    // 递增索引，继续检索下一个光源定义
    idx += updatedBlock.length + (startBrace - idx);
  }
  return content;
}

/**
 * 转换单个文件
 * @param {string} filePath 
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // 1. 转换默认尺寸并注入 unit: 'm'
  content = convertDefaultSize(content);
  
  // 2. 转换光源配置
  content = convertLightSources(content);
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[成功] 已将文件转换为米制: ${path.basename(filePath)}`);
  } else {
    console.log(`[跳过] 无需转换: ${path.basename(filePath)}`);
  }
}

function main() {
  console.log('=== 开始批量转换内置家具定义为米制 ===');
  
  if (!fs.existsSync(furnitureDir)) {
    console.error(`[错误] 未找到内置家具目录: ${furnitureDir}`);
    return;
  }
  
  const files = fs.readdirSync(furnitureDir);
  let count = 0;
  for (const file of files) {
    // 仅转换分类文件，忽略聚合入口 index.js 以及公共辅助 helper 模块
    if (!file.endsWith('.js') || file === 'index.js' || file === '_helpers.js') {
      continue;
    }
    const fullPath = path.join(furnitureDir, file);
    try {
      processFile(fullPath);
      count++;
    } catch (err) {
      console.error(`[错误] 转换文件 ${file} 失败:`, err);
    }
  }
  
  console.log(`\n=== 批量转换完成！共扫描转换了 ${count} 个家具分类模块。===`);
}

main();
