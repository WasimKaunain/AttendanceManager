package com.attendcrew.app.ui.workers

import com.attendcrew.app.ui.components.AppDividerLine
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.navigation.NavController
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.attendcrew.app.data.local.AppPreferences
import com.attendcrew.app.data.model.SiteWorker
import com.attendcrew.app.ui.components.AppCard
import com.attendcrew.app.ui.components.AppEmptyState
import com.attendcrew.app.ui.components.AppPrimaryButton
import com.attendcrew.app.ui.components.AppSectionTitle
import com.attendcrew.app.ui.components.AppTextField
import com.attendcrew.app.ui.components.StatusBadge
import com.attendcrew.app.ui.theme.*
import com.attendcrew.app.data.local.db.siteworker.SiteWorkerRepository
import com.attendcrew.app.data.local.db.siteworker.SiteWorkerEntity
import com.attendcrew.app.data.local.db.WorkerSyncer
import com.attendcrew.app.data.local.db.WorkerEntity
import com.attendcrew.app.data.local.db.siteworker.SiteWorkerSyncer
import com.attendcrew.app.data.local.db.AttendanceEntity
import com.attendcrew.app.data.local.db.AttendanceRepository
import com.attendcrew.app.data.local.TokenManager
import com.attendcrew.app.data.api.RetrofitInstance
import kotlinx.coroutines.launch
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import com.attendcrew.app.R
import java.time.LocalDate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll

@Composable
fun WorkersTabScreen(navController: NavController) {
    val context = LocalContext.current
    val repository = remember {SiteWorkerRepository(context)}
    val scope = rememberCoroutineScope()
    var workers by remember { mutableStateOf<List<SiteWorkerEntity>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }
    var statusFilter by remember { mutableStateOf<String?>(null) }
    var pendingEnrollmentOnly by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedWorker by remember { mutableStateOf<SiteWorkerEntity?>(null) }
    val scrollState = rememberScrollState()
    val showFloatingFilter = scrollState.value > 300

    val displayedWorkers = remember(workers, pendingEnrollmentOnly) {
        if (pendingEnrollmentOnly) workers.filter { it.photoUrl.isNullOrBlank() } else workers
    }
    val totalWorkers = workers.size

    val activeWorkers =workers.count {it.status.equals("active", true)}

    val facePendingWorkers =workers.count {it.photoUrl.isNullOrBlank()}

    val newThisMonth =
        workers.count {
            try {
                val today = java.time.LocalDate.now()
                val joining = it.joiningDate?.let { date -> LocalDate.parse(date)} ?: return@count false

                joining.monthValue == today.monthValue &&
                        joining.year == today.year

            } catch (_: Exception) {
                false
            }
        }

    fun loadWorkers() {
        scope.launch {

            isLoading = true

            try {
                workers = repository.getFiltered(search = searchQuery.ifBlank { null },status = statusFilter)

            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        // Show cached workers immediately
        loadWorkers()

        // Sync in background
        runCatching {WorkerSyncer.syncWorkers(context,incremental = true)}

        runCatching {SiteWorkerSyncer.syncWorkers(context)}

        // Reload after sync completes
        loadWorkers()
    }

    LaunchedEffect(searchQuery,statusFilter,pendingEnrollmentOnly) {
        loadWorkers()
    }

    // Show worker detail if selected
    selectedWorker?.let { worker ->
        WorkerDetailSheet(worker = worker, navController=navController, onBack = { selectedWorker = null })
        return
    }
    Box(modifier = Modifier.fillMaxSize())
    {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(scrollState)) {

            // ── Header (premium gradient using new theme) ────────────────────────
            Box(modifier = Modifier.fillMaxWidth().height(260.dp))
            {
                    Image(
                        painter = painterResource(R.drawable.hero_workers),
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )

                Column(
                    modifier = Modifier.align(Alignment.TopStart)
                        .padding(start = 24.dp, top = 110.dp, end = 120.dp)
                ) {

                    Text(
                        text = "Workers",
                        color = Color.White,
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Manage your site workforce",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            //Stats Cards
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBF5)),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
            )
            {
                Row(
                    modifier = Modifier.fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 18.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                )
                {
                    WorkerStatItem(
                        icon = Icons.Default.People,
                        value = totalWorkers.toString(),
                        label = "Total Workers",
                        tint = Color(0xFF4F46E5)
                    )
                    VerticalDivider()
                    WorkerStatItem(
                        icon = Icons.Default.CheckCircle,
                        value = activeWorkers.toString(),
                        label = "Active",
                        tint = Color(0xFF10B981)
                    )
                    VerticalDivider()
                    WorkerStatItem(
                        icon = Icons.Default.PersonAdd,
                        value = newThisMonth.toString(),
                        label = "New This Month",
                        tint = Color(0xFFEF4444)
                    )
                    VerticalDivider()
                    WorkerStatItem(
                        icon = Icons.Default.Face,
                        value = facePendingWorkers.toString(),
                        label = "Face Pending",
                        tint = Color(0xFFF59E0B)
                    )
                }
            }
            Spacer(Modifier.height(16.dp))

            // ── Filters ──────────────────────────────────────────────────────────
            AppCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {

                AppSectionTitle("Find Workers")

                AppTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = "Search Workers",
                    placeholder = "Search by name, ID or mobile",
                    leadingIcon = Icons.Default.Search
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    FilterChip(
                        selected = statusFilter == null,
                        onClick = { statusFilter = null },
                        label = { Text("All") })
                    FilterChip(
                        selected = statusFilter == "active",
                        onClick = { statusFilter = "active" },
                        label = { Text("Active") })
                    FilterChip(
                        selected = statusFilter == "inactive",
                        onClick = { statusFilter = "inactive" },
                        label = { Text("Inactive") })
                    FilterChip(
                        selected = pendingEnrollmentOnly,
                        onClick = { pendingEnrollmentOnly = !pendingEnrollmentOnly },
                        label = { Text("Face Pending") })
                }
                Spacer(Modifier.height(8.dp))
            }

            Spacer(Modifier.height(12.dp))

            // ── List / states ─────────────────────────────────────────────────────
            when {
                isLoading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }

                displayedWorkers.isEmpty() -> {
                    AppEmptyState(
                        title = "No workers found",
                        message = "Try clearing filters or searching with a different keyword.",
                        icon = Icons.Default.PeopleOutline,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                else -> {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 100.dp)
                    )
                    {
                        displayedWorkers.forEach { worker ->

                            WorkerRow(worker = worker,onClick = {selectedWorker = worker},

                                onFaceEnrollClick = { selectedWorker ->
                                    val encodedName =java.net.URLEncoder.encode(selectedWorker.fullName,java.nio.charset.StandardCharsets.UTF_8.toString())
                                    navController.navigate("camera_enroll/${selectedWorker.id}/$encodedName")
                                }
                            )

                            Spacer(Modifier.height(10.dp))
                        }
                    }
                }
            }
        }
        if (showFloatingFilter) {

            AppCard(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {

                AppTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = "Search Workers",
                    placeholder = "Search by name, ID or mobile",
                    leadingIcon = Icons.Default.Search
                )
            }
        }
    }
}

