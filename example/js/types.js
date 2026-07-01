/**
 * types.js — 兼容桥接层
 * 
 * 职责：
 *   1. 重新导出 type/targetTypes.js 中的常量，完全兼容外部业务文件的直接引入。
 *   2. 桥接 JSDoc 声明，使旧的引用能正常映射。
 */

export { BUILDING_TARGET_TYPES, TARGET_TYPES } from '../type/targetTypes.js';
