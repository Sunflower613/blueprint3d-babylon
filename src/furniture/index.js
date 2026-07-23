import { FURNITURE_DEFINITIONS as DOMAIN_FURNITURE_DEFINITIONS } from '../domain/FurnitureCatalog.js';
export * from './seating.js';
export * from './tables.js';
export * from './storage.js';
export * from './bedroom.js';
export * from './appliances.js';
export * from './kitchen.js';
export * from './bathroom.js';
export * from './textiles.js';
export * from './decor.js';
export * from './plants.js';
export * from './flora.js';
export * from './landscape.js';
export * from './outdoor.js';
export * from './lighting.js';
export * from './custom.js';
export * from './clothing.js';

import * as seatingModule from './seating.js';
import * as tablesModule from './tables.js';
import * as storageModule from './storage.js';
import * as bedroomModule from './bedroom.js';
import * as appliancesModule from './appliances.js';
import * as kitchenModule from './kitchen.js';
import * as bathroomModule from './bathroom.js';
import * as textilesModule from './textiles.js';
import * as decorModule from './decor.js';
import * as plantsModule from './plants.js';
import * as floraModule from './flora.js';
import * as landscapeModule from './landscape.js';
import * as outdoorModule from './outdoor.js';
import * as lightingModule from './lighting.js';
import * as customModule from './custom.js';
import * as clothingModule from './clothing.js';

