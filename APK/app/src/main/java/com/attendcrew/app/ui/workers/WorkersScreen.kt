package com.attendcrew.app.ui.workers

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.attendcrew.app.data.api.RetrofitInstance
import com.attendcrew.app.data.model.WorkerResponse
import com.attendcrew.app.ui.components.AppCard
import com.attendcrew.app.ui.components.AppEmptyState
import com.attendcrew.app.ui.components.AppPrimaryButton
import com.attendcrew.app.ui.components.AppSectionTitle
import com.attendcrew.app.ui.components.AppTextField
import com.attendcrew.app.ui.theme.*
import kotlinx.coroutines.launch
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import com.attendcrew.app.data.local.db.siteworker.SiteWorkerRepository
import com.attendcrew.app.data.local.db.siteworker.SiteWorkerEntity
import androidx.compose.ui.res.painterResource
import com.attendcrew.app.R
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.material.icons.automirrored.filled.ArrowBack

@Composable
fun WorkersScreen(
    navController: NavController,
    mode: String
) {
    val context = LocalContext.current
    var workers by remember {mutableStateOf<List<SiteWorkerEntity>>(emptyList())}
    var searchQuery by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val repository = remember {SiteWorkerRepository(context)}
    val scope = rememberCoroutineScope()


    fun loadWorkers() {
        scope.launch {

            isLoading = true

            try {

                var result = repository.getFiltered(search = searchQuery.ifBlank { null },status = "active")
                if (mode == "enroll")
                {
                    result = result.filter {it.photoUrl.isNullOrBlank()}
                }
                workers = result

            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(mode)
    {
        loadWorkers()
    }

    LaunchedEffect(searchQuery) {
        loadWorkers()
    }

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
    ) {
        val heroRes =when(mode)
        {
            "checkin" -> R.drawable.hero_checkin
            "checkout" -> R.drawable.hero_checkout
            "enroll" -> R.drawable.hero_enroll
            else -> R.drawable.hero_workers
        }

        // ── Header ───────────────────────────────────────────────────────────
        val headerTitle = when (mode) {
            "enroll" -> "Face Enrollment"
            "checkin" -> "Check In"
            else -> "Check Out"
        }

        Box(modifier = Modifier.fillMaxWidth().height(260.dp)
        )
        {
                Image(
                    painter = painterResource(heroRes),
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )

            Column(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(
                        start = 24.dp,
                        top = 110.dp,
                        end = 120.dp
                    )
            ) {

                Text(
                    text = headerTitle,
                    color = Color.White,
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold
                )

                Spacer(Modifier.height(8.dp))

                Text(
                    text = "Select a worker to continue",
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium
                )
            }

            Surface(
                modifier = Modifier.align(Alignment.TopEnd).padding(top = 56.dp,end = 18.dp).clickable {navController.popBackStack()},
                shape = CircleShape,
                color = Color.White.copy(alpha = 0.18f)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White,
                    modifier = Modifier.padding(12.dp).size(24.dp)
                )
            }
        }

        Spacer(Modifier.height(14.dp))

        // ── Search ───────────────────────────────────────────────────────────
        ElevatedCard(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape = RoundedCornerShape(24.dp),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 6.dp)
        )
        {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {

                AppTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = "Search Worker",
                    placeholder = "Name, ID or mobile",
                    leadingIcon = Icons.Default.Search
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // ── List / states ─────────────────────────────────────────────────────
        when {
            isLoading -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }

            workers.isEmpty() -> {
                AppEmptyState(
                    title = "No workers found",
                    message = "Try searching with a different keyword.",
                    icon = Icons.Default.PeopleOutline,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            else -> {
                LazyColumn(
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 24.dp)
                ) {
                    items(workers) { worker ->
                        val encodedName = URLEncoder.encode(worker.fullName, StandardCharsets.UTF_8.toString())
                        WorkerActionRow(worker = worker,mode = mode)
                        {
                            when (mode) { "enroll" -> navController.navigate("camera_enroll/${worker.id}/$encodedName")

                                "checkin" -> navController.navigate("camera_checkin/${worker.id}/$encodedName")

                                else -> navController.navigate("camera_checkout/${worker.id}/$encodedName")
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun WorkerActionRow(
    worker: SiteWorkerEntity,
    mode: String,
    onClick: () -> Unit
)

{
    val isEnrollmentPending = worker.photoUrl.isNullOrBlank()

    val initials = worker.fullName.split(" ").take(2).joinToString("") {it.first().uppercase()}

    val isFacePending = worker.photoUrl.isNullOrBlank()

    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp
        )
    )
    {
        val actionText = when(mode)
            {
                "enroll" -> "Enroll"
                "checkin" -> "Check In"
                else -> "Check Out"
            }
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 6.dp),verticalAlignment = Alignment.CenterVertically,horizontalArrangement = Arrangement.spacedBy(10.dp))
        {
            Surface(shape = RoundedCornerShape(18.dp),color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f))
            {
                Box(modifier = Modifier.size(40.dp),contentAlignment = Alignment.Center)
                {
                    Text(
                        text = initials.ifBlank { "?" },
                        style = MaterialTheme.typography.titleMedium.copy(color = MaterialTheme.colorScheme.primary,fontWeight = FontWeight.Bold
                        )
                    )
                }
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            )
            {
                Text(
                    text = worker.fullName,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Text(
                    text = worker.id,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (!worker.role.isNullOrBlank()) {

                    Spacer(Modifier.height(2.dp))

                    Surface(
                        shape = RoundedCornerShape(50),
                        color = Color(0xFFEFF6FF)
                    ) {
                        Text(
                            worker.role,
                            modifier = Modifier.padding(horizontal = 10.dp,vertical = 2.dp),
                            color = Color(0xFF1D4ED8),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
            Surface(
                shape = RoundedCornerShape(50),
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
            )
            {
                Row(modifier = Modifier.padding(horizontal = 12.dp,vertical = 4.dp),verticalAlignment = Alignment.CenterVertically)
                {
                    Text(actionText,color = MaterialTheme.colorScheme.primary,style = MaterialTheme.typography.labelMedium)
                    Spacer(Modifier.width(4.dp))
                    Icon(Icons.Default.ArrowForward,null,modifier = Modifier.size(14.dp),tint = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }


}
