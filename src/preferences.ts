import type { Locale } from './game/types.ts';

export interface ControlSettings {
  mode:'floating'|'fixed';hand:'right'|'left';size:number;opacity:number;height:number;
  sensitivity:number;deadzone:number;camera:number;tapToMove:boolean;runMode:'edge'|'always'|'walk';holdRepeat:boolean;
}
export interface Settings {
  language:Locale;ambient:boolean;sfx:boolean;volume:number;pace:number;largeText:boolean;haptics:boolean;
  showHUD:boolean;reduceMotion:boolean;quality:30|60;worldZoom:2|3;controls:ControlSettings;
}
export const DEFAULT_CONTROLS:ControlSettings={mode:'floating',hand:'right',size:1,opacity:.8,height:0,sensitivity:1,deadzone:.15,camera:1,tapToMove:true,runMode:'edge',holdRepeat:true};
const object=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
const number=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
const flag=(value:unknown,fallback:boolean)=>typeof value==='boolean'?value:fallback;
export function readSettings(value:unknown={}):Settings {
  const s=object(value),c=object(s.controls),d=DEFAULT_CONTROLS;
  return {
    language:s.language==='id'?'id':'en',ambient:flag(s.ambient,true),sfx:flag(s.sfx,true),volume:number(s.volume,.4,0,1),
    pace:[.7,1.4,2.8].includes(s.pace as number)?s.pace as number:1.4,largeText:flag(s.largeText,false),haptics:flag(s.haptics,true),
    showHUD:flag(s.showHUD,true),reduceMotion:flag(s.reduceMotion,false),quality:s.quality===30?30:60,worldZoom:s.worldZoom===3?3:2,
    controls:{mode:c.mode==='fixed'?'fixed':'floating',hand:c.hand==='left'?'left':'right',size:number(c.size,d.size,.85,1.2),
      opacity:number(c.opacity,d.opacity,.35,1),height:number(c.height,d.height,0,80),sensitivity:number(c.sensitivity,d.sensitivity,.6,1.5),
      deadzone:number(c.deadzone,d.deadzone,.05,.3),camera:number(c.camera,d.camera,.6,1.4),tapToMove:flag(c.tapToMove,true),runMode:c.runMode==='always'?'always':c.runMode==='walk'?'walk':'edge',holdRepeat:flag(c.holdRepeat,true)}
  };
}

export function controlValue(key:string,value:unknown) {
  if(key==='size'||key==='opacity'||key==='deadzone')return `${Math.round(Number(value)*100)}%`;
  if(key==='sensitivity'||key==='camera')return `${Number(value).toFixed(1)}×`;
  if(key==='height')return `${Math.round(Number(value))} px`;
  return String(value);
}
