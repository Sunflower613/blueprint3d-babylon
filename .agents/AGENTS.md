# 项目架构守则

本工作区（blueprint3d-babylon）已完成第一阶段的模块化重构（收口公开 API），确立了以下架构和依赖隔离规则：

## 1. 依赖隔离规则
* **公开门面出口**：`src/index.js`（重定向自 `src/api/index.js`）是整个库的唯一稳定 API 门面。
* **越权访问限制**：禁止 `example/app.js` 或任何外部集成组件直接使用 `import` 引用 `src/core/*`、`src/presets/*`、`src/rooms/*`、`src/furniture/*`、`src/geometry/*` 等内部私有目录下的文件。
* **所有外部依赖的导入均须从 `src/index.js` 解构引入。**

## 2. API 分层与重构大方向
* **api 层（门面）**：管理对外导出的 API 稳定性，为外部集成系统提供统一收口的门面。
* **domain 层（数据）/ runtime 层（渲染）/ editor 层（交互）**：属于库的私有实现细节，其文件物理隔离在内部私有目录下，不得暴露给外部直接 import。
