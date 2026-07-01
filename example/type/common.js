/**
 * common.js — 基础通用目标类型定义
 */

/**
 * @typedef {('room'|'wall'|'item'|'opening'|'roof'|'stairs'|'fence'|'fence_gate')} TargetType
 */

/**
 * @typedef {Object} SelectedTarget
 * @property {TargetType|null} type - 选中的实体类型
 * @property {string|null} id - 选中的实体 ID
 */
