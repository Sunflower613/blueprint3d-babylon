/**
 * 架构约束与安全规则：
 * 
 * 1. 本模块是 blueprint3d-babylon 库的统一公开 API 门面（Facade）。
 * 2. 外部组件、示例（如 example/app.js）或任何第三方依赖禁止越权直接 import
 *    'src/core/*', 'src/presets/*', 'src/rooms/*', 'src/furniture/*' 等内部私有目录下的文件。
 * 3. 所有的外部引用都必须统一从本顶层公开 API 引入。
 * 4. 内部各模块职责分离（domain 数据 -> runtime 渲染 -> editor 交互 -> api 门面），
 *    本门面仅作为 API 层稳定出口的聚合与暴露。
 */

// ==========================================
// 1. Babylon.js 核心渲染包重导出
// ==========================================
export {
  AbstractMesh,
  ArcRotateCamera,
  CSG,
  Color3,
  Color4,
  CubeTexture,
  DirectionalLight,
  DynamicTexture,
  Engine,
  HemisphericLight,
  Material,
  MaterialPluginBase,
  Matrix,
  Mesh,
  MeshBuilder,
  MirrorTexture,
  Node,
  Plane,
  PointerEventTypes,
  PointLight,
  RenderTargetTexture,
  ReflectionProbe,
  Scene,
  ShaderLanguage,
  ShadowGenerator,
  ShadowGeneratorSceneComponent,
  SpotLight,
  StandardMaterial,
  Texture,
  Tools,
  TransformNode,
  Vector3,
  VertexBuffer,
  VertexData
} from '../core/babylon.js';

// ==========================================
// 2. Domain / Core 核心数据与几何工具
// ==========================================
export {
  BlueprintRegistry,
  normalizeVector3,
  setTransform
} from '../core/BlueprintRegistry.js';

export {
  getShadowCasterContext,
  shouldIncludeShadowCaster
} from '../runtime/shadowCasterFilter.js';

export {
  FloorplanDocument
} from '../domain/FloorplanDocument.js';

export {
  MaterialResolver
} from '../domain/MaterialResolver.js';

export {
  createFlatMaterial,
  createMaterialPalette
} from '../core/materials.js';

export {
  stringifyDXF,
  create3MFPackage,
  create3MFModelXml,
  createDXFFileName,
  create3MFFileName
} from '../core/exporters.js';

export {
  BUILDING_FILE_FORMAT,
  BUILDING_FILE_EXTENSION,
  createBuildingFile,
  parseBuildingFile,
  stringifyBuildingFile,
  createBuildingFileName
} from '../core/buildingFile.js';

export {
  createBox,
  createCylinder,
  createSphere,
  createDisc,
  createFenceLine
} from '../core/primitives.js';

export {
  MATERIAL_CATEGORIES,
  DEFAULT_MATERIAL_PACKS,
  createColorMaterialDescriptor,
  createTextureMaterialDescriptor
} from '../core/materialCatalog.js';

export {
  isItemSnappedToBookshelfOrMannequin
} from '../core/exporterUtils.js';

// ==========================================
// 3. Geometry 几何处理
// ==========================================
export {
  buildFenceGeometry
} from '../geometry/fenceGeometry.js';

export {
  buildFenceGateGeometry
} from '../geometry/fenceGateGeometry.js';

// ==========================================
// 4. Audio 音频
// ==========================================
export {
  playWindChimeSound
} from '../audio/windChimeSound.js';

// ==========================================
// 5. Furniture 业务定义与辅助器
// ==========================================
export {
  boxComponent,
  cylinderComponent,
  sphereComponent
} from '../furniture/_helpers.js';

export {
  FURNITURE_CATEGORIES,
  FURNITURE_DEFINITIONS,
  FURNITURE_LIST,
  getFurnitureDefinition,
  isPowerControllable,
  isAppliancePowerOn
} from '../furniture/index.js';

