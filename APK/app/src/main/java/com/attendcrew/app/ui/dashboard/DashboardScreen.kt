package com.attendcrew.app.ui.dashboard

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.FaceRetouchingNatural
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import com.attendcrew.app.data.local.TokenManager
import com.attendcrew.app.data.local.db.dashboard.DashboardRepository
import com.attendcrew.app.data.local.db.dashboard.DashboardSyncer
import com.attendcrew.app.data.local.db.dashboard.RecentActivityEntity
import com.attendcrew.app.data.local.db.dashboard.WeeklyDayEntity
import com.attendcrew.app.data.local.db.site.SiteGeofenceRepository
import com.attendcrew.app.data.local.db.AttendanceOutboxRepository
import com.attendcrew.app.work.WorkScheduler
import kotlinx.coroutines.delay
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Refresh
import com.attendcrew.app.ui.components.AppEmptyState
import com.attendcrew.app.ui.components.AppSectionTitle
import com.attendcrew.app.ui.theme.StatusError
import com.attendcrew.app.ui.theme.StatusSuccess
import com.attendcrew.app.ui.theme.StatusWarning
import com.attendcrew.app.utils.GeoFenceLocalChecker
import com.attendcrew.app.utils.LocationHelper
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import android.util.Log
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.res.painterResource
import com.attendcrew.app.R
import androidx.compose.ui.graphics.graphicsLayer
import java.util.Calendar

