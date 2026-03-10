package com.wasim.attendancemanager.ui.main

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.wasim.attendancemanager.ui.attendance.AttendanceTabScreen
import com.wasim.attendancemanager.ui.dashboard.DashboardScreen
import com.wasim.attendancemanager.ui.workers.WorkersTabScreen
import com.wasim.attendancemanager.ui.theme.AppBackground
import com.wasim.attendancemanager.ui.theme.AppPrimary
import com.wasim.attendancemanager.ui.theme.AppSurface
import com.wasim.attendancemanager.ui.theme.AppTextSecondary

private enum class BottomTab(
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    DASHBOARD( "Dashboard", Icons.Filled.Dashboard,   Icons.Outlined.Dashboard),
    WORKERS(   "Workers",   Icons.Filled.People,      Icons.Outlined.PeopleOutline),
    ATTENDANCE("Attendance",Icons.Filled.EventNote,   Icons.Outlined.EventNote)
}

@Composable
fun MainShell(navController: NavController) {

    var currentTab by remember { mutableStateOf(BottomTab.DASHBOARD) }

    Scaffold(
        containerColor = AppBackground,
        bottomBar = {
            NavigationBar(
                containerColor = AppSurface,
                tonalElevation = 8.dp
            ) {
                BottomTab.entries.forEach { tab ->
                    val selected = currentTab == tab
                    NavigationBarItem(
                        selected = selected,
                        onClick  = { currentTab = tab },
                        icon = {
                            Icon(
                                imageVector = if (selected) tab.selectedIcon else tab.unselectedIcon,
                                contentDescription = tab.label
                            )
                        },
                        label  = { Text(tab.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor   = AppPrimary,
                            selectedTextColor   = AppPrimary,
                            unselectedIconColor = AppTextSecondary,
                            unselectedTextColor = AppTextSecondary,
                            indicatorColor      = AppPrimary.copy(alpha = 0.12f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            AnimatedContent(
                targetState   = currentTab,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label          = "tab_transition"
            ) { tab ->
                when (tab) {
                    BottomTab.DASHBOARD  -> DashboardScreen(navController)
                    BottomTab.WORKERS    -> WorkersTabScreen()
                    BottomTab.ATTENDANCE -> AttendanceTabScreen()
                }
            }
        }
    }
}

