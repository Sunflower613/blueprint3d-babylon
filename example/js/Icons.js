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
  door: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21"><g fill="none" fill-rule="evenodd" transform="translate(4 1)"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2.5 2.5h2v14h-2a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2M7.202.513l4 1.5A2 2 0 0 1 12.5 3.886v11.228a2 2 0 0 1-1.298 1.873l-4 1.5A2 2 0 0 1 4.5 16.614V2.386A2 2 0 0 1 7.202.513"/><circle cx="6.5" cy="9.5" r="1" fill="currentColor"/></g></svg>`,
  double_door: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M8.288 12.713Q8 12.425 8 12t.288-.712T9 11t.713.288T10 12t-.288.713T9 13t-.712-.288m6 0Q14 12.426 14 12t.288-.712T15 11t.713.288T16 12t-.288.713T15 13t-.712-.288M4 21q-.425 0-.712-.288T3 20q0-.4.363-.562T4 19V5q0-.825.588-1.412T6 3h12q.825 0 1.413.588T20 5v14q.425 0 .713.288T21 20t-.288.713T20 21zm2-2h5V5H6zm7 0h5V5h-5zm-1-8"/></svg>`,
  edit: `<svg ${attrs}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  droplet: `<svg ${attrs}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`,
  flip: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16"><path fill="currentColor" d="M15.547 3.061A.75.75 0 0 1 16 3.75v8.5a.751.751 0 0 1-1.265.545l-4.5-4.25a.75.75 0 0 1 0-1.09l4.5-4.25a.75.75 0 0 1 .812-.144M0 12.25v-8.5a.751.751 0 0 1 1.265-.545l4.5 4.25a.75.75 0 0 1 0 1.09l-4.5 4.25A.75.75 0 0 1 0 12.25m1.5-6.76v5.02L4.158 8ZM11.842 8l2.658 2.51V5.49ZM8 4a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-1.5 0v-.5A.75.75 0 0 1 8 4m.75-2.25v.5a.75.75 0 0 1-1.5 0v-.5a.75.75 0 0 1 1.5 0m0 6v.5a.75.75 0 0 1-1.5 0v-.5a.75.75 0 0 1 1.5 0M8 10a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-1.5 0v-.5A.75.75 0 0 1 8 10m0 3a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-1.5 0v-.5A.75.75 0 0 1 8 13"/></svg>`,
  pipette: `<svg ${attrs}><path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"/><path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z"/><path d="m2 22 .414-.414"/></svg>`
};

/**
 * 获取对应操作种类的 SVG 图标字符串
 * @param {string} name 图标名称（如 copy, rotate, trash 等）
 * @returns {string} 图标的完整 SVG HTML 字符串，如果未找到则返回空字符串
 */
export function iconSvg(name) {
  return icons[name] || '';
}
