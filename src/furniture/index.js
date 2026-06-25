import {
  sofaFurniture,
  chairFurniture,
  armchairFurniture,
  stoolFurniture,
  barstoolFurniture,
  benchFurniture,
  loveseatFurniture,
  officechairFurniture,
  beanbagFurniture,
  deckchairFurniture
} from './seating.js';

import {
  tableFurniture,
  deskFurniture,
  coffeeTableFurniture,
  sideTableFurniture,
  roundTableFurniture,
  diningTableLongFurniture,
  consoleTableFurniture,
  computerDeskFurniture,
  bedsideDeskFurniture,
  picnicTableFurniture
} from './tables.js';

import {
  bookshelfFurniture,
  consoleFurniture,
  wardrobeFurniture,
  nightstandFurniture,
  cabinetKitchenFurniture,
  shoerackFurniture,
  chestDrawersFurniture,
  sideboardFurniture,
  displayCabinetFurniture,
  wallShelfFurniture
} from './storage.js';

import {
  bedFurniture,
  bedDoubleFurniture,
  bedSingleFurniture,
  cribFurniture,
  bunkBedFurniture,
  mattressFurniture,
  canopyBedFurniture,
  vanityFurniture,
  hammockFurniture,
  bedBenchFurniture
} from './bedroom.js';

import {
  fridgeFurniture,
  toiletFurniture,
  bathtubFurniture,
  sinkKitchenFurniture,
  sinkBathroomFurniture,
  washingMachineFurniture,
  microwaveFurniture,
  stoveFurniture,
  showerCabinFurniture,
  mirrorBathroomFurniture
} from './kitchenBath.js';

import {
  plantFurniture,
  lampFurniture,
  rugFurniture,
  paintingFurniture,
  vaseFurniture,
  mirrorWallFurniture,
  curtainFurniture,
  cushionFurniture,
  clockFurniture,
  plantPotFurniture,
  chandelierFurniture,
  mannequinFurniture
} from './decor.js';

import {
  ceilingLight,
  chandelierLight,
  wallSconceLight,
  floorLampLight,
  deskLampLight,
  bedsideLampLight,
  trackLight,
  neonSignLight,
  globePendantLight,
  lavaLampLight
} from './lighting.js';

// 1. 将家具划归各大分类
const seating = [sofaFurniture, chairFurniture, armchairFurniture, stoolFurniture, barstoolFurniture, benchFurniture, loveseatFurniture, officechairFurniture, beanbagFurniture, deckchairFurniture];
seating.forEach(f => f.category = 'seating');

const tables = [tableFurniture, deskFurniture, coffeeTableFurniture, sideTableFurniture, roundTableFurniture, diningTableLongFurniture, consoleTableFurniture, computerDeskFurniture, bedsideDeskFurniture, picnicTableFurniture];
tables.forEach(f => f.category = 'tables');

const storage = [bookshelfFurniture, consoleFurniture, wardrobeFurniture, nightstandFurniture, cabinetKitchenFurniture, shoerackFurniture, chestDrawersFurniture, sideboardFurniture, displayCabinetFurniture, wallShelfFurniture];
storage.forEach(f => f.category = 'storage');

const bedroom = [bedFurniture, bedDoubleFurniture, bedSingleFurniture, cribFurniture, bunkBedFurniture, mattressFurniture, canopyBedFurniture, vanityFurniture, hammockFurniture, bedBenchFurniture];
bedroom.forEach(f => f.category = 'bedroom');

const kitchenBath = [fridgeFurniture, toiletFurniture, bathtubFurniture, sinkKitchenFurniture, sinkBathroomFurniture, washingMachineFurniture, microwaveFurniture, stoveFurniture, showerCabinFurniture, mirrorBathroomFurniture];
kitchenBath.forEach(f => f.category = 'kitchen-bath');

const decor = [plantFurniture, lampFurniture, rugFurniture, paintingFurniture, vaseFurniture, mirrorWallFurniture, curtainFurniture, cushionFurniture, clockFurniture, plantPotFurniture, chandelierFurniture, mannequinFurniture];
decor.forEach(f => f.category = 'decor');

const lighting = [
  ceilingLight,
  chandelierLight,
  wallSconceLight,
  floorLampLight,
  deskLampLight,
  bedsideLampLight,
  trackLight,
  neonSignLight,
  globePendantLight,
  lavaLampLight
];
lighting.forEach(f => f.category = 'lighting');

// 2. 导出分类列表映射字典
export const FURNITURE_CATEGORIES = [
  { id: 'all', label: '全部家具' },
  { id: 'seating', label: '坐具/沙发' },
  { id: 'tables', label: '桌台/茶几' },
  { id: 'storage', label: '储物/收纳' },
  { id: 'bedroom', label: '卧室/睡眠' },
  { id: 'kitchen-bath', label: '厨卫/电器' },
  { id: 'decor', label: '绿植/装饰' },
  { id: 'lighting', label: '灯具/照明' }
];

// 3. 构建大家具映射字典与列表
export const FURNITURE_DEFINITIONS = {};
const allFurniture = [...seating, ...tables, ...storage, ...bedroom, ...kitchenBath, ...decor, ...lighting];
allFurniture.forEach(f => {
  FURNITURE_DEFINITIONS[f.type] = f;
});

export const FURNITURE_LIST = Object.values(FURNITURE_DEFINITIONS);

export function getFurnitureDefinition(type) {
  return FURNITURE_DEFINITIONS[type] || tableFurniture;
}

// 4. 导出各个家具实例变量，兼容现有库接口与 Presets
export {
  sofaFurniture,
  chairFurniture,
  armchairFurniture,
  stoolFurniture,
  barstoolFurniture,
  benchFurniture,
  loveseatFurniture,
  officechairFurniture,
  beanbagFurniture,
  deckchairFurniture,
  tableFurniture,
  deskFurniture,
  coffeeTableFurniture,
  sideTableFurniture,
  roundTableFurniture,
  diningTableLongFurniture,
  consoleTableFurniture,
  computerDeskFurniture,
  bedsideDeskFurniture,
  picnicTableFurniture,
  bookshelfFurniture,
  consoleFurniture,
  wardrobeFurniture,
  nightstandFurniture,
  cabinetKitchenFurniture,
  shoerackFurniture,
  chestDrawersFurniture,
  sideboardFurniture,
  displayCabinetFurniture,
  wallShelfFurniture,
  bedFurniture,
  bedDoubleFurniture,
  bedSingleFurniture,
  cribFurniture,
  bunkBedFurniture,
  mattressFurniture,
  canopyBedFurniture,
  vanityFurniture,
  hammockFurniture,
  bedBenchFurniture,
  fridgeFurniture,
  toiletFurniture,
  bathtubFurniture,
  sinkKitchenFurniture,
  sinkBathroomFurniture,
  washingMachineFurniture,
  microwaveFurniture,
  stoveFurniture,
  showerCabinFurniture,
  mirrorBathroomFurniture,
  plantFurniture,
  lampFurniture,
  rugFurniture,
  paintingFurniture,
  vaseFurniture,
  mirrorWallFurniture,
  curtainFurniture,
  cushionFurniture,
  clockFurniture,
  plantPotFurniture,
  chandelierFurniture,
  mannequinFurniture,
  ceilingLight,
  chandelierLight,
  wallSconceLight,
  floorLampLight,
  deskLampLight,
  bedsideLampLight,
  trackLight,
  neonSignLight,
  globePendantLight,
  lavaLampLight
};
