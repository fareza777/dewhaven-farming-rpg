import './style.css';
import './premium.css';
import './readability.css';
import './mobile.css';
import './immersive.css';
import './expedition.css';
import './comfort.css';
import { AdsController, type AdResult } from './ads.ts';
import { canReward, claimAdEnergy, canInterstitial, REWARD_COOLDOWN } from './game/ads.ts';
import { adPreviews } from './ui/ads.ts';
import { nativeAndroid, setupAndroid, finishNativeSplash, exitAndroid, haptic, shareAndroid, exportAndroid } from './native.ts';
import { Soundscape } from './nature-audio.ts';
import { Assets } from './world/assets.ts';
import { WorldController } from './world/controller.ts';
import type { Target } from './world/controller.ts';
import { MAPS, hash } from './world/maps.ts';
import { AREAS, CROPS, FESTIVALS, ITEMS, QUESTS, SEASONS, VILLAGERS } from './game/content.ts';
import { actOnPlot, attendFestival, buy, buyAnimal, careAnimal, catchFish, claimQuest, craft, createGame, currentQuest, expandFarm, gather, gift, level, propose, questReady, sell, shippingValue, sleep, startFishing, talk, upgrade, useItem } from './game/simulation.ts';
import { decodeSave, encodeSave, exportSave, occupiedSlots, readSlot, SAVE_PREFIX, saveSlot } from './game/save.ts';
import type { Area, GameState, Locale, Result, Text, Tool } from './game/types.ts';
import { txt } from './game/types.ts';
import * as view from './ui/views.ts';
import * as immersive from './ui/immersive.ts';
import { cinematic, dawn, home, TOUR_PAGES } from './ui/cinematic.ts';
import { settingsView as settingsPanel } from './ui/settings.ts';
import { DEFAULT_CONTROLS, readSettings, controlValue, type Settings } from './preferences.ts';
import { activateMechanism, openTreasure, shareBond, quietWalk, attendGathering, residentHere } from './game/expeditions.ts';
import { socialExtras, bondView, discoveryView, gatheringView, chapterView } from './ui/expeditions.ts';
import { GATHERINGS } from './game/expansion-content.ts';
import { escape as e, icon, t } from './ui/i18n.ts';

