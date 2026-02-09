package com.safeguard.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private String pendingUrl = null;
    private FirebaseAuth mAuth;
    private GoogleSignInClient mGoogleSignInClient;

    private final ActivityResultLauncher<Intent> signInLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == RESULT_OK) {
                    Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                    try {
                        GoogleSignInAccount account = task.getResult(ApiException.class);
                        firebaseAuthWithGoogle(account.getIdToken());
                    } catch (ApiException e) {
                        Log.w(TAG, "Google sign in failed", e);
                        notifyWebviewOfSignIn("failed", e.getMessage());
                    }
                }
            });

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(LinkShieldPlugin.class);
        super.onCreate(savedInstanceState);

        mAuth = FirebaseAuth.getInstance();

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail()
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);

        handleIntent(getIntent());
    }

    public void startSignIn() {
        // First, sign out of the Google client to ensure the account picker is always shown.
        mGoogleSignInClient.signOut().addOnCompleteListener(this, task -> {
            Intent signInIntent = mGoogleSignInClient.getSignInIntent();
            signInLauncher.launch(signInIntent);
        });
    }

    private void firebaseAuthWithGoogle(String idToken) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(this, task -> {
                    if (task.isSuccessful()) {
                        FirebaseUser user = mAuth.getCurrentUser();
                        Log.d(TAG, "firebaseAuthWithGoogle:success");
                        notifyWebviewOfSignIn("success", null);
                    } else {
                        Log.w(TAG, "firebaseAuthWithGoogle:failure", task.getException());
                        notifyWebviewOfSignIn("failed", task.getException().getMessage());
                    }
                });
    }
    
    private void notifyWebviewOfSignIn(String status, String errorMessage) {
        JSObject result = new JSObject();
        result.put("status", status);
        if (errorMessage != null) {
            result.put("error", errorMessage);
        }
        getBridge().triggerJSEvent("googleSignInResult", "window", result.toString());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String url = null;
        Uri appLinkData = intent.getData();
        if (appLinkData != null) {
            url = appLinkData.toString();
        }
        if (url == null && Intent.ACTION_SEND.equals(intent.getAction())) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null) {
                java.util.regex.Pattern urlPattern = java.util.regex.Pattern.compile(
                        "https?://[^\\s<>\"{}|\\\\^`\\[\\]]+",
                        java.util.regex.Pattern.CASE_INSENSITIVE);
                java.util.regex.Matcher matcher = urlPattern.matcher(sharedText);
                if (matcher.find()) {
                    url = matcher.group();
                }
            }
        }
        if (url != null) {
            String escapedUrl = url.replace("'", "\\'");
            if (getBridge() != null && getBridge().getWebView() != null) {
                forwardUrlToWebView(escapedUrl);
            } else {
                pendingUrl = escapedUrl;
            }
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        FirebaseUser currentUser = mAuth.getCurrentUser();
        if (currentUser != null) {
            currentUser.reload();
        }
        if (pendingUrl != null && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().postDelayed(() -> {
                if (pendingUrl != null) {
                    forwardUrlToWebView(pendingUrl);
                    pendingUrl = null;
                }
            }, 500);
        }
    }

    private void forwardUrlToWebView(String url) {
        String js = "window.dispatchEvent(new CustomEvent('linkguardian:intercepted', { detail: { url: '" + url
                + "' } }));";
        getBridge().getWebView().post(() -> {
            getBridge().getWebView().evaluateJavascript(js, null);
        });
    }
}
