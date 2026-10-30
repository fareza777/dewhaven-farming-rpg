package com.fajar.dewhaven;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.ads.mediation.admob.AdMobAdapter;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;
import java.util.UUID;

/** Native-only Google demo ads. No ad-unit IDs are accepted from JavaScript. */
@CapacitorPlugin(name = "DewhavenAds")
public class DewhavenAdsPlugin extends Plugin {
    private static final boolean TEST_MODE = true;
    private static final String BANNER = "ca-app-pub-3940256099942544/9214589741";
    private static final String INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";
    private static final String REWARDED = "ca-app-pub-3940256099942544/5224354917";
    private static final long EXPIRY = 55 * 60 * 1000L;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean starting, sdkInitializing, ready, destroyed, bannerWanted, bannerLoaded, bannerLoading, interLoading, rewardLoading, bannerVisible;
    private FrameLayout bannerContainer;
    private AdView banner;
    private InterstitialAd interstitial;
    private RewardedAd rewarded;
    private ConsentInformation consent;
    private long interLoadedAt, rewardLoadedAt, bannerAttempt = -60000;
    private int bannerHeight, originalBottomMargin;
    private PluginCall fullScreenCall;
    private boolean earned, shown, preview;
    private String receipt, lastError = "";

    private void ui(Runnable action) { if (!destroyed) getActivity().runOnUiThread(() -> { if (!destroyed) action.run(); }); }
    private boolean privacyRequired() { return consent != null && consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED; }
    private JSObject snapshot() {
        JSObject data = new JSObject();
        data.put("testMode", TEST_MODE); data.put("initialized", ready);
        data.put("bannerReady", bannerLoaded); data.put("bannerHeight", bannerHeight);
        data.put("interstitialReady", interstitial != null && SystemClock.elapsedRealtime() - interLoadedAt < EXPIRY);
        data.put("rewardedReady", rewarded != null && SystemClock.elapsedRealtime() - rewardLoadedAt < EXPIRY);
        data.put("privacyRequired", privacyRequired()); data.put("error", lastError);
        return data;
    }
    private void changed() { if (!destroyed) notifyListeners("state", snapshot()); }
    private AdRequest request() {
        Bundle extras = new Bundle(); extras.putString("npa", "1");
        return new AdRequest.Builder().addNetworkExtrasBundle(AdMobAdapter.class, extras).build();
    }

