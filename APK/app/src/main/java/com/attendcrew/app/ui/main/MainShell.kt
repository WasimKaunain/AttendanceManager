package com.attendcrew.app.ui.main

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.attendcrew.app.ui.attendance.AttendanceTabScreen
import com.attendcrew.app.ui.dashboard.DashboardScreen
import com.attendcrew.app.ui.profile.ProfileScreen
import com.attendcrew.app.ui.workers.WorkersTabScreen

private enum class BottomTab(val label: String,val selectedIcon: ImageVector,val unselectedIcon: ImageVector)
{
    DASHBOARD("Dashboard", Icons.Filled.Dashboard, Icons.Outlined.Dashboard),
    WORKERS("Workers", Icons.Filled.People, Icons.Outlined.PeopleOutline),
    ATTENDANCE("Attendance", Icons.Filled.EventNote, Icons.Outlined.EventNote),
    PROFILE("Profile", Icons.Filled.AccountCircle, Icons.Outlined.AccountCircle)
}

@Composable
fun MainShell(
    navController: NavController,
    isDarkTheme: Boolean,
    onThemeToggle: (Boolean) -> Unit
) {
    var currentTab by remember { mutableStateOf(BottomTab.DASHBOARD) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            // Premium bottom bar: slightly floating surface, clean indicator.
            Surface(tonalElevation = 2.dp,shadowElevation = 0.dp,color = MaterialTheme.colorScheme.surface)
            {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface,tonalElevation = 0.dp)
                {
                    BottomTab.entries.forEach { tab ->
                        val selected = currentTab == tab
                        NavigationBarItem(
                            selected = selected,
                            onClick = { currentTab = tab },
                            icon = {Icon(imageVector = if (selected) tab.selectedIcon else tab.unselectedIcon,contentDescription = tab.label)},
                            label = {Text(tab.label,style = MaterialTheme.typography.labelMedium)},
                            alwaysShowLabel = true,
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(bottom = innerPadding.calculateBottomPadding()))
        {
            // No tab-to-tab animations for performance
            when (currentTab) {
                BottomTab.DASHBOARD -> DashboardScreen(navController)
                BottomTab.WORKERS -> WorkersTabScreen(navController = navController)
                BottomTab.ATTENDANCE -> AttendanceTabScreen(navController)
                BottomTab.PROFILE -> ProfileScreen(
                    navController = navController,
                    isDarkTheme = isDarkTheme,
                    onThemeToggle = onThemeToggle
                )
            }
        }
    }
}
