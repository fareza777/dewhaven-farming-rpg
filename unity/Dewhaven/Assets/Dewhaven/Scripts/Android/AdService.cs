using System;
using System.Collections;
using GoogleMobileAds.Api;
using GoogleMobileAds.Common;
using GoogleMobileAds.Ump.Api;
using UnityEngine;
namespace Dewhaven
{
    public sealed class AdService : MonoBehaviour
    {
        // Google demo units only. This build never requests a production ad unit.
        private const string BannerId="ca-app-pub-6279186647593327/4263550692";
        private const string InterstitialId="ca-app-pub-6279186647593327/1789430590";
        private const string RewardId="ca-app-pub-6279186647593327/9979831675";
        private DewhavenGame game;
        private AndroidJavaClass billing;
        private float nextBillingCheck;
        private BannerView banner;
        private InterstitialAd interstitial;
        private RewardedAd rewarded;
        private bool initialized,initializing,bannerLoaded,bannerWanted,loadingInterstitial,loadingReward;
        private IDisposable pause;
        private int width,height,failures;
        private float nextRetry,sessionStart;
        private readonly AdPolicy policy=new AdPolicy();
        public bool Removed=>PlayerPrefs.GetInt("dewhaven.remove-ads",0)==1;
        public bool RewardReady=>!Removed&&initialized&&rewarded!=null&&rewarded.CanShowAd()&&!policy.Busy;
        public bool FullscreenActive=>policy.Busy;
        public float ReservationPixels=>!Removed&&bannerWanted&&bannerLoaded&&banner!=null?banner.GetHeightInPixels()+8*Scale():0;
        private long Now=>DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        private static void Main(Action action)=>MobileAdsEventExecutor.ExecuteInUpdate(action);
        public void Setup(DewhavenGame game)
        {
            this.game=game;
#if UNITY_ANDROID && !UNITY_EDITOR
            InitializeBilling();
#endif
            if(Removed)return;sessionStart=Time.realtimeSinceStartup;
            long.TryParse(PlayerPrefs.GetString("dewhaven.ads.last-fullscreen","0"),out policy.LastFullscreenAt);
            long.TryParse(PlayerPrefs.GetString("dewhaven.ads.last-interstitial","0"),out policy.LastInterstitialAt);
#if UNITY_ANDROID && !UNITY_EDITOR
            StartCoroutine(Boot());
#endif
        }
        private IEnumerator Boot(){yield return new WaitForSecondsRealtime(2);BeginConsent();}
        private void BeginConsent()
        {
            if(initialized||initializing||Application.internetReachability==NetworkReachability.NotReachable)return;
            initializing=true;
            ConsentInformation.Update(new ConsentRequestParameters(),error=>Main(()=>
            {
                if(error!=null)
                {
                    // Google's demo application has no publisher consent-message configuration.
                    // It uses only demo units and non-personalised requests. Live IDs need consent.
                    Initialize();return;
                }
                ConsentForm.LoadAndShowConsentFormIfRequired(formError=>Main(()=>{if(ConsentInformation.CanRequestAds())Initialize();else initializing=false;}));
            }));
        }
        private void Initialize()
        {
            MobileAds.SetApplicationMuted(true);MobileAds.SetApplicationVolume(0);
            MobileAds.Initialize(status=>Main(()=>
            {initializing=false;if(status==null){nextRetry=Time.realtimeSinceStartup+120;return;}initialized=true;LoadBanner();LoadInterstitial();LoadReward();}));
        }
        private static AdRequest Request(){var request=new AdRequest();request.Extras["npa"]="1";return request;}
        private float Scale()=>Mathf.Max(1,MobileAds.Utils.GetDeviceScale());
        private float NavigationBottom()
        {
            float inset=Screen.safeArea.yMin;
#if UNITY_ANDROID && !UNITY_EDITOR
            try
            {
                using(var player=new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                using(var activity=player.GetStatic<AndroidJavaObject>("currentActivity"))
                using(var window=activity.Call<AndroidJavaObject>("getWindow"))
                using(var decor=window.Call<AndroidJavaObject>("getDecorView"))
                using(var insets=decor.Call<AndroidJavaObject>("getRootWindowInsets"))if(insets!=null)inset=Mathf.Max(inset,insets.Call<int>("getStableInsetBottom"));
            }catch(AndroidJavaException){}
#endif
            return inset;
        }
        private void PlaceBanner()
        {
            if(banner==null)return;float scale=Scale(),h=banner.GetHeightInPixels();
            int x=Mathf.Max(0,Mathf.RoundToInt((Screen.width-banner.GetWidthInPixels())*.5f/scale));
            int y=Mathf.Max(0,Mathf.RoundToInt((Screen.height-NavigationBottom()-h)/scale-8));banner.SetPosition(x,y);width=Screen.width;height=Screen.height;
        }
        private void LoadBanner()
        {
            banner?.Destroy();bannerLoaded=false;
            int dp=Mathf.Max(280,(int)(Screen.safeArea.width/Scale()));
            banner=new BannerView(BannerId,AdSize.GetCurrentOrientationAnchoredAdaptiveBannerAdSizeWithWidth(dp),AdPosition.Bottom);
            banner.Hide();banner.OnBannerAdLoaded+=()=>Main(()=>{bannerLoaded=true;PlaceBanner();if(bannerWanted)banner.Show();else banner.Hide();game.UI.RefreshAdLayout();});
            banner.OnBannerAdLoadFailed+=error=>Main(()=>{bannerLoaded=false;nextRetry=Time.realtimeSinceStartup+120;failures++;game.UI.RefreshAdLayout();});banner.LoadAd(Request());
        }
        public void SetBanner(bool show)
        {bannerWanted=show;if(banner==null)return;if(show&&bannerLoaded&&!policy.Busy){PlaceBanner();banner.Show();}else banner.Hide();}
        private void LoadInterstitial()
        {
            if(Removed||loadingInterstitial||!initialized)return;loadingInterstitial=true;interstitial?.Destroy();interstitial=null;
            InterstitialAd.Load(InterstitialId,Request(),(ad,error)=>Main(()=>
            {loadingInterstitial=false;if(error!=null||ad==null){nextRetry=Time.realtimeSinceStartup+120;return;}interstitial=ad;
                ad.OnAdFullScreenContentOpened+=()=>Main(()=>Opened(false));ad.OnAdFullScreenContentClosed+=()=>Main(()=>Finish(false));ad.OnAdFullScreenContentFailed+=e=>Main(()=>Finish(false));}));
        }
        private void LoadReward()
        {
            if(Removed||loadingReward||!initialized)return;loadingReward=true;rewarded?.Destroy();rewarded=null;
            RewardedAd.Load(RewardId,Request(),(ad,error)=>Main(()=>
            {loadingReward=false;if(error!=null||ad==null){nextRetry=Time.realtimeSinceStartup+120;return;}rewarded=ad;
                ad.OnAdFullScreenContentOpened+=()=>Main(()=>Opened(true));ad.OnAdFullScreenContentClosed+=()=>Main(()=>Finish(true));ad.OnAdFullScreenContentFailed+=e=>Main(()=>Finish(true));}));
        }
        private void Hold()
        {policy.Busy=true;pause=game.Clock?.Pause("Full-screen demo ad");game.Controls.Clear();game.Player.Release();game.Sound.Suspend(true);banner?.Hide();}
        private void Opened(bool reward)
        {
            policy.LastFullscreenAt=Now;
            if(!reward){policy.LastInterstitialAt=Now;if(game.State!=null){game.State.stats["ad-interstitial-day"]=game.State.totalDays;game.Save();}}
            Persist();
        }
        private void Finish(bool reward)
        {
            policy.Busy=false;pause?.Dispose();pause=null;game.Controls.Clear();game.Sound.Suspend(game.IsBackgrounded);SetBanner(bannerWanted);if(reward)LoadReward();else LoadInterstitial();
        }
        private void Persist(){PlayerPrefs.SetString("dewhaven.ads.last-fullscreen",policy.LastFullscreenAt.ToString());PlayerPrefs.SetString("dewhaven.ads.last-interstitial",policy.LastInterstitialAt.ToString());PlayerPrefs.Save();}
        public void RewardRest()
        {
            if(!policy.CanReward(game.State,Now,out var reason)){game.UI.Toast(reason);return;}
            if(!RewardReady){game.UI.Toast("No demo ad is ready. Ordinary rest is always available.");return;}
            var state=game.State;int slot=state.slot,day=state.totalDays;string receipt=Guid.NewGuid().ToString("N");Hold();
            rewarded.Show(reward=>Main(()=>
            {
                if(game.State!=state||state.slot!=slot||state.totalDays!=day)return;
                if(policy.Grant(state,receipt,Now,out var message,true)){game.Save();Persist();game.UI.Toast(message);}
            }));
        }
        public void AfterSleep()
        {
            if(!policy.CanInterstitial(game.State,Now,Time.realtimeSinceStartup-sessionStart)||interstitial==null||!interstitial.CanShowAd())return;
            Hold();interstitial.Show();
        }
        public void Privacy()
        {ConsentForm.ShowPrivacyOptionsForm(error=>Main(()=>{if(error!=null)game.UI.Toast("Google's demo application has no privacy options form.");}));}
        private void Update()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            if(Time.realtimeSinceStartup>=nextRetry&&!policy.Busy&&failures<3&&Application.internetReachability!=NetworkReachability.NotReachable)
            {nextRetry=Time.realtimeSinceStartup+120;if(!initialized)BeginConsent();else {if(!bannerLoaded)LoadBanner();if(interstitial==null)LoadInterstitial();if(rewarded==null)LoadReward();}}
            if(bannerWanted&&bannerLoaded&&(width!=Screen.width||height!=Screen.height)){PlaceBanner();game.UI.RefreshAdLayout();}
            if(billing!=null&&Time.realtimeSinceStartup>=nextBillingCheck)
            {
                nextBillingCheck=Time.realtimeSinceStartup+2;
                try
                {
                    using(var player=new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                    using(var activity=player.GetStatic<AndroidJavaObject>("currentActivity"))
                    {
                        if(!Removed&&billing.CallStatic<bool>("owned",activity))
                        {SetRemoved(true);game.UI.Toast("Ads removed. Thank you for your support!");}
                    }
                }
                catch(AndroidJavaException){}
            }
#endif
        }
        public void SetRemoved(bool removed)
        {
            if(removed)PlayerPrefs.SetInt("dewhaven.remove-ads",1);else PlayerPrefs.DeleteKey("dewhaven.remove-ads");PlayerPrefs.Save();
            if(!removed)return;bannerWanted=false;bannerLoaded=false;
            banner?.Destroy();banner=null;interstitial?.Destroy();interstitial=null;rewarded?.Destroy();rewarded=null;
            game?.UI?.RefreshAdLayout();
        }
        public string RemoveAdsLabel=>Removed?"Ads removed · thank you":"Remove ads · $4.99";
        public void BuyRemoveAds()
        {
            if(Removed){game.UI.Toast("Ads are already removed.");return;}
#if UNITY_ANDROID && !UNITY_EDITOR
            if(billing==null){InitializeBilling();game.UI.Toast("The store is starting. Try again in a moment.");return;}
            try
            {
                using(var player=new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                using(var activity=player.GetStatic<AndroidJavaObject>("currentActivity"))
                {
                    string error=billing.CallStatic<string>("buy",activity);
                    if(!string.IsNullOrEmpty(error))game.UI.Toast("Purchase unavailable: "+error);
                }
            }
            catch(AndroidJavaException e){Debug.LogWarning("Billing: "+e.Message);game.UI.Toast("The store is unavailable right now.");}
#else
            game.UI.Toast("Purchases are available in the Play build.");
#endif
        }
        private void InitializeBilling()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            if(billing!=null)return;
            try
            {
                using(var player=new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                using(var activity=player.GetStatic<AndroidJavaObject>("currentActivity"))
                {
                    billing=new AndroidJavaClass("com.fajar.dewhaven.BillingBridge");
                    billing.CallStatic("init",activity);
                    nextBillingCheck=Time.realtimeSinceStartup+2;
                }
            }
            catch(AndroidJavaException e){Debug.LogWarning("Billing: "+e.Message);}
#endif
        }
        private void OnDestroy()
        {
            banner?.Destroy();interstitial?.Destroy();rewarded?.Destroy();pause?.Dispose();
#if UNITY_ANDROID && !UNITY_EDITOR
            try{billing?.CallStatic("destroy");}catch(AndroidJavaException){}
            billing=null;
#endif
        }
    }
}
