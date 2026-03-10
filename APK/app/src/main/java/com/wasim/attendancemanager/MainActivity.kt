package com.wasim.attendancemanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.wasim.attendancemanager.navigation.AppNavGraph
import com.wasim.attendancemanager.ui.theme.AttendanceManagerTheme
import com.wasim.attendancemanager.utils.ml.FaceEmbeddingManager

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

            FaceEmbeddingManager.initialize(this)
        setContent {
            AttendanceManagerTheme {
                AppNavGraph()
            }
        }
    }
}
