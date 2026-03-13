package com.wasim.attendancemanager.ui.login

import android.util.Base64
import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.wasim.attendancemanager.data.api.RetrofitInstance
import com.wasim.attendancemanager.data.local.TokenManager
import com.wasim.attendancemanager.data.model.LoginRequest
import kotlinx.coroutines.launch
import org.json.JSONObject

private enum class LoginRole(val label: String, val apiValue: String) {
    ADMIN("Admin", "admin"),
    SITE_INCHARGE("Site Incharge", "site_incharge")
}

/** Decodes the JWT payload (middle part) and returns it as a JSONObject. */
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
fun LoginScreen(navController: NavController) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var role by remember { mutableStateOf(LoginRole.SITE_INCHARGE) }
    var roleExpanded by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val tokenManager = remember { TokenManager(context) }

    fun goToDashboard() {
        navController.navigate("dashboard") {
            popUpTo("login") { inclusive = true }
        }
    }

    fun goToAdminSiteSelection() {
        navController.navigate("admin_site_selection") {
            popUpTo("login") { inclusive = false }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Login",
                    style = MaterialTheme.typography.headlineMedium
                )

                Spacer(modifier = Modifier.height(20.dp))

                OutlinedButton(
                    onClick = { roleExpanded = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(role.label)
                }
                DropdownMenu(
                    expanded = roleExpanded,
                    onDismissRequest = { roleExpanded = false }
                ) {
                    LoginRole.entries.forEach { item ->
                        DropdownMenuItem(
                            text = { Text(item.label) },
                            onClick = {
                                role = item
                                roleExpanded = false
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("Username / Email") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    visualTransformation = if (showPassword) {
                        VisualTransformation.None
                    } else {
                        PasswordVisualTransformation()
                    },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                imageVector = if (showPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                                contentDescription = if (showPassword) "Hide password" else "Show password"
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(22.dp))

                Button(
                    onClick = {
                        if (username.isBlank() || password.isBlank()) {
                            Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        scope.launch {
                            isLoading = true
                            try {
                                val response = RetrofitInstance.getApi(context).login(
                                    LoginRequest(
                                        username = username.trim(),
                                        password = password,
                                        loginAs = role.apiValue
                                    )
                                )

                                if (!response.isSuccessful || response.body() == null) {
                                    Toast.makeText(context, "Invalid credentials", Toast.LENGTH_SHORT).show()
                                    return@launch
                                }

                                val body = response.body()!!
                                val token = body.access_token
                                val payload = decodeJwtPayload(token)
                                val apiRole = body.role ?: payload?.optString("role", "") ?: ""
                                val userName = payload?.optString("name", null)

                                if (role == LoginRole.SITE_INCHARGE) {
                                    if (apiRole != "site_incharge") {
                                        Toast.makeText(context, "Selected role mismatch", Toast.LENGTH_SHORT).show()
                                        return@launch
                                    }

                                    val siteId = body.site_id ?: payload?.optString("site_id", null)
                                    val siteName = body.site_name ?: payload?.optString("site_name", null)

                                    tokenManager.saveToken(token)
                                    tokenManager.saveRole("site_incharge")
                                    siteId?.let { tokenManager.saveSiteId(it) }
                                    siteName?.let { tokenManager.saveSiteName(it) }
                                    userName?.let { tokenManager.saveUserName(it) }

                                    Toast.makeText(context, "Login successful", Toast.LENGTH_SHORT).show()
                                    goToDashboard()
                                } else {
                                    if (apiRole != "admin") {
                                        Toast.makeText(context, "Selected role mismatch", Toast.LENGTH_SHORT).show()
                                        return@launch
                                    }

                                    tokenManager.saveToken(token)
                                    tokenManager.saveRole("admin")
                                    userName?.let { tokenManager.saveUserName(it) }

                                    goToAdminSiteSelection()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.height(20.dp)
                        )
                    } else {
                        Text("Continue")
                    }
                }
            }
        }
    }
}
