package com.wasim.attendancemanager.ui.workers

import android.widget.Toast
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wasim.attendancemanager.data.api.RetrofitInstance
import com.wasim.attendancemanager.data.local.AppPreferences
import com.wasim.attendancemanager.data.model.SiteWorker
import com.wasim.attendancemanager.ui.components.AppDividerLine
import com.wasim.attendancemanager.ui.components.SectionHeader
import com.wasim.attendancemanager.ui.components.StatusBadge
import com.wasim.attendancemanager.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun WorkersTabScreen() {

    val context = LocalContext.current
    val scope   = rememberCoroutineScope()

    var workers      by remember { mutableStateOf<List<SiteWorker>>(emptyList()) }
    var searchQuery  by remember { mutableStateOf("") }
    var statusFilter by remember { mutableStateOf<String?>(null) } // null = all
    var isLoading    by remember { mutableStateOf(true) }
    var selectedWorker by remember { mutableStateOf<SiteWorker?>(null) }

    fun fetchWorkers() {
        scope.launch {
            isLoading = true
            try {
                val resp = RetrofitInstance.getApi(context).getSiteWorkers(
                    search = searchQuery.ifBlank { null },
                    status = statusFilter
                )
                if (resp.isSuccessful) workers = resp.body() ?: emptyList()
                else Toast.makeText(context, "Failed to load workers", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { fetchWorkers() }

    // Show worker detail if selected
    selectedWorker?.let { worker ->
        WorkerDetailSheet(worker = worker, onBack = { selectedWorker = null })
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)   // was AppBackground
    ) {

        // ── Header ────────────────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(AppPrimary, AppPrimaryLight)))
                .padding(horizontal = 20.dp, vertical = 28.dp)
        ) {
            Column {
                Text("Workers", style = MaterialTheme.typography.labelLarge.copy(color = AppOnPrimary.copy(alpha = 0.75f)))
                Text(
                    "${workers.size} total",
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold, color = AppOnPrimary)
                )
            }
        }

        // ── Search + Filter ───────────────────────────────────────────────────
        Card(
            modifier  = Modifier.fillMaxWidth().padding(16.dp),
            shape     = RoundedCornerShape(16.dp),
            colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {

                OutlinedTextField(
                    value         = searchQuery,
                    onValueChange = { searchQuery = it },
                    label         = { Text("Search by name, mobile or ID") },
                    leadingIcon   = { Icon(Icons.Default.Search, null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
                    modifier      = Modifier.fillMaxWidth(),
                    singleLine    = true,
                    shape         = RoundedCornerShape(12.dp)
                )

                // Status filter chips
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected  = statusFilter == null,
                        onClick   = { statusFilter = null },
                        label     = { Text("All") }
                    )
                    FilterChip(
                        selected  = statusFilter == "active",
                        onClick   = { statusFilter = "active" },
                        label     = { Text("Active") }
                    )
                    FilterChip(
                        selected  = statusFilter == "inactive",
                        onClick   = { statusFilter = "inactive" },
                        label     = { Text("Inactive") }
                    )
                }

                Button(
                    onClick   = { fetchWorkers() },
                    modifier  = Modifier.fillMaxWidth(),
                    shape     = RoundedCornerShape(12.dp)
                ) { Text("Apply Filters") }
            }
        }

        // ── List ──────────────────────────────────────────────────────────────
        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AppPrimary)
            }
        } else if (workers.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.PeopleOutline, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("No workers found", style = MaterialTheme.typography.bodyLarge.copy(color = MaterialTheme.colorScheme.onSurfaceVariant))
                }
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 100.dp)) {
                items(workers) { worker ->
                    WorkerRow(worker = worker, onClick = { selectedWorker = worker })
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }
}

// ── Worker Row Card ───────────────────────────────────────────────────────────