// ── Reusable elevated card wrapper (new theme-aligned) ───────────────────────
@Composable
private fun ElevatedCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    val shape = RoundedCornerShape(16.dp)
    Surface(
        modifier = modifier,
        shape = shape,
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
        shadowElevation = 0.dp,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.55f))
    ) {
        Column(content = content)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(navController: NavController)
{

    val cardColor = Color(0xFFFFFBF5)
    val titleColor = Color(0xFF0F172A)
    val subtitleColor = Color(0xFF64748B)
    val iconColor = Color(0xFF1E40AF)
    val context = LocalContext.current
    val dashboardRepo = remember { DashboardRepository(context) }
    val stats by dashboardRepo.observeStats().collectAsState(initial = null)
    val weeklyData by dashboardRepo.observeWeekly().collectAsState(initial = emptyList())
    val recentActivity by dashboardRepo.observeRecent().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }
    val isAdmin = remember { tokenManager.getRole() == "admin" }
    val isLoading = stats == null
    var isRefreshing by remember { mutableStateOf(false) }
    var geofenceLoading by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    val outboxRepo = remember {AttendanceOutboxRepository(context)}
    val pendingCount by outboxRepo.observePendingCount().collectAsState(initial = 0)
    var pendingSyncRunning by remember {mutableStateOf(false)}


    // Today's date string e.g. "Tuesday, 11 Mar 2026"
    val todayString = remember {SimpleDateFormat("EEEE, dd MMM yyyy", Locale.getDefault()).format(Date())}
    val calendarDate = remember {SimpleDateFormat("dd", Locale.getDefault()).format(Date())}
    val greeting = remember {
        when (Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) {
            in 5..11 -> "Good Morning"
            in 12..16 -> "Good Afternoon"
            in 17..20 -> "Good Evening"
            else -> "Welcome Back"
        }
    }


    val calendarMonth = remember {SimpleDateFormat("MMM", Locale.getDefault()).format(Date())}

    val calendarDay = remember {SimpleDateFormat("EEE", Locale.getDefault()).format(Date())}
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) Toast.makeText(context, "Location permission required", Toast.LENGTH_SHORT)
            .show()
    }


    fun hasLocationPermission() = ContextCompat.checkSelfPermission(
        context, Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED


    fun refreshDashboard() {
        scope.launch {
            Log.d("DASHBOARD_UI", "REFRESH STARTED")

            isRefreshing = true

            try {
                DashboardSyncer.syncDashboard(context)
            } finally {
                isRefreshing = false
            }
        }
    }

    LaunchedEffect(stats) {

        Log.d("DASHBOARD_UI", "stats = $stats")

        if (stats == null) {

            Log.d("DASHBOARD_UI", "Calling refreshDashboard")

            refreshDashboard()
        }
    }
    fun navigateWithGeofence(route: String)
    {
        if (!hasLocationPermission())
        {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
            return
        }
        geofenceLoading = true
        LocationHelper(context).getCurrentLocation(
            onResult = { lat, lon ->
                scope.launch {

                    try {
                        val siteId = tokenManager.getSiteId()

                        if (siteId.isNullOrBlank())
                        {
                            Toast.makeText(context,"No site selected",Toast.LENGTH_SHORT).show()
                            return@launch
                        }

                        val site = SiteGeofenceRepository(context).getSite(siteId)

                        if (site == null)
                        {
                            Toast.makeText(context,"Site geofence not synced",Toast.LENGTH_SHORT).show()
                            return@launch
                        }

                        val (inside, distance) =
                            GeoFenceLocalChecker.isInside(
                                workerLat = lat,
                                workerLng = lon,
                                boundaryType = site.boundaryType,
                                siteLat = site.latitude,
                                siteLng = site.longitude,
                                radiusM = site.radiusM,
                                polygonJson = site.polygonJson
                            )
                        if (inside)
                        {
                            navController.navigate(route)
                        }
                        else
                        {
                            Toast.makeText(context,"You are outside the site boundary",Toast.LENGTH_LONG).show()
                        }

                    } catch (e: Exception) {
                        Toast.makeText(context,"Geofence error: ${e.message}",Toast.LENGTH_SHORT).show()
                    } finally {
                        geofenceLoading = false
                    }
                }
            },
            onFailure = {
                geofenceLoading = false
                Toast.makeText(context,"Could not get location. Enable GPS and try again.",Toast.LENGTH_LONG).show()
            }
        )
    }
    PullToRefreshBox(isRefreshing = isRefreshing,onRefresh = { refreshDashboard() })
    {
        Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).verticalScroll(rememberScrollState()))
        {
        // ── Header (clean, premium gradient, better spacing/typography) ───────
        Box(modifier = Modifier.fillMaxWidth().height(300.dp).background(Color.Red))
        {
                Image(painter = painterResource(R.drawable.hero_dashboard),
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop)

            val unenrolled = stats?.unenrolledCount ?: 0

            Column(
                modifier = Modifier.align(Alignment.TopEnd).padding(top = 42.dp, end = 12.dp),
                horizontalAlignment = Alignment.End
            )
            {
                Box {
                    Surface(
                        onClick = { showNotifications = true },
                        shape = CircleShape,
                        color = Color.White.copy(alpha = 0.22f),
                        modifier = Modifier.size(56.dp)
                    )
                    {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        )
                        {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = null,
                                tint = Color(0xFFFFD700),
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }

                    if (unenrolled > 0)
                    {
                        Badge(modifier = Modifier.align(Alignment.TopEnd).offset(x = 4.dp, y = 2.dp))
                        {
                            Text(unenrolled.toString())
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))

                Card(
                    modifier = Modifier.offset(x=(-10).dp,y=12.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.18f)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
                )
                {
                    Column(
                        modifier = Modifier.width(100.dp),horizontalAlignment = Alignment.CenterHorizontally)
                    {
                        Box(modifier = Modifier.fillMaxWidth().background(
                                    Color(0xFFFFB000),
                                    RoundedCornerShape(topStart = 18.dp,
                                        topEnd = 18.dp)).padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        )
                        {
                            Text(
                                text = calendarMonth.uppercase(),
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.labelMedium
                            )
                        }
                        Spacer(Modifier.height(4.dp))

                        Text(
                            text = calendarDate,
                            color = Color.White,
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.ExtraBold
                        )

                        Text(
                            text = calendarDay.uppercase(),
                            color = Color.White.copy(alpha = 0.85f),
                            style = MaterialTheme.typography.labelMedium
                        )

                        Spacer(Modifier.height(8.dp))
                    }
                }
            }

            Column(modifier = Modifier.align(Alignment.TopStart).padding(start = 24.dp, top = 110.dp, end = 120.dp))
            {
                Row(verticalAlignment = Alignment.CenterVertically)
                {
                    Icon(Icons.Default.LocationOn,null,tint = Color.White,modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(text = stats?.siteName ?: "",color = Color.White,style = MaterialTheme.typography.titleMedium,fontWeight = FontWeight.SemiBold)
                }
                Spacer(Modifier.height(14.dp))
                Column {
                    Text(text = greeting,color = Color.White.copy(alpha = 0.90f),style = MaterialTheme.typography.titleLarge)
                    Spacer(Modifier.height(6.dp))
                    Text(text = "${tokenManager.getUserName() ?: "Admin"} 👋",color = Color.White,style = MaterialTheme.typography.headlineLarge,fontWeight = FontWeight.Bold)
                }
            }
        }

        if (isLoading)
        {
            Box(Modifier.fillMaxWidth().padding(64.dp),contentAlignment = Alignment.Center)
            {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            return@Column
        }

        Surface(modifier = Modifier.fillMaxWidth().offset(y = -25.dp),shape = RoundedCornerShape(topStart = 32.dp,topEnd = 32.dp),color = MaterialTheme.colorScheme.surface)
        {
            Column(modifier = Modifier.padding(top = 24.dp))
            {
                Spacer(Modifier.height(0.dp))

                // ── Quick actions ────────────────────────────────────────────────────
                AppSectionTitle("Quick Actions",modifier = Modifier.padding(horizontal = 20.dp))
                Spacer(Modifier.height(12.dp))
                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp),horizontalArrangement = Arrangement.spacedBy(12.dp))
                {
                    if(pendingCount > 0) {
                        item {
                            QuickActionTile(
                                title = "Pending Sync",
                                subtitle =
                                    if (pendingSyncRunning)
                                        "Syncing..."
                                    else
                                        "$pendingCount pending",
                                icon = Icons.Default.Sync,
                                containerColor = cardColor,
                                titleColor = titleColor,
                                subtitleColor = subtitleColor,
                                iconColor = if (pendingCount > 0)
                                    Color(0xFFE65100)
                                else
                                    iconColor,
                                isLoading = pendingSyncRunning,
                                onClick = {
                                    if (!pendingSyncRunning) {
                                        pendingSyncRunning = true

                                        WorkScheduler.enqueueOneTimeAttendanceSync(context)

                                        scope.launch {
                                            delay(3000)
                                            pendingSyncRunning = false
                                        }
                                    }
                                }
                            )
                        }
                    }
                    item {QuickActionTile(title = "Check In",subtitle = "Mark arrival",icon = Icons.Default.Login,containerColor = cardColor,titleColor = titleColor,subtitleColor = subtitleColor,iconColor = iconColor,onClick = { navigateWithGeofence("checkin") })}
                    item {QuickActionTile(title = "Check Out",subtitle = "Mark departure",icon = Icons.Default.Logout,containerColor = cardColor,titleColor = titleColor,subtitleColor = subtitleColor,iconColor = iconColor,onClick = { navigateWithGeofence("checkout") })}
                    item {QuickActionTile(title = "Face Enroll",subtitle = "Register face",icon = Icons.Default.FaceRetouchingNatural,containerColor = cardColor,titleColor = titleColor,subtitleColor = subtitleColor,iconColor = iconColor,onClick = { navController.navigate("face_enroll") })}
                    item {QuickActionTile(title = "Switch Site",subtitle = "Change site",icon = Icons.Default.Business,containerColor = cardColor,titleColor = titleColor,subtitleColor = subtitleColor,iconColor = iconColor,onClick = { navController.navigate("admin_site_selection") })}
                }

                Spacer(Modifier.height(22.dp))

                stats?.let { s ->
                    ElevatedCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.elevatedCardColors(containerColor = Color(0xFFFFFBF5)),
                        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 6.dp))
                    {
                        Column(modifier = Modifier.padding(horizontal=20.dp,vertical=20.dp))
                        {
                            Text(text = "Today's Overview",style = MaterialTheme.typography.titleLarge,fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.height(20.dp))
                            Row(modifier = Modifier.fillMaxWidth(),horizontalArrangement = Arrangement.spacedBy(0.dp))
                            {
                                MiniStatItem(label = "Total",value = s.totalWorkers.toString(),icon = Icons.Default.People,tint = MaterialTheme.colorScheme.primary,modifier = Modifier.weight(1f))
                                VerticalDividerLine()
                                MiniStatItem(label = "Present",value = s.presentToday.toString(),icon = Icons.Default.CheckCircle,tint = StatusSuccess,modifier = Modifier.weight(1f))
                                VerticalDividerLine()
                                MiniStatItem(label = "Absent",value = s.absentToday.toString(),icon = Icons.Default.Cancel,tint = StatusError,modifier = Modifier.weight(1f))
                                VerticalDividerLine()
                                MiniStatItem(label = "Checked Out",value = s.checkedOutToday.toString(),icon = Icons.Default.Logout,tint = StatusWarning,modifier = Modifier.weight(1f))
                            }
                        }
                    }
                } ?: run {
                    AppEmptyState(
                        title = "No data",
                        message = "Dashboard summary is not available right now.",
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }


                // ── WEEKLY TREND (single white elevated card) ──────────────────
                if (weeklyData.isNotEmpty()) {
                    Spacer(Modifier.height(24.dp))
                    AppSectionTitle("Weekly Trend", modifier = Modifier.padding(horizontal = 20.dp))
                    Spacer(Modifier.height(12.dp))
                    WeeklyBarChart(data = weeklyData)
                }

                // ── RECENT ACTIVITY (single white elevated card) ───────────────
                if (recentActivity.isNotEmpty()) {
                    Spacer(Modifier.height(24.dp))
                    AppSectionTitle("Recent Activity",modifier = Modifier.padding(horizontal = 20.dp))
                    Spacer(Modifier.height(12.dp))

                    Box(modifier = Modifier.padding(horizontal = 16.dp).shadow(elevation = 14.dp,shape = RoundedCornerShape(28.dp),clip = false))
                    {
                        ElevatedCard(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(28.dp),
                            colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 10.dp)
                        )
                        {
                            recentActivity.forEachIndexed { index, activity ->
                                RecentActivityRow(activity)
                                if (index < recentActivity.lastIndex)
                                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                thickness = 0.8.dp,
                                modifier = Modifier.padding(horizontal = 20.dp,vertical=16.dp)
                                )
                            }
                        }
                    }
                }

            Spacer(Modifier.height(100.dp))
        }}
        }
    }

    // Notification Dialog
    if (showNotifications) {

        val unenrolled = stats?.unenrolledCount ?: 0

        AlertDialog(
            onDismissRequest = {
                showNotifications = false
            },

            confirmButton = {
                TextButton(
                    onClick = {
                        showNotifications = false
                    }
                ) {
                    Text("Close")
                }
            },

            title = {
                Text("Notifications")
            },

            text = {
                Column {

                    if (unenrolled > 0) {

                        Text(
                            "⚠ $unenrolled workers need face enrollment"
                        )

                        Spacer(Modifier.height(12.dp))

                        Text(
                            "Please open Face Enroll from Quick Actions and register them."
                        )
                    } else {

                        Text("No notifications.")
                    }
                }
            }
        )
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
        modifier = modifier.padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {

        Box(modifier = Modifier.size(54.dp).clip(CircleShape).background(tint.copy(alpha = 0.15f)),contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(28.dp)
            )
        }

        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold,color = MaterialTheme.colorScheme.onSurface
            )
        )

        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(Modifier.height(4.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth(0.7f)
                .height(4.dp)
                .clip(RoundedCornerShape(50))
                .background(tint)
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
private fun RecentActivityRow(activity: RecentActivityEntity) {
    val isCheckout = activity.checkOutTime != null
    val statusColor = if (isCheckout) StatusSuccess else StatusWarning
    val statusIcon = if (isCheckout) Icons.Default.Logout else Icons.Default.Login
    val timeLabel = if (isCheckout)
        activity.checkOutTime ?: activity.checkInTime ?: "—"
    else
        activity.checkInTime ?: "—"
    val eventLabel = if (isCheckout) "Checked Out" else "Checked In"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(statusColor.copy(alpha = 0.10f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(statusIcon, null, tint = statusColor, modifier = Modifier.size(18.dp))
        }

        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(
                activity.workerName,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(eventLabel, style = MaterialTheme.typography.bodySmall.copy(color = statusColor, fontSize = 11.sp))
                if (activity.isLate == true) {
                    Text("· Late", style = MaterialTheme.typography.bodySmall.copy(color = StatusError, fontSize = 11.sp))
                }
            }
        }

        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(
                timeLabel,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 12.sp
                )
            )
            Text(
                activity.date,
                style = MaterialTheme.typography.labelSmall.copy(
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.sp
                )
            )
        }
    }
}