    @PluginMethod public void initialize(PluginCall call) {
        ui(() -> {
            call.resolve(snapshot());
            if (starting || ready) return;
            starting = true;
            consent = UserMessagingPlatform.getConsentInformation(getContext());
            consent.requestConsentInfoUpdate(getActivity(), new ConsentRequestParameters.Builder().build(),
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(getActivity(), error -> finishConsent()),
                error -> { lastError = "consent-unavailable"; finishConsent(); });
        });
    }
    private void finishConsent() {
        if (destroyed || ready || sdkInitializing) return;
        // Google's sample publisher cannot host this game's production privacy message.
        // This fallback is restricted to hard-coded demo units. A live build must require canRequestAds().
        if (!TEST_MODE && !consent.canRequestAds()) { starting = false; changed(); return; }
        sdkInitializing = true;
        MobileAds.setRequestConfiguration(new RequestConfiguration.Builder().setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G).build());
        new Thread(() -> MobileAds.initialize(getContext(), status -> ui(() -> {
            MobileAds.setAppMuted(true); MobileAds.setAppVolume(0f);
            ready = true; starting = false; sdkInitializing = false; loadInterstitial(); loadRewarded(); if (bannerWanted) ensureBanner(); changed();
        })), "Dewhaven-ad-init").start();
    }
    @PluginMethod public void status(PluginCall call) { ui(() -> { call.resolve(snapshot()); if (ready) { loadInterstitial(); loadRewarded(); } }); }
    @PluginMethod public void privacyOptions(PluginCall call) {
        ui(() -> {
            if (!privacyRequired()) { JSObject out = new JSObject(); out.put("shown", false); call.resolve(out); return; }
            UserMessagingPlatform.showPrivacyOptionsForm(getActivity(), error -> { changed(); JSObject out = new JSObject(); out.put("shown", error == null); call.resolve(out); });
        });
    }

    @PluginMethod public void setBanner(PluginCall call) {
        ui(() -> { bannerWanted = call.getBoolean("visible", false); if (bannerWanted && ready) ensureBanner(); layoutBanner(); call.resolve(snapshot()); });
    }
    private int safeBottom() {
        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(getActivity().getWindow().getDecorView());
        if (insets == null) return 0;
        // Reserve the navigation area even while immersive mode hides it.
        // Three-button navigation is taller than the gesture area on many devices.
        int navigation = insets.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.navigationBars()).bottom;
        int gestures = insets.getInsets(WindowInsetsCompat.Type.systemGestures()).bottom;
        int cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout()).bottom;
        int gap = Math.round(8 * getContext().getResources().getDisplayMetrics().density);
        return Math.max(Math.max(navigation, gestures), cutout) + gap;
    }
    private void ensureBanner() {
        if (!ready || destroyed) return;
        if (banner == null) {
            FrameLayout root = getActivity().findViewById(android.R.id.content);
            bannerContainer = new FrameLayout(getContext()); bannerContainer.setBackgroundColor(Color.rgb(243, 238, 229));
            bannerContainer.setVisibility(View.GONE);
            FrameLayout.LayoutParams containerParams = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM);
            root.addView(bannerContainer, containerParams);
            ViewGroup.LayoutParams webParams = getBridge().getWebView().getLayoutParams();
            if (webParams instanceof ViewGroup.MarginLayoutParams) originalBottomMargin = ((ViewGroup.MarginLayoutParams) webParams).bottomMargin;
            banner = new AdView(getContext()); banner.setAdUnitId(BANNER);
            float density = getContext().getResources().getDisplayMetrics().density;
            int width = Math.max(1, Math.round(getBridge().getWebView().getWidth() / density));
            banner.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(getContext(), width));
            bannerContainer.addView(banner, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP | Gravity.CENTER_HORIZONTAL));
            banner.setAdListener(new AdListener() {
                @Override public void onAdLoaded() { if (destroyed) return; bannerLoading = false; bannerLoaded = true; lastError = ""; layoutBanner(); changed(); }
                @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { if (destroyed) return; bannerLoading = false; bannerLoaded = false; lastError = "ad-unavailable"; layoutBanner(); changed(); handler.postDelayed(() -> { if (bannerWanted) ensureBanner(); }, 60000); }
            });
        }
        if (!bannerLoaded && !bannerLoading && SystemClock.elapsedRealtime() - bannerAttempt >= 30000) {
            bannerAttempt = SystemClock.elapsedRealtime(); bannerLoading = true; banner.loadAd(request());
        }
        layoutBanner();
    }
    private void layoutBanner() {
        if (destroyed) return;
        boolean visible = bannerWanted && bannerLoaded && fullScreenCall == null && !destroyed;
        if (visible != bannerVisible) {
            bannerVisible = visible;
            WindowCompat.getInsetsController(getActivity().getWindow(), getActivity().getWindow().getDecorView()).setAppearanceLightNavigationBars(visible);
        }
        int pixels = visible ? banner.getAdSize().getHeightInPixels(getContext()) + safeBottom() : 0;
        if (bannerContainer != null) {
            bannerContainer.setPadding(0, 0, 0, visible ? safeBottom() : 0);
            bannerContainer.setVisibility(visible ? View.VISIBLE : View.GONE);
            if (visible) banner.resume(); else banner.pause();
        }
        View web = getBridge().getWebView(); ViewGroup.LayoutParams params = web.getLayoutParams();
        if (params instanceof ViewGroup.MarginLayoutParams) {
            ViewGroup.MarginLayoutParams margins = (ViewGroup.MarginLayoutParams) params;
            if (margins.bottomMargin != originalBottomMargin + pixels) { margins.bottomMargin = originalBottomMargin + pixels; web.setLayoutParams(margins); }
        }
        int dp = Math.round(pixels / getContext().getResources().getDisplayMetrics().density);
        if (dp != bannerHeight) { bannerHeight = dp; changed(); }
    }
    private void loadInterstitial() {
        if (!ready || destroyed || interLoading || interstitial != null && SystemClock.elapsedRealtime() - interLoadedAt < EXPIRY) return;
        interstitial = null; interLoading = true;
        InterstitialAd.load(getContext(), INTERSTITIAL, request(), new InterstitialAdLoadCallback() {
            @Override public void onAdLoaded(@NonNull InterstitialAd ad) { if (destroyed) return; interstitial = ad; interLoadedAt = SystemClock.elapsedRealtime(); interLoading = false; changed(); }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { if (destroyed) return; interLoading = false; lastError = "ad-unavailable"; changed(); handler.postDelayed(() -> loadInterstitial(), 60000); }
        });
    }
    private void loadRewarded() {
        if (!ready || destroyed || rewardLoading || rewarded != null && SystemClock.elapsedRealtime() - rewardLoadedAt < EXPIRY) return;
        rewarded = null; rewardLoading = true;
        RewardedAd.load(getContext(), REWARDED, request(), new RewardedAdLoadCallback() {
            @Override public void onAdLoaded(@NonNull RewardedAd ad) { if (destroyed) return; rewarded = ad; rewardLoadedAt = SystemClock.elapsedRealtime(); rewardLoading = false; changed(); }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { if (destroyed) return; rewardLoading = false; lastError = "ad-unavailable"; changed(); handler.postDelayed(() -> loadRewarded(), 60000); }
        });
    }
    private JSObject unavailable() { JSObject out = new JSObject(); out.put("shown", false); out.put("earned", false); return out; }
    private FullScreenContentCallback fullScreenCallback(boolean reward) {
        return new FullScreenContentCallback() {
            @Override public void onAdShowedFullScreenContent() { shown = true; }
            @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error) { lastError = "ad-unavailable"; finishFullScreen(reward); }
            @Override public void onAdDismissedFullScreenContent() { finishFullScreen(reward); }
        };
    }
    private void finishFullScreen(boolean reward) {
        if (fullScreenCall == null) return;
        PluginCall call = fullScreenCall; fullScreenCall = null;
        JSObject out = new JSObject(); out.put("shown", shown); out.put("earned", reward && earned);
        if (reward && earned) out.put("receipt", receipt);
        if (shown && !preview) getContext().getSharedPreferences("dewhaven-ads", 0).edit().putLong(reward ? "reward" : "interstitial", System.currentTimeMillis()).putLong("fullscreen", System.currentTimeMillis()).apply();
        layoutBanner(); changed(); call.resolve(out);
        if (reward) loadRewarded(); else loadInterstitial();
    }
    private boolean allowed(PluginCall call, boolean reward) {
        if (!ready || destroyed || fullScreenCall != null) { call.resolve(unavailable()); return false; }
        boolean sample = TEST_MODE && call.getBoolean("preview", false);
        long last = Math.max(getContext().getSharedPreferences("dewhaven-ads", 0).getLong(reward ? "reward" : "interstitial", 0), getContext().getSharedPreferences("dewhaven-ads", 0).getLong("fullscreen", 0));
        if (!sample && System.currentTimeMillis() - last < (reward ? 90000 : 180000)) { call.resolve(unavailable()); return false; }
        preview = sample; fullScreenCall = call; shown = false; earned = false; receipt = UUID.randomUUID().toString(); layoutBanner(); return true;
    }
    @PluginMethod public void showInterstitial(PluginCall call) {
        ui(() -> {
            if (interstitial == null || SystemClock.elapsedRealtime() - interLoadedAt >= EXPIRY) { call.resolve(unavailable()); loadInterstitial(); return; }
            if (!allowed(call, false)) return;
            InterstitialAd ad = interstitial; interstitial = null; changed(); ad.setImmersiveMode(true); ad.setFullScreenContentCallback(fullScreenCallback(false)); ad.show(getActivity());
        });
    }
    @PluginMethod public void showRewarded(PluginCall call) {
        ui(() -> {
            if (rewarded == null || SystemClock.elapsedRealtime() - rewardLoadedAt >= EXPIRY) { call.resolve(unavailable()); loadRewarded(); return; }
            if (!allowed(call, true)) return;
            RewardedAd ad = rewarded; rewarded = null; changed(); ad.setImmersiveMode(true); ad.setFullScreenContentCallback(fullScreenCallback(true));
            ad.show(getActivity(), reward -> { if (fullScreenCall != null) earned = true; });
        });
    }
    @Override protected void handleOnPause() { if (banner != null) banner.pause(); }
    @Override protected void handleOnResume() { if (banner != null) layoutBanner(); }
    @Override protected void handleOnDestroy() {
        destroyed = true; handler.removeCallbacksAndMessages(null);
        if (banner != null) { banner.destroy(); banner = null; }
        if (bannerContainer != null && bannerContainer.getParent() instanceof ViewGroup) ((ViewGroup) bannerContainer.getParent()).removeView(bannerContainer);
        if (fullScreenCall != null) { fullScreenCall.resolve(unavailable()); fullScreenCall = null; }
        interstitial = null; rewarded = null;
    }
}
