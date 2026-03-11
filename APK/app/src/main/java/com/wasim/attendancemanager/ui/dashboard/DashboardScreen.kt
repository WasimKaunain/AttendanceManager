package com.wasim.attendancemanager.ui.dashboard

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import com.wasim.attendancemanager.data.api.RetrofitInstance
import com.wasim.attendancemanager.data.local.TokenManager
import com.wasim.attendancemanager.data.model.DashboardStats
import com.wasim.attendancemanager.data.model.LocationRequest
import com.wasim.attendancemanager.data.model.RecentActivity
import com.wasim.attendancemanager.data.model.WeeklyDay
import com.wasim.attendancemanager.ui.components.SectionHeader
import com.wasim.attendancemanager.ui.theme.*
import com.wasim.attendancemanager.utils.LocationHelper
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

// ── Reusable elevated white card wrapper ──────────────────────────────────────
@Composable
private fun ElevatedCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    val shape = RoundedCornerShape(20.dp)
    Box(
        modifier = modifier
            .shadow(
                elevation    = 6.dp,
                shape        = shape,
                ambientColor = Color.Black.copy(alpha = 0.06f),
                spotColor    = Color.Black.copy(alpha = 0.14f)
            )
            .clip(shape)
            .background(MaterialTheme.colorScheme.surface)
    ) {
        Column(content = content)
    }
}

