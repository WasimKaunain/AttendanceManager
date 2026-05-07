package com.attendcrew.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import com.attendcrew.app.data.local.AppPreferences
import com.attendcrew.app.data.local.TokenManager
import com.attendcrew.app.navigation.AppNavGraph
import com.attendcrew.app.ui.theme.AttendanceManagerTheme
import com.attendcrew.app.utils.ml.FaceEmbeddingManager

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        FaceEmbeddingManager.initialize(this)

        // Start background syncing (runs only when network is available)
        com.attendcrew.app.work.WorkScheduler.schedulePeriodicAttendanceSync(this)

        val appPrefs = AppPreferences(this)

        setContent {
            var isDarkTheme by remember { mutableStateOf(appPrefs.isDarkTheme) }

            // Best-effort refresh on startup (only if user is logged in AND site is selected)
            val ctx = LocalContext.current
            LaunchedEffect(Unit) {
                val tokenManager = TokenManager(ctx)
                val hasSiteSelected = tokenManager.isLoggedIn() && !tokenManager.getSiteId().isNullOrBlank()
                if (hasSiteSelected) {
                    runCatching { com.attendcrew.app.data.local.db.site.SiteSyncer.syncCurrentSite(ctx) }
                    runCatching { com.attendcrew.app.data.local.db.WorkerSyncer.syncWorkers(ctx, incremental = true) }
                }
            }

            AttendanceManagerTheme(darkTheme = isDarkTheme) {
                AppNavGraph(
                    isDarkTheme   = isDarkTheme,
                    onThemeToggle = { isDarkTheme = it }
                )
            }
        }
    }
}
