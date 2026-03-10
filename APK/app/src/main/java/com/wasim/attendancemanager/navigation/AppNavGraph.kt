package com.wasim.attendancemanager.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.*
import com.wasim.attendancemanager.ui.login.LoginScreen
import com.wasim.attendancemanager.ui.dashboard.DashboardScreen
import com.wasim.attendancemanager.ui.workers.WorkersScreen
import com.wasim.attendancemanager.ui.camera.CameraScreen
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

// 🔹 Helper function (outside composable)
private fun decodeArg(arg: String?): String {
    return URLDecoder.decode(
        arg ?: "",
        StandardCharsets.UTF_8.toString()
    )
}

@Composable
fun AppNavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "login"
    ) {
        composable("login") {
            LoginScreen(navController)
        }

        composable("dashboard") {
            DashboardScreen(navController)
        }

        composable("face_enroll") {
            WorkersScreen(navController, mode = "enroll")
        }

        composable("checkin") {
            WorkersScreen(navController, mode = "checkin")
        }

        composable("checkout") {
            WorkersScreen(navController, mode = "checkout")
        }

        composable("camera_enroll/{workerId}/{workerName}") { backStackEntry ->

            val workerId = backStackEntry.arguments?.getString("workerId")!!
            val workerName = decodeArg(backStackEntry.arguments?.getString("workerName"))
            CameraScreen(navController, workerId, workerName, mode = "enroll")
        }

        composable("camera_checkin/{workerId}/{workerName}") { backStackEntry ->

            val workerId = backStackEntry.arguments?.getString("workerId")!!
            val workerName = decodeArg(backStackEntry.arguments?.getString("workerName"))
            CameraScreen(navController, workerId, workerName, mode = "checkin")
        }

        composable("camera_checkout/{workerId}/{workerName}") { backStackEntry ->

            val workerId = backStackEntry.arguments?.getString("workerId")!!
            val workerName = decodeArg(backStackEntry.arguments?.getString("workerName"))
            CameraScreen(navController, workerId, workerName, mode = "checkout")
        }

    }
}