class Dewhaven {
  root=document.querySelector<HTMLDivElement>('#app')!;
  assets=new Assets();audio=new Soundscape();ads=new AdsController();state=createGame();world:WorldController|null=null;
  mode:'title'|'game'='title';dialog!:HTMLDialogElement;modalType='';modalTab='';modalPage=0;selectedItem='';personId='mira';dialogue='';
  tutorialStep=0;rating=5;settings:Settings=readSettings();
  movementPointer:number|null=null;
  movementOrigin:{x:number;y:number}|null=null;
  movementTap:{x:number;y:number;at:number;dragged:boolean}|null=null;
  actionPointer:number|null=null;goldShown:number|null=null;goldVisual=0;goldFrame=0;morningEarnings=0;morningExhausted=false;replayingIntro=false;
  goldCompact=new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1});goldShort=new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:0});
  modalGesture:number|null=null;
  adPreviewBanner=true;adPreviewMessage='';wasBackgrounded=false;rewardRefresh:ReturnType<typeof setTimeout>|null=null;
  journeyArea:Area='tide-vault';gatheringId='quay-fair';chapterId='new-roots';chapterPage=0;
  autosaveTimer:ReturnType<typeof setInterval>|null=null;lastHud=0;newGameDraft:{name:string;farm:string;avatar:number;slot:number}|null=null;pendingImport:GameState|null=null;
  fishing={phase:'cast',hits:0,misses:0,elapsed:0,frameTime:0,position:0,lastReel:0};fishTimeout:ReturnType<typeof setTimeout>|null=null;fishFrame=0;
  get ctx():view.ViewContext {return {s:this.state,lang:this.settings.language,assets:this.assets};}
  get uiWidth() {return Math.min(innerWidth,this.root.clientWidth||innerWidth);}
  tr(key:string) {return t(key,this.settings.language);}
  l(text:Text) {return text[this.settings.language];}
  async boot() {
    try {this.settings=readSettings(JSON.parse(localStorage.getItem('dewhaven.settings')||'{}'));}catch{/* Defaults also work when storage is unavailable. */}
    await setupAndroid(()=>this.back(),()=>this.background(),()=>this.foreground());
    this.root.innerHTML=`<main class="boot-screen"><img class="splash-emblem" src="/assets/brand/icon.svg" alt="Dewhaven emblem"><h1>Dewhaven</h1><p>${this.settings.language==='en'?'A little life in bloom.':'Kehidupan kecil yang bermekaran.'}</p><div class="boot-progress"><span id="load-progress"></span></div><small>THE LANTERN PROMISE</small></main>`;
    this.root.addEventListener('click',event=>{const button=(event.target as Element).closest<HTMLElement>('[data-action]');if(button&&!button.hasAttribute('disabled')){if(['reel','interact'].includes(button.dataset.action||'')&&(event as PointerEvent).pointerType)return;void this.action(button.dataset.action!,button.dataset);}});
    this.root.addEventListener('submit',event=>this.submit(event));
    this.root.addEventListener('change',event=>void this.change(event));
    this.root.addEventListener('input',event=>{if((event.target as HTMLElement).dataset.control)void this.change(event);});
    this.root.addEventListener('pointerdown',event=>{
      const reel=(event.target as Element).closest<HTMLElement>('[data-action="reel"]');
      if(reel&&!reel.hasAttribute('disabled')){event.preventDefault();void this.action('reel');return;}
      if(!this.world||this.dialog.open)return;
      const action=(event.target as Element).closest<HTMLElement>('[data-action="interact"]');
      if(action){event.preventDefault();this.actionPointer=event.pointerId;try{action.setPointerCapture(event.pointerId);}catch{}void this.audio.unlock();this.world.actionHeld=this.settings.controls.holdRepeat;this.world.interact();return;}
      let stick=(event.target as Element).closest<HTMLElement>('#movement-joystick');
      const button=(event.target as Element).closest<HTMLElement>('[data-direction]');
      const bounds=this.root.getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width,y=(event.clientY-bounds.top)/bounds.height;
      const floating=this.settings.controls.mode==='floating';
      const touchWorld=(event.target as Element).id==='world'&&event.pointerType!=='mouse';
      const zone=touchWorld&&floating&&y>.28&&(this.settings.controls.hand==='right'?x<.48:x>.52);
      if(zone)stick=this.root.querySelector<HTMLElement>('#movement-joystick');
      if(!stick&&!button)return;if(this.movementPointer!==null){event.preventDefault();event.stopPropagation();return;}event.preventDefault();this.movementPointer=event.pointerId;
      event.stopPropagation();
      if(stick){const r=stick.getBoundingClientRect();this.movementOrigin=floating?{x:event.clientX,y:event.clientY}:{x:r.left+r.width/2,y:r.top+r.height/2};stick.classList.toggle('is-floating',floating);if(floating){stick.style.setProperty('--float-x',`${this.movementOrigin.x}px`);stick.style.setProperty('--float-y',`${this.movementOrigin.y}px`);}this.movementTap=zone?{x:event.clientX,y:event.clientY,at:performance.now(),dragged:false}:null;}
      try{(stick||button)!.setPointerCapture(event.pointerId);}catch{/* Assistive input may not have an active pointer. */}
      if(stick)this.moveJoystick(event);else{const dir=button!.dataset.direction;this.world.touch={x:dir==='left'?-1:dir==='right'?1:0,y:dir==='up'?-1:dir==='down'?1:0};}
    },{capture:true});
    this.root.addEventListener('pointermove',event=>{if(event.pointerId===this.movementPointer&&this.root.querySelector('#movement-joystick')?.hasPointerCapture(event.pointerId))this.moveJoystick(event);});
    const release=(event:PointerEvent)=>{if(event.pointerId===this.movementPointer){const tap=this.movementTap;this.resetJoystick();if(event.type==='pointerup'&&tap&&!tap.dragged&&performance.now()-tap.at<300&&this.settings.controls.tapToMove&&this.world&&!this.world.paused){const p=this.world.renderer.toWorld(tap.x,tap.y);this.world.click(p.x,p.y);}}if(event.pointerId===this.actionPointer){this.actionPointer=null;if(this.world)this.world.actionHeld=false;}};
    this.root.addEventListener('pointerup',release);this.root.addEventListener('pointercancel',release);this.root.addEventListener('lostpointercapture',release);
    window.addEventListener('keydown',event=>this.shortcut(event));
    window.addEventListener('blur',()=>this.resetJoystick());
    window.addEventListener('resize',()=>{if(this.mode==='game')this.showGold(this.state.gold);});
    window.addEventListener('pagehide',()=>{if(this.mode==='game')saveSlot(this.state);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.mode==='game')this.background();});
    try {await Promise.all([this.assets.load(n=>{document.querySelector<HTMLElement>('#load-progress')!.style.width=`${n*100}%`;}),Promise.all(['letter','valley','homestead','dawn'].map(async scene=>{const image=new Image();image.src=`/assets/cinematic/${scene}.webp`;await image.decode();})),new Promise(resolve=>setTimeout(resolve,1100))]);this.renderTitle();finishNativeSplash();this.ads.onChange=()=>this.onAdsChanged();window.addEventListener('online',()=>void this.ads.initialize());void this.ads.initialize();}
    catch(error){this.root.innerHTML=`<main class="boot-screen"><div class="brand">${view.brand()}</div><h2>The valley’s art could not be loaded.</h2><p>${e(error instanceof Error?error.message:error)}</p><button class="button button-primary" onclick="location.reload()">Try again</button></main>`;}
    if(import.meta.env.PROD&&!nativeAndroid&&'serviceWorker' in navigator)void navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }
  shell(html:string) {
    this.root.innerHTML=`<div id="screen">${html}</div><dialog id="modal" aria-label="Dewhaven"><div class="modal-wrap"><button class="modal-close" data-action="close" aria-label="${this.tr('close')}">${icon('x')}</button><div class="modal-body" id="modal-body"></div></div></dialog><div id="toast-container" role="status" aria-live="polite"></div><input id="save-import" type="file" accept="application/json,.json" hidden>`;
    this.root.classList.toggle('large-text',this.settings.largeText);
    this.dialog=this.root.querySelector<HTMLDialogElement>('#modal')!;
    this.dialog.addEventListener('close',()=>{if(!this.dialog.open&&this.modalType)this.dismiss();});
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.back();});
    this.dialog.addEventListener('click',event=>{if(event.target===this.dialog){if(this.modalGesture===(event as PointerEvent).pointerId){this.modalGesture=null;return;}this.modalGesture=null;const rect=this.dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)this.close();}});
    this.applyControls();this.updateAudio();
  }
  renderTitle() {this.world?.stop();this.world=null;this.mode='title';document.body.classList.remove('game-running');if(this.autosaveTimer)clearInterval(this.autosaveTimer);this.shell(immersive.title(this.ctx,occupiedSlots().some(Boolean)));this.syncAdsPlacement();}
  renderGame() {
    this.world?.stop();cancelAnimationFrame(this.goldFrame);this.goldShown=null;this.mode='game';document.body.classList.add('game-running');this.shell(immersive.game(this.ctx));
    this.root.querySelector('#world')?.setAttribute('aria-label','Dewhaven game world. Touch the movement side and drag to walk. Choose a tool below, then tap or hold the action button. Tap the world to approach a crop, neighbour or door. Customize controls in Settings.');
    this.world=new WorldController(this.root.querySelector<HTMLCanvasElement>('#world')!,this.assets,this.state,target=>this.worldAction(target),()=>this.onClock(),()=>{this.resetJoystick();this.audio.play('door');this.updateHud();saveSlot(this.state);});
    this.applyControls();this.world.onStep=()=>{this.audio.play('step');this.world?.renderer.footstep();};
    this.world.onBusy=busy=>{const button=this.root.querySelector('.touch-interact');button?.classList.toggle('is-working',busy);button?.setAttribute('aria-busy',String(busy));};this.updateHud();
    this.world.onFocus=()=>this.updateHud(false);
    if(this.autosaveTimer)clearInterval(this.autosaveTimer);
    this.autosaveTimer=setInterval(()=>{if(this.mode==='game')saveSlot(this.state);},15000);this.syncAdsPlacement();
  }
  start(state:GameState,tour=false) {this.state=state;this.replayingIntro=false;this.morningEarnings=0;this.renderGame();saveSlot(this.state);void this.audio.unlock();if(tour||!state.tutorialDone){this.tutorialStep=0;this.open('onboarding');}}
  dismiss() {if(this.dialog.open)this.dialog.close();this.stopFishing();this.modalType='';if(this.world){this.world.paused=this.ads.presenting||document.hidden;this.world.clear();}this.syncAdsPlacement();}
  close() {if(this.modalType==='onboarding'){this.finishTour(false);return;}if(this.modalType==='morning'){this.beginDay();return;}this.dismiss();}
  finishTour(wake=true) {if(this.replayingIntro){this.replayingIntro=false;this.dismiss();return;}this.state.tutorialDone=true;saveSlot(this.state);if(wake)this.open('morning');else this.dismiss();}
  async beginDay() {
    this.dismiss();this.world?.renderer.arrival();if(this.morningEarnings){this.animateCoins(this.morningEarnings);this.morningEarnings=0;}void this.audio.unlock();
    const state=this.state;
    if(this.ads.state.interstitialReady&&canInterstitial(state,this.ads.sessionStarted,this.ads.lastFullscreenAt)){
      const result=await this.presentAd(false);
      if(result.shown){state.adHistory.lastInterstitialDay=state.totalDays;saveSlot(state);}
    }else void this.ads.refresh();
  }
  back() {if(this.ads.presenting)return;if(this.dialog?.open){if(this.modalType==='onboarding')this.finishTour();else this.close();}else if(this.mode==='game')this.open('pause');else exitAndroid();}
  background() {this.wasBackgrounded=true;this.resetJoystick();if(this.mode==='game'){saveSlot(this.state);this.world?.clear();if(this.world)this.world.paused=true;if(!this.ads.presenting&&(!this.dialog.open||this.modalType==='fishing'))this.open('pause');}void this.audio.ctx?.suspend();}
  foreground() {
    const returning=this.wasBackgrounded;this.wasBackgrounded=false;
    if(this.ads.presenting)return;
    if(this.ads.justResumed){if(this.world)this.world.paused=this.dialog.open||document.hidden;if(!document.hidden)void this.audio.unlock().catch(()=>{});return;}
    if(!returning)return;
    if(this.mode==='game'){this.resetJoystick();this.world?.clear();saveSlot(this.state);if(!this.dialog.open)this.open('pause');}void this.ads.refresh();
  }
  syncAdsPlacement() {void this.ads.banner((this.mode==='title'&&!this.dialog?.open)||this.modalType==='pause'||(this.modalType==='ad-previews'&&this.adPreviewBanner));}
  get rewardReady() {return this.ads.state.rewardedReady&&canReward(this.state)&&Date.now()-this.ads.lastFullscreenAt>=REWARD_COOLDOWN;}
  onAdsChanged() {
    this.syncAdsPlacement();
    const reward=this.root.querySelector<HTMLButtonElement>('[data-action="watch-reward"]');if(reward)reward.disabled=!this.rewardReady;
    if(this.rewardRefresh)clearTimeout(this.rewardRefresh);
    const remaining=Math.max(this.state.adHistory.lastRewardAt,this.ads.lastFullscreenAt)+REWARD_COOLDOWN-Date.now();
    if(this.modalType==='home'&&remaining>0)this.rewardRefresh=setTimeout(()=>this.onAdsChanged(),remaining+100);
    const privacy=this.root.querySelector<HTMLElement>('[data-action="ad-privacy"]');if(privacy)privacy.hidden=!this.ads.state.privacyRequired;
    if(this.modalType==='ad-previews'&&this.dialog.open)this.renderModal();
  }
  async presentAd(rewarded:boolean,preview=false):Promise<AdResult> {
    if(this.ads.presenting)return {shown:false,earned:false};
    const world=this.world;this.resetJoystick();world?.clear();if(world)world.paused=true;void this.audio.ctx?.suspend();
    try {return await this.ads.show(rewarded,preview);}
    finally {if(world===this.world&&world)world.paused=this.dialog.open||document.hidden;if(!document.hidden)void this.audio.unlock().catch(()=>{});this.onAdsChanged();}
  }
  async watchReward() {
    if(this.modalType!=='home'||!this.rewardReady)return;
    const state=this.state,result=await this.presentAd(true);
    if(result.earned&&result.receipt){const reward=claimAdEnergy(state,result.receipt);saveSlot(state);if(state===this.state)this.result(reward,true);}
    else this.toast(txt('No reward collected. You can rest or try again later.','Hadiah belum terkumpul. Kamu bisa istirahat atau mencoba lagi.'),true);
  }
  moveJoystick(event:PointerEvent) {
    const el=this.root.querySelector<HTMLElement>('#movement-joystick');if(!el||!this.world||this.dialog.open||!this.movementOrigin)return;
    const radius=el.getBoundingClientRect().width*.3,origin=this.movementOrigin;
    let dx=event.clientX-origin.x,dy=event.clientY-origin.y,len=Math.hypot(dx,dy);
    if(this.movementTap&&Math.hypot(event.clientX-this.movementTap.x,event.clientY-this.movementTap.y)>8)this.movementTap.dragged=true;
    if(el.classList.contains('is-floating')&&len>radius*1.75){const shift=(len-radius*1.75)/len;origin.x+=dx*shift;origin.y+=dy*shift;dx=event.clientX-origin.x;dy=event.clientY-origin.y;len=Math.hypot(dx,dy);el.style.setProperty('--float-x',`${origin.x}px`);el.style.setProperty('--float-y',`${origin.y}px`);}
    const k=len>radius?radius/len:1,dead=radius*this.settings.controls.deadzone;
    el.style.setProperty('--stick-x',`${dx*k}px`);el.style.setProperty('--stick-y',`${dy*k}px`);
    const strength=Math.max(0,Math.min(1,(len-dead)/(radius-dead)*this.settings.controls.sensitivity));
    this.world.touch=len<=dead?{x:0,y:0}:{x:dx/len*strength,y:dy/len*strength};
    this.world.touchRun=this.settings.controls.runMode==='always'?strength>0:this.settings.controls.runMode==='edge'&&len>radius*1.4;
  }
  resetJoystick() {this.movementPointer=null;this.movementOrigin=null;this.movementTap=null;if(this.world){this.world.touch={x:0,y:0};this.world.touchRun=false;}const el=this.root.querySelector<HTMLElement>('#movement-joystick');el?.classList.remove('is-floating');el?.style.setProperty('--stick-x','0px');el?.style.setProperty('--stick-y','0px');}
  applyControls() {
    const c=this.settings.controls;for(const [key,value] of Object.entries({size:c.size,opacity:c.opacity,height:`${c.height}px`}))this.root.style.setProperty(`--control-${key}`,String(value));
    this.root.classList.toggle('reduce-motion',this.settings.reduceMotion);
    const game=this.root.querySelector('.immersive-game');game?.classList.toggle('left-handed',c.hand==='left');game?.classList.toggle('floating-controls',c.mode==='floating');game?.classList.toggle('hide-hud',!this.settings.showHUD);
    this.root.querySelector('.control-preview')?.classList.toggle('left-handed',c.hand==='left');
    if(this.world){this.world.timeRate=this.settings.pace;this.world.tapToMove=c.tapToMove;this.world.renderFPS=this.settings.quality;this.world.renderer.cameraResponse=c.camera;this.world.renderer.reduceMotion=this.settings.reduceMotion;if(this.world.renderer.viewZoom!==this.settings.worldZoom){this.world.renderer.viewZoom=this.settings.worldZoom;this.world.renderer.resize();}}
    this.root.querySelectorAll<HTMLOutputElement>('[data-control-value]').forEach(el=>{const key=el.dataset.controlValue!;el.value=controlValue(key,c[key as keyof typeof c]);});
  }
  open(type:string,tab='') {
    this.resetJoystick();
    this.modalGesture=this.actionPointer;
    this.actionPointer=null;
    this.stopFishing();this.modalType=type;this.modalTab=tab;this.modalPage=0;
    if(this.world){this.world.paused=true;this.world.clear();}
    this.dialog.classList.toggle('narrow',['new-game','replace-save','onboarding','settings','about','rate','share','home','morning','pause','fishing','letter','import-confirm','tools','actions','ad-previews'].includes(type));
    this.dialog.classList.toggle('bottom-sheet',['tools','actions'].includes(type));
    this.dialog.classList.toggle('cinematic-dialog',['onboarding','morning','home','bond','discovery','chapter'].includes(type));
    this.renderModal();if(!this.dialog.open)this.dialog.showModal();this.syncAdsPlacement();
    this.dialog.querySelector('.modal-wrap')!.scrollTop=0;
    this.root.querySelectorAll('.nav-link').forEach(el=>el.classList.toggle('active',(el as HTMLElement).dataset.action===type));
  }
  renderModal() {
    const c=this.ctx,b=view.button;let html='';
    switch(this.modalType) {
      case 'tools':html=view.toolsView(c);break;
      case 'actions':html=view.actionsView(c);break;
      case 'new-game':html=view.newGameView(c,occupiedSlots());break;
      case 'replace-save':html=`<p class="eyebrow">${this.tr('saveSlots')}</p><h2>${this.settings.language==='en'?'Begin a new chapter?':'Mulai kisah yang baru?'}</h2><p class="modal-intro">${this.settings.language==='en'?`Save slot ${(this.newGameDraft?.slot||0)+1} already contains a story. Starting here replaces that save. You can export it first.`:`Slot ${(this.newGameDraft?.slot||0)+1} sudah memiliki kisah. Kisah baru menggantikan save ini. Kamu dapat mengekspornya terlebih dahulu.`}</p><div class="modal-actions">${b(this.tr('export'),'export-old','button button-subtle')}${b(this.tr('newGame'),'confirm-new','button button-primary')}</div>`;break;
      case 'onboarding':html=cinematic(c,this.tutorialStep);break;
      case 'journal':html=view.journal(c,this.modalTab||'main',this.modalPage,this.uiWidth<900?1:2);break;
      case 'backpack':html=view.backpack(c,this.modalTab||'all',this.selectedItem,this.modalPage,this.uiWidth<360?2:this.uiWidth<900?6:8);break;
      case 'market':html=view.market(c,this.modalTab||'seeds',this.modalPage,this.uiWidth<900?2:4);break;
      case 'shipping':html=view.shipping(c,this.modalPage,this.uiWidth<360?3:this.uiWidth<900?4:6);break;
      case 'craft':html=view.craftView(c,this.modalTab||'food',this.modalPage,this.uiWidth<360?1:this.uiWidth<900?2:3);break;
      case 'animals':html=view.animals(c,this.modalPage,this.uiWidth<900?2:4);break;
      case 'people':html=view.people(c,this.modalPage,this.uiWidth<900?4:6);break;
      case 'person':html=view.person(c,this.personId,this.dialogue)+socialExtras(c,this.personId);break;
      case 'bond':html=bondView(c,this.personId);break;
      case 'discovery':html=discoveryView(c,this.journeyArea);break;
      case 'gathering':html=gatheringView(c,this.gatheringId);break;
      case 'chapter':html=chapterView(c,this.chapterId,this.chapterPage);break;
      case 'gift':html=view.giftList(c,this.personId);break;
      case 'calendar':html=view.calendar(c,this.modalTab);break;
      case 'map':html=view.mapView(c,this.modalTab);break;
      case 'almanac':html=view.almanac(c,this.modalTab||'crops',this.modalPage,this.uiWidth<360?2:4);break;
      case 'upgrade':html=view.upgradeView(c,this.modalPage,this.uiWidth<900?2:4);break;
      case 'seeds':html=view.seeds(c);break;
      case 'settings':html=settingsPanel(c,this.settings,this.modalTab,this.modalPage,this.mode==='game');break;
      case 'about':html=this.aboutView();break;
      case 'rate':html=this.rateView();break;
      case 'share':html=this.shareView();break;
      case 'home':html=home(c,shippingValue(this.state),this.ads.supported,this.rewardReady);break;
      case 'ad-previews':html=adPreviews(c,this.ads.state,this.adPreviewMessage);break;
      case 'letter':html=`<p class="eyebrow">${c.lang==='en'?'GRANDMOTHER’S LETTER':'SURAT NENEK'}</p><h2>${c.lang==='en'?'Keep a light.':'Jagalah cahaya.'}</h2><p class="onboarding-copy">${c.lang==='en'?'When the world feels too loud, come home. The soil remembers kind hands. Bring the garden back. Keep a light in the valley.':'Saat dunia terasa bising, pulanglah. Tanah mengingat tangan yang baik. Hidupkan kebun lagi. Jagalah cahaya di lembah.'}</p>${b(c.lang==='en'?'Read the opening story':'Baca kisah pembuka','replay-intro','button button-primary')}`;break;
      case 'morning':html=dawn(c,this.morningEarnings,this.morningExhausted);break;
      case 'pause':html=`<div class="onboarding-sheet"><div class="onboarding-icon">${icon('coffee')}</div><span class="eyebrow">${this.settings.language==='en'?'THE VALLEY CAN WAIT':'LEMBAH BISA MENUNGGU'}</span><h2>${this.tr('pause')}</h2><p class="modal-intro">${this.settings.language==='en'?'Time is paused.':'Tarik napas. Tak ada yang berjalan tanpa dirimu.'}</p><div class="home-actions">${b(this.tr('resume'),'close','button button-primary')}${b(`${icon('floppy-disk')} ${this.tr('save')}`,'save','button button-subtle')}${b(this.tr('settings'),'settings','button button-subtle')}${b(this.tr('help'),'help','button button-subtle')}${b(this.tr('title'),'return-title','text-button')}</div></div>`;break;
      case 'help':html=this.helpView();break;
      case 'continue':html=this.slotsView();break;
      case 'fishing':html=this.fishingView();break;
      case 'festival':html=this.festivalView();break;
      case 'import-confirm':html=`<p class="eyebrow">${this.tr('import')}</p><h2>${e(this.pendingImport?.farmName)} ${this.tr('farmSuffix')}</h2><p class="modal-intro">${this.settings.language==='en'?`Load ${e(this.pendingImport?.playerName)}’s story? This will replace save slot ${(this.pendingImport?.slot||0)+1}.`:`Muat kisah ${e(this.pendingImport?.playerName)}? Save slot ${(this.pendingImport?.slot||0)+1} akan diganti.`}</p><div class="modal-actions">${b(this.tr('export'),'export','button button-subtle',this.mode==='title'?'disabled':'')}${b(this.tr('continue'),'confirm-import','button button-primary')}</div>`;break;
    }
    this.root.querySelector('#modal-body')!.innerHTML=html;
    this.applyControls();
    if(this.modalType==='map')this.drawValley();
  }
  async action(action:string,data:DOMStringMap={}) {
    if(this.ads.presenting)return;
    if(action!=='noop'){
      if(this.audio.ctx?.state==='suspended')void this.audio.unlock().catch(()=>{});
      this.audio.play('click');
    }
    const gameOnly=['journal','backpack','market','calendar','map','craft','animals','people','almanac','upgrade','seeds','home','pause','help','tools','actions'];
    if(this.mode==='title'&&gameOnly.includes(action)){this.open('new-game');return;}
    switch(action) {
      case 'noop':break;
      case 'play':this.close();break;
      case 'new-game':this.open('new-game');break;
      case 'confirm-new':if(this.newGameDraft){const d=this.newGameDraft;this.start(createGame(d.name,d.farm,d.avatar,d.slot),true);this.newGameDraft=null;}break;
      case 'export-old':{const old=readSlot(this.newGameDraft?.slot||0);if(old)await this.exportStory(old.state);else this.toast(txt('This slot has no readable save to export.','Slot ini tidak memiliki save yang bisa diekspor.'),true);break;}
      case 'continue':this.open('continue');break;
      case 'load-slot':{const slot=readSlot(Number(data.slot));if(slot)this.start(slot.state);else this.toast(txt('This story could not be loaded. Your file is kept unchanged.','Kisah tidak dapat dimuat. File tetap tersimpan.'),true);break;}
      case 'close':this.close();break;
      case 'next-tour':this.tutorialStep=Math.min(TOUR_PAGES-1,this.tutorialStep+1);this.renderModal();break;
      case 'previous-tour':this.tutorialStep=Math.max(0,this.tutorialStep-1);this.renderModal();break;
      case 'skip-tour':case 'finish-tour':this.finishTour();break;
      case 'begin-day':this.beginDay();break;
      case 'settings-tab':this.modalTab=data.tab!;this.modalPage=0;this.renderModal();this.dialog.querySelector('.modal-wrap')!.scrollTop=0;break;
      case 'controls-page':this.modalPage=Math.max(0,Math.min(2,Number(data.page)||0));this.renderModal();break;
      case 'reset-controls':this.resetJoystick();this.settings.controls={...DEFAULT_CONTROLS};this.settings.haptics=true;this.saveSettings();this.renderModal();break;
      case 'replay-intro':this.replayingIntro=true;this.tutorialStep=0;this.open('onboarding');break;
      case 'tools':case 'actions':case 'journal':case 'backpack':case 'market':case 'calendar':case 'map':case 'craft':case 'animals':case 'people':case 'almanac':case 'upgrade':case 'seeds':case 'home':case 'pause':case 'help':case 'about':case 'rate':case 'share':case 'settings':this.open(action);break;
      case 'journal-tab':case 'bag-tab':case 'market-tab':case 'craft-tab':case 'almanac-tab':case 'help-tab':case 'map-tab':case 'calendar-tab':this.modalTab=data.tab!;this.modalPage=0;this.renderModal();break;
      case 'catalog-page':this.modalPage=Math.max(0,Number(data.page)||0);this.selectedItem='';this.renderModal();this.dialog.querySelector('.modal-wrap')!.scrollTop=0;break;
      case 'tool':{const seedWasEquipped=this.state.selectedTool==='seed';this.state.selectedTool=data.tool as Tool;if(this.settings.haptics)haptic();this.updateHud();this.toolNote();if(data.tool==='seed'&&(data.quick!=='true'||seedWasEquipped))this.open('seeds');else if(this.modalType==='tools')this.close();saveSlot(this.state);break;}
      case 'choose-seed':this.state.selectedSeed=data.seed!;this.state.selectedTool='seed';this.close();this.updateHud();this.toolNote();saveSlot(this.state);break;
      case 'interact':this.world?.interact();break;
      case 'buy':this.result(buy(this.state,data.item!),true);break;
      case 'ship-item':this.result(sell(this.state,data.item!,Number(data.quantity)||1),true);break;
      case 'select-item':this.selectedItem=data.item!;this.renderModal();break;
      case 'use-item':{const r=useItem(this.state,data.item!);this.result(r,true);if(r.ok&&ITEMS[data.item!].category==='seed')this.close();break;}
      case 'make':this.result(craft(this.state,data.recipe!),true);break;
      case 'claim':{const r=claimQuest(this.state,data.quest!);this.result(r,true);if(r.ok&&['lantern-promise','letters-across-water','tide-remembers','warm-glass','farther-lights'].includes(data.quest!)){this.chapterId=data.quest!;this.chapterPage=0;this.open('chapter');}break;}
      case 'read-chapter':this.chapterId=data.quest!;this.chapterPage=0;this.open('chapter');break;
      case 'chapter-next':this.chapterPage=1;this.renderModal();break;
      case 'chapter-previous':this.chapterPage=0;this.renderModal();break;
      case 'bond':this.personId=data.person!;this.open('bond');break;
      case 'bond-choice':{const r=shareBond(this.state,data.person!,Number(data.scene),Number(data.choice));this.result(r,false,true);if(r.ok){this.dialogue=this.l(r.message);this.open('person');}break;}
      case 'quiet-walk':this.result(quietWalk(this.state,data.person!),true);break;
      case 'visit-gathering':{const g=GATHERINGS.find(g=>g.id===data.event)!;this.close();this.world?.travel(g.area,[g.area==='aster-quay'?24.5:23.5,g.area==='aster-quay'?24.5:18.5]);this.gatheringId=g.id;this.open('gathering');break;}
      case 'join-gathering':this.result(attendGathering(this.state,data.event!),true);break;
      case 'care':this.result(careAnimal(this.state,data.animal!,data.care as 'pet'|'feed'|'collect'),true);break;
      case 'animal-market':this.open('market','animals');break;
      case 'buy-animal':this.result(buyAnimal(this.state,data.kind as 'chicken'|'pig'|'rabbit',data.name!),true);break;
      case 'person':this.personId=data.person!;this.dialogue='';this.open('person');break;
      case 'talk':{this.personId=data.person!;const r=talk(this.state,this.personId);this.dialogue=this.l(r.message);this.result(r,true);break;}
      case 'visit-person':{const v=VILLAGERS.find(v=>v.id===data.person)!;this.close();this.world?.travel(v.area);this.world?.click(v.x+.5,v.y+1.5);break;}
      case 'gift-list':this.personId=data.person!;this.open('gift');break;
      case 'gift-item':{const r=gift(this.state,data.person!,data.item!);this.result(r);if(r.ok){this.personId=data.person!;this.dialogue=this.l(r.message);this.open('person');}break;}
      case 'propose':this.result(propose(this.state,data.person!),true);break;
      case 'travel':this.close();if(this.state.player.area!==data.area)this.world?.travel(data.area as Area);break;
      case 'upgrade-buy':this.result(data.upgrade==='expansion'?expandFarm(this.state):upgrade(this.state,data.upgrade as 'tools'|'backpack'|'house'),true);break;
      case 'watch-reward':await this.watchReward();break;
      case 'ad-previews':if(this.ads.supported&&this.ads.state.testMode){this.adPreviewMessage='';this.open('ad-previews');void this.ads.refresh();}break;
      case 'ad-refresh':await this.ads.refresh();break;
      case 'ad-banner':if(this.modalType==='ad-previews'){this.adPreviewBanner=!this.adPreviewBanner;this.syncAdsPlacement();}break;
      case 'ad-interstitial':case 'ad-rewarded':if(this.modalType==='ad-previews'&&this.ads.state.testMode){const result=await this.presentAd(action==='ad-rewarded',true);this.adPreviewMessage=result.earned?this.l(txt('Reward completed. Your farm is unchanged.','Iklan selesai. Farm tidak berubah.')):result.shown?this.l(txt('Preview closed. Your farm is unchanged.','Pratinjau ditutup. Farm tidak berubah.')):this.l(txt('Ad unavailable. Please try again later.','Iklan belum tersedia. Coba lagi nanti.'));if(this.modalType==='ad-previews')this.renderModal();}break;
      case 'ad-privacy':{const world=this.world;if(world)world.paused=true;void this.audio.ctx?.suspend();await this.ads.privacy();if(world===this.world&&world)world.paused=this.dialog.open||document.hidden;if(!document.hidden)void this.audio.unlock().catch(()=>{});break;}
      case 'save':this.manualSave();break;
      case 'sleep':this.doSleep();break;
      case 'rest':if(this.state.energy===this.state.maxEnergy)this.toast(txt('You are already rested.','Kamu sudah beristirahat.'),true);else if(this.state.time>=1320)this.doSleep();else {this.state.time+=60;this.state.energy=Math.min(this.state.maxEnergy,this.state.energy+25);this.result({ok:true,message:txt('A cup of tea, a quiet hour. +25 energy.','Secangkir teh, satu jam tenang. +25 energi.')},true);}break;
      case 'return-title':saveSlot(this.state);this.close();this.renderTitle();break;
      case 'export':if(this.mode==='game')await this.exportStory(this.state);else this.open('continue');break;
      case 'import':this.root.querySelector<HTMLInputElement>('#save-import')!.click();break;
      case 'confirm-import':if(this.pendingImport){const s=this.pendingImport;this.pendingImport=null;this.start(s);this.toast(txt('Your story has found its way home.','Kisahmu telah menemukan jalan pulang.'));}break;
      case 'audio':await this.audio.unlock();this.settings.ambient=!this.settings.ambient;this.saveSettings();this.updateAudio();break;
      case 'fullscreen':try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{this.toast(txt('Fullscreen is not available in this window.','Layar penuh tidak tersedia di jendela ini.'),true);}break;
      case 'rate-star':this.rating=Number(data.star);this.renderModal();break;
      case 'share-native':await this.share();break;
      case 'copy-share':await this.copyShare();break;
      case 'cast':this.cast();break;
      case 'reel':this.reel();break;
      case 'festival-attend':this.result(attendFestival(this.state),true);break;
    }
  }
  submit(event:Event) {
    event.preventDefault();const form=event.target as HTMLFormElement;const data=new FormData(form);
    if(form.id==='new-game-form') {
      const d={name:String(data.get('playerName')),farm:String(data.get('farmName')),avatar:Number(data.get('avatar')),slot:Number(data.get('slot'))};this.newGameDraft=d;
      let hasSave=false;try{hasSave=Boolean(localStorage.getItem(SAVE_PREFIX+d.slot));}catch{/* Start without persistence if browser storage is unavailable. */}
      if(hasSave)this.open('replace-save');else{this.start(createGame(d.name,d.farm,d.avatar,d.slot),true);this.newGameDraft=null;}
    }
    if(form.id==='rating-form') {
      try{localStorage.setItem('dewhaven.feedback',JSON.stringify({stars:this.rating,comment:String(data.get('comment')||'').slice(0,1000),createdAt:new Date().toISOString()}));this.close();this.toast(txt('Your thoughts are saved on this device. Thank you for the little love.','Penilaian tersimpan di perangkat ini. Terima kasih!'));}catch{this.toast(txt('Feedback could not be saved on this device.','Penilaian belum dapat disimpan.'),true);}
    }
  }
  async change(event:Event) {
    const target=event.target as HTMLInputElement|HTMLSelectElement;
    if(target.id==='save-import') {
      const input=target as HTMLInputElement;const file=input.files?.[0];if(!file)return;
      try {if(file.size>250000)throw new Error('Save too large');this.pendingImport=decodeSave(await file.text());this.open('import-confirm');}catch{this.toast(txt('This file is not a valid Dewhaven save. Your current story is safe.','File ini bukan save Dewhaven yang valid. Kisahmu tetap aman.'),true);}input.value='';return;
    }
    const control=target.dataset.control;
    if(control){const value=['tapToMove','holdRepeat'].includes(control)?(target as HTMLInputElement).checked:['mode','hand','runMode'].includes(control)?target.value:Number(target.value);this.settings=readSettings({...this.settings,controls:{...this.settings.controls,[control]:value}});this.applyControls();this.saveSettings();return;}
    const key=target.dataset.setting as keyof Settings|undefined;if(!key)return;
    if(key==='language'){const tab=this.modalTab;this.settings.language=target.value as Locale;this.saveSettings();if(this.mode==='game')this.renderGame();else this.renderTitle();this.open('settings',tab);return;}
    const value=target instanceof HTMLInputElement&&target.type==='checkbox'?target.checked:['volume','pace','quality','worldZoom'].includes(key)?Number(target.value):target.value;
    this.settings=readSettings({...this.settings,[key]:value});
    this.applyControls();this.root.classList.toggle('large-text',this.settings.largeText);this.saveSettings();await this.audio.unlock();this.updateAudio();
  }
  saveSettings() {try{localStorage.setItem('dewhaven.settings',JSON.stringify(this.settings));}catch{/* Gameplay remains usable. */}}
  updateAudio() {this.audio.ambient=this.settings.ambient;this.audio.effects=this.settings.sfx;this.audio.volume=this.settings.volume;this.audio.configure();this.root.querySelectorAll<HTMLElement>('.audio-button').forEach(button=>{button.innerHTML=icon(this.settings.ambient?'speaker-high':'speaker-slash');button.setAttribute('aria-pressed',String(this.settings.ambient));});}
  result(result:Result,refreshModal=false,physical=false) {
    if(!result.ok&&this.world)this.world.actionHeld=false;if(!physical||!result.ok)this.toast(result.message,!result.ok);if(!physical||!result.ok)this.audio.play(result.ok?'success':'error');
    if(result.ok){if(result.item)this.world?.renderer.effect(`+${result.amount||1}`);saveSlot(this.state);}
    this.updateHud();if(refreshModal&&this.dialog.open)this.renderModal();
  }
  toast(text:Text|string,error=false) {const container=this.root.querySelector('#toast-container');if(!container)return;const toast=document.createElement('div');toast.className=`toast ${error?'error':''}`;toast.innerHTML=`${icon(error?'info':'leaf')}<span>${e(typeof text==='string'?text:this.l(text))}</span>`;container.replaceChildren(toast);setTimeout(()=>toast.remove(),2600);}
  manualSave() {const success=saveSlot(this.state);this.toast(success?txt('Your story is saved.','Kisahmu tersimpan.'):txt('Storage is full. Export your save to keep your story.','Penyimpanan penuh. Ekspor save untuk menyimpan kisahmu.'),!success);}
  async exportStory(s:GameState) {if(!nativeAndroid){exportSave(s);return;}try{await exportAndroid(`dewhaven-${s.farmName.toLowerCase().replace(/[^a-z0-9]/g,'-')}-day-${s.totalDays}.json`,encodeSave(s));}catch{this.toast(txt('The export was closed. Your farm is still saved.','Ekspor ditutup. Farm tetap tersimpan.'),true);}}
  doSleep(exhausted=false) {const animation=this.world?.renderer.toolAnimation;if(animation)this.world?.renderer.actions.update(animation.duration);const r=sleep(this.state,exhausted);this.morningEarnings=r.amount||0;this.morningExhausted=exhausted;this.world?.clear();if(this.world){this.world.minutes=0;this.world.renderer.center();}saveSlot(this.state);this.updateHud();this.open('morning');}
  onClock() {if(this.state.time>=1380){this.doSleep(true);return;}if(Date.now()-this.lastHud>700){this.updateHud(false);this.lastHud=Date.now();}}
  updateHud(side=true) {
    if(this.mode!=='game')return;const s=this.state,lang=this.settings.language;this.audio.environment(s.player.area,s.weather,!!MAPS[s.player.area].interior);
    const html=(id:string,value:string)=>{const el=this.root.querySelector(`#${id}`);if(el&&el.innerHTML!==value)el.innerHTML=value;};
    html('hud-day',`${this.l(SEASONS[s.season])} ${s.day}`);
    html('hud-clock',view.clock(s.time));html('hud-weather',icon(s.weather==='sunny'?'sun':s.weather==='rain'?'cloud-rain':s.weather==='snow'?'snowflake':'cloud'));
    this.showGold(s.gold);html('hud-energy',`${s.energy}`);
    const energy=this.root.querySelector<HTMLElement>('#energy-bar');if(energy){energy.style.width=`${s.energy/s.maxEnergy*100}%`;energy.style.background=s.energy<20?'#c19062':'#b29870';}
    html('bag-count',`${Object.keys(s.inventory).length} / ${s.capacity} ${this.tr('items')}`);
    const greeting=s.time<720?(lang==='en'?'Good morning':'Selamat pagi'):s.time<1080?(lang==='en'?'A lovely afternoon':'Selamat sore'):(lang==='en'?'A quiet evening':'Selamat malam');html('greeting',`${greeting}, ${e(s.playerName)}<span class="greeting-dot">.</span>`);
    this.root.querySelectorAll<HTMLElement>('[data-action="tool"]').forEach(button=>{const active=button.dataset.tool===s.selectedTool;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
    html('mobile-tool-icon',icon(view.toolIcon(s.selectedTool)));
    const interact=this.root.querySelector<HTMLElement>('.touch-interact');if(interact){const target=this.world?.focusedTarget,action=target?.type==='object'?target.object.action:'',enter=target?.type==='object'&&!!target.object.destination;const label=s.selectedTool==='hand'&&enter?(lang==='en'?'Enter':'Masuk'):s.selectedTool==='hand'&&action&&(MAPS[s.player.area].interior||action.startsWith('gathering:'))?(lang==='en'?'Use':'Gunakan'):view.toolActionLabel(s.selectedTool,lang);const key=`${s.selectedTool}-${label}`;if(interact.dataset.visual!==key){interact.innerHTML=`${immersive.toolArt(s.selectedTool)}<span>${label}</span>`;interact.dataset.visual=key;}interact.setAttribute('aria-label',`${label} nearby`);}
    const library=this.root.querySelector<HTMLElement>('.tool-library');if(library){const content=`${immersive.toolArt(['axe','pickaxe','rod'].includes(s.selectedTool)?s.selectedTool:'axe')}<span class="tool-more">${icon('dots-three')}</span>`;if(library.innerHTML!==content)library.innerHTML=content;library.classList.toggle('selected',['axe','pickaxe','rod'].includes(s.selectedTool));}
    if(side){const q=currentQuest(s);this.root.querySelector('#quest-dot')?.classList.toggle('ready',!!q&&questReady(s,q));}
  }
  toolNote() {const note=this.root.querySelector<HTMLElement>('#tool-note');if(!note)return;note.textContent=this.state.selectedTool==='seed'?`${this.l(CROPS[this.state.selectedSeed].name)} · ${this.state.inventory[this.state.selectedSeed+'_seed']||0}`:this.tr(this.state.selectedTool);note.classList.remove('visible');void note.offsetWidth;note.classList.add('visible');}
  goldText(gold:number) {return gold<10000?gold.toLocaleString(): (this.uiWidth<360?this.goldShort:this.goldCompact).format(gold);}
  showGold(gold:number) {
    const label=this.root.querySelector<HTMLElement>('#hud-gold');if(!label)return;if(gold===this.goldShown){label.textContent=this.goldText(this.goldVisual);return;}
    const previous=this.goldShown;this.goldShown=gold;cancelAnimationFrame(this.goldFrame);
    this.root.querySelector('.money-hud')?.setAttribute('aria-label',`Gold: ${gold.toLocaleString()}`);
    if(previous===null||this.settings.reduceMotion){this.goldVisual=gold;label.textContent=this.goldText(gold);if(previous!==null&&gold>previous)this.audio.play('coin');return;}
    const initial=this.goldVisual,start=performance.now();
    const draw=(now:number)=>{const p=Math.min(1,(now-start)/650);this.goldVisual=Math.round(initial+(gold-initial)*(1-Math.pow(1-p,3)));label.textContent=this.goldText(this.goldVisual);if(p<1)this.goldFrame=requestAnimationFrame(draw);};
    this.goldFrame=requestAnimationFrame(draw);this.animateCoins(gold-previous);
    if(gold>previous)this.audio.play('coin');
  }
  animateCoins(delta:number) {
    if(!delta)return;const hud=this.root.querySelector<HTMLElement>('.money-hud'),change=this.root.querySelector<HTMLElement>('#gold-change');if(!hud||!change)return;
    change.textContent=`${delta>0?'+':'−'}${this.goldText(Math.abs(delta))}`;hud.classList.remove('earning','spending');void hud.offsetWidth;hud.classList.add(delta>0?'earning':'spending');
    const layer=this.root.querySelector<HTMLElement>('.coin-flight-layer');if(delta<0||!layer||this.settings.reduceMotion||!this.settings.showHUD||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const rect=layer.getBoundingClientRect(),end=hud.getBoundingClientRect(),r=this.world?.renderer;
    const x=r?(this.state.player.x*16-r.camera.x)*r.scale:rect.width/2,y=r?(this.state.player.y*16-r.camera.y)*r.scale:rect.height*.6;
    for(let i=0;i<6;i++){const coin=document.createElement('span');coin.className='flying-coin';coin.innerHTML=immersive.coinArt();coin.style.cssText=`--coin-x:${x+(i-2)*9}px;--coin-y:${y}px;--coin-dx:${end.left-rect.left-x-(i-2)*9}px;--coin-dy:${end.top-rect.top-y}px;--coin-delay:${i*65}ms`;layer.append(coin);setTimeout(()=>coin.remove(),1400);}
  }
  worldAction(target:Target|null) {
    const s=this.state;
    if(this.world?.renderer.toolAnimation)return;
    if(target?.type==='object'){
      const o=target.object;
      if(o.destination){this.world?.travel(o.destination,o.destinationSpawn);return;}
      if(o.action?.startsWith('mechanism:')){const [,area,index]=o.action.split(':');this.result(activateMechanism(s,area as Area,Number(index)));this.audio.play('pickaxe');if(this.settings.haptics)haptic();return;}
      if(o.action?.startsWith('treasure:')){const area=o.action.split(':')[1] as Area,r=openTreasure(s,area);this.result(r,false,true);if(r.ok){this.journeyArea=area;this.open('discovery');}return;}
      if(o.action?.startsWith('gathering:')){this.gatheringId=o.action.split(':')[1];this.open('gathering');return;}
    }
    if(s.selectedTool==='rod') {if(this.nearWater())this.open('fishing');else this.toast(txt('Find a quiet spot near the lake or river, then cast.','Cari tempat di tepi danau atau sungai, lalu lempar pancing.'),true);return;}
    if(!target){this.toast(txt('Move a little closer to something you can tend.','Mendekatlah ke sesuatu yang bisa dirawat.'),true);return;}
    if(target.type==='plot'){const tool=s.selectedTool,seed=s.selectedSeed;const preview=actOnPlot(structuredClone(s),target.id,tool,seed);if(!preview.ok){this.result(preview,false,true);return;}this.world?.renderer.animateTool(tool,target,()=>{const r=actOnPlot(s,target.id,tool,seed);this.result(r,false,true);if(r.ok){this.audio.play(tool==='hand'?'harvest':tool as 'hoe'|'water'|'seed');if(this.settings.haptics)haptic();}});return;}
    if(target.type==='npc'){this.personId=target.id;this.dialogue='';this.open('person');return;}
    if(target.type==='animal'){this.open('animals');return;}
    const o=target.object;
    if(o.kind==='exit'){this.world?.travel(o.destination!);return;}
    if(o.resource) {
      const expected=o.resource==='wood'?'axe':['stone','ore'].includes(o.resource)?'pickaxe':'hand';
      if(s.selectedTool!==expected){this.toast(txt(`Select ${t(expected,'en').toLowerCase()} to gather this.`,`Pilih ${t(expected,'id').toLowerCase()} untuk mengambilnya.`),true);return;}
      const key=o.resource==='ore'?`${o.id}-f${s.mineFloor}`:o.id;
      const roll=Math.random(),preview=gather(structuredClone(s),key,o.resource!,roll);if(!preview.ok){this.result(preview,false,true);return;}this.world?.renderer.animateTool(expected,target,()=>{const r=gather(s,key,o.resource!,roll);this.result(r,false,true);if(r.ok){this.audio.play(expected==='axe'?'axe':expected==='pickaxe'?'pickaxe':'harvest');if(this.settings.haptics)haptic();}},o);return;
    }
    if(o.action?.startsWith('npc:')){this.personId=o.action.split(':')[1];this.dialogue='';this.open('person');return;}
    const action=o.action==='shop'?'market':o.action==='board'?'journal':o.action==='mail'?'letter':o.action;
    if(action==='mine-down') {if(s.mineFloor>=5){this.toast(txt('The deepest chamber. The stone holds its oldest secrets here.','Ruang terdalam. Batu menyimpan rahasia tertuanya di sini.'));return;}s.mineFloor++;s.player.x=23.5;s.player.y=26.5;this.world?.renderer.center();this.updateHud();this.manualSave();this.toast(txt(`Mine floor ${s.mineFloor}. New veins await.`,`Lantai tambang ${s.mineFloor}. Bijih baru menanti.`));return;}
    if(action==='fish'){this.open('fishing');return;}
    if(action)this.open(action);
  }
  nearWater() {const m=MAPS[this.state.player.area],p=this.state.player;for(let y=Math.floor(p.y)-2;y<=Math.floor(p.y)+2;y++)for(let x=Math.floor(p.x)-2;x<=Math.floor(p.x)+2;x++)if(m.tiles[y]?.[x]==='water')return true;return false;}
  waterTarget() {const m=MAPS[this.state.player.area],p=this.state.player;let point={x:p.x+1,y:p.y},best=Infinity;for(let y=Math.floor(p.y)-4;y<=Math.floor(p.y)+4;y++)for(let x=Math.floor(p.x)-4;x<=Math.floor(p.x)+4;x++)if(m.tiles[y]?.[x]==='water'){const d=Math.hypot(x+.5-p.x,y+.5-p.y);if(d<best){best=d;point={x:x+.5,y:y+.5};}}return point;}
  shortcut(event:KeyboardEvent) {
    if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLSelectElement)return;
    if(this.dialog?.open){if(this.modalType==='fishing'&&event.code==='Space'){event.preventDefault();if(!event.repeat)this.reel();}return;}
    if(this.mode!=='game')return;
    const key=event.key.toLowerCase();const tools:Tool[]=['hand','hoe','water','seed','axe','pickaxe','rod'];
    if(/^[1-7]$/.test(key)){event.preventDefault();void this.action('tool',{tool:tools[Number(key)-1]});return;}
    const shortcuts:Record<string,string>={b:'backpack',j:'journal',m:'map',c:'calendar',p:'pause',escape:'pause',f:'craft'};
    if(shortcuts[key]){event.preventDefault();this.open(shortcuts[key]);}
  }
  aboutView() {return `<div class="about-brand"><span class="brand-mark">${icon('plant')}</span><h2>Dewhaven</h2><p>${this.tr('tagline')}</p></div><p class="about-copy">${this.settings.language==='en'?'A farming and life simulation about small beginnings, kind neighbors, and the quiet joy of growing something good. Restore a forgotten homestead, follow sixteen story chapters across four towns, and find your own rhythm in the valley.':'Simulasi bertani dan kehidupan tentang awal kecil, tetangga baik, dan kebahagiaan sederhana saat menumbuhkan sesuatu. Pulihkan kebun tua, ikuti enam belas bab cerita di empat kota, dan temukan iramamu sendiri di lembah.'}</p><details class="about-credits"><summary>Credits &amp; storage</summary><p>Version 1.3.0 · Farming & life simulation</p><p>Pixel art: 2D Cozy RPG Pixelart / Super Retro Collection — Gif.<br>Cinematic paintings & 32 inventory illustrations: generated from text with OpenAI imagegen.<br>Typography: Fraunces & Nunito · Icons: Phosphor.<br>Nature ambience & activity foley: original Web Audio.</p><p>${this.settings.language==='en'?'Your stories and feedback are saved on this device. Export a save to carry your valley with you.':'Kisah dan penilaian disimpan di perangkat ini. Ekspor save untuk membawa lembahmu ke mana saja.'}</p></details><div class="modal-actions">${view.button(this.settings.language==='en'?'Replay opening':'Kisah pembuka','replay-intro','button button-subtle')}${view.button(this.tr('share'),'share','button button-subtle')}${view.button(this.tr('rate'),'rate','button button-primary')}${this.ads.supported&&this.ads.state.testMode?view.button(this.settings.language==='en'?'Ad previews':'Pratinjau iklan','ad-previews','text-button'):''}${this.ads.supported?view.button(this.settings.language==='en'?'Privacy choices':'Pilihan privasi','ad-privacy','text-button',this.ads.state.privacyRequired?'':'hidden'):''}</div>`;}
  rateView() {return `<p class="eyebrow">DEAR VALLEY DREAMER</p><h2>${this.tr('rate')}</h2><p class="modal-intro">${this.settings.language==='en'?'How is your time in the valley? A little thought can make this place even better.':'Bagaimana waktumu di lembah? Pendapat kecilmu bisa membuat tempat ini lebih indah.'}</p><div class="rating-stars" role="group" aria-label="Rating">${[1,2,3,4,5].map(n=>view.button(icon('star'),'rate-star',`star-button ${n<=this.rating?'filled':''}`,`data-star="${n}" aria-label="${n} star${n>1?'s':''}" aria-pressed="${n===this.rating}"`)).join('')}</div><form id="rating-form"><label for="rating-comment">${this.settings.language==='en'?'A little note (optional)':'Catatan kecil (opsional)'}</label><textarea id="rating-comment" name="comment" maxlength="1000" placeholder="${this.settings.language==='en'?'What made you smile? What could grow?':'Apa yang menyenangkan? Apa yang bisa ditingkatkan?'}"></textarea><p class="rating-note">${this.settings.language==='en'?'Feedback is saved on this device. Dewhaven does not have a store listing yet, so this does not post an online review.':'Penilaian tersimpan di perangkat ini. Dewhaven belum memiliki halaman toko, sehingga ini tidak mengirim ulasan daring.'}</p><button class="button button-primary button-full" type="submit">${icon('heart')} ${this.tr('rateSubmit')}</button></form>`;}
  shareText() {const s=this.state;return this.settings.language==='en'?`Dewhaven — a little life in bloom.\n${this.mode==='game'?`I am growing ${s.farmName} Homestead. ${this.l(SEASONS[s.season])} ${s.day}, Year ${s.year} · ${s.stats.harvested} harvests · ${s.completed.length} chapters & requests completed.\n`:''}Plant. Wander. Belong.`:`Dewhaven — kehidupan kecil yang bermekaran.\n${this.mode==='game'?`Aku merawat ${s.farmName} Farm. ${this.l(SEASONS[s.season])} ${s.day}, Tahun ${s.year} · ${s.stats.harvested} panen · ${s.completed.length} quest selesai.\n`:''}Menanam. Menjelajah. Menemukan rumah.`;}
  shareView() {return `<p class="eyebrow">${this.settings.language==='en'?'GOOD THINGS ARE BETTER SHARED':'HAL BAIK LEBIH INDAH SAAT DIBAGIKAN'}</p><h2>${this.tr('share')}</h2><div class="share-card"><textarea id="share-text" readonly aria-label="Share text">${e(this.shareText())}</textarea></div><p class="rating-note">${this.settings.language==='en'?'Share your farm’s story. This local version has no public game link yet.':'Bagikan kisah farm-mu. Versi lokal ini belum memiliki tautan publik.'}</p><div class="modal-actions">${view.button(`${icon('copy')} ${this.settings.language==='en'?'Copy your story':'Salin kisahmu'}`,'copy-share','button button-subtle')}${view.button(`${icon('share-network')} ${this.tr('share')}`,'share-native','button button-primary')}</div>`;}
  async share() {if(nativeAndroid){try{await shareAndroid('Dewhaven',this.shareText());}catch{/* Closing the Android share sheet keeps the story unchanged. */}return;}if(navigator.share){try{await navigator.share({title:'Dewhaven',text:this.shareText()});this.toast(txt('A little piece of the valley, shared.','Sepotong kecil lembah telah dibagikan.'));}catch(err){if(!(err instanceof DOMException&&err.name==='AbortError'))await this.copyShare();}}else await this.copyShare();}
  async copyShare() {try{await navigator.clipboard.writeText(this.shareText());this.toast(txt('Your story is copied. Share it wherever you like.','Kisahmu disalin. Bagikan di mana saja.'));}catch{const input=this.root.querySelector<HTMLTextAreaElement>('#share-text');input?.focus();input?.select();this.toast(txt('Select and copy the story text above.','Pilih dan salin teks kisah di atas.'));}}
  homeView() {const s=this.state;return `<div class="home-banner"></div><p class="eyebrow">${e(s.farmName)} HOMESTEAD</p><h2>${this.tr('home')}</h2><p class="modal-intro">${this.settings.language==='en'?'Rest restores 25 energy. Sleep pays shipments and grows watered crops.':'Tinggalkan sepatumu di pintu. Istirahat atau tidur nyenyak bisa membawa perubahan indah.'}</p><div class="home-details"><span><b>${s.energy}/${s.maxEnergy}</b>${this.tr('energy')}</span><span><b>${shippingValue(s)} G</b>${this.tr('shipTomorrow')}</span><span><b>${s.plots.filter(p=>p.crop&&p.watered).length}</b>${this.settings.language==='en'?'crops growing tonight':'tanaman tumbuh malam ini'}</span></div><div class="home-actions">${view.button(`${icon('moon-stars')} ${this.tr('sleep')}`,'sleep','button button-primary')}${view.button(`${icon('coffee')} ${this.tr('rest')} (+25)`,'rest','button button-subtle')}${view.button(`${icon('floppy-disk')} ${this.tr('save')}`,'save','text-button')}</div><p class="home-note">${this.settings.language==='en'?'A new day begins at 6 am. Pass out at 11 pm and lose a little gold.':'Hari baru dimulai pukul 06.00. Kelelahan pada 23.00 memotong sedikit emas.'}</p>`;}
  helpView() {return view.helpView(this.ctx,this.modalTab||'controls',nativeAndroid||this.uiWidth<=900);}
  slotsView() {return `<p class="eyebrow">${this.settings.language==='en'?'RIGHT WHERE YOU LEFT OFF':'TEPAT DI TEMPATMU BERHENTI'}</p><h2>${this.tr('saveSlots')}</h2><div class="save-slot-list">${occupiedSlots().map((slot,i)=>`<button class="save-slot-card" data-action="load-slot" data-slot="${i}" ${!slot?'disabled':''}>${icon(slot?'house':'feather')}<div><h3>${slot?e(slot.state.farmName):this.tr('noSave')}</h3><p>${slot?`${e(slot.state.playerName)} · ${SEASONS[slot.state.season][this.settings.language]} ${slot.state.day}, Year ${slot.state.year}`:this.settings.language==='en'?'An empty save slot':'Slot save kosong'}</p>${slot?`<small>${slot.state.gold} G · ${slot.state.completed.length} ${this.settings.language==='en'?'chapters & requests':'quest'}</small>`:''}</div><span>0${i+1}</span></button>`).join('')}</div><div class="modal-actions">${view.button(this.tr('newGame'),'new-game','button button-subtle')}${view.button(this.tr('import'),'import','button button-subtle')}</div>`;}
  festivalView() {const f=FESTIVALS[this.state.season];return `<div class="onboarding-sheet"><div class="onboarding-icon">${icon('flower-lotus')}</div><span class="eyebrow">${this.tr('festival')}</span><h2>${this.l(f.name)}</h2><p class="modal-intro">${this.l(f.description)}<br>${this.l(SEASONS[this.state.season])} 14</p><p class="field-note">${this.settings.language==='en'?'Bring a flower in spring, a carp in summer, corn in autumn or berries in winter. Celebrate with everyone to earn friendship, energy and 300 gold.':'Bawa bunga saat semi, ikan mas saat panas, jagung saat gugur, atau beri saat dingin. Rayakan bersama untuk memperoleh pertemanan, energi dan 300 emas.'}</p><div class="modal-actions">${view.button(this.tr('calendar'),'calendar','button button-subtle')}${view.button(this.settings.language==='en'?'Join the celebration':'Ikut merayakan','festival-attend','button button-primary',this.state.day!==14||this.state.festivalDay===this.state.totalDays?'disabled':'')}</div></div>`;}
  fishingView() {const phase=this.fishing.phase;return `<p class="eyebrow">MOONWATER LAKE</p><h2>${this.tr('fishing')}</h2><div class="fishing-scene is-${phase}">${view.fishingArt()}</div><p class="fishing-status" id="fish-status">${phase==='cast'?(this.settings.language==='en'?'The lake is quiet. Cast a little hope.':'Danau tenang. Lempar sedikit harapan.'):phase==='waiting'?(this.settings.language==='en'?'Wait for the little ripple…':'Tunggu riak kecil…'):(this.settings.language==='en'?'A bite! Reel in the highlighted zone.':'Ikan menggigit! Tarik di zona yang ditandai.')}</p>${phase==='bite'?`<div class="fishing-meter"><span class="fishing-zone"></span><span class="fishing-marker" id="fish-marker"></span></div><div class="fishing-progress">${[0,1,2].map(i=>`<span class="${i<this.fishing.hits?'success':''}"></span>`).join('')}</div>`:''}<div class="home-actions">${view.button(`${icon('fish')} ${phase==='cast'?this.tr('cast'):this.tr('reel')}`,phase==='cast'?'cast':'reel','button button-primary',phase==='waiting'?'disabled':'')}</div><p class="home-note">${this.settings.language==='en'?'Three good reels to land a fish. Three misses and it swims free.':'Tarik tepat waktu tiga kali. Tiga kali meleset dan ikan bebas.'}</p>`;}
  cast() {if(this.modalType!=='fishing'||this.fishing.phase!=='cast')return;const r=startFishing(this.state);if(!r.ok){this.result(r);return;}this.world?.renderer.animateTool('rod',this.waterTarget(),()=>{this.audio.play('water');if(this.settings.haptics)haptic();});this.fishing={phase:'waiting',hits:0,misses:0,elapsed:0,frameTime:0,position:0,lastReel:0};this.renderModal();this.updateHud();saveSlot(this.state);this.fishTimeout=setTimeout(()=>{if(this.modalType!=='fishing'||!this.dialog.open)return;this.fishing.phase='bite';this.fishing.frameTime=performance.now();this.renderModal();this.animateFishing();this.audio.play('water');},2200+Math.random()*1200);}
  animateFishing() {if(this.modalType!=='fishing'||!this.dialog.open||this.fishing.phase!=='bite')return;const now=performance.now();this.fishing.elapsed+=Math.max(0,Math.min(80,now-this.fishing.frameTime));this.fishing.frameTime=now;const elapsed=this.fishing.elapsed;this.fishing.position=(Math.sin(elapsed/(nativeAndroid||this.uiWidth<=900?1200:900))+1)*48;const marker=this.root.querySelector<HTMLElement>('#fish-marker');if(marker)marker.style.left=`${this.fishing.position}%`;if(elapsed>16000){this.finishFishing(false);return;}this.fishFrame=requestAnimationFrame(()=>this.animateFishing());}
  reel() {if(this.fishing.phase!=='bite'||performance.now()-this.fishing.lastReel<250)return;this.fishing.lastReel=performance.now();const mobile=nativeAndroid||this.uiWidth<=900;const min=mobile?28:35,max=mobile?70:63;if(this.fishing.position>=min&&this.fishing.position<=max){this.fishing.hits++;this.audio.play('water');if(this.fishing.hits>=3){this.finishFishing(true);return;}this.root.querySelectorAll('.fishing-progress span').forEach((el,i)=>el.classList.toggle('success',i<this.fishing.hits));}else{this.fishing.misses++;this.audio.play('error');const status=this.root.querySelector('#fish-status');if(status)status.textContent=this.settings.language==='en'?`Steady now. ${3-this.fishing.misses} chances left.`:`Tenang. ${3-this.fishing.misses} kesempatan lagi.`;if(this.fishing.misses>=3)this.finishFishing(false);}}
  finishFishing(success:boolean) {this.close();this.fishing.phase='cast';this.result(success?catchFish(this.state):{ok:false,message:txt('The fish slipped away. Another quiet moment, another chance.','Ikan terlepas. Masih ada kesempatan berikutnya.')});}
  stopFishing() {if(this.fishTimeout)clearTimeout(this.fishTimeout);cancelAnimationFrame(this.fishFrame);this.fishing.phase='cast';}
  drawMinimap() {const c=this.root.querySelector<HTMLCanvasElement>('#minimap');if(!c)return;const ctx=c.getContext('2d')!,m=MAPS[this.state.player.area];ctx.fillStyle='#b4c28b';ctx.fillRect(0,0,c.width,c.height);const scale=Math.min(c.width/m.w,c.height/m.h);const ox=(c.width-m.w*scale)/2,oy=(c.height-m.h*scale)/2;for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){ctx.fillStyle=m.tiles[y][x]==='water'?'#7dada6':m.tiles[y][x]==='path'?'#d2c7a0':m.tiles[y][x]==='stone'?'#7c8b75':m.tiles[y][x]==='floor'?'#a3aa88':'#b4c28b';ctx.fillRect(ox+x*scale,oy+y*scale,scale+1,scale+1);}for(const o of m.objects){ctx.fillStyle=o.kind==='building'?'#ac8b64':o.kind==='tree'?'#91a776':'transparent';ctx.fillRect(ox+(o.x-1)*scale,oy+(o.y-1)*scale,scale*2,scale*2);}ctx.fillStyle='#fff1c2';ctx.strokeStyle='#647f55';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox+this.state.player.x*scale,oy+this.state.player.y*scale,4,0,Math.PI*2);ctx.fill();ctx.stroke();}
  drawValley() {const c=this.root.querySelector<HTMLCanvasElement>('#valley-map');if(!c)return;const ctx=c.getContext('2d')!;ctx.fillStyle='#eee5d5';ctx.fillRect(0,0,680,280);for(let i=0;i<70;i++){ctx.fillStyle=i%2?'#d4d6bd':'#d9d1b5';ctx.beginPath();ctx.ellipse(hash(i,1)*680,hash(i,2)*280,12+hash(i,5)*20,7+hash(i,3)*12,0,0,Math.PI*2);ctx.fill();}ctx.strokeStyle='#91b4b4';ctx.lineWidth=24;ctx.beginPath();ctx.moveTo(545,0);ctx.bezierCurveTo(430,130,650,155,540,280);ctx.stroke();const places:Array<[Area,number,number,string]>=[['forest',80,90,'W'],['farm',240,80,'F'],['village',300,200,'D'],['lake',420,140,'L'],['mine',130,220,'M'],['aster-quay',580,225,'A'],['sunridge',450,55,'S'],['briar-hollow',600,55,'B']];ctx.strokeStyle='#bc9b70';ctx.lineWidth=7;ctx.lineCap='round';for(const [a,b] of [[0,1],[1,2],[1,3],[0,4],[2,4],[2,5],[0,6],[6,7],[4,7]]){ctx.beginPath();ctx.moveTo(places[a][1],places[a][2]);ctx.lineTo(places[b][1],places[b][2]);ctx.stroke();}for(const [area,x,y,letter] of places){ctx.fillStyle=area===this.state.player.area?'#a57c47':'#617b73';ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#faf0d8';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff2d8';ctx.font='bold 23px Nunito';ctx.textAlign='center';ctx.fillText(letter,x,y+8);}}
}
const app=new Dewhaven();void app.boot();
if(import.meta.env.DEV)Object.defineProperty(window,'__dewhaven',{value:app});
