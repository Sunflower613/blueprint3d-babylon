import { pointInRoom, Topology } from '../../src/index.js';
const { getItemsOnBookshelf, isBigBedroomItem, isBigKitchenBathItem, calculateSnappedPosition } = Topology;

const INCHES_PER_UNIT = 39.37;

/**
 * EntityManager.js — blueprint3d-babylon 物体/家具管理器
 *
 * 职责：
 *   1. 管理家具选中状态、2D 拖拽、多指手势的状态。
 *   2. 实现家具对齐格子的核心吸附逻辑（常规家具中心对齐格子中心，贴墙家具边缘对齐网格线）。
 *   3. 封装家具在 2D 平面拖拽时的位置更新、朝向与贴墙吸附计算。
 */

export class EntityManager {
  /**
   * @param {object} opts
   * @param {object} opts.testMap - 地图实例
   * @param {() => boolean} opts.getSnapEnabled - 获取是否启用网格吸附
   * @param {() => number} opts.getSnapSize - 获取网格吸附大小
   * @param {(val: number) => number} opts.inchesToWorld - 英寸到米制单位转换
   * @param {() => string} opts.getMode - 获取当前交互模式 (如 'select')
   * @param {() => object[]} opts.getWalls - 获取当前楼层所有墙体
   * @param {() => object[]} opts.getRooms - 获取当前楼层所有房间
   * @param {() => void} opts.pushHistory - 保存历史记录（撤销/重做）
   * @param {() => void} opts.refreshShadows - 刷新光源与阴影
   * @param {() => void} opts.updateEditor - 更新侧边编辑面板
   * @param {() => void} opts.renderPlan - 刷新 2D Canvas 画布
   * @param {() => void} opts.clear3DEditHandles - 清理 3D 编辑控制柄
   * @param {(type: string, id: string|null) => void} opts.onSelectionChanged - 当选择改变时触发的回调
   * @param {(event: any) => {x: number, y: number}} opts.svgPointFromEvent - SVG 坐标点获取
   * @param {(x: number, y: number) => {x: number, z: number}} opts.svgToWorld - SVG 坐标转换至世界坐标
   * @param {(event: any) => void} opts.rememberPointer - 记录鼠标/指针指针
   * @param {(pointerId: number) => void} opts.setPointerCapture - 捕获事件指针
   * @param {Map<number, object>} opts.activePointers - 活动中多指点位映射表
   * @param {(a: object, b: object) => number} opts.pointerDistance - 指针距离计算
   * @param {(a: object, b: object) => number} opts.pointerAngle - 指针角度计算
   * @param {(item: object, def: object) => boolean} opts.canPlaceOnTable - 能否放置在桌子上判定
   * @param {(item: object) => object|null} opts.findTableBelow - 获取下方桌子物体
   * @param {(item: object) => object|null} opts.findNearestSeat - 获取最近的座椅物体
   */
  constructor(opts) {
    this.opts = opts;

    /** 2D平面下家具拖拽交互状态 */
    this.dragState = null;

    /** 家具缩放与旋转的手势交互状态 */
    this.itemGestureState = null;
  }

  get selectedItemId() {
    return this.opts.getSelectedItemId();
  }

  set selectedItemId(val) {
    this.opts.setSelectedItemId(val);
  }

  /**
   * 判断家具是否属于“需要边缘与格子边缘对齐”的贴墙品类
   * @param {string} type - 家具类型标识
   * @returns {boolean}
   */
  shouldSnapToEdge(type) {
    const definition = this.opts.testMap.getFurnitureDefinition(type);
    if (!definition) return false;

    // 允许在家具定义中显式指定 snapToEdge 属性覆盖默认规则
    if (definition.snapToEdge !== undefined) {
      return !!definition.snapToEdge;
    }

    const category = definition.category || '';

    // 1. 储物柜类 (storage)：书架、衣柜、鞋架、矮柜、橱柜等 100% 贴墙
    if (category === 'storage') {
      return true;
    }

    // 2. 卧室大件 (bedroom)：床铺及梳妆台等大件贴墙；排除精细小摆件（化妆品、笔筒、日历等）
    if (category === 'bedroom') {
      return isBigBedroomItem(type);
    }

    // 3. 厨卫家电及台盆 (kitchen-bath/kitchen/bathroom)：大件电器与台盆全部贴墙；排除小厨摆、餐具、皂液器等小摆件
    if (category === 'kitchen-bath' || category === 'kitchen' || category === 'bathroom') {
      return isBigKitchenBathItem(type);
    }

    // 4. 桌台类 (tables)：书桌 (desk)、电脑桌、床头桌、长餐桌、条案/玄关桌等靠墙；
    //    圆桌 (roundTable)、野餐桌等通常居中放置，不贴墙
    if (category === 'tables') {
      return type !== 'roundTable' && type !== 'picnicTable';
    }

    // 5. 坐具类 (seating)：沙发、双人椅、长凳、床尾凳等靠墙；
    //    普通的餐椅、办公椅、折叠椅散落在房中，不贴墙
    if (category === 'seating') {
      return type === 'sofa' || type === 'loveseat' || type === 'bench' || type === 'bedBench';
    }

    return false;
  }



