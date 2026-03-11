package com.wasim.attendancemanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import com.wasim.attendancemanager.data.local.AppPreferences
import com.wasim.attendancemanager.navigation.AppNavGraph
import com.wasim.attendancemanager.ui.theme.AttendanceManagerTheme
import com.wasim.attendancemanager.utils.ml.FaceEmbeddingManager

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
