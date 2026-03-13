package com.wasim.attendancemanager.navigation

import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.*
import com.wasim.attendancemanager.data.local.AppPreferences
import com.wasim.attendancemanager.data.local.TokenManager
import com.wasim.attendancemanager.ui.login.AdminSiteSelectionScreen
import com.wasim.attendancemanager.ui.login.LoginScreen
import com.wasim.attendancemanager.ui.main.MainShell
import com.wasim.attendancemanager.ui.workers.WorkersScreen
import com.wasim.attendancemanager.ui.camera.CameraScreen
import com.wasim.attendancemanager.ui.splash.SplashScreen
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

private fun decodeArg(arg: String?): String =
    URLDecoder.decode(arg ?: "", StandardCharsets.UTF_8.toString())

@Composable
fun AppNavGraph(
    isDarkTheme: Boolean,
    onThemeToggle: (Boolean) -> Unit
) {
    val context       = LocalContext.current
    val navController = rememberNavController()

    val tokenManager = TokenManager(context)
    if (tokenManager.getToken() != null && tokenManager.isTokenExpired()) {
        tokenManager.clearAll()
    }

    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") {
            SplashScreen(
                onFinished = {
                    val destination = if (tokenManager.isLoggedIn()) "dashboard" else "login"
                    navController.navigate(destination) {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            )
        }

        composable("login") {
            LoginScreen(navController)
        }

        composable("admin_site_selection") {
            AdminSiteSelectionScreen(navController)
        }

        composable("dashboard") {
            MainShell(
                navController  = navController,
                isDarkTheme    = isDarkTheme,
                onThemeToggle  = onThemeToggle
            )
        }

        composable("face_enroll") { WorkersScreen(navController, mode = "enroll") }
        composable("checkin")     { WorkersScreen(navController, mode = "checkin") }
        composable("checkout")    { WorkersScreen(navController, mode = "checkout") }

        composable("camera_enroll/{workerId}/{workerName}") { back ->
            val workerId   = back.arguments?.getString("workerId")!!
            val workerName = decodeArg(back.arguments?.getString("workerName"))
            CameraScreen(navController, workerId, workerName, mode = "enroll")
        }
        composable("camera_checkin/{workerId}/{workerName}") { back ->
            val workerId   = back.arguments?.getString("workerId")!!
            val workerName = decodeArg(back.arguments?.getString("workerName"))
            CameraScreen(navController, workerId, workerName, mode = "checkin")
        }
        composable("camera_checkout/{workerId}/{workerName}") { back ->
            val workerId   = back.arguments?.getString("workerId")!!
            val workerName = decodeArg(back.arguments?.getString("workerName"))
            CameraScreen(navController, workerId, workerName, mode = "checkout")
        }
    }
}
