package com.wasim.attendancemanager.ui.attendance

import android.widget.Toast
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wasim.attendancemanager.data.api.RetrofitInstance
import com.wasim.attendancemanager.data.model.AttendanceRecord
import com.wasim.attendancemanager.ui.components.AppDividerLine
import com.wasim.attendancemanager.ui.components.SectionHeader
import com.wasim.attendancemanager.ui.components.StatusBadge
import com.wasim.attendancemanager.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun AttendanceTabScreen() {

    val context = LocalContext.current
    val scope   = rememberCoroutineScope()

    var records      by remember { mutableStateOf<List<AttendanceRecord>>(emptyList()) }
    var isLoading    by remember { mutableStateOf(true) }
    var showFilters  by remember { mutableStateOf(false) }

    // Filter state
    var workerName   by remember { mutableStateOf("") }
    var dateFrom     by remember { mutableStateOf("") }
    var dateTo       by remember { mutableStateOf("") }
    var sortOrder    by remember { mutableStateOf("desc") }

    fun fetchAttendance() {
        scope.launch {
            isLoading = true
            try {
                val resp = RetrofitInstance.getApi(context).getSiteAttendance(
                    workerName = workerName.ifBlank { null },
                    dateFrom   = dateFrom.ifBlank { null },
                    dateTo     = dateTo.ifBlank { null },
                    sortOrder  = sortOrder
                )
                if (resp.isSuccessful) records = resp.body() ?: emptyList()
                else Toast.makeText(context, "Failed to load attendance", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { fetchAttendance() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBackground)
    ) {

        // ── Header ────────────────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(AppPrimary, AppPrimaryLight)))
                .padding(horizontal = 20.dp, vertical = 28.dp)
        ) {
            Column {
                Text("Attendance", style = MaterialTheme.typography.labelLarge.copy(color = AppOnPrimary.copy(alpha = 0.75f)))
                Text(
                    "${records.size} records",
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold, color = AppOnPrimary)
                )
            }
            IconButton(
                onClick  = { showFilters = !showFilters },
                modifier = Modifier.align(Alignment.CenterEnd)
            ) {
                Icon(
                    if (showFilters) Icons.Default.FilterListOff else Icons.Default.FilterList,
                    contentDescription = "Filter",
                    tint = AppOnPrimary
                )
            }
        }

        // ── Filter Panel ──────────────────────────────────────────────────────
        if (showFilters) {
            Card(
                modifier  = Modifier.fillMaxWidth().padding(16.dp),
                shape     = RoundedCornerShape(16.dp),
                colors    = CardDefaults.cardColors(containerColor = AppSurface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {

                    SectionHeader("Filters")

                    OutlinedTextField(
                        value         = workerName,
                        onValueChange = { workerName = it },
                        label         = { Text("Worker Name") },
                        leadingIcon   = { Icon(Icons.Default.Person, null, tint = AppTextSecondary) },
                        modifier      = Modifier.fillMaxWidth(),
                        singleLine    = true,
                        shape         = RoundedCornerShape(12.dp)
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value         = dateFrom,
                            onValueChange = { dateFrom = it },
                            label         = { Text("From (YYYY-MM-DD)") },
                            modifier      = Modifier.weight(1f),
                            singleLine    = true,
                            shape         = RoundedCornerShape(12.dp)
                        )
                        OutlinedTextField(
                            value         = dateTo,
                            onValueChange = { dateTo = it },
                            label         = { Text("To (YYYY-MM-DD)") },
                            modifier      = Modifier.weight(1f),
                            singleLine    = true,
                            shape         = RoundedCornerShape(12.dp)
                        )
                    }

                    // Sort order
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("Sort:", style = MaterialTheme.typography.bodyMedium.copy(color = AppTextSecondary))
                        FilterChip(
                            selected = sortOrder == "desc",
                            onClick  = { sortOrder = "desc" },
                            label    = { Text("Newest First") }
                        )
                        FilterChip(
                            selected = sortOrder == "asc",
                            onClick  = { sortOrder = "asc" },
                            label    = { Text("Oldest First") }
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick   = {
                                workerName = ""; dateFrom = ""; dateTo = ""; sortOrder = "desc"
                                fetchAttendance()
                            },
                            modifier  = Modifier.weight(1f),
                            shape     = RoundedCornerShape(12.dp)
                        ) { Text("Clear") }

                        Button(
                            onClick  = { fetchAttendance() },
                            modifier = Modifier.weight(1f),
                            shape    = RoundedCornerShape(12.dp)
                        ) { Text("Apply") }
                    }
                }
            }
        }

        // ── Records List ──────────────────────────────────────────────────────
        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AppPrimary)
            }
        } else if (records.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.EventNote, null, tint = AppTextSecondary, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("No attendance records", style = MaterialTheme.typography.bodyLarge.copy(color = AppTextSecondary))
                }
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 100.dp)) {
                items(records) { record ->
                    AttendanceCard(record = record)
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }
}

// ── Attendance Card ───────────────────────────────────────────────────────────

@Composable
fun AttendanceCard(record: AttendanceRecord) {

    val statusColor = when (record.status) {
        "checked_out" -> AppPresent
        "checked_in"  -> AppCheckedOut
        "absent"      -> AppAbsent
        else          -> AppInactive
    }
    val statusLabel = when (record.status) {
        "checked_out" -> "Checked Out"
        "checked_in"  -> "Checked In"
        "absent"      -> "Absent"
        else          -> record.status ?: "—"
    }

    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = AppSurface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {

            // Top row: name + status badge
            Row(
                modifier      = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text  = record.worker_name,
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.SemiBold, color = AppTextPrimary
                        )
                    )
                    Text(
                        text  = record.worker_id,
                        style = MaterialTheme.typography.bodySmall.copy(color = AppTextSecondary, fontSize = 11.sp)
                    )
                }
                StatusBadge(statusLabel, statusColor)
            }

            Spacer(Modifier.height(10.dp))
            HorizontalDivider(color = AppDivider, thickness = 1.dp)
            Spacer(Modifier.height(10.dp))

            // Date + times row
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                AttendanceInfoChip(Icons.Default.CalendarToday, record.date)

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    record.check_in_time?.let  { AttendanceInfoChip(Icons.Default.Login,  it, AppPresent) }
                    record.check_out_time?.let { AttendanceInfoChip(Icons.Default.Logout, it, AppAbsent) }
                }
            }

            // Hours + late
            if (record.total_hours != null || record.is_late == true) {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    record.total_hours?.let {
                        AttendanceInfoChip(Icons.Default.Schedule, "%.1f hrs".format(it))
                    }
                    if (record.is_late == true) {
                        StatusBadge("Late", AppAbsent)
                    }
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

