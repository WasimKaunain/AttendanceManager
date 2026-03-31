# Add project specific ProGuard rules here.

# Keep line numbers for crash stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── TensorFlow Lite ───────────────────────────────────────────────────────────
-keep class org.tensorflow.** { *; }
-keep class org.tensorflow.lite.gpu.** { *; }
-dontwarn org.tensorflow.lite.**

# ── Gson / Retrofit data models ───────────────────────────────────────────────
# Keep all data classes used by Gson serialisation (Retrofit responses)
-keep class com.attendcrew.app.data.model.** { *; }
-keepclassmembers class com.attendcrew.app.data.model.** { *; }

# Gson internals
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer
-keep class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# ── Retrofit ──────────────────────────────────────────────────────────────────
-keepattributes RuntimeVisibleAnnotations
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}
-dontwarn retrofit2.**

# ── OkHttp ────────────────────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ── ML Kit face detection ─────────────────────────────────────────────────────
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**
-keep class com.google.android.gms.internal.mlkit_vision_face.** { *; }

# ── CameraX ───────────────────────────────────────────────────────────────────
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**

# ── Coroutines ────────────────────────────────────────────────────────────────
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.**

# ── Jetpack Compose ───────────────────────────────────────────────────────────
-dontwarn androidx.compose.**

# ── model class ─────────────────────────────────────────────────────────────
-keep class com.attendcrew.app.data.model.** { *; }

# ── Prevent warnings ───────────────────────────────────────────────────────────
-dontwarn org.tensorflow.**
-dontwarn okhttp3.**
-dontwarn retrofit2.**

# Keep constructors for Gson (VERY IMPORTANT)
-keepclassmembers class * {
    public <init>(...);
}

# Keep generic signatures (needed for Retrofit/Gson)
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep Retrofit response types
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}