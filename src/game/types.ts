export type Locale = 'en' | 'id';
export type Text = { en: string; id: string };
export const AREA_IDS=['farm','village','forest','lake','mine','aster-quay','sunridge','briar-hollow','farmhouse','barn','market','townhall','cafe','ranch','ranger-house','lake-house','forge','quay-inn','quay-workshop','orchard-house','glasshouse','library','archive-house','tide-vault','ember-vault','sky-vault'] as const;
export type Area = typeof AREA_IDS[number];
export type Tool = 'hand' | 'hoe' | 'water' | 'seed' | 'axe' | 'pickaxe' | 'rod';
export type Direction = 'down' | 'left' | 'right' | 'up';
export type Weather = 'sunny' | 'rain' | 'cloudy' | 'snow';
export type Skill = 'farming' | 'foraging' | 'fishing' | 'mining';
export interface Plot { id: string; x: number; y: number; tilled: boolean; crop: string | null; growth: number; watered: boolean; fertilizer: boolean; }
export interface Animal { id: string; kind: 'chicken' | 'pig' | 'rabbit'; name: string; hearts: number; fed: boolean; petted: boolean; product: boolean; age: number; }
export interface Friendship { points: number; talked: boolean; gifted: boolean; met: boolean; }
export interface GameState {
  playerName: string; farmName: string; avatar: number; slot: number;
  day: number; season: number; year: number; totalDays: number; time: number; weather: Weather;
  gold: number; energy: number; maxEnergy: number; capacity: number;
  inventory: Record<string, number>; shipping: Record<string, number>; plots: Plot[]; animals: Animal[];
  friendships: Record<string, Friendship>; partner: string | null; skills: Record<Skill, number>;
  stats: Record<string, number>; completed: string[]; accepted: string[]; achievements: string[];
  upgrades: Record<string, number>; removed: Record<string, number>; festivalDay: number;
  player: { x: number; y: number; area: Area; direction: Direction };
  selectedSeed: string; selectedTool: Tool; mineFloor: number; tutorialDone: boolean;
  discoveries:string[];journeyDays:Record<string,number>;
  adHistory:{rewardDay:number;rewardCount:number;lastRewardAt:number;receipts:string[];lastInterstitialDay:number;};
}
export interface Result { ok: boolean; message: Text; amount?: number; item?: string; }
export interface Requirement { stat?: string; item?: string; amount: number; upgrade?: string; }
export interface Quest { id: string; main: boolean; title: Text; description: Text; giver: string; requirements: Requirement[]; reward: { gold: number; items?: Record<string, number> }; }
export interface Item { id: string; name: Text; category: 'seed' | 'crop' | 'material' | 'food' | 'fish' | 'animal' | 'special'; price: number; sell: number; icon: string; color: string; energy?: number; frame?: string; }
export interface Crop { id: string; name: Text; days: number; seasons: number[]; sell: number; seed: number; sheet: string; stages: number; regrow?: number; }
export interface Villager { id: string; name: string; role: Text; sprite: string; area: Area; x: number; y: number; birthday: [number, number]; loves: string[]; color: string; dialogue: Text[]; romance: boolean; newcomer?:boolean;hue?:number; }
export interface Recipe { id: string; name: Text; ingredients: Record<string, number>; output: string; quantity: number; skill?: Skill; level?: number; description: Text; }
export const txt = (en: string, id: string): Text => ({ en, id });
