package com.fajar.dewhaven;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import java.util.Collections;
import java.util.List;

/** Google Play Billing 8 bridge for the optional remove-ads purchase. */
public final class BillingBridge {
    private static final String PRODUCT = "remove_ads";
    private static final String PREFS = "dewhaven_billing";
    private static BillingClient client;
    private static ProductDetails details;
    private static boolean connecting;
    private static String lastError = "";

    public static void init(final Activity activity) {
        activity.runOnUiThread(() -> {
            if (client == null) {
                client = BillingClient.newBuilder(activity)
                    .setListener((BillingResult result, List<Purchase> purchases) -> handlePurchases(activity, result, purchases))
                    .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                    .build();
            }
            connect(activity);
        });
    }

    private static void connect(final Activity activity) {
        if (client == null || connecting) return;
        connecting = true;
        client.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                connecting = false;
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    queryDetails(activity);
                    refresh(activity);
                } else {
                    lastError = result.getDebugMessage();
                }
            }
            @Override public void onBillingServiceDisconnected() { connecting = false; }
        });
    }

    private static void queryDetails(final Activity activity) {
        if (client == null) return;
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Collections.singletonList(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(PRODUCT)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()))
            .build();
        client.queryProductDetailsAsync(params, (result, queryResult) -> {
            List<ProductDetails> list = queryResult == null ? null : queryResult.getProductDetailsList();
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && list != null && !list.isEmpty()) {
                details = list.get(0);
            } else {
                lastError = result.getDebugMessage();
            }
        });
    }

    public static String buy(final Activity activity) {
        if (activity == null) return "The store is unavailable.";
        if (client == null) { init(activity); return "The store is starting. Try again in a moment."; }
        if (details == null) { queryDetails(activity); return "The store is loading. Try again in a moment."; }
        BillingFlowParams params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details).build()))
            .build();
        BillingResult result = client.launchBillingFlow(activity, params);
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            lastError = result.getDebugMessage();
            return lastError == null || lastError.isEmpty() ? "The purchase could not start." : lastError;
        }
        return "";
    }

    public static void refresh(final Activity activity) {
        if (client == null) return;
        client.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
            (result, purchases) -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    boolean owned = false;
                    if (purchases != null) {
                        for (Purchase purchase : purchases) {
                            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED
                                && purchase.getProducts().contains(PRODUCT)) {
                                owned = true;
                                if (!purchase.isAcknowledged()) acknowledge(purchase.getPurchaseToken());
                            }
                        }
                    }
                    setOwned(activity, owned);
                } else {
                    lastError = result.getDebugMessage();
                }
            });
    }

    private static void handlePurchases(Activity activity, BillingResult result, List<Purchase> purchases) {
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED
                    && purchase.getProducts().contains(PRODUCT)) {
                    if (!purchase.isAcknowledged()) acknowledge(purchase.getPurchaseToken());
                    setOwned(activity, true);
                }
            }
        } else if (result.getResponseCode() != BillingClient.BillingResponseCode.USER_CANCELED) {
            lastError = result.getDebugMessage();
        }
    }

    private static void acknowledge(String token) {
        if (client == null) return;
        client.acknowledgePurchase(
            AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build(),
            result -> { if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) lastError = result.getDebugMessage(); });
    }

    private static void setOwned(Context context, boolean owned) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(PRODUCT, owned).apply();
    }

    public static boolean owned(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(PRODUCT, false);
    }

    public static String lastError() {
        return lastError == null ? "" : lastError;
    }

    public static void destroy() {
        if (client != null) {
            client.endConnection();
            client = null;
            details = null;
        }
    }
}