  /**
   * 选中家具物品
   * @param {string} itemId
   */
  selectItem(itemId) {
    this.opts.clear3DEditHandles();
    this.selectedItemId = itemId;
    this.opts.onSelectionChanged('item', itemId);
    this.opts.testMap.setSelectedItem(itemId);
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 反选/取消选中当前家具物品
   */
  deselect() {
    this.selectedItemId = null;
    this.opts.testMap.setSelectedItem(null);
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 移动家具物品至指定世界坐标点，并在此处理网格吸附与特殊挂墙/贴表吸附逻辑
   * @param {string} itemId - 移动的物品ID
   * @param {number} x - 目标世界坐标 X
   * @param {number} z - 目标世界坐标 Z
   */
  moveItemTo(itemId, x, z, isFinished = false) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;

    const beforeState = { x: item.x, z: item.z, rotation: item.rotation, elevation: item.elevation, type: item.type };

    const definition = this.opts.testMap.getFurnitureDefinition(item.type);

    let finalX = x;
    let finalZ = z;

    const snapEnabled = this.opts.getSnapEnabled();
    const snapSize = this.opts.getSnapSize();

    if (snapEnabled && snapSize) {
      const snappedPos = calculateSnappedPosition({
        item,
        definition,
        x,
        z,
        snapSize,
        wallThickness: this.opts.testMap.floorplan.wallThickness || 0.18,
        walls: this.opts.getWalls(),
        shouldSnapToEdge: this.shouldSnapToEdge(item.type),
        inchesToWorld: this.opts.inchesToWorld.bind(this.opts)
      });
      finalX = snappedPos.x;
      finalZ = snappedPos.z;
    }

    const snapped = {
      x: Number(finalX.toFixed(3)),
      z: Number(finalZ.toFixed(3))
    };

    let patch = {};

    if (definition.placeType === 'wall') {
      // 挂墙物体逻辑（例如壁灯、窗帘）
      let minDistance = Infinity;
      let bestProjX = snapped.x;
      let bestProjZ = snapped.z;
      let bestAngle = item.rotation || 0;
      let bestWall = null;

      // 窗帘/百叶窗自动吸附至最近窗户附近
      const isCurtain = item.type.toLowerCase().includes('curtain') || item.type.toLowerCase().includes('blind');
      let nearWindow = null;
      let minWinDist = 0.6; // 吸附范围门槛（约 0.6 米）
      let bestWinProjX = snapped.x;
      let bestWinProjZ = snapped.z;
      let bestWinAngle = item.rotation || 0;
      let bestWinWall = null;

      if (isCurtain) {
        const floorplan = this.opts.testMap.floorplan;
        if (floorplan && floorplan.openings) {
          floorplan.openings.forEach((opening) => {
            if (opening.type === 'door') return; // 排除门，只吸附窗户
            const wall = (floorplan.walls || []).find(w => w.id === opening.wallId);
            if (!wall) return;
            
            // 计算该窗户在墙体上的实际世界坐标
            const winX = wall.from[0] + (wall.to[0] - wall.from[0]) * (opening.t ?? 0.5);
            const winZ = wall.from[1] + (wall.to[1] - wall.from[1]) * (opening.t ?? 0.5);
            const dist = Math.hypot(snapped.x - winX, snapped.z - winZ);
            
            if (dist < minWinDist) {
              minWinDist = dist;
              nearWindow = opening;
              bestWinProjX = winX;
              bestWinProjZ = winZ;
              
              const dx = wall.to[0] - wall.from[0];
              const dz = wall.to[1] - wall.from[1];
              bestWinAngle = -Math.atan2(dz, dx);
              bestWinWall = wall;
            }
          });
        }
      }

      if (nearWindow && bestWinWall) {
        bestProjX = bestWinProjX;
        bestProjZ = bestWinProjZ;
        bestAngle = bestWinAngle;
        bestWall = bestWinWall;
      } else {
        // 如果没有触发窗户吸附，执行常规寻找最近墙壁逻辑
        this.opts.getWalls().forEach((wall) => {
          const [x1, z1] = wall.from;
          const [x2, z2] = wall.to;
          const dx = x2 - x1;
          const dz = z2 - z1;
          const len2 = dx * dx + dz * dz;
          if (len2 === 0) return;
          let t = ((snapped.x - x1) * dx + (snapped.z - z1) * dz) / len2;
          t = Math.max(0.08, Math.min(0.92, t));
          const projX = x1 + t * dx;
          const projZ = z1 + t * dz;
          const dist = Math.hypot(snapped.x - projX, snapped.z - projZ);
          if (dist < minDistance) {
            minDistance = dist;
            bestProjX = projX;
            bestProjZ = projZ;
            bestAngle = -Math.atan2(dz, dx);
            bestWall = wall;
          }
        });
      }

      if (bestWall) {
        const wallThickness = this.opts.testMap.floorplan.wallThickness || 0.18;
        const itemScale = Number(item.scale || 1);
        const itemDepth = (item.depth ?? (definition.defaultSize.depth / INCHES_PER_UNIT)) * itemScale;

        const vx = snapped.x - bestProjX;
        const vz = snapped.z - bestProjZ;
        const vLen = Math.hypot(vx, vz);

        let offsetX = 0;
        let offsetZ = 0;
        const offsetDist = wallThickness / 2 + itemDepth / 2 + 0.002;

        if (vLen > 0.0001) {
          offsetX = (vx / vLen) * offsetDist;
          offsetZ = (vz / vLen) * offsetDist;
        } else {
          const [x1, z1] = bestWall.from;
          const [x2, z2] = bestWall.to;
          const dx = x2 - x1;
          const dz = z2 - z1;
          const len = Math.hypot(dx, dz) || 1;
          offsetX = (-dz / len) * offsetDist;
          offsetZ = (dx / len) * offsetDist;
        }

        patch.x = bestProjX + offsetX;
        patch.z = bestProjZ + offsetZ;

        const dot1 = Math.sin(bestAngle) * offsetX + Math.cos(bestAngle) * offsetZ;
        const dot2 = Math.sin(bestAngle + Math.PI) * offsetX + Math.cos(bestAngle + Math.PI) * offsetZ;
        patch.rotation = dot1 >= dot2 ? bestAngle : bestAngle + Math.PI;
      } else {
        patch.x = snapped.x;
        patch.z = snapped.z;
      }

      if (item.elevation === undefined || item.elevation === 0) {
        patch.elevation = 33.6;
      }
    } else if (definition.placeType === 'ceiling') {
      // 天花板物体逻辑
      patch.x = snapped.x;
      patch.z = snapped.z;
      patch.elevation = (this.opts.testMap.floorplan.wallHeight || 2.8) - (item.height ?? (definition.defaultSize.height / INCHES_PER_UNIT)) * (item.scale || 1);
    } else {
      // 普通地板物体逻辑
      patch.x = snapped.x;
      patch.z = snapped.z;
      if (this.opts.canPlaceOnTable(item, definition)) {
        if (isFinished) {
          // 移动完毕：触发搁板/桌面磁吸定位
          const bookshelfBelow = this.opts.findBookshelfNearby ? this.opts.findBookshelfNearby(item) : null;
          if (bookshelfBelow) {
            const snappedState = this.opts.snapToBookshelf ? this.opts.snapToBookshelf(item, bookshelfBelow) : null;
            if (snappedState) {
              patch.x = snappedState.x;
              patch.z = snappedState.z;
              patch.elevation = snappedState.elevation;
              patch.rotation = snappedState.rotation;
            }
          } else {
            const tableBelow = this.opts.findTableBelow(item);
            if (tableBelow) {
              const tableDef = this.opts.testMap.getFurnitureDefinition(tableBelow.type);
              patch.elevation = (tableBelow.elevation || 0) + (tableBelow.height ?? (tableDef.defaultSize.height / INCHES_PER_UNIT)) * (tableBelow.scale || 1);
            } else {
              // 释放时无桌面：恢复为拖拽开始时的初始高程
              let origElevation = 0;
              if (this.dragState && this.dragState.itemId === itemId) {
                origElevation = this.dragState.originalElevation || 0;
              } else if (this.opts.getDrag3DState) {
                const d3s = this.opts.getDrag3DState();
                if (d3s && d3s.itemId === itemId) {
                  origElevation = d3s.originalElevation || 0;
                }
              }
              patch.elevation = origElevation;
            }
          }
        } else {
          // 移动过程中：实时做高程抬升反馈，但不对齐 X/Z/Rotation 以保证移动手感丝滑
          let targetElevation = null;

          // 1. 尝试检测下方的书架高度
          const bookshelfBelow = this.opts.findBookshelfNearby ? this.opts.findBookshelfNearby(item) : null;
          if (bookshelfBelow) {
            const snappedState = this.opts.snapToBookshelf ? this.opts.snapToBookshelf(item, bookshelfBelow) : null;
            if (snappedState) {
              targetElevation = snappedState.elevation;
            }
          }

          // 2. 若没有书架，尝试检测下方桌台的顶面高度
          if (targetElevation === null) {
            const tableBelow = this.opts.findTableBelow(item);
            if (tableBelow) {
              const tableDef = this.opts.testMap.getFurnitureDefinition(tableBelow.type);
              targetElevation = (tableBelow.elevation || 0) + (tableBelow.height ?? (tableDef.defaultSize.height / INCHES_PER_UNIT)) * (tableBelow.scale || 1);
            }
          }

          // 3. 若什么都没检测到，退回到物件的拖拽初始高度
          if (targetElevation === null) {
            let origElevation = 0;
            if (this.dragState && this.dragState.itemId === itemId) {
              origElevation = this.dragState.originalElevation || 0;
            } else if (this.opts.getDrag3DState) {
              const d3s = this.opts.getDrag3DState();
              if (d3s && d3s.itemId === itemId) {
                origElevation = d3s.originalElevation || 0;
              }
            }
            targetElevation = origElevation;
          }

          patch.elevation = targetElevation;
        }
      }
    }

    const updatedX = patch.x !== undefined ? patch.x : item.x;
    const updatedZ = patch.z !== undefined ? patch.z : item.z;
    const updatedRotation = patch.rotation !== undefined ? patch.rotation : (item.rotation || 0);
    const updatedElevation = patch.elevation !== undefined ? patch.elevation : (item.elevation || 0);

    const room = this.opts.testMap.getRoomAt(updatedX, updatedZ);
    if (room) {
      patch.roomId = room.id;
    }

    let requiresRuntimeRebuild = false;
    if (item.type === 'mannequin' && item.pose && item.pose !== 'stand') {
      const seat = this.opts.findNearestSeat({ ...item, x: updatedX, z: updatedZ });
      if (!seat) {
        patch.pose = 'stand';
        patch.elevation = 0;
        requiresRuntimeRebuild = true;
      }
    }

    // 统一通过 Command API 写入
    this.opts.testMap.executeCommand('updateItem', { itemId: item.id, patch, rebuild: false });
    if (room) {
      this.opts.testMap.executeCommand('assignItemToRoom', { itemId: item.id, roomId: room.id, rebuild: false });
    }

    if (requiresRuntimeRebuild) this.opts.testMap.build();
    else this.opts.testMap.syncEntityPreview('item', item.id);
    this.updateChildrenOnBookshelf({ ...item, x: updatedX, z: updatedZ, rotation: updatedRotation, elevation: updatedElevation }, beforeState);
    this.opts.renderPlan();
  }

  /**
   * 开启 2D 指针拖拽家具交互
   * @param {any} event
   * @param {string} itemId
   */
  beginItemDrag(event, itemId) {
    if (event.button === 2) return;
    if (this.opts.getMode() !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    this.opts.rememberPointer(event);
    this.selectItem(itemId);
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;

    if (this.maybeBeginItemGesture(itemId)) {
      this.dragState = null;
      return;
    }

    const point = this.opts.svgPointFromEvent(event);
    const world = this.opts.svgToWorld(point.x, point.y);
    this.dragState = {
      itemId,
      offsetX: item.x - world.x,
      offsetZ: item.z - world.z,
      originalX: item.x,
      originalZ: item.z,
      originalElevation: item.elevation || 0,
      historyPushed: false
    };
    this.opts.setPointerCapture(event.pointerId);
  }

  /**
   * 处理 2D 拖拽中位置的移动更新
   * @param {any} event
   */
  handleItemDrag(event) {
    if (!this.dragState) return;
    const point = this.opts.svgPointFromEvent(event);
    const world = this.opts.svgToWorld(point.x, point.y);
    const nextX = world.x + this.dragState.offsetX;
    const nextZ = world.z + this.dragState.offsetZ;

    if (!this.dragState.historyPushed && Math.hypot(nextX - this.dragState.originalX, nextZ - this.dragState.originalZ) > 0.02) {
      this.opts.pushHistory();
      this.dragState.historyPushed = true;
    }
    this.moveItemTo(this.dragState.itemId, nextX, nextZ);
  }

  /**
   * 获取某家具对应的双指指针对象数组
   * @param {string} itemId
   * @returns {object[]}
   */
  getItemGesturePointers(itemId) {
    return [...this.opts.activePointers.values()].filter((pointer) => pointer.targetItemId === itemId).slice(0, 2);
  }

  /**
   * 检查并尝试开启手势交互（如移动设备双指旋转/缩放）
   * @param {string} itemId
   * @returns {boolean} 是否成功开启手势
   */
  maybeBeginItemGesture(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    const pointers = this.getItemGesturePointers(itemId);
    if (!item || pointers.length < 2) return false;

    this.itemGestureState = {
      itemId,
      startDistance: Math.max(1, this.opts.pointerDistance(pointers[0], pointers[1])),
      startAngle: this.opts.pointerAngle(pointers[0], pointers[1]),
      startRotation: item.rotation || 0,
      startScale: item.scale || 1,
      historyPushed: false
    };
    return true;
  }

  /**
   * 处理多指手势缩放与旋转更新
   */
  moveItemGesture() {
    if (!this.itemGestureState) return;
    const item = this.opts.testMap.getItem(this.itemGestureState.itemId);
    const pointers = this.getItemGesturePointers(this.itemGestureState.itemId);
    if (!item || item.locked || pointers.length < 2) return;

    const nextScale = Math.max(0.5, Math.min(4, this.itemGestureState.startScale * this.opts.pointerDistance(pointers[0], pointers[1]) / this.itemGestureState.startDistance));
    const nextRotation = this.itemGestureState.startRotation + this.opts.pointerAngle(pointers[0], pointers[1]) - this.itemGestureState.startAngle;

    if (!this.itemGestureState.historyPushed) {
      this.opts.pushHistory();
      this.itemGestureState.historyPushed = true;
    }

    const definition = this.opts.testMap.getFurnitureDefinition(item.type);
    const isMeterDef = definition.unit === 'm';
    const defW = isMeterDef ? definition.defaultSize.width : (definition.defaultSize.width / 39.37);
    const defD = isMeterDef ? definition.defaultSize.depth : (definition.defaultSize.depth / 39.37);
    const defH = isMeterDef ? definition.defaultSize.height : (definition.defaultSize.height / 39.37);
    const patch = {
      rotation: nextRotation,
      width: Number((defW * nextScale).toFixed(3)),
      depth: Number((defD * nextScale).toFixed(3)),
      height: Number((defH * nextScale).toFixed(3)),
      scale: 1.0
    };
    if (definition.placeType === 'ceiling') {
      patch.elevation = (this.opts.testMap.floorplan.wallHeight || 2.8) - patch.height;
    }

    this.opts.testMap.executeCommand('updateItem', { itemId: item.id, patch });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 切换具有蓄水凹槽的家具（如浴缸、水槽、洗手台）的放水与排水状态
   * @param {string} itemId - 家具物品ID
   */
  toggleItemWater(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const isWaterOn = item.waterEnabled !== false;
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { waterEnabled: !isWaterOn } });
    this.opts.renderPlan();
  }

  /**
   * 切换马桶盖板的开盖与合盖状态
   * @param {string} itemId - 马桶物品ID
   */
  toggleItemLid(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const isLidOpen = item.lidOpen === true;
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { lidOpen: !isLidOpen } });
    this.opts.renderPlan();
  }

  /**
   * 复制家具物品
   * @param {string} itemId - 家具物品ID
   * @returns {object|null} 复制后的新物体数据
   */
  copyItem(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item) return null;
    this.opts.pushHistory();
    const copyX = (item.x || 0) + 0.4;
    const copyZ = (item.z || 0) + 0.4;
    const targetRoom = this.opts.getRooms().find((room) => pointInRoom(room, copyX, copyZ));
    const copy = this.opts.testMap.executeCommand('addItem', {
      ...JSON.parse(JSON.stringify(item)),
      id: undefined,
      name: item.name,
      x: copyX,
      z: copyZ,
      roomId: targetRoom?.id,
      floorId: this.opts.testMap.floorplan.currentFloorId
    });
    this.opts.refreshShadows();
    this.selectItem(copy.id);
    return copy;
  }

  /**
   * 旋转家具物品 (每次顺时针旋转90度)
   * @param {string} itemId - 家具物品ID
   */
  rotateItem(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const currentDegrees = Math.round(((item.rotation || 0) * 180 / Math.PI + 360) % 360);
    const nextDegrees = (currentDegrees + 90) % 360;
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { rotation: nextDegrees * Math.PI / 180 } });
    if (this.selectedItemId === itemId) {
      this.opts.updateEditor();
    }
    this.opts.refreshShadows();
    this.opts.renderPlan();
  }

  /**
   * 切换家具开关状态 (如灯具自发光或普通开关状态)
   * @param {string} itemId - 家具物品ID
   */
  toggleItemPower(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    const def = this.opts.testMap.getFurnitureDefinition(item.type);
    if (def && (def.category === 'lighting' || def.lightSource)) {
      this.updateItemLight(itemId, item.lightOn === false);
    } else {
      this.setItemPower(itemId, item.isOn !== true);
    }
  }

  /**
   * 设置家具锁定状态，并做清除3D控制柄与2D视图联动
   *
   * @param {string} itemId - 家具物品ID
   * @param {boolean} locked - 是否锁定
   */
  setItemLocked(itemId, locked) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item) return;
    this.opts.pushHistory();

    this.opts.testMap.executeCommand('setTargetLocked', { type: 'item', id: itemId, locked });

    // 当物体被锁定时，立即清除 3D 编辑控制柄，以保证交互状态联动正确
    if (locked) {
      this.opts.clear3DEditHandles();
    }

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 切换家具锁定/解锁状态
   * @param {string} itemId - 家具物品ID
   */
  toggleItemLock(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item) return;
    this.setItemLocked(itemId, !item.locked);
  }

  /**
   * 删除指定家具物品
   * @param {string} itemId - 家具物品ID
   */
  deleteItem(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('deleteItem', { itemId });
    if (this.selectedItemId === itemId) {
      this.deselect();
    }
    this.opts.refreshShadows();
    this.opts.renderPlan();
  }

  /**
   * 属性面板：更新家具尺寸和高度
   */
  updateItemSize(itemId, widthInches, depthInches, heightInches, elevationInches) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;

    const beforeState = { x: item.x, z: item.z, rotation: item.rotation, elevation: item.elevation, type: item.type };

    this.opts.pushHistory();

    const definition = this.opts.testMap.getFurnitureDefinition(item.type);
    let elevation = elevationInches;

    if (definition.placeType === 'ceiling') {
      const curElev = Number((item.elevation || 0).toFixed(2));
      const inputElev = Number((elevationInches || 0).toFixed(2));
      if (curElev === inputElev) {
        // 天花板家具自适应高度计算
        elevation = (this.opts.testMap.floorplan.wallHeight || 2.8) - heightInches * (item.scale || 1);
      }
    }

    this.opts.testMap.executeCommand('updateItem', {
      itemId,
      patch: {
        width: widthInches,
        depth: depthInches,
        height: heightInches,
        elevation: elevation
      }
    });

    this.updateChildrenOnBookshelf(item, beforeState);

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 属性面板：更新家具旋转角度
   */
  updateItemRotation(itemId, degrees) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;

    const beforeState = { x: item.x, z: item.z, rotation: item.rotation, elevation: item.elevation, type: item.type };

    this.opts.pushHistory();
    this.opts.testMap.executeCommand('rotateItem', { itemId, rotationRadians: degrees * Math.PI / 180 });

    this.updateChildrenOnBookshelf(item, beforeState);

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 属性面板：更新家具缩放值
   */
  updateItemScale(itemId, scaleValue) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    const definition = this.opts.testMap.getFurnitureDefinition(item.type);
    this.opts.pushHistory();
    const scale = Math.max(0.5, Math.min(4, Number(scaleValue) || 1));
    
    const isMeterDef = definition.unit === 'm';
    const defW = isMeterDef ? definition.defaultSize.width : (definition.defaultSize.width / 39.37);
    const defD = isMeterDef ? definition.defaultSize.depth : (definition.defaultSize.depth / 39.37);
    const defH = isMeterDef ? definition.defaultSize.height : (definition.defaultSize.height / 39.37);
    const patch = {
      width: Number((defW * scale).toFixed(3)),
      depth: Number((defD * scale).toFixed(3)),
      height: Number((defH * scale).toFixed(3)),
      scale: 1.0
    };
    if (definition.placeType === 'ceiling') {
      patch.elevation = (this.opts.testMap.floorplan.wallHeight || 2.8) - patch.height;
    }
    
    this.opts.testMap.executeCommand('updateItem', { itemId, patch });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 属性面板：更新人偶动作姿势
   */
  updateItemPose(itemId, newPose) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked || item.type !== 'mannequin') return;
    this.opts.pushHistory();
    
    let patch = { pose: newPose };
    if (newPose !== 'stand') {
      const seat = this.opts.findNearestSeat(item);
      if (seat) {
        patch.x = seat.worldPos.x;
        patch.z = seat.worldPos.z;
        patch.elevation = seat.worldPos.y;
        patch.rotation = seat.item.rotation || 0;
      }
    } else {
      patch.elevation = 0;
    }
    
    this.opts.testMap.executeCommand('updateItem', { itemId, patch });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 属性面板：更新发光状态
   */
  setItemSeason(itemId, season) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    const def = this.opts.testMap.getFurnitureDefinition(item.type);
    const seasonOptions = def?.seasonOptions || [];
    if (!seasonOptions.length) return;

    const nextSeason = seasonOptions.find((option) => option.value === season)?.value;
    if (!nextSeason || item.season === nextSeason) return;

    this.opts.pushHistory();
    this.opts.testMap.updateItem(itemId, { season: nextSeason });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  cycleItemSeason(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    const def = this.opts.testMap.getFurnitureDefinition(item.type);
    const seasonOptions = def?.seasonOptions || [];
    if (!seasonOptions.length) return;

    const currentIndex = seasonOptions.findIndex((option) => option.value === item.season);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % seasonOptions.length : 0;
    this.setItemSeason(itemId, seasonOptions[nextIndex].value);
  }

  updateItemLight(itemId, lightOn) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { lightOn } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * Set a non-light appliance power state.
   */
  setItemPower(itemId, isOn) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { isOn: !!isOn } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 键盘快捷键：按方向键微移家具位置
   * @param {string} itemId
   * @param {number} dx - X 方向偏移量（米）
   * @param {number} dz - Z 方向偏移量（米）
   */
  nudgeItem(itemId, dx, dz) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;

    const beforeState = { x: item.x, z: item.z, rotation: item.rotation, elevation: item.elevation, type: item.type };

    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { x: item.x + dx, z: item.z + dz } });

    this.updateChildrenOnBookshelf(item, beforeState);

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 键盘快捷键：PageUp/PageDown 调整家具高度
   * @param {string} itemId
   * @param {number} deltaInches - 高度增量（英寸）
   */
  adjustItemElevation(itemId, deltaInches) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;

    const beforeState = { x: item.x, z: item.z, rotation: item.rotation, elevation: item.elevation, type: item.type };

    this.opts.pushHistory();
    const newElev = Math.max(0, (item.elevation || 0) + deltaInches);
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { elevation: newElev } });

    this.updateChildrenOnBookshelf(item, beforeState);

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 键盘快捷键：+/- 键步进缩放家具
   * @param {string} itemId
   * @param {number} delta - 缩放步长 (正为放大，负为缩小)
   */
  adjustItemScale(itemId, delta) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const nextScale = Math.max(0.5, Math.min(4.0, (item.scale || 1) + delta));
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { scale: nextScale } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 键盘快捷键：[/] 键步进旋转家具
   * @param {string} itemId
   * @param {number} deltaDeg - 旋转步长度数 (正为顺时针，负为逆时针)
   */
  adjustItemRotation(itemId, deltaDeg) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const radStep = deltaDeg * Math.PI / 180;
    let rotation = (item.rotation || 0) + radStep;
    rotation = (rotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { rotation } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 当柜架类家具发生位移、高度或旋转变化时，联动更新当前在其上方的所有小摆件的姿态
   * @param {Object} bookshelf - 目标书架家具对象
   * @param {Object} beforeState - 移动前书架的状态 { x, z, rotation, elevation }
   */
  updateChildrenOnBookshelf(bookshelf, beforeState) {
    const supportedTypes = ['bookshelf', 'shoerack', 'corner_shelf', 'display_cabinet', 'grid_cabinet'];
    const definition = this.opts.testMap.getFurnitureDefinition(bookshelf.type);
    if (!definition) return;
    
    const isMannequin = definition.type.includes('clothing_mannequin');
    if (!supportedTypes.includes(definition.type) && !isMannequin) return;
    
    const dx = bookshelf.x - beforeState.x;
    const dz = bookshelf.z - beforeState.z;
    const dr = (bookshelf.rotation || 0) - (beforeState.rotation || 0);
    const de = (bookshelf.elevation || 0) - (beforeState.elevation || 0);
    if (Math.abs(dx) < 0.0001 && Math.abs(dz) < 0.0001 && Math.abs(dr) < 0.0001 && Math.abs(de) < 0.0001) return;
    
    let isDraggingThis = false;
    let initialChildrenIds = null;

    if (this.dragState && this.dragState.itemId === bookshelf.id) {
      isDraggingThis = true;
      initialChildrenIds = this.dragState.initialChildrenIds || null;
    } else if (this.opts.getDrag3DState) {
      const d3s = this.opts.getDrag3DState();
      if (d3s && d3s.type === 'item' && d3s.itemId === bookshelf.id) {
        isDraggingThis = true;
        initialChildrenIds = d3s.initialChildrenIds || null;
      }
    }

    let itemsOnShelf;
    if (isDraggingThis && initialChildrenIds) {
      itemsOnShelf = this.opts.testMap.floorplan.items.filter(item => initialChildrenIds.includes(item.id));
    } else {
      if (isMannequin) {
        itemsOnShelf = this.opts.testMap.floorplan.items.filter(item => {
          if (item.id === bookshelf.id) return false;
          if (!item.type.startsWith('clothing_') || item.type.includes('mannequin')) return false;

          const cdx = item.x - beforeState.x;
          const cdz = item.z - beforeState.z;
          const distSq = cdx * cdx + cdz * cdz;
          if (distSq > 0.05 * 0.05) return false;

          const modelH = (bookshelf.height ?? (definition.defaultSize.height / INCHES_PER_UNIT)) * (bookshelf.scale || 1);
          const itemElev = item.elevation || 0;
          const modelElev = beforeState.elevation || 0;
          return itemElev >= modelElev && itemElev <= modelElev + modelH + (5.0 / INCHES_PER_UNIT);
        });
      } else {
        itemsOnShelf = getItemsOnBookshelf(
          beforeState, 
          this.opts.testMap.floorplan.items, 
          (type) => this.opts.testMap.getFurnitureDefinition(type)
        );
      }
      
      if (isDraggingThis) {
        const ids = itemsOnShelf.map(item => item.id);
        if (this.dragState && this.dragState.itemId === bookshelf.id) {
          this.dragState.initialChildrenIds = ids;
        } else if (this.opts.getDrag3DState) {
          const d3s = this.opts.getDrag3DState();
          if (d3s && d3s.type === 'item' && d3s.itemId === bookshelf.id) {
            d3s.initialChildrenIds = ids;
          }
        }
      }
    }
    
    for (const childItem of itemsOnShelf) {
      const cx = beforeState.x;
      const cz = beforeState.z;
      const oRot = beforeState.rotation || 0;
      
      const cdx = childItem.x - cx;
      const cdz = childItem.z - cz;
      
      const cos = Math.cos(-oRot);
      const sin = Math.sin(-oRot);
      const lx = cdx * cos - cdz * sin;
      const lz = cdx * sin + cdz * cos;
      
      const nx = bookshelf.x;
      const nz = bookshelf.z;
      const nRot = bookshelf.rotation || 0;
      
      const cosRot = Math.cos(nRot);
      const sinRot = Math.sin(nRot);
      const newWx = nx + lx * cosRot + lz * sinRot;
      const newWz = nz - lx * sinRot + lz * cosRot;
      
      const newRot = (childItem.rotation || 0) + dr;
      const newElevation = (childItem.elevation || 0) + de;
      
      this.opts.testMap.executeCommand('updateItem', {
        itemId: childItem.id,
        patch: {
          x: Number(newWx.toFixed(3)),
          z: Number(newWz.toFixed(3)),
          rotation: newRot,
          elevation: newElevation
        },
        rebuild: false
      });
      
      this.opts.testMap.syncEntityPreview('item', childItem.id);
    }
  }

  /**
   * 从家具库面板添加新家具到场景
   * @param {string} type - 家具类型
   * @param {number} x - 放置坐标 X
   * @param {number} z - 放置坐标 Z
   * @param {object} [extraProps] - 额外属性（如 elevation, roomId, floorId）
   * @returns {object} 新创建的家具 item
   */
  addItem(type, x, z, extraProps = {}) {
    const definition = this.opts.testMap.getFurnitureDefinition(type);
    if (!definition) return null;
    this.opts.pushHistory();
    const item = this.opts.testMap.executeCommand('addItem', {
      type,
      width: definition.defaultSize.width / INCHES_PER_UNIT,
      depth: definition.defaultSize.depth / INCHES_PER_UNIT,
      height: definition.defaultSize.height / INCHES_PER_UNIT,
      x,
      z,
      ...extraProps
    });
    this.opts.refreshShadows();
    this.selectItem(item.id);
    return item;
  }

  /**
   * 重置家具的颜色与材质为默认值
   * @param {string} itemId
   */
  resetItemMaterial(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const definition = this.opts.testMap.getFurnitureDefinition(item.type);
    
    const colors = {};
    const materials = {};
    if (definition && definition.components) {
      definition.components.forEach((component) => {
        colors[component.id] = component.defaultColor;
        materials[component.id] = component.defaultColor;
      });
    }
    
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { colors, materials } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 将人偶重置为站立姿势（无座椅时自动回退）
   * @param {string} itemId
   */
  resetItemPose(itemId) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item) return;
    if (item.pose && item.pose !== 'stand') {
      this.opts.testMap.executeCommand('updateItem', { itemId, patch: { pose: 'stand', elevation: 0 } });
      this.opts.refreshShadows();
      this.opts.updateEditor();
      this.opts.renderPlan();
    }
  }

  /**
   * 更新家具组件颜色
   * @param {string} itemId
   * @param {string} componentId
   * @param {string} color
   */
  updateItemComponentColor(itemId, componentId, color) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItemComponentColor', { itemId, componentId, color });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * 应用材质到家具组件
   * @param {string} itemId
   * @param {string} componentId
   * @param {object} material
   */
  updateItemComponentMaterial(itemId, componentId, material) {
    const item = this.opts.testMap.getItem(itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItemComponentMaterial', { itemId, componentId, material });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }
}
