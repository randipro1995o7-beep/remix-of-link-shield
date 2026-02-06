package io.ionic.starter;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;
import com.safeguard.app.LinkShieldPlugin;

public class MainActivity extends BridgeActivity {
    private String pendingUrl = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(LinkShieldPlugin.class);
        super.onCreate(savedInstanceState);

        // Handle link from initial launch
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // Handle link when app is already running
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        
        String url = null;
        
        // Handle ACTION_VIEW (direct link click)
        Uri appLinkData = intent.getData();
        if (appLinkData != null) {
            url = appLinkData.toString();
        }
        
        // Handle ACTION_SEND (shared text containing link)
        if (url == null && Intent.ACTION_SEND.equals(intent.getAction())) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null) {
                // Extract URL from shared text using regex
                java.util.regex.Pattern urlPattern = java.util.regex.Pattern.compile(
                    "https?://[^\\s<>\"{}|\\\\^`\\[\\]]+",
                    java.util.regex.Pattern.CASE_INSENSITIVE
                );
                java.util.regex.Matcher matcher = urlPattern.matcher(sharedText);
                if (matcher.find()) {
                    url = matcher.group();
                }
            }
        }
        
        if (url != null) {
            // Escape single quotes to prevent JS injection issues
            String escapedUrl = url.replace("'", "\\'");
            
            // Check if bridge is ready
            if (getBridge() != null && getBridge().getWebView() != null) {
                forwardUrlToWebView(escapedUrl);
            } else {
                // Store for later when bridge is ready
                pendingUrl = escapedUrl;
            }
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        // Forward pending URL once bridge is ready
        if (pendingUrl != null && getBridge() != null && getBridge().getWebView() != null) {
            // Small delay to ensure WebView is fully loaded
            getBridge().getWebView().postDelayed(() -> {
                if (pendingUrl != null) {
                    forwardUrlToWebView(pendingUrl);
                    pendingUrl = null;
                }
            }, 500);
        }
    }

    private void forwardUrlToWebView(String url) {
        String js = "window.dispatchEvent(new CustomEvent('linkguardian:intercepted', { detail: { url: '" + url + "' } }));";
        getBridge().getWebView().post(() -> {
            getBridge().getWebView().evaluateJavascript(js, null);
        });
    }
}
