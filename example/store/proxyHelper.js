/**
 * proxyHelper.js — 运行时状态 Store 与各 Handler 注入上下文的桥接代理助手
 * 
 * 职责：
 *   1. 利用运行时动态反射机制，检测 Handler 访问属性所归属的子 Store 并进行分流读写。
 *   2. 对非状态的渲染方法、场景服务等操作直接透传至原始上下文 ctx。
 *   3. O(1) 属性路由缓存，保证性能的同时彻底消除任何硬编码属性判定。
 */

import { ui, selection, editor } from './index.js';

// 子 Store 实例列表
const stores = [ui, selection, editor];
// 属性归属 Store 路由映射表缓存
const storePropCache = new Map();

/**
 * 查找指定属性所归属的子 Store，并在缓存中记录
 * @param {string} prop - 属性名
 * @returns {Object|null} 归属的 Store 实例或 null
 */
function findStoreForProp(prop) {
  if (storePropCache.has(prop)) {
    return storePropCache.get(prop);
  }

  for (const store of stores) {
    // 检查属性是否定义在 store 自身上
    if (Object.prototype.hasOwnProperty.call(store, prop)) {
      storePropCache.set(prop, store);
      return store;
    }
  }

  // 缓存透传属性
  storePropCache.set(prop, null);
  return null;
}

/**
 * 创建一个用于桥接 Handler 和运行时子 Store 的代理对象
 * @param {() => Object} getRawCtx - 闭包，用于动态获取 Handler 原本传入的原始 ctx 对象
 * @returns {Proxy} 代理对象
 */
export function createStoreProxy(getRawCtx) {
  return new Proxy({}, {
    get(target, prop) {
      // 如果属性是一个 symbol，直接在 target 上解析以防止对 hasOwnProperty.call 产生非法调用
      if (typeof prop === 'symbol') {
        return target[prop];
      }

      const store = findStoreForProp(prop);
      if (store) {
        return store[prop];
      }

      // 透传读取原始上下文
      const raw = getRawCtx();
      return raw ? raw[prop] : undefined;
    },

    set(target, prop, value) {
      if (typeof prop === 'symbol') {
        target[prop] = value;
        return true;
      }

      const store = findStoreForProp(prop);
      if (store) {
        store[prop] = value;
        return true;
      }

      // 透传写入原始上下文
      const raw = getRawCtx();
      if (raw) {
        raw[prop] = value;
      }
      return true;
    }
  });
}
