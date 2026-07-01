/**
 * appState.js — 运行时主状态 AppState 聚合类型定义
 */

/**
 * @typedef {import('./uiState.js').UIState} UIState
 * @typedef {import('./selectionState.js').SelectionState} SelectionState
 * @typedef {import('./editorPreviewState.js').EditorPreviewState} EditorPreviewState
 */

/**
 * @typedef {Object} AppState
 * @property {UIState} ui - UI 交互状态子 Store
 * @property {SelectionState} selection - 实体选中状态子 Store
 * @property {EditorPreviewState} editor - 编辑器与捕捉预览状态子 Store
 */
