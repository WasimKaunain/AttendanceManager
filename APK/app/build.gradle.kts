plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.wasim.attendancemanager"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.wasim.attendancemanager"
        minSdk = 23   // ⬅️ Recommended (better stability for location + security)
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // 🔑 Signing Config (PLACEHOLDERS — replace later)
    signingConfigs {
        release {
            storeFile file("your-keystore.jks")
            storePassword "your_store_password"
            keyAlias "your_key_alias"
            keyPassword "your_key_password"
        }
    }

    buildTypes {
        release {
            debuggable false
            isMinifyEnabled = true
            isShrinkResources = true

            // 🔐 Attach signing config
            signingConfig signingConfigs.release

            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }

        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        compose = true
        buildConfig = true   // ⬅️ REQUIRED for BuildConfig.BASE_URL
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "META-INF/INDEX.LIST"
            excludes += "META-INF/io.netty.versions.properties"
        }
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)

    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // 🌐 Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // ⚠️ Logging ONLY in debug (important for security)
    debugImplementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // 📍 Location (Geofencing)
    implementation("com.google.android.gms:play-services-location:21.0.1")

    // 📷 CameraX
    implementation("androidx.camera:camera-core:1.3.4")
    implementation("androidx.camera:camera-camera2:1.3.4")
    implementation("androidx.camera:camera-lifecycle:1.3.4")
    implementation("androidx.camera:camera-view:1.3.4")

    // 🎨 Icons
    implementation("androidx.compose.material:material-icons-core")
    implementation("androidx.compose.material:material-icons-extended")

    // 🤖 ML + Face Detection
    implementation("org.tensorflow:tensorflow-lite:2.14.0")
    implementation("com.google.mlkit:face-detection:16.1.5")

    // 🔄 Coroutines Play Services
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.3")

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)

    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)

    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}