// ── Weekly Bar Chart (white elevated card, no color stripe) ───────────────────

@Composable
fun WeeklyBarChart(data: List<WeeklyDayEntity>) {
    val maxVal = data.maxOf { it.present + it.absent }.coerceAtLeast(1)
    val shape = RoundedCornerShape(28.dp)

    Box(
        modifier = Modifier
            .padding(horizontal = 16.dp)
            .shadow(
                elevation = 14.dp,
                shape = RoundedCornerShape(28.dp),
                clip = false
            )
    )
    {
        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.elevatedCardColors(
                containerColor = Color(0xFFFFFBF5)
            ),
            elevation = CardDefaults.elevatedCardElevation(
                defaultElevation = 10.dp
            )
        )
        {
            Column(
                modifier = Modifier.padding(20.dp)
            )
            {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    LegendDot(StatusSuccess, "Present")
                    LegendDot(StatusError, "Absent")
                }

                Spacer(Modifier.height(20.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.Bottom
                ) {
                    data.forEach { day ->
                        DayColumn(day = day, maxVal = maxVal)
                    }
                }
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
private fun DayColumn(day: WeeklyDayEntity, maxVal: Int) {
    val maxHeight = 100.dp
    val safeMax = maxVal.coerceAtLeast(1).toFloat()
    val presentRatio = day.present.toFloat() / safeMax
    val absentRatio = day.absent.toFloat() / safeMax
    val presentTarget = maxHeight * presentRatio
    val absentTarget = maxHeight * absentRatio
    val presentAnim by animateDpAsState(targetValue = presentTarget, animationSpec = tween(600), label = "p")
    val absentAnim by animateDpAsState(targetValue = absentTarget, animationSpec = tween(600, 100), label = "a")

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Bottom,
        modifier = Modifier.width(36.dp)
    ) {
        Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            Box(
                Modifier
                    .width(15.dp)
                    .height(presentAnim.coerceAtLeast(2.dp))
                    .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                    .background(StatusSuccess)
            )
            Box(
                Modifier
                    .width(15.dp)
                    .height(absentAnim.coerceAtLeast(2.dp))
                    .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                    .background(StatusError.copy(alpha = 0.75f))
            )
        }
        Spacer(Modifier.height(4.dp))
        Text(
            day.day,
            style = MaterialTheme.typography.labelSmall.copy(
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        )
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
@Composable
fun QuickActionTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    containerColor: Color,
    titleColor: Color,
    subtitleColor: Color,
    iconColor: Color,
    isLoading: Boolean = false,
    onClick: () -> Unit
){
    Box(modifier = Modifier.shadow(elevation = 14.dp,shape = RoundedCornerShape(28.dp),clip = false))
    {
        ElevatedCard(
            onClick = {if(!isLoading) onClick()},
            modifier = Modifier.width(170.dp).height(190.dp).graphicsLayer {alpha = if(isLoading) 0.85f else 1f },
            shape = RoundedCornerShape(28.dp),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 10.dp
            )
        )
        {
            Column(
                modifier = Modifier.fillMaxSize().background(containerColor).padding(18.dp),
                verticalArrangement = Arrangement.SpaceBetween
            )
            {
                Surface(
                    shape = CircleShape,
                    color = Color(0xFFE8F0FF).copy(alpha = 0.55f),
                    modifier = Modifier.size(90.dp)
                ) {
                    Box(contentAlignment = Alignment.Center)
                    {
                        if (isLoading)
                        {
                            CircularProgressIndicator(
                                modifier = Modifier.size(38.dp),
                                strokeWidth = 3.dp,
                                color = iconColor
                            )
                        }
                        else {
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = iconColor,
                                modifier = Modifier.padding(18.dp).size(42.dp)
                            )
                        }
                    }
                }

                Column {
                    Text(
                        text = title,
                        color = titleColor,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(4.dp))

                    Text(
                        text = subtitle,
                        color = subtitleColor.copy(alpha = 0.85f),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}