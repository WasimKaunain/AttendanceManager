package com.attendcrew.app.ui.attendance

import com.attendcrew.app.data.local.db.AttendanceRepository
import com.attendcrew.app.data.local.db.AttendanceEntity
import com.attendcrew.app.data.local.db.AttendanceSyncer
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.attendcrew.app.data.model.AttendanceRecord
import com.attendcrew.app.ui.components.AppCard
import com.attendcrew.app.ui.components.AppEmptyState
import com.attendcrew.app.ui.components.AppPrimaryButton
import com.attendcrew.app.ui.components.AppSecondaryButton
import com.attendcrew.app.ui.components.AppSectionTitle
import com.attendcrew.app.ui.components.AppTextField
import com.attendcrew.app.ui.components.SectionHeader
import com.attendcrew.app.ui.components.StatusBadge
import com.attendcrew.app.ui.theme.*
import kotlinx.coroutines.launch
import androidx.navigation.NavController
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.attendcrew.app.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceTabScreen(navController: NavController) {

    val context = LocalContext.current
    val repository = remember {AttendanceRepository(context)}
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(true) }
    var isRefreshing by remember { mutableStateOf(false) }
    var showFilters by remember { mutableStateOf(false) }

    var workerName by remember { mutableStateOf("") }
    var dateFrom by remember { mutableStateOf("") }
    var dateTo by remember { mutableStateOf("") }
    var sortOrder by remember { mutableStateOf("desc") }
    var initialSyncDone by remember {mutableStateOf(false)}
    val records by repository.observeFiltered(workerName.ifBlank { null },dateFrom.ifBlank { null },dateTo.ifBlank { null }).collectAsState(initial = emptyList())


    fun loadAttendance() {
        scope.launch {

            isLoading = true

            try {

                var result = repository.getFiltered(workerName = workerName.ifBlank { null },dateFrom = dateFrom.ifBlank { null },dateTo = dateTo.ifBlank { null })
                result.forEach {
                    android.util.Log.d("ATT_TAB","id=${it.id} worker=${it.workerId} date=${it.date}")
                }
                result =
                    if (sortOrder == "asc")
                        result.sortedBy { it.date }
                    else
                        result.sortedByDescending { it.date }

            } finally {
                isLoading = false
            }
        }
    }

    fun refreshAttendance() {
        scope.launch {
            isRefreshing = true
            try {
                AttendanceSyncer.syncAttendance(context)
                loadAttendance()
            } finally {
                isRefreshing = false
            }
        }
    }

    LaunchedEffect(Unit) {

        if (repository.count() == 0) {
            AttendanceSyncer.syncAttendance(context)
        }
    }

    LaunchedEffect(Unit) {
        loadAttendance()
    }

    PullToRefreshBox(isRefreshing = isRefreshing,onRefresh = { refreshAttendance() })
    {
    Column(modifier = Modifier.fillMaxSize())
    {
        // ── Header ───────────────────────────────────────────────────────────
        Box(modifier = Modifier.fillMaxWidth().height(260.dp))
        {
                Image(
                    painter = painterResource(R.drawable.hero_attendance),
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            Column(
                modifier = Modifier.align(Alignment.TopStart).padding(start = 24.dp,top = 110.dp,end = 120.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp))
            {

                Text(text = "Attendance",color = Color.White,style = MaterialTheme.typography.labelLarge,fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text(text = "Track worker check-ins & check-outs",color = Color.White.copy(alpha = 0.85f),style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(12.dp))

                Surface(
                    shape = RoundedCornerShape(50),color = Color.White.copy(alpha = 0.18f)) {
                    Text(
                        text = "${records.size} Records",
                        modifier = Modifier.padding(horizontal = 12.dp,vertical = 6.dp),
                        color = Color.White,
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }

            Surface(
                modifier = Modifier.align(Alignment.TopEnd).padding(top = 56.dp,end = 18.dp),
                shape = CircleShape,color = Color.White.copy(alpha = 0.18f))
            {
                IconButton(onClick = {showFilters = !showFilters})
                {
                    Icon(
                        imageVector =
                            if (showFilters)
                                Icons.Default.Close
                            else
                                Icons.Default.FilterList,contentDescription = null,tint = Color.White
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        // ── Filter panel ─────────────────────────────────────────────────────
            AnimatedVisibility(visible = showFilters)
            {
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = Color(0xFFFFFBF5)),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 8.dp))
                {
                    Column(
                        modifier = Modifier.padding(20.dp))
                    {

                        Text(text = "Filters",style = MaterialTheme.typography.titleMedium,fontWeight = FontWeight.SemiBold)
                        Row(modifier = Modifier.fillMaxWidth(),horizontalArrangement = Arrangement.SpaceBetween,verticalAlignment = Alignment.CenterVertically)
                        {
                            Text(text = "Refine Attendance Records",style = MaterialTheme.typography.bodyMedium,color = MaterialTheme.colorScheme.onSurfaceVariant)

                            TextButton(
                                onClick = {
                                    workerName = ""
                                    dateFrom = ""
                                    dateTo = ""
                                    sortOrder = "desc"}
                            ) {
                                Text("Clear")
                            }
                        }

                        Spacer(Modifier.height(8.dp))

                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))

                        Spacer(Modifier.height(16.dp))

                        AppTextField(value = workerName,onValueChange = { workerName = it },label = "Worker Name",leadingIcon = Icons.Default.Person)
                        Spacer(Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp))
                        {
                            AppTextField(
                                value = dateFrom,
                                onValueChange = { dateFrom = it },
                                label = "From",
                                placeholder = "YYYY-MM-DD",
                                modifier = Modifier.weight(1f),
                                leadingIcon = Icons.Default.CalendarMonth
                            )

                            AppTextField(
                                value = dateTo,
                                onValueChange = { dateTo = it },
                                label = "To",
                                placeholder = "YYYY-MM-DD",
                                modifier = Modifier.weight(1f),
                                leadingIcon = Icons.Default.CalendarMonth
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Row(verticalAlignment = Alignment.CenterVertically,horizontalArrangement = Arrangement.spacedBy(8.dp))
                        {
                            Text("Sort",style = MaterialTheme.typography.bodyMedium,color = MaterialTheme.colorScheme.onSurfaceVariant)
                            FilterChip(selected = sortOrder == "desc",onClick = { sortOrder = "desc" },label = { Text("Newest") })
                            FilterChip(selected = sortOrder == "asc",onClick = { sortOrder = "asc" },label = { Text("Oldest") })
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            AppSecondaryButton(
                                text = "Clear",
                                onClick = {
                                    workerName = ""
                                    dateFrom = ""
                                    dateTo = ""
                                    sortOrder = "desc"
                                    loadAttendance()},
                                modifier = Modifier.weight(1f),
                                enabled = !isLoading
                            )
                            AppPrimaryButton(
                                text = "Apply Filters",
                                onClick = {
                                    loadAttendance()
                                    showFilters = false
                                          },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))

        // ── Records list ─────────────────────────────────────────────────────
        when {
            isLoading -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }

            records.isEmpty() -> {
                AppEmptyState(
                    title = "No attendance records",
                    message = "If you just started, records will appear here after check-in/out.",
                    icon = Icons.Default.EventNote,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            else -> {
                LazyColumn(
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 100.dp)
                ) {
                    items(records) { record ->
                        val encodedName = URLEncoder.encode(record.workerName, StandardCharsets.UTF_8.toString())
                        val normalizedStatus = record.status?.trim()?.lowercase(Locale.US)
                        val canDirectCheckout =
                            normalizedStatus == "checked_in" &&
                                record.checkOutTime.isNullOrBlank() &&
                                isTodayAttendanceDate(record.date)

                        AttendanceCard(
                            record = record,
                            showDirectCheckout = canDirectCheckout,
                            onDirectCheckout = {
                                navController.navigate("camera_checkout/${record.workerId}/$encodedName")
                            }
                        )
                        Spacer(Modifier.height(10.dp))
                    }
                }
            }
        }
    }
    }
}

private fun isTodayAttendanceDate(rawDate: String?): Boolean {
    if (rawDate.isNullOrBlank()) return false

    val trimmed = rawDate.trim()
    val today = todayAsIsoDate()

    // Fast path for common ISO date/timestamp payloads.
    if (trimmed == today || trimmed.startsWith("${today}T")) return true

    val knownFormats = listOf(
        "yyyy-MM-dd",
        "yyyy-MM-dd'T'HH:mm:ss",
        "yyyy-MM-dd'T'HH:mm:ss.SSS",
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    )

    for (pattern in knownFormats) {
        val formatter = SimpleDateFormat(pattern, Locale.US).apply {
            isLenient = false
            timeZone = if (pattern.endsWith("'Z'")) TimeZone.getTimeZone("UTC") else TimeZone.getDefault()
        }
        val parsed = runCatching { formatter.parse(trimmed) }.getOrNull() ?: continue
        if (dateToIso(parsed) == today) return true
    }

    return false
}

private fun todayAsIsoDate(): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
        timeZone = TimeZone.getDefault()
    }
    return formatter.format(Date())
}

private fun dateToIso(date: Date): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
        timeZone = TimeZone.getDefault()
    }
    return formatter.format(date)
}

// ── Attendance Card ───────────────────────────────────────────────────────────

@Composable
fun AttendanceCard(
    record: AttendanceEntity,
    showDirectCheckout: Boolean,
    onDirectCheckout: () -> Unit
) {

    val normalized = record.status?.trim()?.lowercase(Locale.US)

    val statusColor = when (normalized)
    {

        "checked_out" -> Color(0xFF1D4ED8)

        "checked_in" -> Color(0xFFF59E0B)

        "absent" -> Color(0xFFDC2626)

        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    val statusLabel = when (normalized) {
        "checked_out" -> "Checked Out"
        "checked_in" -> "Checked In"
        "absent" -> "Absent"
        else -> record.status ?: "—"
    }
    val formattedDate =
        try {java.time.LocalDate.parse(record.date).format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"))}
        catch (_: Exception) {record.date}

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {

            Row(modifier = Modifier.fillMaxWidth(),verticalAlignment = Alignment.CenterVertically)
            {
                Row(modifier = Modifier.weight(1f),verticalAlignment = Alignment.CenterVertically,horizontalArrangement = Arrangement.spacedBy(12.dp))
                {

                    val initials = record.workerName.split(" ").filter { it.isNotBlank() }.take(2).joinToString("") {it.first().uppercase()}.ifBlank { "?" }

                    Surface(
                        shape = RoundedCornerShape(16.dp),color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)) {
                        Box(modifier = Modifier.size(52.dp),contentAlignment = Alignment.Center) {
                            Text(initials,color = MaterialTheme.colorScheme.primary,fontWeight = FontWeight.Bold)
                        }
                    }
                    Column(modifier = Modifier.weight(1f))
                    {
                        Text(
                            text = record.workerName,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold,color = MaterialTheme.colorScheme.onSurface),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = record.workerId,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically,horizontalArrangement = Arrangement.spacedBy(8.dp))
                {
                    if (showDirectCheckout) {
                        Surface(
                            onClick = onDirectCheckout,
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
                        )
                        {
                            Icon(
                                imageVector = Icons.Default.Logout,
                                contentDescription = null,
                                modifier = Modifier.padding(10.dp).size(18.dp),
                                tint = MaterialTheme.colorScheme.primary)
                        }
                    }

                    StatusBadge(label = statusLabel, color = statusColor)
                }
            }

            Spacer(Modifier.height(12.dp))

            // Date + times row
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically)
            {
                AttendanceInfoChip(Icons.Default.CalendarMonth,formattedDate)
                Spacer(Modifier.weight(1f))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    record.checkInTime?.let  { AttendanceInfoChip(Icons.Default.Login,  it, AppPresent) }
                    record.checkOutTime?.let { AttendanceInfoChip(Icons.Default.Logout, it, AppAbsent) }
                }
            }

            // Hours + late
            if (record.totalHours != null || record.isLate == true)
            {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp))
                {
                    record.totalHours?.let {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = Color(0xFFEFF6FF)
                        ) {
                            Row(modifier = Modifier.padding(horizontal = 10.dp,vertical = 5.dp),verticalAlignment = Alignment.CenterVertically)
                            {
                                Icon(Icons.Default.Schedule,null,tint = Color(0xFF2563EB),modifier = Modifier.size(14.dp))

                                Spacer(Modifier.width(4.dp))

                                Text("%.1f hrs".format(it),color = Color(0xFF2563EB),style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                    if (record.isLate == true) {StatusBadge("Late", AppAbsent)}
                }
            }
        }
    }
}

@Composable
private fun AttendanceInfoChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: Color = AppTextSecondary
) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(icon, null, tint = color, modifier = Modifier.size(14.dp))
        Text(label, style = MaterialTheme.typography.bodySmall.copy(color = color, fontSize = 12.sp))
    }
}
