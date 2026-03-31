package com.attendcrew.app.ui.login

import android.Manifest
import android.content.pm.PackageManager
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import com.attendcrew.app.data.api.RetrofitInstance
import com.attendcrew.app.data.local.TokenManager
import com.attendcrew.app.data.model.AdminSelectSiteRequest
import com.attendcrew.app.data.model.AdminSite
import com.attendcrew.app.utils.LocationHelper
import kotlinx.coroutines.launch
import org.json.JSONObject

private fun decodeJwtPayload(token: String): JSONObject? {
    return try {
        val parts = token.split(".")
        if (parts.size < 2) return null
        val payloadBytes = Base64.decode(
            parts[1].replace('-', '+').replace('_', '/'),
            Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP
        )
        JSONObject(String(payloadBytes, Charsets.UTF_8))
    } catch (e: Exception) {
        null
    }
}

@Composable
fun AdminSiteSelectionScreen(navController: NavController) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }

    var isLoading by remember { mutableStateOf(false) }
    var sites by remember { mutableStateOf<List<AdminSite>>(emptyList()) }
    var pendingSiteId by remember { mutableStateOf<String?>(null) }

    fun backToLogin(clearAuth: Boolean = false) {
        if (clearAuth) tokenManager.clearAll()
        navController.navigate("login") {
            popUpTo("login") { inclusive = true }
        }
    }

    fun goToDashboard() {
        navController.navigate("dashboard") {
            popUpTo("login") { inclusive = true }
        }
    }

    fun performSiteSelection(siteId: String) {
        val hasFineLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasFineLocation) {
            Toast.makeText(context, "Location permission is required", Toast.LENGTH_SHORT).show()
            return
        }

        isLoading = true
        LocationHelper(context).getCurrentLocation(
            onResult = { lat, lng ->
                scope.launch {
                    try {
                        val response = RetrofitInstance.getApi(context).selectAdminSite(
                            AdminSelectSiteRequest(
                                siteId = siteId,
                                latitude = lat,
                                longitude = lng
                            )
                        )

                        if (response.isSuccessful && response.body() != null) {
                            val body = response.body()!!
                            val scopedToken = body.access_token
                            val payload = decodeJwtPayload(scopedToken)
                            val name = payload?.optString("name", null)

                            tokenManager.saveToken(scopedToken)
                            tokenManager.saveRole("admin")
                            tokenManager.saveSiteId(body.selectedSiteId)
                            tokenManager.saveSiteName(body.selectedSiteName)
                            name?.let { tokenManager.saveUserName(it) }

                            Toast.makeText(context, "Site selected", Toast.LENGTH_SHORT).show()
                            goToDashboard()
                        } else {
                            Toast.makeText(
                                context,
                                "Unable to select site. Ensure you are inside site geofence.",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    } finally {
                        isLoading = false
                        pendingSiteId = null
                    }
                }
            },
            onFailure = {
                isLoading = false
                pendingSiteId = null
            }
        )
    }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { granted ->
            val siteId = pendingSiteId
            if (granted && siteId != null) {
                performSiteSelection(siteId)
            } else {
                Toast.makeText(context, "Location permission denied", Toast.LENGTH_SHORT).show()
            }
        }
    )

    fun onSiteClick(siteId: String) {
        pendingSiteId = siteId
        val hasFineLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasFineLocation) {
            performSiteSelection(siteId)
        } else {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    LaunchedEffect(Unit) {
        val role = tokenManager.getRole()
        if (role != "admin") {
            backToLogin(clearAuth = true)
            return@LaunchedEffect
        }

        isLoading = true
        try {
            val response = RetrofitInstance.getApi(context).getAdminSites()
            if (response.isSuccessful && response.body() != null) {
                sites = response.body()!!
                if (sites.isEmpty()) {
                    Toast.makeText(context, "No active sites available", Toast.LENGTH_LONG).show()
                    backToLogin(clearAuth = true)
                }
            } else {
                Toast.makeText(context, "Unable to load active sites", Toast.LENGTH_SHORT).show()
                backToLogin(clearAuth = true)
            }
        } catch (e: Exception) {
            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            backToLogin(clearAuth = true)
        } finally {
            isLoading = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "Select Active Site",
                style = MaterialTheme.typography.headlineSmall
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Choose a site and verify location to continue.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium
            )
            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 4.dp)
            ) {
                items(sites) { site ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = !isLoading) { onSiteClick(site.id) },
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp)) {
                            Text(site.name, style = MaterialTheme.typography.titleMedium)
                            if (!site.address.isNullOrBlank()) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    site.address,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(
                onClick = { backToLogin(clearAuth = true) },
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding(),
                enabled = !isLoading
            ) {
                Text("Back to Login")
            }
        }

        if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
        }
    }
}