@Composable
fun WorkerRow(worker: SiteWorker, onClick: () -> Unit) {

    val todayColor = when (worker.today_status) {
        "present"     -> AppPresent
        "checked_out" -> AppCheckedOut
        else          -> AppAbsent
    }
    val todayLabel = when (worker.today_status) {
        "present"     -> "Present"
        "checked_out" -> "Checked Out"
        else          -> "Absent"
    }
    val activeColor = if (worker.status == "active") AppPresent else AppInactive

    Card(
        modifier  = Modifier.fillMaxWidth().clickable { onClick() },
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier              = Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment     = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Avatar
            Box(
                modifier         = Modifier.size(46.dp).clip(CircleShape).background(AppPrimary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text  = worker.full_name.firstOrNull()?.uppercase() ?: "?",
                    style = MaterialTheme.typography.titleMedium.copy(color = AppPrimary, fontWeight = FontWeight.Bold)
                )
            }

            // Info
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(worker.full_name, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface))
                Text(worker.id,       style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp))
            }

            // Badges
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                // Active / Inactive status dot
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.size(8.dp).clip(CircleShape).background(activeColor))
                    Text(worker.status.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelSmall.copy(color = activeColor, fontWeight = FontWeight.Medium))
                }
                // Today attendance badge (only for active)
                if (worker.status == "active") {
                    StatusBadge(label = todayLabel, color = todayColor)
                }
            }
        }
    }
}

// ── Worker Detail ─────────────────────────────────────────────────────────────

@Composable
fun WorkerDetailSheet(worker: SiteWorker, onBack: () -> Unit) {
    val context    = LocalContext.current
    val prefs      = remember { AppPreferences(context) }
    val currCode   = prefs.currency
    fun fmtMoney(amount: Double) = AppPreferences.formatMoney(amount, currCode)

    val todayColor = when (worker.today_status) {
        "present"     -> AppPresent
        "checked_out" -> AppCheckedOut
        else          -> AppAbsent
    }
    val todayLabel = when (worker.today_status) {
        "present"     -> "Present"
        "checked_out" -> "Checked Out"
        else          -> "Absent"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
    ) {
        // ── Header ────────────────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(AppPrimary, AppPrimaryLight)))
                .padding(horizontal = 16.dp, vertical = 20.dp)
        ) {
            IconButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart)) {
                Icon(Icons.Default.ArrowBack, "Back", tint = AppOnPrimary)
            }
            Text(
                "Worker Profile",
                style    = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = AppOnPrimary),
                modifier = Modifier.align(Alignment.Center)
            )
        }

        // ── Avatar + Name ─────────────────────────────────────────────────────
        Column(
            modifier            = Modifier.fillMaxWidth().padding(top = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(88.dp)
                    .shadow(8.dp, CircleShape, ambientColor = AppPrimary.copy(alpha = 0.2f))
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(AppPrimary, AppPrimaryLight))),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text  = worker.full_name.firstOrNull()?.uppercase() ?: "?",
                    style = MaterialTheme.typography.headlineMedium.copy(color = Color.White, fontWeight = FontWeight.Bold)
                )
            }

            Spacer(Modifier.height(12.dp))

            Text(worker.full_name, style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground))
            Spacer(Modifier.height(4.dp))
            Text(worker.id, style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.onSurfaceVariant))

            Spacer(Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusBadge(label = worker.status.replaceFirstChar { it.uppercase() }, color = if (worker.status == "active") AppPresent else AppInactive)
                if (worker.status == "active") StatusBadge(label = todayLabel, color = todayColor)
            }
        }

        Spacer(Modifier.height(28.dp))

        // ── Info Card ─────────────────────────────────────────────────────────
        Card(
            modifier  = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape     = RoundedCornerShape(16.dp),
            colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column {
                InfoRow(Icons.Default.Badge,         "Employee ID",   worker.id)
                AppDividerLine()
                InfoRow(Icons.Default.Phone,         "Mobile",        worker.mobile)
                AppDividerLine()
                InfoRow(Icons.Default.Work,          "Role",          worker.role?.replaceFirstChar { it.uppercase() } ?: "—")
                AppDividerLine()
                InfoRow(Icons.Default.Category,      "Type",          worker.type?.replaceFirstChar { it.uppercase() } ?: "—")
                AppDividerLine()
                InfoRow(Icons.Default.CalendarMonth, "Joining Date",  worker.joining_date ?: "—")
                worker.daily_rate?.let    { AppDividerLine(); InfoRow(Icons.Default.AttachMoney, "Daily Rate",     fmtMoney(it)) }
                worker.hourly_rate?.let   { AppDividerLine(); InfoRow(Icons.Default.AttachMoney, "Hourly Rate",    fmtMoney(it)) }
                worker.monthly_salary?.let{ AppDividerLine(); InfoRow(Icons.Default.AttachMoney, "Monthly Salary", fmtMoney(it)) }
            }
        }
        Spacer(Modifier.height(100.dp))
    }
}

@Composable
private fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(
        modifier              = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment     = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(icon, null, tint = AppPrimary, modifier = Modifier.size(20.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelSmall.copy(color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp))
            Text(value, style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Medium))
        }
    }
}