@Composable
fun DashboardScreen(navController: NavController) {

    val context = LocalContext.current
    val scope   = rememberCoroutineScope()

    var stats            by remember { mutableStateOf<DashboardStats?>(null) }
    var weeklyData       by remember { mutableStateOf<List<WeeklyDay>>(emptyList()) }
    var recentActivity   by remember { mutableStateOf<List<RecentActivity>>(emptyList()) }
    var isLoading        by remember { mutableStateOf(true) }
    var geofenceLoading  by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    // Today's date string e.g. "Tuesday, 11 Mar 2026"
    val todayString = remember {
        SimpleDateFormat("EEEE, dd MMM yyyy", Locale.getDefault()).format(Date())
    }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) Toast.makeText(context, "Location permission required", Toast.LENGTH_SHORT).show()
    }

    fun hasLocationPermission() = ContextCompat.checkSelfPermission(
        context, Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED

    LaunchedEffect(Unit) {
        try {
            val api = RetrofitInstance.getApi(context)
            val sResp = api.getDashboardStats()
            val wResp = api.getWeeklyAttendance()
            val rResp = api.getRecentActivity()
            if (sResp.isSuccessful) stats          = sResp.body()
            if (wResp.isSuccessful) weeklyData     = wResp.body() ?: emptyList()
            if (rResp.isSuccessful) recentActivity = rResp.body() ?: emptyList()
        } catch (_: Exception) {
        } finally {
            isLoading = false
        }
    }

    fun navigateWithGeofence(route: String) {
        if (!hasLocationPermission()) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
            return
        }
        geofenceLoading = true
        LocationHelper(context).getCurrentLocation(
            onResult = { lat, lon ->
                scope.launch {
                    try {
                        val resp = RetrofitInstance.getApi(context)
                            .verifyGeofence(LocationRequest(latitude = lat, longitude = lon))
                        if (resp.isSuccessful && resp.body()?.inside == true) {
                            navController.navigate(route)
                        } else {
                            Toast.makeText(context, "You are outside the site boundary", Toast.LENGTH_LONG).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(context, "Geofence error: ${e.message}", Toast.LENGTH_SHORT).show()
                    } finally { geofenceLoading = false }
                }
            },
            onFailure = {
                geofenceLoading = false
                Toast.makeText(context, "Could not get location. Enable GPS and try again.", Toast.LENGTH_LONG).show()
            }
        )
    }

    // ── Logout dialog ─────────────────────────────────────────────────────────
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Logout") },
            text  = { Text("Are you sure you want to logout?") },
            confirmButton = {
                Button(onClick = {
                    showLogoutDialog = false
                    TokenManager(context).clearAll()
                    navController.navigate("login") { popUpTo(0) { inclusive = true } }
                }) { Text("Logout") }
            },
            dismissButton = {
                OutlinedButton(onClick = { showLogoutDialog = false }) { Text("Cancel") }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
    ) {

        // ── 1. HEADER — site name + today's date ──────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(AppPrimary, AppPrimaryLight)))
                .padding(start = 20.dp, end = 8.dp, top = 28.dp, bottom = 28.dp)
        ) {
            Column(modifier = Modifier.align(Alignment.CenterStart)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint     = AppOnPrimary.copy(alpha = 0.8f),
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text  = stats?.site_name ?: "Loading…",
                        style = MaterialTheme.typography.labelLarge.copy(
                            color = AppOnPrimary.copy(alpha = 0.85f)
                        )
                    )
                }
                Spacer(Modifier.height(2.dp))
                Text(
                    text  = todayString,
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Bold, color = AppOnPrimary
                    )
                )
            }
            IconButton(
                onClick  = { showLogoutDialog = true },
                modifier = Modifier.align(Alignment.CenterEnd)
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = AppOnPrimary)
            }
        }

        if (isLoading) {
            Box(Modifier.fillMaxWidth().padding(64.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AppPrimary)
            }
        } else {

            // ── 2. QUICK ACTIONS (single white elevated card) ─────────────────
            Spacer(Modifier.height(20.dp))
            SectionHeader("Quick Actions", modifier = Modifier.padding(horizontal = 20.dp))
            Spacer(Modifier.height(12.dp))

            ElevatedCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Top row: Check In + Check Out side by side (most frequent)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ActionButton(
                            title    = "Check In",
                            icon     = Icons.Default.Login,
                            onClick  = { navigateWithGeofence("checkin") },
                            modifier = Modifier.weight(1f)
                        )
                        ActionButton(
                            title    = "Check Out",
                            icon     = Icons.Default.Logout,
                            onClick  = { navigateWithGeofence("checkout") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    ActionButtonWide(
                        title    = "Face Enrollment",
                        subtitle = "Register a worker's face biometric",
                        icon     = Icons.Default.FaceRetouchingNatural,
                        onClick  = { navController.navigate("face_enroll") }
                    )
                }
            }

            if (geofenceLoading) {
                Spacer(Modifier.height(12.dp))
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AppPrimary, modifier = Modifier.size(28.dp))
                }
            }

            // ── 3. STATS (single white elevated card with 4 mini stats inside) ─
            Spacer(Modifier.height(24.dp))
            SectionHeader("Today's Overview", modifier = Modifier.padding(horizontal = 20.dp))
            Spacer(Modifier.height(12.dp))

            stats?.let { s ->
                ElevatedCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(0.dp)
                        ) {
                            MiniStatItem(
                                label = "Total",
                                value = s.total_workers.toString(),
                                icon  = Icons.Default.People,
                                tint  = AppPrimary,
                                modifier = Modifier.weight(1f)
                            )
                            VerticalDividerLine()
                            MiniStatItem(
                                label = "Present",
                                value = s.present_today.toString(),
                                icon  = Icons.Default.CheckCircle,
                                tint  = AppPresent,
                                modifier = Modifier.weight(1f)
                            )
                            VerticalDividerLine()
                            MiniStatItem(
                                label = "Absent",
                                value = s.absent_today.toString(),
                                icon  = Icons.Default.Cancel,
                                tint  = AppAbsent,
                                modifier = Modifier.weight(1f)
                            )
                            VerticalDividerLine()
                            MiniStatItem(
                                label = "Checked Out",
                                value = s.checked_out_today.toString(),
                                icon  = Icons.Default.Logout,
                                tint  = AppCheckedOut,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            // ── 4. UNENROLLED ALERT ───────────────────────────────────────────
            val unenrolled = stats?.unenrolled_count ?: 0
            if (unenrolled > 0) {
                Spacer(Modifier.height(16.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .clickable { navController.navigate("face_enroll") },
                    shape  = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF8E1)),
                    border = BorderStroke(1.dp, Color(0xFFFFCC02))
                ) {
                    Row(
                        modifier          = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFFFFCC02).copy(alpha = 0.25f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.WarningAmber, null, tint = Color(0xFFF59F00), modifier = Modifier.size(22.dp))
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "$unenrolled worker${if (unenrolled > 1) "s" else ""} not enrolled",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = FontWeight.SemiBold, color = Color(0xFF92400E)
                                )
                            )
                            Text(
                                "Tap to enroll their face biometric",
                                style = MaterialTheme.typography.bodySmall.copy(color = Color(0xFFB45309))
                            )
                        }
                        Icon(Icons.Default.ChevronRight, null, tint = Color(0xFFF59F00))
                    }
                }
            }

            // ── 5. WEEKLY TREND (single white elevated card) ──────────────────
            if (weeklyData.isNotEmpty()) {
                Spacer(Modifier.height(24.dp))
                SectionHeader("Weekly Trend", modifier = Modifier.padding(horizontal = 20.dp))
                Spacer(Modifier.height(12.dp))
                WeeklyBarChart(data = weeklyData)
            }

            // ── 6. RECENT ACTIVITY (single white elevated card) ───────────────
            if (recentActivity.isNotEmpty()) {
                Spacer(Modifier.height(24.dp))
                SectionHeader("Recent Activity", modifier = Modifier.padding(horizontal = 20.dp))
                Spacer(Modifier.height(12.dp))

                ElevatedCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                    recentActivity.forEachIndexed { index, activity ->
                        RecentActivityRow(activity)
                        if (index < recentActivity.lastIndex)
                            HorizontalDivider(
                                color     = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                thickness = 0.8.dp,
                                modifier  = Modifier.padding(horizontal = 16.dp)
                            )
                    }
                }
            }

            Spacer(Modifier.height(100.dp)) // bottom nav clearance
        }
    }
}

