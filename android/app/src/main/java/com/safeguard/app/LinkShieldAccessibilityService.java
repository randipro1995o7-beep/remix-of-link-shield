package com.safeguard.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Toast;
import android.util.Log;

import java.util.List;

public class LinkShieldAccessibilityService extends AccessibilityService {

    private static final String TAG = "LinkShieldAS";

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null)
            return;

        // We care about text changes or clicks which might indicate user is interacting
        // with a link/message
        int eventType = event.getEventType();
        if (eventType == AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED ||
                eventType == AccessibilityEvent.TYPE_VIEW_CLICKED) { // Or TYPE_WINDOW_CONTENT_CHANGED but that's noisy

            AccessibilityNodeInfo source = event.getSource();
            if (source != null) {
                // Check the text of the source node
                CharSequence text = source.getText();
                if (text != null && text.length() > 0) {
                    analyzeText(text.toString());
                } else {
                    // Sometimes text is in children
                    // recursiveCheck(source); // Simplified for now: only checking direct source or
                    // description
                    CharSequence desc = source.getContentDescription();
                    if (desc != null) {
                        analyzeText(desc.toString());
                    }
                }
                source.recycle();
            }
        }
    }

    private void analyzeText(String text) {
        if (ScamDetector.isSuspicious(text)) {
            Log.w(TAG, "Sensitive content detected in Accessibility Service: " + text);
            // Show a non-intrusive warning
            Toast.makeText(getApplicationContext(), "⚠️ Safety SHIELD: Suspected Scam text detected!",
                    Toast.LENGTH_LONG).show();
        }
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Service Connected");

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        // We want to see text content from all apps
        info.eventTypes = AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED | AccessibilityEvent.TYPE_VIEW_CLICKED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.notificationTimeout = 100;
        info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;

        setServiceInfo(info);
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Service Interrupted");
    }
}