@Composable
private fun VerticalDivider() {
    Box(
        modifier = Modifier
            .width(1.dp)
            .height(90.dp)
            .background(
                MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
            )
    )
}
@Composable
private fun WorkerStatItem(icon: ImageVector,value: String,label: String,tint: Color)
{
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {

        Surface(
            shape = CircleShape,
            color = tint.copy(alpha = 0.12f)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = tint,
                modifier = Modifier
                    .padding(12.dp)
                    .size(24.dp)
            )
        }

        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

// ── Worker Row Card ───────────────────────────────────────────────────────────

@Composable
fun WorkerRow(worker: SiteWorkerEntity,onClick: () -> Unit,onFaceEnrollClick: (SiteWorkerEntity) -> Unit) {

    val todayColor = when (worker.todayStatus) {
        "present" -> StatusSuccess
        "checked_out" -> StatusWarning
        else -> StatusError
    }
    val todayLabel = when (worker.todayStatus) {
        "present" -> "Present"
        "checked_out" -> "Checked Out"
        else -> "Absent"
    }

    val isEnrollmentPending = worker.photoUrl.isNullOrBlank()
    val initials =worker.fullName.split(" ").take(2).joinToString("") {it.first().uppercase()}
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        border = BorderStroke(1.dp,Color(0xFFF1F5F9))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Avatar
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = Color(0xFFEFF6FF)
            ) {
                Box(
                    modifier = Modifier.size(56.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = initials.ifBlank { "?" },
                        style = MaterialTheme.typography.titleMedium.copy(
                            color = Color(0xFF2563EB),
                            fontWeight = FontWeight.SemiBold
                        )
                    )
                }
            }

            // Info
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        worker.fullName,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Text(
                    worker.id,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (!worker.role.isNullOrBlank()) {

                    Spacer(Modifier.height(4.dp))
                    Row {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = Color(0xFFEFF6FF)
                        ) {
                            Text(
                                text = worker.role,
                                modifier = Modifier.padding(horizontal = 10.dp,vertical = 4.dp),
                                color = Color(0xFF1D4ED8),
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                }
            }

            // Right side
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {

                if (isEnrollmentPending) {

                    Surface(
                        onClick = {
                            onFaceEnrollClick(worker)
                        },
                        shape = RoundedCornerShape(50),
                        color = Color(0xFFFFF7ED)
                    ) {
                        Row(modifier = Modifier.padding(horizontal = 10.dp,vertical = 6.dp),verticalAlignment = Alignment.CenterVertically)
                        {
                            Icon(imageVector = Icons.Default.WarningAmber,contentDescription = null,tint = Color(0xFFF59E0B),modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(text = "Enroll Face",color = Color(0xFFF59E0B),style = MaterialTheme.typography.labelSmall,fontWeight = FontWeight.Medium)
                            Spacer(Modifier.width(2.dp))
                            Icon(imageVector = Icons.Default.ArrowForward,contentDescription = null,tint = Color(0xFFF59E0B),modifier = Modifier.size(12.dp))
                        }
                    }
                }
                StatusBadge(label = todayLabel,color = todayColor)
            }
        }
    }
}

// ── Worker Detail ─────────────────────────────────────────────────────────────

@Composable
fun WorkerDetailSheet(worker: SiteWorkerEntity, navController:NavController, onBack: () -> Unit) {
    val context    = LocalContext.current
    val prefs      = remember { AppPreferences(context) }
    val tokenManager = remember { TokenManager(context) }
    val isAdmin =tokenManager.getRole()?.equals("admin", ignoreCase = true) == true
    val currCode   = prefs.currency
    fun fmtMoney(amount: Double) = AppPreferences.formatMoney(amount, currCode)

    val hasProfilePhoto = !worker.photoUrl.isNullOrBlank()
    var profilePhotoUrl by remember(worker.id) { mutableStateOf<String?>(null) }
    var isPhotoLoading by remember(worker.id, worker.photoUrl) { mutableStateOf(hasProfilePhoto) }
    var attendanceRecords by remember {mutableStateOf<List<AttendanceEntity>>(emptyList())}

    LaunchedEffect(worker.id, worker.photoUrl) {
        if (!hasProfilePhoto) {
            profilePhotoUrl = null
            isPhotoLoading = false
            return@LaunchedEffect
        }

        isPhotoLoading = true
        profilePhotoUrl = null

        try {
            val response = RetrofitInstance.getApi(context).getWorkerPhoto(worker.id)
            profilePhotoUrl = if (response.isSuccessful) response.body()?.url else null
        } catch (_: Exception) {
            profilePhotoUrl = null
        } finally {
            isPhotoLoading = false
        }
    }

    LaunchedEffect(worker.id) {

        val repo = AttendanceRepository(context)

        attendanceRecords =
            repo.getByWorker(worker.id)
    }

    val todayColor = when (worker.todayStatus) {
        "present"     -> StatusSuccess
        "checked_out" -> StatusWarning
        else          -> StatusError
    }
    val todayLabel = when (worker.todayStatus) {
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
                .height(180.dp)
                .background(Brush.verticalGradient(colors = listOf(Color(0xFF004B93),Color(0xFF0A5FB4),Color(0xFF1E73D8))))
        ) {
            Surface(
                modifier = Modifier.align(Alignment.TopStart).padding(start = 16.dp, top = 50.dp),
                shape = CircleShape,
                color = Color.White.copy(alpha = 0.18f)
            )
            {
                IconButton(
                    onClick = onBack
                ) {
                    Icon(imageVector = Icons.Default.ArrowBack,contentDescription = "Back",tint = Color.White)
                }
            }
            Text(
                "Worker Profile",
                style    = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimary),
                modifier = Modifier.align(Alignment.Center)
            )
        }

        // ── Avatar + Name ─────────────────────────────────────────────────────
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .offset(y = (-40).dp),
            shape = RoundedCornerShape(28.dp),
            elevation = CardDefaults.cardElevation(
                defaultElevation = 8.dp
            )
        )
        {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {

                WorkerProfileAvatar(
                    fullName = worker.fullName,
                    imageUrl = profilePhotoUrl,
                    isLoading = isPhotoLoading
                )

                Spacer(Modifier.height(16.dp))

                Text(
                    text = worker.fullName,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )

                Spacer(Modifier.height(4.dp))

                Text(
                    text = worker.id,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(Modifier.height(16.dp))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {

                    StatusBadge(
                        label = todayLabel,
                        color = todayColor
                    )
                }
            }
        }

        Spacer(Modifier.height((-10).dp))

        // ── Info Card ─────────────────────────────────────────────────────────
        Text(
            text = "Worker Information",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 20.dp)
        )

        Spacer(Modifier.height(10.dp))

        ElevatedCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(24.dp),
            elevation = CardDefaults.elevatedCardElevation(
                defaultElevation = 6.dp
            )
        )
        {
            Column {

                InfoRow(
                    Icons.Default.Badge,
                    "Employee ID",
                    worker.id
                )

                AppDividerLine()

                InfoRow(
                    Icons.Default.Phone,
                    "Mobile",
                    worker.mobile
                )

                AppDividerLine()

                InfoRow(
                    Icons.Default.Work,
                    "Role",
                    worker.role ?: "-"
                )

                AppDividerLine()

                InfoRow(
                    Icons.Default.Category,
                    "Type",
                    worker.type ?: "-"
                )

                AppDividerLine()

                InfoRow(
                    Icons.Default.CalendarMonth,
                    "Joining Date",
                    worker.joiningDate ?: "-"
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        if (isAdmin) {

            Text(
                text = "Compensation Details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 20.dp)
            )

            Spacer(Modifier.height(10.dp))

            ElevatedCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                shape = RoundedCornerShape(24.dp),
                elevation = CardDefaults.elevatedCardElevation(
                    defaultElevation = 6.dp
                )
            )
            {
                Column {

                    worker.dailyRate?.let {

                        InfoRow(
                            Icons.Default.AttachMoney,
                            "Daily Rate",
                            fmtMoney(it)
                        )
                    }

                    worker.hourlyRate?.let {

                        AppDividerLine()

                        InfoRow(
                            Icons.Default.AttachMoney,
                            "Hourly Rate",
                            fmtMoney(it)
                        )
                    }

                    worker.monthlySalary?.let {

                        AppDividerLine()

                        InfoRow(
                            Icons.Default.AttachMoney,
                            "Monthly Salary",
                            fmtMoney(it)
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        Text(
            text = "Attendance Summary",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 20.dp)
        )


        Spacer(Modifier.height(20.dp))

        Button(
            onClick = {

                val encodedName =
                    java.net.URLEncoder.encode(
                        worker.fullName,
                        java.nio.charset.StandardCharsets.UTF_8.toString()
                    )

                navController.navigate("worker_attendance/${worker.id}/$encodedName")
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(56.dp),
            shape = RoundedCornerShape(18.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CalendarMonth,
                contentDescription = null
            )

            Spacer(Modifier.width(8.dp))

            Text("View Attendance Calendar")
        }
        Spacer(Modifier.height(100.dp))


    }
}

@Composable
private fun WorkerProfileAvatar(
    fullName: String,
    imageUrl: String?,
    isLoading: Boolean
) {
    Box(
        modifier = Modifier
            .size(110.dp)
            .shadow(8.dp, CircleShape, ambientColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
            .clip(CircleShape)
            .border(width = 4.dp,color = Color.White,shape = CircleShape)
            .background(Brush.linearGradient(listOf(MaterialTheme.colorScheme.primary, MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)))),
        contentAlignment = Alignment.Center
    ) {
        if (!imageUrl.isNullOrBlank()) {
            AsyncImage(
                model = imageUrl,
                contentDescription = "Worker profile photo",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        } else {
            val initials = fullName.split(" ").take(2).joinToString(""){it.first().uppercase()}
            Text(
                text  = initials.ifBlank { "?" },
                style = MaterialTheme.typography.headlineMedium.copy(color = Color.White, fontWeight = FontWeight.Bold)
            )
        }

        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        }
    }
}

@Composable
private fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(
        modifier              = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment     = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelSmall.copy(color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp))
            Text(value, style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Medium))
        }
    }
}

