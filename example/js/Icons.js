/**
 * 2D/3D 编辑器交互操作图标管理器
 */

const attrs = 'class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const icons = {
  copy: `<svg ${attrs}><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  rotate: `<svg ${attrs}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>`,
  trash: `<svg ${attrs}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`,
  up: `<svg ${attrs}><path d="m18 15-6-6-6 6"/></svg>`,
  down: `<svg ${attrs}><path d="m6 9 6 6 6-6"/></svg>`,
  lock: `<svg ${attrs}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  unlock: `<svg ${attrs}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M16 11V7a4 4 0 0 0-7.6-1.8"/></svg>`,
  power: `<svg ${attrs}><path d="M12 2v10"/><path d="M18.36 6.36a9 9 0 1 1-12.73 0"/></svg>`,
  door: `<svg ${attrs}><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M15 6 L10.5 4.5 A2 2 0 0 0 9 6.5 L9 17.5 A2 2 0 0 0 10.5 19.5 L15 18 Z"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  double_door: `<svg ${attrs}><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="2"/><path d="M7 6 L10.5 7.2 A1 1 0 0 1 11 8.2 L11 15.8 A1 1 0 0 1 10.5 16.8 L7 18 Z M17 6 L13.5 7.2 A1 1 0 0 0 13 8.2 L13 15.8 A1 1 0 0 0 13.5 16.8 L17 18 Z" stroke="currentColor" stroke-width="2"/></svg>`,
  edit: `<svg ${attrs}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  droplet: `<svg ${attrs}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`,
  flip: `<svg ${attrs}><path d="M12 2v20 M9 7v10H3z M15 7v10H21z"/></svg>`
};

/**
 * 获取对应操作种类的 SVG 图标字符串
 * @param {string} name 图标名称（如 copy, rotate, trash 等）
 * @returns {string} 图标的完整 SVG HTML 字符串，如果未找到则返回空字符串
 */
export function iconSvg(name) {
  return icons[name] || '';
}
