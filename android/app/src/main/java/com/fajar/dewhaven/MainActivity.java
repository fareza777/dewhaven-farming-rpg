package com.fajar.dewhaven;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(DewhavenAdsPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View decor = getWindow().getDecorView();
        // Draw the world behind the camera cutout. Only controls receive safe-area offsets.
        // Capacitor's fallback for WebViews below 140 pads the whole surface instead.
        ViewCompat.setOnApplyWindowInsetsListener(decor, (view, insets) -> {
            Insets cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            Insets gestures = insets.getInsets(WindowInsetsCompat.Type.systemGestures());
            boolean keyboard = insets.isVisible(WindowInsetsCompat.Type.ime());
            view.setPadding(0, 0, 0, keyboard ? insets.getInsets(WindowInsetsCompat.Type.ime()).bottom : 0);
            float density = getResources().getDisplayMetrics().density;
            int top = Math.round(cutout.top / density);
            int right = Math.round(cutout.right / density);
            int bottom = keyboard ? 0 : Math.round(Math.max(cutout.bottom, gestures.bottom) / density);
            int left = Math.round(cutout.left / density);
            getBridge().getWebView().evaluateJavascript(
                "(() => { const root = document.documentElement; if (!root) return; " +
                "root.style.setProperty('--safe-area-inset-top','" + top + "px');" +
                "root.style.setProperty('--safe-area-inset-right','" + right + "px');" +
                "root.style.setProperty('--safe-area-inset-bottom','" + bottom + "px');" +
                "root.style.setProperty('--safe-area-inset-left','" + left + "px'); })();", null);
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout(), Insets.NONE)
                .build();
        });
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageCommitVisible(WebView view, String url) {
                ViewCompat.requestApplyInsets(decor);
            }
        });
        ViewCompat.requestApplyInsets(decor);
        hideBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    private void hideBars() {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }
}
