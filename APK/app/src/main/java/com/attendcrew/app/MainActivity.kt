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
import com.attendcrew.app.data.local.db.AttendanceOutboxRepository
import androidx.activity.enableEdgeToEdge
import com.attendcrew.app.work.WorkScheduler
import com.attendcrew.app.data.local.db.site.SiteSyncer
import com.attendcrew.app.data.local.db.dashboard.DashboardSyncer
import kotlinx.coroutines.launch
import android.util.Log


class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        FaceEmbeddingManager.initialize(this)

        val appPrefs = AppPreferences(this)

        setContent {
            var isDarkTheme by remember { mutableStateOf(appPrefs.isDarkTheme) }
            val ctx = LocalContext.current

            LaunchedEffect(Unit) {

                val tokenManager = TokenManager(ctx)

                val hasSiteSelected = tokenManager.isLoggedIn() && !tokenManager.getSiteId().isNullOrBlank()

                if (hasSiteSelected)
                {

                    WorkScheduler.schedulePeriodicAttendanceSync(ctx)

                    // Site sync in background
                    launch {runCatching {SiteSyncer.syncCurrentSite(ctx)}}

                    // Dashboard sync in background

                    launch {
                        Log.d("APP_STRTUP","Dashboard sync launching")
                        runCatching {DashboardSyncer.syncDashboard(ctx)}
                    }
                }

            }
            AttendanceManagerTheme(darkTheme = isDarkTheme)
            {
                AppNavGraph(isDarkTheme = isDarkTheme, onThemeToggle = { isDarkTheme = it })
            }
        }
    }
}
