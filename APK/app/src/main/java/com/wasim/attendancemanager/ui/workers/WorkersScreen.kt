package com.wasim.attendancemanager.ui.workers

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.wasim.attendancemanager.data.api.RetrofitInstance
import com.wasim.attendancemanager.data.model.WorkerResponse
import com.wasim.attendancemanager.ui.theme.*
import kotlinx.coroutines.launch
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Composable
fun WorkersScreen(
    navController: NavController,
    mode: String
) {
    var workers     by remember { mutableStateOf<List<WorkerResponse>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }
    var isLoading   by remember { mutableStateOf(false) }

    val scope   = rememberCoroutineScope()
    val context = LocalContext.current

    fun fetchWorkers() {
        scope.launch {
            isLoading = true
            try {
                val response = RetrofitInstance.getApi(context)
                    .getWorkers(search = searchQuery.ifBlank { null })
                if (response.isSuccessful) {
                    workers = response.body() ?: emptyList()
                } else {
                    Toast.makeText(context, "Failed to load workers", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { fetchWorkers() }

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
                Text(
                    text = when (mode) {
                        "enroll"  -> "Face Enrollment"
                        "checkin" -> "Check In"
                        else      -> "Check Out"
                    },
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Bold, color = AppOnPrimary
                    )
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text  = "Select a worker to continue",
                    style = MaterialTheme.typography.bodyMedium.copy(color = AppOnPrimary.copy(alpha = 0.8f))
                )
            }
        }

        // ── Search Card ───────────────────────────────────────────────────────
        Card(
            modifier  = Modifier.fillMaxWidth().padding(16.dp),
            shape     = RoundedCornerShape(16.dp),
            colors    = CardDefaults.cardColors(containerColor = AppSurface),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value         = searchQuery,
                    onValueChange = { searchQuery = it },
                    label         = { Text("Search by name, mobile or ID") },
                    leadingIcon   = { Icon(Icons.Default.Search, null, tint = AppTextSecondary) },
                    modifier      = Modifier.fillMaxWidth(),
                    singleLine    = true,
                    shape         = RoundedCornerShape(12.dp)
                )
                Button(
                    onClick  = { fetchWorkers() },
                    modifier = Modifier.fillMaxWidth(),
                    shape    = RoundedCornerShape(12.dp),
                    colors   = ButtonDefaults.buttonColors(containerColor = AppPrimary)
                ) { Text("Search") }
            }
        }

        // ── Worker List ───────────────────────────────────────────────────────
        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AppPrimary)
            }
        } else if (workers.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.PeopleOutline, null, tint = AppTextSecondary, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("No workers found", style = MaterialTheme.typography.bodyLarge.copy(color = AppTextSecondary))
                }
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 24.dp)) {
                items(workers) { worker ->
                    val encodedName = URLEncoder.encode(worker.full_name, StandardCharsets.UTF_8.toString())
                    WorkerPickerItem(worker = worker) {
                        when (mode) {
                            "enroll"  -> navController.navigate("camera_enroll/${worker.id}/$encodedName")
                            "checkin" -> navController.navigate("camera_checkin/${worker.id}/$encodedName")
                            else      -> navController.navigate("camera_checkout/${worker.id}/$encodedName")
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }
}

// ── Worker Picker Row Card ────────────────────────────────────────────────────

@Composable
fun WorkerPickerItem(worker: WorkerResponse, onClick: () -> Unit) {
    Card(
        modifier  = Modifier.fillMaxWidth().clickable { onClick() },
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = AppSurface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier          = Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Avatar circle
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
                Text(worker.full_name, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold, color = AppTextPrimary))
                Text("ID: ${worker.id}", style = MaterialTheme.typography.bodySmall.copy(color = AppTextSecondary, fontSize = 11.sp))
                Text("📱 ${worker.mobile}", style = MaterialTheme.typography.bodySmall.copy(color = AppTextSecondary, fontSize = 11.sp))
            }

            // Status badge
            if (worker.status != null) {
                val badgeColor = if (worker.status == "active") AppPresent else AppInactive
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(badgeColor.copy(alpha = 0.12f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text  = worker.status.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelSmall.copy(color = badgeColor, fontWeight = FontWeight.SemiBold)
                    )
                }
            }

            Icon(Icons.Default.ChevronRight, null, tint = AppTextSecondary, modifier = Modifier.size(18.dp))
        }
    }
}



@Composable
fun WorkersScreen(
    navController: NavController,
    mode: String
) {
    var workers by remember { mutableStateOf<List<WorkerResponse>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedSite by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    fun fetchWorkers() {
        scope.launch {
            isLoading = true
            try {
                val response = RetrofitInstance.getApi(context)
                    .getWorkers(
                        search = if (searchQuery.isBlank()) null else searchQuery,
                        siteId = selectedSite
                    )

                if (response.isSuccessful && response.body() != null) {
                    workers = response.body()!!
                } else {
                    Toast.makeText(context, "Failed to load workers", Toast.LENGTH_SHORT).show()
                }

            } catch (e: Exception) {
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchWorkers()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {

        // 🔷 Premium Gradient Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xFF6A11CB),
                            Color(0xFF2575FC)
                        )
                    )
                )
                .padding(vertical = 36.dp),
            contentAlignment = Alignment.Center
        ) {

            Column(horizontalAlignment = Alignment.CenterHorizontally) {

                Text(
                    text = when (mode) {
                        "enroll" -> "Face Enrollment"
                        "checkin" -> "Check In"
                        else -> "Check Out"
                    },
                    style = MaterialTheme.typography.headlineLarge,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Select a worker to continue",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.85f)
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // 🔷 Search + Filter Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {

            Column(modifier = Modifier.padding(18.dp)) {

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = { Text("Search by Name / Mobile / ID") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = selectedSite ?: "",
                    onValueChange = { selectedSite = it },
                    label = { Text("Filter by Site ID (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = { fetchWorkers() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Apply Filters")
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // 🔷 Worker List Section
        if (isLoading) {

            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }

        } else {

            if (workers.isEmpty()) {

                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No workers found",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

            } else {

                LazyColumn(
                    contentPadding = PaddingValues(
                        start = 12.dp,
                        end = 12.dp,
                        bottom = 24.dp
                    )
                ) {
                    items(workers) { worker ->

                        val encodedName = URLEncoder.encode(
                            worker.full_name,
                            StandardCharsets.UTF_8.toString()
                        )

                        WorkerItem(worker = worker) {

                            when (mode) {
                                "enroll" ->
                                    navController.navigate("camera_enroll/${worker.id}/$encodedName")

                                "checkin" ->
                                    navController.navigate("camera_checkin/${worker.id}/$encodedName")

                                else ->
                                    navController.navigate("camera_checkout/${worker.id}/$encodedName")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun WorkerItem(
    worker: WorkerResponse,
    onClick: () -> Unit
) {

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 10.dp
        ),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {

            // 🔹 Left side – Worker Info
            Column(
                modifier = Modifier.weight(1f)
            ) {

                Text(
                    text = worker.full_name,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "ID: ${worker.id}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Text(
                    text = "Mobile: ${worker.mobile}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // 🔹 Optional Status Badge
            if (worker.status != null) {

                Spacer(modifier = Modifier.width(12.dp))

                Box(
                    modifier = Modifier
                        .background(
                            color = if (worker.status == "active")
                                Color(0xFF4CAF50)
                            else
                                Color(0xFFF44336),
                            shape = RoundedCornerShape(50)
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = worker.status.uppercase(),
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.White
                    )
                }
            }
        }
    }
}
