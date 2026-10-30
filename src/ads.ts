import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface AdState {
  testMode:boolean; initialized:boolean; bannerReady:boolean; bannerHeight:number;
  interstitialReady:boolean; rewardedReady:boolean; privacyRequired:boolean; error:string;
}
export interface AdResult { shown:boolean; earned:boolean; receipt?:string; }
export interface AdsPort {
  initialize():Promise<AdState>;
  status():Promise<AdState>;
  setBanner(options:{visible:boolean}):Promise<AdState>;
  showInterstitial(options:{preview:boolean}):Promise<AdResult>;
  showRewarded(options:{preview:boolean}):Promise<AdResult>;
  privacyOptions():Promise<{shown:boolean}>;
  addListener(name:'state',callback:(state:AdState)=>void):Promise<PluginListenerHandle>;
}
const unavailable=():AdResult=>({shown:false,earned:false});

/** The web game stays ad-free; only the native Android bridge requests ads. */
export class AdsController {
  state:AdState={testMode:false,initialized:false,bannerReady:false,bannerHeight:0,interstitialReady:false,rewardedReady:false,privacyRequired:false,error:''};
  presenting=false;resumeUntil=0;bannerWanted=false;sessionStarted:number;lastInterstitialAt=0;lastFullscreenAt=0;
  onChange:()=>void=()=>{};
  private port:AdsPort;private now:()=>number;private online:()=>boolean;supported:boolean;
  private initializing:Promise<void>|null=null;private listenerRegistered=false;
  constructor(port:AdsPort=registerPlugin<AdsPort>('DewhavenAds'),supported=Capacitor.getPlatform()==='android',now=()=>Date.now(),online=()=>typeof navigator==='undefined'||navigator.onLine!==false) {
    this.port=port;this.supported=supported;this.now=now;this.online=online;
    this.sessionStarted=now();
    try {this.lastInterstitialAt=Math.max(0,Number(localStorage.getItem('dewhaven.ads.last-interstitial'))||0);this.lastFullscreenAt=Math.max(this.lastInterstitialAt,Number(localStorage.getItem('dewhaven.ads.last-fullscreen'))||0);}catch{/* Native cooldown also persists independently. */}
  }
  private receive(state:AdState) {this.state=state;this.onChange();}
  initialize():Promise<void> {
    if(!this.supported||!this.online())return Promise.resolve();
    if(this.initializing)return this.initializing;
    if(this.state.initialized)return this.refresh();
    this.initializing=this.initializePort().finally(()=>{this.initializing=null;});
    return this.initializing;
  }
  private async initializePort() {
    try {
      if(!this.listenerRegistered){await this.port.addListener('state',state=>this.receive(state));this.listenerRegistered=true;}
      this.receive(await this.port.initialize());
    }
    catch {this.state.error='ad-unavailable';this.onChange();}
  }
  async refresh() {if(this.supported)try {this.receive(await this.port.status());}catch{/* Offline play needs no ad connection. */}}
  async banner(visible:boolean) {
    if(!this.supported||visible===this.bannerWanted)return;
    this.bannerWanted=visible;
    try {this.receive(await this.port.setBanner({visible}));}catch{this.bannerWanted=false;}
  }
  async show(rewarded:boolean,preview=false):Promise<AdResult> {
    if(!this.supported||this.presenting||!(rewarded?this.state.rewardedReady:this.state.interstitialReady))return unavailable();
    this.presenting=true;
    try {
      const result=await (rewarded?this.port.showRewarded({preview:preview&&this.state.testMode}):this.port.showInterstitial({preview:preview&&this.state.testMode}));
      if(result.shown&&!preview){this.lastFullscreenAt=this.now();try{localStorage.setItem('dewhaven.ads.last-fullscreen',String(this.lastFullscreenAt));}catch{/* Native cooldown remains active. */}}
      if(!rewarded&&result.shown&&!preview){this.lastInterstitialAt=this.now();try{localStorage.setItem('dewhaven.ads.last-interstitial',String(this.lastInterstitialAt));}catch{/* Native cooldown remains active. */}}
      // Only the SDK's reward callback can supply an earned receipt.
      return {shown:result.shown,earned:rewarded&&result.shown&&result.earned&&!!result.receipt,receipt:result.receipt};
    }catch {return unavailable();}
    finally {this.presenting=false;this.resumeUntil=this.now()+1500;void this.refresh();}
  }
  async privacy() {
    if(!this.supported||this.presenting||!this.state.privacyRequired)return false;
    this.presenting=true;
    try{return (await this.port.privacyOptions()).shown;}catch{return false;}
    finally{this.presenting=false;this.resumeUntil=this.now()+1500;void this.refresh();}
  }
  get justResumed() {return this.now()<this.resumeUntil;}
}
