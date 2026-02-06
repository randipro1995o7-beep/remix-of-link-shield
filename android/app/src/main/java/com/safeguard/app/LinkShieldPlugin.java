package com.safeguard.app;

import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LinkShield")
public class LinkShieldPlugin extends Plugin {

    @PluginMethod
    public void setProtectionEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("Must provide 'enabled' boolean");
            return;
        }

        PackageManager pm = getContext().getPackageManager();
        ComponentName componentName = new ComponentName(getContext(), getContext().getPackageName() + ".LinkHandlerActivity");

        int newState = enabled 
            ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED 
            : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;

        try {
            pm.setComponentEnabledSetting(
                componentName,
                newState,
                PackageManager.DONT_KILL_APP
            );
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to toggle component: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isLinkHandlerEnabled(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            String ourPackage = getContext().getPackageName();
            
            // Create intent to check which app handles http links
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("http://example.com"));
            
            // Get the default activity for this intent
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Android 13+ 
                android.content.pm.ResolveInfo resolveInfo = pm.resolveActivity(browserIntent, 
                    PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY));
                if (resolveInfo != null && resolveInfo.activityInfo != null) {
                    String defaultPackage = resolveInfo.activityInfo.packageName;
                    boolean isDefault = ourPackage.equals(defaultPackage);
                    
                    JSObject result = new JSObject();
                    result.put("enabled", isDefault);
                    result.put("defaultHandler", defaultPackage);
                    call.resolve(result);
                    return;
                }
            } else {
                // Pre-Android 13
                android.content.pm.ResolveInfo resolveInfo = pm.resolveActivity(browserIntent, 
                    PackageManager.MATCH_DEFAULT_ONLY);
                if (resolveInfo != null && resolveInfo.activityInfo != null) {
                    String defaultPackage = resolveInfo.activityInfo.packageName;
                    boolean isDefault = ourPackage.equals(defaultPackage);
                    
                    JSObject result = new JSObject();
                    result.put("enabled", isDefault);
                    result.put("defaultHandler", defaultPackage);
                    call.resolve(result);
                    return;
                }
            }
            
            // No default set (user will be prompted to choose)
            JSObject result = new JSObject();
            result.put("enabled", false);
            result.put("defaultHandler", "none");
            call.resolve(result);
            
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("enabled", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void openAppLinkSettings(PluginCall call) {
        try {
            // Try to open the default browser picker directly (image 2)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // Android 7+ - Try to open default apps settings with browser category
                Intent browserIntent = new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                
                // Check if intent can be resolved before starting
                if (browserIntent.resolveActivity(getContext().getPackageManager()) != null) {
                    getContext().startActivity(browserIntent);
                    call.resolve();
                    return;
                }
            }
            
            // Fallback: Open app details settings (image 3)
            Intent fallbackIntent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:" + getContext().getPackageName()));
            fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallbackIntent);
            call.resolve();
        } catch (Exception e) {
            // Final fallback - try opening app info page
            try {
                Intent appInfoIntent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + getContext().getPackageName()));
                appInfoIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(appInfoIntent);
                call.resolve();
            } catch (Exception ex) {
                call.reject("Failed to open settings: " + ex.getMessage());
            }
        }
    }
}