export const FURNITURE_CATEGORIES = [
  { id: 'all', label: '全部', icon: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>' },
  { id: 'seating', label: '座具', icon: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M5 11h14"/><path d="M2 9h20"/><path d="M6 18v2"/><path d="M18 18v2"/>' },
  { id: 'tables', label: '桌台', icon: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>' },
  { id: 'storage', label: '储物', icon: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" x2="14" y1="12" y2="12"/>' },
  { id: 'bedroom', label: '卧室', icon: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>' },
  { id: 'appliances', label: '家电', icon: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M5 6h14"/><path d="M12 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>' },
  { id: 'kitchen', label: '厨房', icon: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3ZM19 15v7"/>' },
  { id: 'bathroom', label: '浴室', icon: '<path d="M4 12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3H4v3ZM2 11h20M6 18v2M18 18v2M8 5a4 4 0 0 1 8 0v2"/>' },
  { id: 'textiles', label: '布艺', icon: '<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="m16 8-8 8M12 6v12M6 12h12"/>' },
  { id: 'decor', label: '装饰', icon: '<path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4Z"/><path d="M12 10H8a4 4 0 0 0-4 4 4 4 0 0 0 4 4h4Z"/><path d="M12 10h4a4 4 0 0 0 4-4 4 4 0 0 0-4-4h-4Z"/><path d="M12 10v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4Z"/><path d="M12 10V6a4 4 0 0 0-4-4 4 4 0 0 0-4 6v4Z"/><path d="M12 10v12"/>' },
  { id: 'plants', label: '盆栽', icon: '<path d="M12 22V12M12 12c-3-2-3-5.5 0-8M12 12c3-2 3-5.5 0-8M12 14c-4 0-6-3-6-3M12 14c4 0 6-3 6-3"/>' },
  { id: 'flora', label: '草木', icon: '<path d="M12 21V11"/><path d="M7 14c0-3 2-5 5-6"/><path d="M17 14c0-3-2-5-5-6"/><path d="M8 19c0-2 1.5-3.5 4-4"/><path d="M16 19c0-2-1.5-3.5-4-4"/>' },
  { id: 'landscape', label: '景观', icon: '<path d="M2 20h20M5 17l4-8 5 10M11 17l5-10 6 10"/>' },
  { id: 'outdoor', label: '户外', icon: '<path d="M12 3v18"/><path d="M5 9c0-3.5 3.1-6 7-6s7 2.5 7 6c0 0-2 1-7 1S5 9 5 9Z"/><path d="M8 21h8"/>' },
  { id: 'lighting', label: '灯具', icon: '<path d="M8 2h8l4 10H4L8 2Z"/><path d="M12 12v6"/><path d="M8 22h8"/><path d="m16 18-2.25-2.25"/>' },
  { id: 'clothing', label: '服饰', icon: '<path d="M2 17h20a1 1 0 0 0 .7-1.7l-9.3-9.3c.4-.7.6-1.5.6-2.3a3 3 0 1 0-6 0c0 .8.2 1.6.6 2.3L1.3 15.3A1 1 0 0 0 2 17Z"/>' },
  { id: 'custom', label: '自定义', icon: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>' }
];

export const APPLIANCE_POWER_EFFECTS = Object.freeze({
  washing_machine: { label: '洗衣机', glowComponents: ['panel', 'glass'], color: '#4fc3f7', pulse: true },
  tv: { label: '电视机', glowComponents: ['screen'], color: '#64b5f6', pulse: true },
  computer: { label: '电脑', glowComponents: ['screen', 'keyboard'], color: '#81d4fa', pulse: true },
  projector: {
    label: '投影仪',
    glowComponents: ['lens'],
    color: '#d7eeff',
    lightSource: { type: 'spot', offset: { x: 2.5, y: 2, z: 5 }, direction: { x: 0, y: 0, z: 1 }, intensity: 0.7, range: 120, angle: Math.PI / 5 }
  },
  game_console: { label: '游戏主机', glowComponents: ['accent'], color: '#2979ff', pulse: true },
  smart_speaker: { label: '智能音箱', glowComponents: ['top'], color: '#7c4dff', pulse: true, audio: 'healing' },
  vintage_record_player: {
    label: '复古唱片机',
    glowComponents: ['accent'],
    color: '#f7c873',
    pulse: true,
    spinNodes: ['turntable'],
    spinSpeed: 2.2,
    audio: 'healing'
  },
  stereo_speaker: {
    label: '复古音响',
    glowComponents: ['accent'],
    color: '#77ddaa',
    pulse: true,
    pulseScaleComponents: ['woofer'],
    audio: 'healing'
  },
  electric_fan: { label: '电风扇', glowComponents: ['base'], color: '#80cbc4', motion: 'oscillate' },
  aroma_diffuser: { label: '香薰机', glowComponents: ['body'], color: '#b2ebf2', pulse: true },
  hair_dryer: { label: '吹风机', glowComponents: ['nozzle'], color: '#ff8a65', motion: 'vibrate' },
  fridge: { label: '冰箱', glowComponents: ['display'], color: '#80d8ff', pulse: true },
  microwave: { label: '微波炉', glowComponents: ['window', 'button'], color: '#ffb74d', pulse: true },
  stove: { label: '炉具', glowComponents: ['burners'], color: '#40c4ff', pulse: true },
  range_hood: { label: '抽油烟机', glowComponents: ['glass'], color: '#fff59d', pulse: true },
  coffee_maker: { label: '咖啡机', glowComponents: ['accent', 'pot'], color: '#ffcc80', pulse: true },
  toaster: { label: '烤面包机', glowComponents: ['slots'], color: '#ff7043', pulse: true },
  electric_kettle: { label: '电热水壶', glowComponents: ['base'], color: '#ef5350', pulse: true },
  dishwasher: { label: '洗碗机', glowComponents: ['handle'], color: '#80d8ff', pulse: true },
  water_dispenser: { label: '饮水机', glowComponents: ['bottle', 'outlet'], color: '#4dd0e1', pulse: true },
  rice_cooker: { label: '电饭煲', glowComponents: ['panel'], color: '#69f0ae', pulse: true },
  air_fryer: { label: '空气炸锅', glowComponents: ['display'], color: '#40c4ff', pulse: true },
  blender: { label: '搅拌机', glowComponents: ['base'], color: '#76ff03', motion: 'vibrate' },
  air_conditioner_wall: { label: '挂式空调', glowComponents: ['display'], color: '#a5d6a7', pulse: true },
  air_conditioner_floor: { label: '立式空调', glowComponents: ['display'], color: '#a5d6a7', pulse: true }
});

export const FURNITURE_DEFINITIONS = DOMAIN_FURNITURE_DEFINITIONS;


const furnitureModules = [
  { module: seatingModule, category: 'seating' },
  { module: tablesModule, category: 'tables' },
  { module: storageModule, category: 'storage' },
  { module: bedroomModule, category: 'bedroom' },
  { module: appliancesModule, category: 'appliances' },
  { module: kitchenModule, category: 'kitchen' },
  { module: bathroomModule, category: 'bathroom' },
  { module: textilesModule, category: 'textiles' },
  { module: decorModule, category: 'decor' },
  { module: plantsModule, category: 'plants' },
  { module: floraModule, category: 'flora' },
  { module: landscapeModule, category: 'landscape' },
  { module: outdoorModule, category: 'outdoor' },
  { module: lightingModule, category: 'lighting' },
  { module: customModule, category: 'custom' },
  { module: clothingModule, category: 'clothing' }
];

for (const { module, category } of furnitureModules) {
  for (const item of Object.values(module)) {
    if (!item || typeof item !== 'object' || !item.type) continue;

    item.category = category;

    if (APPLIANCE_POWER_EFFECTS[item.type]) {
      item.isSwitchable = true;
      item.powerEffect = APPLIANCE_POWER_EFFECTS[item.type];
    }

    FURNITURE_DEFINITIONS[item.type] = item;
  }
}

export const FURNITURE_LIST = Object.values(FURNITURE_DEFINITIONS);

export function getFurnitureDefinition(type) {
  return FURNITURE_DEFINITIONS[type] || tablesModule.tableFurniture;
}

export function isPowerControllable(definition) {
  return !!definition && (
    definition.isSwitchable === true ||
    !!definition.powerEffect ||
    definition.category === 'lighting' ||
    !!definition.lightSource
  );
}

export function isWaterControllable(definition) {
  return definition?.waterControllable === true;
}

export function isAppliancePowerOn(item) {
  return item?.isOn === true;
}
