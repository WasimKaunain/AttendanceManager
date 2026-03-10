package com.wasim.attendancemanager.ui.dashboard

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Face
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import kotlinx.coroutines.launch
import com.wasim.attendancemanager.data.api.RetrofitInstance
import com.wasim.attendancemanager.data.model.LocationRequest
import com.wasim.attendancemanager.utils.LocationHelper
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.ui.graphics.graphicsLayer

@Composable
fun DashboardScreen(navController: NavController) {

    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            Toast.makeText(context, "Location permission required", Toast.LENGTH_SHORT).show()
        }
    }

    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun handleGeofenceAndNavigate(route: String) {

        if (!hasLocationPermission()) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
            return
        }

        LocationHelper(context).getCurrentLocation { lat, lon ->

            scope.launch {
                isLoading = true
                try {
                    val response = RetrofitInstance
                        .getApi(context)
                        .verifyGeofence(
                            LocationRequest(latitude = lat, longitude = lon)
                        )

                    if (response.isSuccessful && response.body()?.inside == true) {
                        navController.navigate(route)
                    } else {
                        Toast.makeText(
                            context,
                            "You are outside site boundary",
                            Toast.LENGTH_LONG
                        ).show()
                    }

                } catch (e: Exception) {
                    Toast.makeText(
                        context,
                        "Geofence error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                } finally {
                    isLoading = false
                }
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Top,
        horizontalAlignment = Alignment.CenterHorizontally) {

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "Welcome Site Manager",
            style = MaterialTheme.typography.headlineMedium
        )

        Spacer(modifier = Modifier.height(40.dp))

        // Face Enroll (No geofence check)
        DashboardCard(
            title = "Face Enroll",
            color1 = Color(0xFF6A11CB),
            color2 = Color(0xFF2575FC)
        ) {
            navController.navigate("face_enroll")
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Check In (With geofence)
        DashboardCard(
            title = "Check In",
            color1 = Color(0xFF11998E),
            color2 = Color(0xFF38EF7D)
        ) {
            handleGeofenceAndNavigate("checkin")
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Check Out (With geofence)
        DashboardCard(
            title = "Check Out",
            color1 = Color(0xFFFF512F),
            color2 = Color(0xFFDD2476)
        ) {
            handleGeofenceAndNavigate("checkout")
        }

        if (isLoading) {
            Spacer(modifier = Modifier.height(20.dp))
            CircularProgressIndicator()
        }
    }
}

@Composable
fun DashboardCard(
    title: String,
    color1: Color,
    color2: Color,
    onClick: () -> Unit
) {

    var pressed by remember { mutableStateOf(false) }

    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.97f else 1f,
        label = ""
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
                shadowElevation = 25f
            }
            .shadow(
                elevation = 20.dp,
                shape = RoundedCornerShape(28.dp),
                ambientColor = color1.copy(alpha = 0.4f),
                spotColor = color2.copy(alpha = 0.6f)
            )
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(color1, color2)
                ),
                shape = RoundedCornerShape(28.dp)
            )
            .clickable(
                onClick = onClick,
                onClickLabel = title,
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            )
            .padding(28.dp)
    ) {

        Column(
            verticalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxSize()
        ) {

            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                color = Color.White
            )

            Text(
                text = "Tap to continue",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.8f)
            )

            Icon(
                imageVector = Icons.Default.Face,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.7f),
                modifier = Modifier.size(32.dp)
            )
        }
    }
}
