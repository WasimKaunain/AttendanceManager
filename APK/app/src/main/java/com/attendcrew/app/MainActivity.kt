package com.attendcrew.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import com.attendcrew.app.data.local.AppPreferences
import com.attendcrew.app.navigation.AppNavGraph
import com.attendcrew.app.ui.theme.AttendanceManagerTheme
import com.attendcrew.app.utils.ml.FaceEmbeddingManager

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        FaceEmbeddingManager.initialize(this)

        val appPrefs = AppPreferences(this)

        setContent {
            var isDarkTheme by remember { mutableStateOf(appPrefs.isDarkTheme) }

            AttendanceManagerTheme(darkTheme = isDarkTheme) {
                AppNavGraph(
                    isDarkTheme   = isDarkTheme,
                    onThemeToggle = { isDarkTheme = it }
                )
            }
        }
    }
}
