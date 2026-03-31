package com.attendcrew.app.navigation

import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.*
import com.attendcrew.app.data.local.AppPreferences
import com.attendcrew.app.data.local.TokenManager
import com.attendcrew.app.ui.login.AdminSiteSelectionScreen
import com.attendcrew.app.ui.login.LoginScreen
import com.attendcrew.app.ui.main.MainShell
import com.attendcrew.app.ui.workers.WorkersScreen
import com.attendcrew.app.ui.camera.CameraScreen
import com.attendcrew.app.ui.splash.SplashScreen
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
