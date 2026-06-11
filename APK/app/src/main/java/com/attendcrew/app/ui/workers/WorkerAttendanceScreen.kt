package com.attendcrew.app.ui.workers
import androidx.compose.ui.platform.LocalContext
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.navigation.NavController
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import java.time.LocalDate
import com.attendcrew.app.data.api.RetrofitInstance
import com.attendcrew.app.data.local.db.AttendanceEntity
import com.attendcrew.app.ui.theme.*

@Composable
fun WorkerAttendanceScreen(navController: NavController,workerId: String,workerName: String) {
    var currentMonth by remember {mutableStateOf(YearMonth.now())}
    var attendanceRecords by remember {mutableStateOf<List<AttendanceEntity>>(emptyList())}
    val context = LocalContext.current

    LaunchedEffect(currentMonth) {

        val start = currentMonth.atDay(1).toString()
        val end = currentMonth.atEndOfMonth().toString()

        val api = RetrofitInstance.getApi(context)

        val response =api.getWorkerAttendance(workerId = workerId,dateFrom = start,dateTo = end)

        if (response.isSuccessful) {

            attendanceRecords =response.body()
                    ?.map {
                        AttendanceEntity(
                            id = it.id,
                            workerId = it.worker_id,
                            workerName = it.worker_name,
                            date = it.date,
                            checkInTime = it.check_in_time,
                            checkOutTime = it.check_out_time,
                            status = it.status,
                            isLate = it.is_late,
                            totalHours = it.total_hours,
                            geofenceValid = it.geofence_valid
                        )}.orEmpty()
        }
    }

    val presentDates =attendanceRecords.map {it.date}.toSet()
    val daysInMonth =currentMonth.lengthOfMonth()
    val presentDays =attendanceRecords.size
    val lateDays = attendanceRecords.count { it.isLate == true }

    val totalDaysInMonth =
        if (currentMonth == YearMonth.now())
            LocalDate.now().dayOfMonth
        else
            currentMonth.lengthOfMonth()

    val absentDays = (totalDaysInMonth - presentDays).coerceAtLeast(0)
    val presentColor = Color(0xFF15803D).copy(alpha = 0.18f)
    val absentColor = Color(0xFFDC2626).copy(alpha = 0.16f)
    val currentRealMonth =YearMonth.now()
    val today = LocalDate.now()


    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp))
    {
        Row(verticalAlignment = Alignment.CenterVertically)
        {
            IconButton(onClick = {navController.navigateUp()})
            {
                Icon(Icons.Default.ArrowBack,contentDescription = null)
            }
            Text(text = workerName,style = MaterialTheme.typography.titleLarge,fontWeight = FontWeight.Bold)
        }

        Spacer(Modifier.height(20.dp))

        Row(modifier = Modifier.fillMaxWidth(),horizontalArrangement = Arrangement.SpaceBetween,verticalAlignment = Alignment.CenterVertically)
        {

            IconButton(onClick = {currentMonth =currentMonth.minusMonths(1)})
            {
                Icon(Icons.Default.ChevronLeft, null)
            }

            Surface(shape = RoundedCornerShape(50),color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f))
            {
                Text(
                    text = currentMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy")),
                    modifier = Modifier.padding(horizontal = 16.dp,vertical = 8.dp),
                    fontWeight = FontWeight.SemiBold)
            }
            IconButton(enabled = currentMonth < currentRealMonth,onClick = {currentMonth = currentMonth.plusMonths(1)})
            {
                Icon(Icons.Default.ChevronRight,contentDescription = null)
            }
        }

        Spacer(Modifier.height(24.dp))

        val firstDayOffset =currentMonth.atDay(1).dayOfWeek.value % 7

        Column {

            Row(modifier = Modifier.fillMaxWidth(),horizontalArrangement = Arrangement.SpaceEvenly)
            {
                listOf(
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat"
                ).forEach { day ->

                    Text(
                        text = day,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            val totalCells =
                firstDayOffset + daysInMonth

            val rows =
                (totalCells + 6) / 7

            repeat(rows) { row ->

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {

                    repeat(7) { col ->

                        val cellIndex = row * 7 + col

                        val dayNumber = cellIndex - firstDayOffset + 1

                        if (dayNumber in 1..daysInMonth)
                        {

                            val localDate = currentMonth.atDay(dayNumber)

                            val isPresent =
                                presentDates.contains(localDate.toString())

                            val isFuture =
                                localDate.isAfter(today)

                            val cellColor =
                                when {
                                    isFuture ->
                                        Color(0xFFF3F4F6)     // Light gray

                                    isPresent ->
                                        Color(0xFFDCFCE7)     // Light green

                                    else ->
                                        Color(0xFFFEE2E2)     // Light red
                                }

                            val textColor =
                                when {
                                    isFuture ->
                                        Color(0xFF9CA3AF)     // Gray

                                    isPresent ->
                                        Color(0xFF15803D)     // Dark green

                                    else ->
                                        Color(0xFFDC2626)     // Dark red
                                }

                            Surface(
                                modifier = Modifier
                                    .size(48.dp)
                                    .padding(2.dp),
                                shape = RoundedCornerShape(12.dp),
                                color = cellColor
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = dayNumber.toString(),
                                        color = textColor,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }
                        else
                        {
                            Spacer(Modifier.size(42.dp))
                        }
                    }
                }

                Spacer(Modifier.height(8.dp))
            }
        }

        Spacer(Modifier.height(18.dp))

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
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 20.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {

                SummaryItem(
                    label = "Present",
                    value = presentDays.toString(),
                    color = StatusSuccess
                )

                SummaryItem(
                    label = "Absent",
                    value = absentDays.toString(),
                    color = StatusError
                )

                SummaryItem(
                    label = "Late",
                    value = lateDays.toString(),
                    color = StatusWarning
                )
            }
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun SummaryItem(
    label: String,
    value: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {

        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = color
        )

        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}