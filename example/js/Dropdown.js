export function createCustomDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return null;

  // 隐藏原生的 select 标签
  select.style.display = 'none';

  // 创建自定义下拉框的外层容器
  const container = document.createElement('div');
  container.className = 'custom-dropdown';
  container.id = `${selectId}-custom-container`;
  
  // 创建触发按钮 Trigger
  const trigger = document.createElement('div');
  trigger.className = 'custom-dropdown-trigger';
  
  trigger.innerHTML = `
    <span class="custom-dropdown-text"></span>
    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  `;
  
  // 创建选项浮层 Menu
  const menu = document.createElement('div');
  menu.className = 'custom-dropdown-menu';
  
  container.appendChild(trigger);
  container.appendChild(menu);
  
  // 插入到 DOM 中，紧随在原生 select 后面
  select.parentNode.insertBefore(container, select.nextSibling);

  // 更新触发器文本和图标
  function updateTriggerDisplay(selectedOption) {
    if (!selectedOption) return;
    const iconContent = selectedOption.getAttribute('data-icon') || '';
    trigger.querySelector('.custom-dropdown-text').innerHTML = `
      ${iconContent ? `<svg class="custom-dropdown-trigger-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconContent}</svg>` : ''}
      <span>${selectedOption.textContent}</span>
    `;
  }

  // 渲染菜单选项列表
  function syncOptions() {
    menu.innerHTML = '';
    const children = Array.from(select.children);
    
    if (children.length === 0) {
      trigger.querySelector('.custom-dropdown-text').textContent = '无选项';
      return;
    }

    // 选中值
    const selectedOption = select.options[select.selectedIndex] || select.querySelector('option') || children[0];
    updateTriggerDisplay(selectedOption);

    function createItem(opt) {
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item';
      if (opt.value === select.value) {
        item.classList.add('selected');
      }
      
      const iconContent = opt.getAttribute('data-icon') || '';
      item.innerHTML = `
        ${iconContent ? `<svg class="custom-dropdown-item-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconContent}</svg>` : ''}
        <span class="custom-dropdown-item-text">${opt.textContent}</span>
      `;
      item.dataset.value = opt.value;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 设值并触发 change 事件
        select.value = opt.value;
        select.dispatchEvent(new Event('change'));
        
        // 更新 UI
        updateTriggerDisplay(opt);
        Array.from(menu.children).forEach(child => {
          if (child.classList.contains('custom-dropdown-item')) {
            child.classList.remove('selected');
          }
        });
        item.classList.add('selected');
        
        closeMenu();
      });
      
      menu.appendChild(item);
    }

    children.forEach((childNode) => {
      if (childNode.tagName === 'OPTGROUP') {
        const groupTitle = document.createElement('div');
        groupTitle.className = 'custom-dropdown-group-title';
        groupTitle.textContent = childNode.label;
        menu.appendChild(groupTitle);

        const opts = Array.from(childNode.querySelectorAll('option'));
        opts.forEach((opt) => {
          createItem(opt);
        });
      } else if (childNode.tagName === 'OPTION') {
        createItem(childNode);
      }
    });
  }

  function openMenu() {
    container.classList.add('active');
    document.addEventListener('click', handleOutsideClick);
  }

  function closeMenu() {
    container.classList.remove('active');
    document.removeEventListener('click', handleOutsideClick);
  }

  function handleOutsideClick(e) {
    if (!container.contains(e.target) && e.target !== select && !select.contains(e.target)) {
      closeMenu();
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (container.classList.contains('active')) {
      closeMenu();
    } else {
      // 关闭页面上其他已激活的下拉框
      document.querySelectorAll('.custom-dropdown.active').forEach(dropdown => {
        if (dropdown !== container) {
          dropdown.classList.remove('active');
        }
      });
      openMenu();
    }
  });

  // 1. 监听原生 select 选项的动态变化 (通过 MutationObserver 自动更新)
  const observer = new MutationObserver(() => {
    syncOptions();
  });
  observer.observe(select, { childList: true, subtree: true });

  // 2. 监听原生 select 值的变更 (防范代码层面的修改，确保数据回流更新)
  select.addEventListener('change', () => {
    const selectedOpt = select.options[select.selectedIndex];
    if (selectedOpt) {
      updateTriggerDisplay(selectedOpt);
      Array.from(menu.children).forEach(child => {
        if (child.dataset.value === select.value) {
          child.classList.add('selected');
        } else {
          child.classList.remove('selected');
        }
      });
    }
  });

  // 初始化首次同步
  syncOptions();

  return {
    destroy() {
      observer.disconnect();
      container.remove();
      select.style.display = '';
    }
  };
}
