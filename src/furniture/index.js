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
  mannequinFurniture,
  cactusFurniture,
  monsteraFurniture,
  succulentFurniture,
  bambooFurniture,
  fernFurniture,
  bonsaiFurniture,
  flowerRoseFurniture,
  snakePlantFurniture,
  booksStackFurniture,
  sculptureFurniture,
  ovalRugFurniture,
  roundedRugFurniture
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

const decor = [
  rugFurniture,
  paintingFurniture,
  vaseFurniture,
  mirrorWallFurniture,
  curtainFurniture,
  cushionFurniture,
  clockFurniture,
  mannequinFurniture,
  booksStackFurniture,
  sculptureFurniture,
  ovalRugFurniture,
  roundedRugFurniture
];
decor.forEach(f => f.category = 'decor');

const plants = [
  plantFurniture,
  plantPotFurniture,
  cactusFurniture,
  monsteraFurniture,
  succulentFurniture,
  bambooFurniture,
  fernFurniture,
  bonsaiFurniture,
  flowerRoseFurniture,
  snakePlantFurniture
];
plants.forEach(f => f.category = 'plants');

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
  lavaLampLight,
  lampFurniture,
  chandelierFurniture
];
lighting.forEach(f => f.category = 'lighting');

// 2. 导出分类列表映射字典
export const FURNITURE_CATEGORIES = [
  { id: 'all', label: '全部', icon: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>' },
  { id: 'seating', label: '坐具', icon: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M5 11h14"/><path d="M2 9h20"/><path d="M6 18v2"/><path d="M18 18v2"/>' },
  { id: 'tables', label: '桌台', icon: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>' },
  { id: 'storage', label: '储物', icon: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" x2="14" y1="12" y2="12"/>' },
  { id: 'bedroom', label: '卧室', icon: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>' },
  { id: 'kitchen-bath', label: '厨卫', icon: '<path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.68 3 4 3.68 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M10 5h4"/><path d="M2 19h20"/>' },
  { id: 'decor', label: '装饰', icon: '<path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4Z"/><path d="M12 10a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4Z"/><path d="M12 10H8a4 4 0 0 0-4 4 4 4 0 0 0 4 4h4Z"/><path d="M12 10h4a4 4 0 0 0 4-4 4 4 0 0 0-4-4h-4Z"/><path d="M12 10v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4Z"/><path d="M12 10V6a4 4 0 0 0-4-4 4 4 0 0 0-4 4v4Z"/><path d="M12 10v12"/>' },
  { id: 'plants', label: '绿植', icon: '<path d="M12 22V12M12 12c-3-2-3-5.5 0-8M12 12c3-2 3-5.5 0-8M12 14c-4 0-6-3-6-3M12 14c4 0 6-3 6-3"/>' },
  { id: 'lighting', label: '灯具', icon: '<path d="M8 2h8l4 10H4L8 2Z"/><path d="M12 12v6"/><path d="M8 22h8"/><path d="m16 18-2.25-2.25"/>' }
];

// 3. 构建大家具映射字典与列表
export const FURNITURE_DEFINITIONS = {};
const allFurniture = [...seating, ...tables, ...storage, ...bedroom, ...kitchenBath, ...decor, ...plants, ...lighting];
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
  cactusFurniture,
  monsteraFurniture,
  succulentFurniture,
  bambooFurniture,
  fernFurniture,
  bonsaiFurniture,
  flowerRoseFurniture,
  snakePlantFurniture,
  booksStackFurniture,
  sculptureFurniture,
  ovalRugFurniture,
  roundedRugFurniture,
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