// ==========================================
// 6. Openings & Rooms 空间逻辑
// ==========================================
export {
  buildOpeningGeometry,
  createOpeningCutterMesh,
  normalizeOpeningShape,
  isSymmetricShape,
  OPENING_SHAPES,
  getOpeningUnitVertices,
  getOpeningVertices,
  triangulateOpening
} from '../openings/index.js';

export {
  ROOM_SHAPES,
  normalizeRoomShape,
  getRoomShapeDefinition,
  getRoomLocalVertices,
  getRoomVertices,
  getRoomBounds,
  getRoomWallKeys,
  pointInRoom,
  triangulateRoom
} from '../rooms/index.js';

// ==========================================
// 7. Runtime 运行时发生器
// ==========================================
export {
  PinkCastleGenerator
} from '../runtime/PinkCastleGenerator.js';

export {
  BabylonSceneRenderer
} from '../runtime/BabylonSceneRenderer.js';

export {
  SelectionController
} from '../editor/SelectionController.js';

export {
  ExportService
} from '../services/ExportService.js';

export {
  EditorFacade,
  createDocument,
  createBabylonRenderer,
  createEditor
} from '../editor/EditorFacade.js';

// ==========================================
// 8. Sample Data (将原 Presets 降级为样本数据)
// ==========================================
import {
  PINK_CASTLE_BLUEPRINT,
  PINK_CASTLE_PALETTE,
  PinkCastleBlueprint,
  buildPinkCastle
} from '../presets/pinkCastle.js';

import {
  BLUEPRINT3D_TEST_FLOORPLAN,
  Blueprint3DTestMap,
  buildBlueprint3DTestMap,
  FENCE_SUBTYPE_DEFAULTS,
  FURNITURE_DEFINITIONS as PRESET_FURNITURE_DEFINITIONS,
  FURNITURE_LIST as PRESET_FURNITURE_LIST
} from '../presets/blueprintTestMap.js';

// 作为 sampleData 统一导出的样本数据对象
export const sampleData = {
  pinkCastle: {
    blueprint: PINK_CASTLE_BLUEPRINT,
    palette: PINK_CASTLE_PALETTE,
    class: PinkCastleBlueprint,
    build: buildPinkCastle
  },
  blueprintTestMap: {
    blueprint: BLUEPRINT3D_TEST_FLOORPLAN,
    class: Blueprint3DTestMap,
    build: buildBlueprint3DTestMap,
    fenceSubtypeDefaults: FENCE_SUBTYPE_DEFAULTS,
    furnitureDefinitions: PRESET_FURNITURE_DEFINITIONS,
    furnitureList: PRESET_FURNITURE_LIST
  }
};

// 保持向下兼容：直接导出原命名，使外部组件可以用原名解构
export {
  PINK_CASTLE_BLUEPRINT,
  PINK_CASTLE_PALETTE,
  PinkCastleBlueprint,
  buildPinkCastle
} from '../presets/pinkCastle.js';

export {
  BLUEPRINT3D_TEST_FLOORPLAN,
  Blueprint3DTestMap,
  buildBlueprint3DTestMap,
  FENCE_SUBTYPE_DEFAULTS
} from '../presets/blueprintTestMap.js';

// ==========================================
// 9. 编辑器交互与拓扑计算导出
// ==========================================
export * as Topology from '../editor/Topology.js';
export { DragHandler } from '../editor/DragHandler.js';
export { Viewer3DHandles } from '../editor/Viewer3DHandles.js';

/** Build the public URL used by the example's copied furniture image directory. */
export function getFurnitureThumbnailUrl(type, basePath = './src/furniture/image') {
  const safeType = String(type || 'custom_cube').replace(/[^a-zA-Z0-9_-]/g, '') || 'custom_cube';
  return `${String(basePath).replace(/\/$/, '')}/${safeType}.png`;
}

/** Bundler-safe URL for the default sky texture. */
export const SKY_TEXTURE_URL = new URL('../textures/sky.png', import.meta.url).href;

/** Bundler-safe URL for the default grass texture. */
export const GRASS_TEXTURE_URL = new URL('../textures/stone_grass.jpg', import.meta.url).href;
