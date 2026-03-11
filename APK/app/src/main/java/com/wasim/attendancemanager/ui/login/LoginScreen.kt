package com.wasim.attendancemanager.ui.login

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import android.util.Base64
import android.widget.Toast
import androidx.compose.ui.platform.LocalContext
import com.wasim.attendancemanager.data.api.RetrofitInstance
import com.wasim.attendancemanager.data.model.LoginRequest
import com.wasim.attendancemanager.data.local.TokenManager
import org.json.JSONObject

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

    var userId by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {

        Text(
            text = "Site In-charge Login",
            style = MaterialTheme.typography.headlineMedium
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = userId,
            onValueChange = { userId = it },
            label = { Text("Username") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (userId.isBlank() || password.isBlank()) {
                    Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                    return@Button
                }

                scope.launch {
                    isLoading = true
                    try {
                        val response = RetrofitInstance.getApi(context).login(
                            LoginRequest(username = userId, password = password)
                        )

                        if (response.isSuccessful && response.body() != null) {

                            val token = response.body()!!.access_token

                            // Decode role and site_id from JWT payload
                            val payload = decodeJwtPayload(token)
                            val role     = payload?.optString("role",      "") ?: ""
                            val siteId   = payload?.optString("site_id",   null)
                            val name     = payload?.optString("name",      null)
                            val siteName = payload?.optString("site_name", null)

                            android.util.Log.d("LoginScreen", "JWT payload: $payload")
                            android.util.Log.d("LoginScreen", "Decoded role: '$role', site_id: '$siteId', name: '$name'")

                            if (role != "site_incharge") {
                                Toast.makeText(context, "Access denied. Role received: '$role'", Toast.LENGTH_LONG).show()
                                isLoading = false
                                return@launch
                            }

                            val tokenManager = TokenManager(context)
                            tokenManager.saveToken(token)
                            tokenManager.saveRole(role)
                            siteId?.let   { tokenManager.saveSiteId(it) }
                            name?.let     { tokenManager.saveUserName(it) }
                            siteName?.let { tokenManager.saveSiteName(it) }

                            Toast.makeText(context, "Login Successful", Toast.LENGTH_SHORT).show()

                            navController.navigate("dashboard") {
                                popUpTo("login") { inclusive = true }
                            }

                        } else {
                            Toast.makeText(context, "Invalid Credentials", Toast.LENGTH_SHORT).show()
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
                    modifier = Modifier.size(20.dp)
                )
            } else {
                Text("Login")
            }
        }
    }
}