// ── Mini stat item inside the stats card ─────────────────────────────────────

@Composable
private fun MiniStatItem(
    label: String,
    value: String,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier            = modifier.padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))
        Text(
            text  = value,
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.ExtraBold,
                color      = MaterialTheme.colorScheme.onSurface,
                fontSize   = 22.sp
            )
        )
        Text(
            text  = label,
            style = MaterialTheme.typography.labelSmall.copy(
                color    = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
        )
    }
}

@Composable
private fun RowScope.VerticalDividerLine() {
    Box(
        modifier = Modifier
            .width(0.8.dp)
            .height(60.dp)
            .align(Alignment.CenterVertically)
            .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
    )
}

// ── Recent Activity Row ───────────────────────────────────────────────────────

@Composable
private fun RecentActivityRow(activity: RecentActivity) {
    val isCheckout  = activity.check_out_time != null
    val statusColor = if (isCheckout) AppPresent else AppCheckedOut
    val statusIcon  = if (isCheckout) Icons.Default.Logout else Icons.Default.Login
    val timeLabel   = if (isCheckout)
        activity.check_out_time ?: activity.check_in_time ?: "—"
    else
        activity.check_in_time ?: "—"
    val eventLabel  = if (isCheckout) "Checked Out" else "Checked In"

    Row(
        modifier          = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Coloured icon circle
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(statusColor.copy(alpha = 0.10f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(statusIcon, null, tint = statusColor, modifier = Modifier.size(18.dp))
        }

        // Name + event label
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(
                activity.worker_name,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    color      = MaterialTheme.colorScheme.onSurface
                )
            )
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(eventLabel, style = MaterialTheme.typography.bodySmall.copy(color = statusColor, fontSize = 11.sp))
                if (activity.is_late == true) {
                    Text("· Late", style = MaterialTheme.typography.bodySmall.copy(color = AppAbsent, fontSize = 11.sp))
                }
            }
        }

        // Time on right
        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(
                timeLabel,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp
                )
            )
            Text(
                activity.date,
                style = MaterialTheme.typography.labelSmall.copy(color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 10.sp)
            )
        }
    }
}

