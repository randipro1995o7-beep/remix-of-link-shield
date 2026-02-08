# ProGuard Rules for Link Shield
# Obfuscation and shrinking for release builds

# ===================================
# CAPACITOR & CORDOVA
# ===================================
# Keep Capacitor bridge
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
}
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView
-keep class android.webkit.WebView { *; }
-keep class android.webkit.WebViewClient { *; }
-keep class android.webkit.WebChromeClient { *; }

# ===================================
# ANDROIDX & ANDROID
# ===================================
-keep class androidx.** { *; }
-dontwarn androidx.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep custom Parcelables
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep custom Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
}

# ===================================
# SECURITY - KEEP CRITICAL CLASSES
# ===================================
# Keep our custom plugins (if any)
-keep class com.safeguard.app.** { *; }

# Keep R8 optimized
-allowaccessmodification
-repackageclasses

# ===================================
# DEBUGGING & ERROR REPORTING
# ===================================
# Keep line numbers for stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep annotations for reflection
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions

# ===================================
# OPTIMIZATION
# ===================================
# Enable aggressive optimization
-optimizationpasses 5
-dontpreverify

# Allow method inlining
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*

# ===================================
# GSON (if used)
# ===================================
-keepattributes Signature
-keepattributes *Annotation*
-keep class sun.misc.Unsafe { *; }
-keep class com.google.gson.** { *; }

# ===================================
# OKHTTP & NETWORKING (if used)
# ===================================
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ===================================
# REMOVE LOGGING
# ===================================
# Remove all Log statements in production
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
    public static int e(...);
}

# Remove console.log equivalent (if any)
-assumenosideeffects class java.io.PrintStream {
    public void println(%);
    public void println(...);
}

# ===================================
# SECURITY HARDENING
# ===================================
# Obfuscate package names
-flattenpackagehierarchy

# Rename classes more aggressively
-overloadaggressively

# Remove unused code
-dontwarn javax.annotation.**
-dontwarn javax.inject.**
-dontwarn sun.misc.**

# Keep crash reporting
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep class com.crashlytics.** { *; }
-dontwarn com.crashlytics.**
