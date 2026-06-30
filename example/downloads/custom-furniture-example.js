/**
 * 可上传的自定义家具示例模板 (云朵沙发)。
 *
 * 上传器将调用此默认工厂函数并注入辅助函数。
 * 您可以在上传前修改 type、name、尺寸、组件和 build 逻辑。
 */
export default function createFurniture({ boxComponent }) {
  const definition = {
    type: 'custom_sofa',
    name: '\u4e91\u6735\u6c99\u53d1', // 云朵沙发
    thumbnail: '', // 自定义缩略图路径 (支持 Base64 Data URL 或线上 URL，可选)
    defaultSize: { width: 84, depth: 36, height: 32 }, // Inches (英寸)
    components: [
      { id: 'seat', label: '\u5750\u57ab', defaultColor: '#ff9dbb' }, // 坐垫
      { id: 'back', label: '\u9760\u80cc', defaultColor: '#f56f9f' }, // 靠背
      { id: 'arms', label: '\u6276\u624b', defaultColor: '#f56f9f' }, // 扶手
      { id: 'legs', label: '\u811a\u67b6', defaultColor: '#b07a50' }  // 脚架
    ],
    interaction: {
      type: 'sit',
      getInteractionPoints(size) {
        const seatH = Math.max(0.12, size.height * 0.36);
        return [
          { x: -size.width * 0.22, y: seatH, z: 0, rot: 0 },
          { x: size.width * 0.22, y: seatH, z: 0, rot: 0 }
        ];
      }
    },
    build(registry, item, node, size) {
      // 这里的 size 单位是米 (Meters)
      const seatH = Math.max(0.12, size.height * 0.36);
      
      // 1. 坐垫
      boxComponent(registry, item, definition, 'seat', {
        width: size.width, height: seatH, depth: size.depth
      }, { position: { x: 0, y: seatH / 2, z: 0 } }, { parent: node });

      // 2. 靠背
      boxComponent(registry, item, definition, 'back', {
        width: size.width, height: size.height * 0.58, depth: Math.max(0.12, size.depth * 0.18)
      }, { position: { x: 0, y: size.height * 0.58, z: -size.depth * 0.41 } }, { parent: node });

      // 3. 扶手
      [-1, 1].forEach((side) => {
        boxComponent(registry, item, definition, 'arms', {
          width: Math.max(0.12, size.width * 0.09), height: size.height * 0.52, depth: size.depth
        }, { position: { x: side * size.width * 0.455, y: size.height * 0.38, z: 0 } }, { parent: node });
      });

      // 4. 脚架 (硬编码的粗细和高度单位都是米)
      [-1, 1].forEach((xSide) => {
        [-1, 1].forEach((zSide) => {
          boxComponent(registry, item, definition, 'legs', {
            width: 0.08, height: 0.16, depth: 0.08
          }, { position: { x: xSide * size.width * 0.36, y: 0.08, z: zSide * size.depth * 0.32 } }, { parent: node });
        });
      });
    }
  };

  return definition;
}

