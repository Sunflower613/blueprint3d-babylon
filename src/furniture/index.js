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
  wallShelfFurniture,
  gridCabinetFurniture,
  parcelLockerFurniture,
  cornerShelfFurniture,
  fileCabinetFurniture,
  wineRackFurniture,
  coatRackFurniture,
  umbrellaStandFurniture,
  drawerCabinetFurniture
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
  bedBenchFurniture,
  cosmeticsFurniture,
  stationeryFurniture,
  eyeshadowCompactFurniture,
  luxuryPerfumesFurniture,
  skincareSetFurniture,
  makeupBrushesFurniture,
  lipstickNailPolishFurniture,
  deskCalendarFurniture,
  woodenPenStandFurniture,
  calculatorFurniture,
  staplerNotesFurniture,
  premiumDeskPenFurniture
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
  mirrorBathroomFurniture,
  rangeHoodFurniture,
  coffeeMakerFurniture,
  toasterFurniture,
  electricKettleFurniture,
  dishwasherFurniture,
  waterDispenserFurniture,
  riceCookerFurniture,
  airFryerFurniture,
  blenderFurniture,
  hairDryerFurniture,
  bathroomShelfFurniture,
  bathroomMirrorCabinetFurniture,
  towelRackFurniture,
  kitchenwareFurniture,
  toiletriesFurniture,
  soapDispenserFurniture,
  knifeBlockFurniture,
  spiceRackFurniture,
  kitchenHooksFurniture,
  coffeeCupSetFurniture,
  teapotTeaCupsFurniture,
  wineGlassesFurniture,
  fruitPlatterFurniture,
  pairMugsFurniture
} from './kitchenBath.js';