// ── Weekly Bar Chart (white elevated card, no color stripe) ───────────────────

@Composable
fun WeeklyBarChart(data: List<WeeklyDay>) {
    val maxVal = data.maxOf { it.present + it.absent }.coerceAtLeast(1)
    val shape  = RoundedCornerShape(20.dp)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .shadow(
                elevation    = 6.dp,
                shape        = shape,
                ambientColor = Color.Black.copy(alpha = 0.06f),
                spotColor    = Color.Black.copy(alpha = 0.14f)
            )
            .clip(shape)
            .background(MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                LegendDot(AppPresent, "Present")
                LegendDot(AppAbsent,  "Absent")
            }
            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth().height(140.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment     = Alignment.Bottom
            ) {
                data.forEach { day -> DayColumn(day = day, maxVal = maxVal) }
            }
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(Modifier.size(10.dp).clip(RoundedCornerShape(50)).background(color))
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = MaterialTheme.colorScheme.onSurfaceVariant))
    }
}

@Composable
private fun DayColumn(day: WeeklyDay, maxVal: Int) {
    val maxHeight   = 100.dp
    val presentAnim by animateDpAsState((maxHeight * day.present / maxVal.toFloat()), tween(600), label = "p")
    val absentAnim  by animateDpAsState((maxHeight * day.absent  / maxVal.toFloat()), tween(600, 100), label = "a")
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Bottom,
        modifier            = Modifier.width(36.dp)
    ) {
        Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            Box(Modifier.width(13.dp).height(presentAnim.coerceAtLeast(2.dp))
                .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)).background(AppPresent))
            Box(Modifier.width(13.dp).height(absentAnim.coerceAtLeast(2.dp))
                .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)).background(AppAbsent.copy(alpha = 0.55f)))
        }
        Spacer(Modifier.height(4.dp))
        Text(day.day, style = MaterialTheme.typography.labelSmall.copy(color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 10.sp))
    }
}

// ── Action Button — clean white tile, no color strip ─────────────────────────

@Composable
fun ActionButton(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(if (isPressed) 0.96f else 1f, spring(stiffness = 600f), label = "sc")
    val shape = RoundedCornerShape(16.dp)

    Box(
        modifier = modifier
            .scale(scale)
            .height(86.dp)
            .shadow(
                elevation    = if (isPressed) 1.dp else 4.dp,
                shape        = shape,
                ambientColor = Color.Black.copy(alpha = 0.05f),
                spotColor    = Color.Black.copy(alpha = 0.10f)
            )
            .clip(shape)
            .background(MaterialTheme.colorScheme.surface)
            .clickable(interactionSource = interactionSource, indication = null) { onClick() }
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint     = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f),
                modifier = Modifier.size(26.dp)
            )
            Spacer(Modifier.height(6.dp))
            Text(
                title,
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.SemiBold,
                    color      = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    }
}

// ── Wide action button — Face Enrollment ─────────────────────────────────────

@Composable
fun ActionButtonWide(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(if (isPressed) 0.97f else 1f, spring(stiffness = 600f), label = "sc")
    val shape = RoundedCornerShape(16.dp)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .scale(scale)
            .height(68.dp)
            .shadow(
                elevation    = if (isPressed) 1.dp else 4.dp,
                shape        = shape,
                ambientColor = Color.Black.copy(alpha = 0.05f),
                spotColor    = Color.Black.copy(alpha = 0.10f)
            )
            .clip(shape)
            .background(MaterialTheme.colorScheme.surface)
            .clickable(interactionSource = interactionSource, indication = null) { onClick() }
    ) {
        Row(
            modifier          = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint     = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f),
                modifier = Modifier.size(26.dp)
            )
            Column(Modifier.weight(1f)) {
                Text(
                    title,
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                        color      = MaterialTheme.colorScheme.onSurface
                    )
                )
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint     = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
