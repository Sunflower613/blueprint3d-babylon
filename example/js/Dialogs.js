import { formatTimestamp } from './Store.js';

// ==========================================
// 自定义弹窗系统 (已去除磨砂玻璃)
// ==========================================

export function showCustomConfirm(title, message = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    
    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = '提示';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">${finalMessage}</div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel">取消</button>
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-confirm">确认</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');
    
    let isCleaned = false;
    const cleanup = (value) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        backdrop.remove();
      }, 200);
      resolve(value);
    };

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(false));
    backdrop.querySelector('#custom-modal-confirm').addEventListener('click', () => cleanup(true));
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup(false);
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        cleanup(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

export function showCustomAlert(title, message = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    
    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = '提示';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper alert">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">${finalMessage}</div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-ok">确定</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');
    
    let isCleaned = false;
    const cleanup = () => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        backdrop.remove();
      }, 200);
      resolve();
    };

    backdrop.querySelector('#custom-modal-ok').addEventListener('click', cleanup);
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup();
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        cleanup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

/**
 * 显示带输入框的弹窗
 * @param {string} title - 弹窗标题
 * @param {string} message - 提示消息
 * @param {string} [defaultValue=''] - 输入框默认值
 * @returns {Promise<string|null>} 用户输入的值，取消返回 null
 */
export function showCustomPrompt(title, message = '', defaultValue = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';

    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = '输入';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">
          <p style="margin:0 0 12px 0">${finalMessage}</p>
          <input type="text" id="custom-modal-input" class="custom-modal-input" value="${defaultValue.replace(/"/g, '&quot;')}" autocomplete="off" />
        </div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel">取消</button>
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-confirm">确定</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');

    const inputEl = backdrop.querySelector('#custom-modal-input');
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.select();
    });

    let isCleaned = false;
    const cleanup = (value) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => backdrop.remove(), 200);
      resolve(value);
    };

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(null));
    backdrop.querySelector('#custom-modal-confirm').addEventListener('click', () => {
      const val = inputEl.value.trim();
      cleanup(val || null);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(null);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const val = inputEl.value.trim();
        cleanup(val || null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

/**
 * 显示本地项目列表弹窗，支持打开和删除
 * @param {{ id: string, name: string, savedAt: number }[]} projects
 * @returns {Promise<{ action: 'open'|'delete', name: string }|null>}
 */
export function showProjectListModal(projects) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';

    const listHtml = projects.map((p) => {
      const timeStr = formatTimestamp(p.savedAt);
      return `
        <div class="project-list-item" data-name="${p.name.replace(/"/g, '&quot;')}">
          <div class="project-list-item-info">
            <span class="project-list-item-name">${p.name}</span>
            <span class="project-list-item-time">${timeStr}</span>
          </div>
          <div class="project-list-item-actions">
            <button type="button" class="custom-modal-btn btn-primary btn-sm project-open-btn" title="打开">打开</button>
            <button type="button" class="custom-modal-btn btn-danger btn-sm project-delete-btn" title="删除">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="custom-modal-container" style="max-width:480px">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 class="custom-modal-title">打开本地项目</h3>
        </div>
        <div class="custom-modal-body" style="margin-bottom:16px">
          <div class="project-list">${listHtml}</div>
        </div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');

    let isCleaned = false;
    const cleanup = (value) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => backdrop.remove(), 200);
      resolve(value);
    };

    // 打开按钮
    backdrop.querySelectorAll('.project-open-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.project-list-item');
        cleanup({ action: 'open', name: item.dataset.name });
      });
    });

    // 删除按钮
    backdrop.querySelectorAll('.project-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.project-list-item');
        cleanup({ action: 'delete', name: item.dataset.name });
      });
    });

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(null));

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(null);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

export function show3MFExportDialog() {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    
    backdrop.innerHTML = `
      <div class="custom-modal-container" style="max-width: 420px; position: relative; max-height: 90vh; overflow-y: auto;">
        <button type="button" class="custom-modal-close" id="export-close-btn" aria-label="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h3 class="custom-modal-title">导出 3MF 三维模型</h3>
        </div>
        <div class="custom-modal-body" style="text-align: center; font-size: 14px; color: var(--text-secondary, #666); line-height: 1.5;">

          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <input type="checkbox" id="enable-tenon-joint" checked style="cursor: pointer; width: 15px; height: 15px; margin: 0;">
            <label for="enable-tenon-joint" style="cursor: pointer; font-size: 13px; color: var(--text-primary, #333); user-select: none;">添加榫卯连接结构 (方便分层拆卸打印)</label>
          </div>
        </div>
        <div class="custom-modal-footer" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
          <button type="button" class="custom-modal-btn btn-primary" id="export-building-only" style="width: 100%; margin: 0; padding: 12px 16px;">仅导出建筑 (仅墙面、地板、楼梯、围栏)</button>
          <button type="button" class="custom-modal-btn btn-primary" id="export-furniture-only" style="width: 100%; margin: 0; padding: 12px 16px;">仅导出家具 (高精度造型与真实配色)</button>
          <button type="button" class="custom-modal-btn btn-secondary" id="export-all" style="width: 100%; margin: 0; padding: 12px 16px; border: 1px solid var(--border-color, #ddd);">导出全部 (合并在同一个 3MF 包中)</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');
    
    let isCleaned = false;
    const cleanup = (choice) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        backdrop.remove();
      }, 200);
      
      if (choice) {
        resolve({
          category: choice,
          enableTenon: backdrop.querySelector('#enable-tenon-joint').checked
        });
      } else {
        resolve(null);
      }
    };

    backdrop.querySelector('#export-building-only').addEventListener('click', () => cleanup('building'));
    backdrop.querySelector('#export-furniture-only').addEventListener('click', () => cleanup('furniture'));
    backdrop.querySelector('#export-all').addEventListener('click', () => cleanup('all'));
    backdrop.querySelector('#export-close-btn').addEventListener('click', () => cleanup(null));
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup(null);
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