import {
  plantFurniture,
  lampFurniture,
  rugFurniture,
  paintingFurniture,
  vaseFurniture,
  mirrorWallFurniture,
  mirrorFramedWallFurniture,
  mirrorRoundWallFurniture,
  mirrorRoundedWallFurniture,
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
  booksFullRowFurniture,
  miniCactusFurniture,
  photoFrameFurniture,
  hourglassFurniture,
  storageBasketFurniture,
  scentedCandleFurniture,
  crystalBallFurniture,
  goldTrophyFurniture,
  globeFurniture,
  gypsumBustFurniture,
  piggyBankFurniture,
  sculptureFurniture,
  ovalRugFurniture,
  roundedRugFurniture,
  tvFurniture,
  computerFurniture,
  triptychPaintingFurniture,
  landscapePaintingFurniture,
  projectorFurniture,
  gameConsoleFurniture,
  smartSpeakerFurniture,
  electricFanFurniture,
  aromaDiffuserFurniture,
  tissueBoxFurniture,
  wallClockFurniture,
  sunflowerPotFurniture,
  pachiraTreeFurniture,
  lavenderPotFurniture,
  tulipVaseFurniture,
  orchidPotFurniture,
  dwarfMonsteraFurniture,
  largeCactusFurniture,
  eucalyptusVaseFurniture,
  cherryBlossomBonsaiFurniture,
  hangingIvyFurniture,
  singleBlackoutCurtainFurniture,
  doubleSheerCurtainFurniture,
  venetianBlindFurniture,
  rollerBlindFurniture,
  romanShadeFurniture,
  verticalBlindFurniture,
  chineseBambooBlindFurniture,
  luxuryValanceCurtainFurniture,
  cafeShortCurtainFurniture,
  japaneseNorenCurtainFurniture
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

import {
  customCubeFurniture,
  customCylinderFurniture,
  customSphereFurniture
} from './custom.js';


// 1. 将家具划归各大分类
const seating = [sofaFurniture, chairFurniture, armchairFurniture, stoolFurniture, barstoolFurniture, benchFurniture, loveseatFurniture, officechairFurniture, beanbagFurniture, deckchairFurniture];
seating.forEach(f => f.category = 'seating');

const tables = [tableFurniture, deskFurniture, coffeeTableFurniture, sideTableFurniture, roundTableFurniture, diningTableLongFurniture, consoleTableFurniture, computerDeskFurniture, bedsideDeskFurniture, picnicTableFurniture];
tables.forEach(f => f.category = 'tables');

const storage = [
  bookshelfFurniture, consoleFurniture, wardrobeFurniture, nightstandFurniture, cabinetKitchenFurniture, shoerackFurniture, chestDrawersFurniture, sideboardFurniture, displayCabinetFurniture, wallShelfFurniture,
  gridCabinetFurniture, parcelLockerFurniture, cornerShelfFurniture, fileCabinetFurniture, wineRackFurniture, coatRackFurniture, umbrellaStandFurniture, drawerCabinetFurniture
];
storage.forEach(f => f.category = 'storage');

const bedroom = [
  bedFurniture, bedDoubleFurniture, bedSingleFurniture, cribFurniture, bunkBedFurniture, mattressFurniture, canopyBedFurniture, vanityFurniture, hammockFurniture, bedBenchFurniture,
  cosmeticsFurniture, stationeryFurniture, eyeshadowCompactFurniture, luxuryPerfumesFurniture, skincareSetFurniture, makeupBrushesFurniture, lipstickNailPolishFurniture, deskCalendarFurniture, woodenPenStandFurniture, calculatorFurniture, staplerNotesFurniture, premiumDeskPenFurniture
];
bedroom.forEach(f => f.category = 'bedroom');

const appliances = [
  fridgeFurniture, washingMachineFurniture, microwaveFurniture, stoveFurniture, tvFurniture, computerFurniture, projectorFurniture, gameConsoleFurniture, smartSpeakerFurniture, electricFanFurniture, aromaDiffuserFurniture, hairDryerFurniture, rangeHoodFurniture, coffeeMakerFurniture, toasterFurniture, electricKettleFurniture, dishwasherFurniture, waterDispenserFurniture, riceCookerFurniture, airFryerFurniture, blenderFurniture
];
appliances.forEach(f => f.category = 'appliances');

const kitchen = [
  sinkKitchenFurniture, kitchenwareFurniture, knifeBlockFurniture, spiceRackFurniture, kitchenHooksFurniture,
  coffeeCupSetFurniture, teapotTeaCupsFurniture, wineGlassesFurniture, fruitPlatterFurniture, pairMugsFurniture
];
kitchen.forEach(f => f.category = 'kitchen');

const bathroom = [
  toiletFurniture, bathtubFurniture, sinkBathroomFurniture, showerCabinFurniture, mirrorBathroomFurniture,
  towelRackFurniture, toiletriesFurniture, soapDispenserFurniture, bathroomShelfFurniture, bathroomMirrorCabinetFurniture
];
bathroom.forEach(f => f.category = 'bathroom');

const textiles = [
  rugFurniture, ovalRugFurniture, roundedRugFurniture, curtainFurniture, cushionFurniture,
  singleBlackoutCurtainFurniture, doubleSheerCurtainFurniture, venetianBlindFurniture, rollerBlindFurniture, romanShadeFurniture, verticalBlindFurniture, chineseBambooBlindFurniture, luxuryValanceCurtainFurniture, cafeShortCurtainFurniture, japaneseNorenCurtainFurniture
];
textiles.forEach(f => f.category = 'textiles');

const decor = [
  paintingFurniture,
  triptychPaintingFurniture,
  landscapePaintingFurniture,
  vaseFurniture,
  mirrorWallFurniture,
  mirrorFramedWallFurniture,
  mirrorRoundWallFurniture,
  mirrorRoundedWallFurniture,
  clockFurniture,
  wallClockFurniture,
  mannequinFurniture,
  booksStackFurniture,
  booksFullRowFurniture,
  miniCactusFurniture,
  photoFrameFurniture,
  hourglassFurniture,
  storageBasketFurniture,
  scentedCandleFurniture,
  crystalBallFurniture,
  goldTrophyFurniture,
  globeFurniture,
  gypsumBustFurniture,
  piggyBankFurniture,
  sculptureFurniture
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
  snakePlantFurniture,
  sunflowerPotFurniture,
  pachiraTreeFurniture,
  lavenderPotFurniture,
  tulipVaseFurniture,
  orchidPotFurniture,
  dwarfMonsteraFurniture,
  largeCactusFurniture,
  eucalyptusVaseFurniture,
  cherryBlossomBonsaiFurniture,
  hangingIvyFurniture
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

const custom = [customCubeFurniture, customCylinderFurniture, customSphereFurniture];
custom.forEach(f => f.category = 'custom');


// 2. 导出分类列表映射字典
export const FURNITURE_CATEGORIES = [
  { id: 'all', label: '全部', icon: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>' },
  { id: 'seating', label: '坐具', icon: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M5 11h14"/><path d="M2 9h20"/><path d="M6 18v2"/><path d="M18 18v2"/>' },
  { id: 'tables', label: '桌台', icon: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>' },
  { id: 'storage', label: '储物', icon: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" x2="14" y1="12" y2="12"/>' },
  { id: 'bedroom', label: '卧室', icon: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>' },
  { id: 'appliances', label: '家电', icon: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M5 6h14"/><path d="M12 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>' },
  { id: 'kitchen', label: '厨房', icon: '<path d="M12 2v20M17 8V2a3 3 0 0 0-3 3v3M7 8V2M10 8V2M14 8h-4a3 3 0 0 0-3 3v11"/>' },
  { id: 'bathroom', label: '浴室', icon: '<path d="M4 12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3H4v3ZM2 11h20M6 18v2M18 18v2M8 5a4 4 0 0 1 8 0v2"/>' },
  { id: 'textiles', label: '布艺', icon: '<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="m16 8-8 8M12 6v12M6 12h12"/>' },
  { id: 'decor', label: '装饰', icon: '<path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4Z"/><path d="M12 10H8a4 4 0 0 0-4 4 4 4 0 0 0 4 4h4Z"/><path d="M12 10h4a4 4 0 0 0 4-4 4 4 0 0 0-4-4h-4Z"/><path d="M12 10v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4Z"/><path d="M12 10V6a4 4 0 0 0-4-4 4 4 0 0 0-4 6v4Z"/><path d="M12 10v12"/>' },
  { id: 'plants', label: '绿植', icon: '<path d="M12 22V12M12 12c-3-2-3-5.5 0-8M12 12c3-2 3-5.5 0-8M12 14c-4 0-6-3-6-3M12 14c4 0 6-3 6-3"/>' },
  { id: 'lighting', label: '灯具', icon: '<path d="M8 2h8l4 10H4L8 2Z"/><path d="M12 12v6"/><path d="M8 22h8"/><path d="m16 18-2.25-2.25"/>' },
  { id: 'custom', label: '自定义', icon: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>' }
];

// 3. 构建大家具映射字典与列表
export const FURNITURE_DEFINITIONS = {};
const allFurniture = [...seating, ...tables, ...storage, ...bedroom, ...appliances, ...kitchen, ...bathroom, ...textiles, ...decor, ...plants, ...lighting, ...custom];
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
  gridCabinetFurniture,
  parcelLockerFurniture,
  cornerShelfFurniture,
  fileCabinetFurniture,
  wineRackFurniture,
  coatRackFurniture,
  umbrellaStandFurniture,
  drawerCabinetFurniture,
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
  cosmeticsFurniture,
  stationeryFurniture,
  eyeshadowCompactFurniture,
  luxuryPerfumesFurniture,
  skincareSetFurniture,
  makeupBrushesFurniture,
  lipstickNailPolishFurniture,
  deskCalendarFurniture,
  woodenPenStandFurniture,
  calculatorFurniture,
  staplerNotesFurniture,
  premiumDeskPenFurniture,
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
  rangeHoodFurniture,
  coffeeMakerFurniture,
  toasterFurniture,
  electricKettleFurniture,
  dishwasherFurniture,
  waterDispenserFurniture,
  riceCookerFurniture,
  airFryerFurniture,
  blenderFurniture,
  hairDryerFurniture,
  bathroomShelfFurniture,
  bathroomMirrorCabinetFurniture,
  towelRackFurniture,
  kitchenwareFurniture,
  toiletriesFurniture,
  soapDispenserFurniture,
  knifeBlockFurniture,
  spiceRackFurniture,
  kitchenHooksFurniture,
  coffeeCupSetFurniture,
  teapotTeaCupsFurniture,
  wineGlassesFurniture,
  fruitPlatterFurniture,
  pairMugsFurniture,
  plantFurniture,
  lampFurniture,
  rugFurniture,
  paintingFurniture,
  vaseFurniture,
  mirrorWallFurniture,
  mirrorFramedWallFurniture,
  mirrorRoundWallFurniture,
  mirrorRoundedWallFurniture,
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
  booksFullRowFurniture,
  miniCactusFurniture,
  photoFrameFurniture,
  hourglassFurniture,
  storageBasketFurniture,
  scentedCandleFurniture,
  crystalBallFurniture,
  goldTrophyFurniture,
  globeFurniture,
  gypsumBustFurniture,
  piggyBankFurniture,
  sculptureFurniture,
  ovalRugFurniture,
  roundedRugFurniture,
  tvFurniture,
  computerFurniture,
  triptychPaintingFurniture,
  landscapePaintingFurniture,
  projectorFurniture,
  gameConsoleFurniture,
  smartSpeakerFurniture,
  electricFanFurniture,
  aromaDiffuserFurniture,
  tissueBoxFurniture,
  wallClockFurniture,
  sunflowerPotFurniture,
  pachiraTreeFurniture,
  lavenderPotFurniture,
  tulipVaseFurniture,
  orchidPotFurniture,
  dwarfMonsteraFurniture,
  largeCactusFurniture,
  eucalyptusVaseFurniture,
  cherryBlossomBonsaiFurniture,
  hangingIvyFurniture,
  singleBlackoutCurtainFurniture,
  doubleSheerCurtainFurniture,
  venetianBlindFurniture,
  rollerBlindFurniture,
  romanShadeFurniture,
  verticalBlindFurniture,
  chineseBambooBlindFurniture,
  luxuryValanceCurtainFurniture,
  cafeShortCurtainFurniture,
  japaneseNorenCurtainFurniture,
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
  customCubeFurniture,
  customCylinderFurniture,
  customSphereFurniture
};
