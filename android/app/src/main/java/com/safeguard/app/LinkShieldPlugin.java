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
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LinkShield", permissions = {
        @com.getcapacitor.annotation.Permission(alias = "sms", strings = {
                android.Manifest.permission.RECEIVE_SMS,
                android.Manifest.permission.READ_SMS
        }),
        @com.getcapacitor.annotation.Permission(alias = "notifications", strings = {
                "android.permission.POST_NOTIFICATIONS"
        })
})
public class LinkShieldPlugin extends Plugin {

    @PluginMethod
    public void signInWithGoogle(PluginCall call) {
        MainActivity mainActivity = (MainActivity) getActivity();
        mainActivity.startSignIn();
        call.resolve();
    }

    @PluginMethod
    public void setProtectionEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("Must provide 'enabled' boolean");
            return;
        }

        PackageManager pm = getContext().getPackageManager();
        ComponentName componentName = new ComponentName(getContext(),
                getContext().getPackageName() + ".LinkHandlerActivity");

        int newState = (enabled != null && enabled)
                ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;

        try {
            pm.setComponentEnabledSetting(
                    componentName,
                    newState,
                    PackageManager.DONT_KILL_APP);
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

            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("http://example.com"));

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                android.content.pm.ResolveInfo resolveInfo = pm.resolveActivity(browserIntent,
                        PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY));
                if (resolveInfo != null && resolveInfo.activityInfo != null) {
                    String defaultPackage = resolveInfo.activityInfo.packageName;
                    boolean isDefault = ourPackage.equals(defaultPackage);

                    // Log for debugging
                    System.out.println("LinkShield: Checking default handler. Found: " + defaultPackage
                            + ", Our package: " + ourPackage);

                    JSObject result = new JSObject();
                    result.put("enabled", isDefault);
                    result.put("defaultHandler", defaultPackage);
                    call.resolve(result);
                    return;
                }
            } else {
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
    public void openAppDetails(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open app details: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAppLinkSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                Intent browserIntent = new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                if (browserIntent.resolveActivity(getContext().getPackageManager()) != null) {
                    getContext().startActivity(browserIntent);
                    call.resolve();
                    return;
                }
            }

            Intent fallbackIntent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + getContext().getPackageName()));
            fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallbackIntent);
            call.resolve();
        } catch (Exception e) {
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

    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        if (getPermissionState("sms") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms") == com.getcapacitor.PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open accessibility settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } else {
                call.resolve();
            }
        } catch (Exception e) {
            call.reject("Failed to open overlay settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getPermissionState("notifications") != com.getcapacitor.PermissionState.GRANTED) {
                requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
            } else {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        if (getPermissionState("notifications") == com.getcapacitor.PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();

        // Check SMS Permissions
        boolean smsGranted = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean receive = getContext()
                    .checkSelfPermission(android.Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
            boolean read = getContext()
                    .checkSelfPermission(android.Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
            smsGranted = receive && read;
        } else {
            smsGranted = true;
        }
        ret.put("sms", smsGranted);

        // Check Accessibility Service
        boolean accessibilityEnabled = false;
        try {
            int accessibilityEnabledInt = Settings.Secure.getInt(
                    getContext().getApplicationContext().getContentResolver(),
                    Settings.Secure.ACCESSIBILITY_ENABLED);

            if (accessibilityEnabledInt == 1) {
                String settingValue = Settings.Secure.getString(
                        getContext().getApplicationContext().getContentResolver(),
                        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);

                if (settingValue != null) {
                    ComponentName expectedComponentName = new ComponentName(getContext(),
                            LinkShieldAccessibilityService.class);
                    accessibilityEnabled = settingValue.contains(expectedComponentName.flattenToString());
                }
            }
        } catch (Settings.SettingNotFoundException e) {
            // Default to false
        }
        ret.put("accessibility", accessibilityEnabled);

        // Check Overlay Permission
        boolean overlayGranted = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            overlayGranted = Settings.canDrawOverlays(getContext());
        } else {
            overlayGranted = true;
        }
        ret.put("overlay", overlayGranted);

        // Check Notification Permission
        boolean notificationsGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationsGranted = getContext().checkSelfPermission(
                    android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }
        ret.put("notifications", notificationsGranted);

        call.resolve(ret);
    }
}
