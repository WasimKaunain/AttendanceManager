package com.attendcrew.app.ui.login

import android.util.Base64
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.attendcrew.app.data.api.RetrofitInstance
import com.attendcrew.app.data.local.TokenManager
import com.attendcrew.app.data.model.LoginRequest
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.Calendar
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.painterResource
import com.attendcrew.app.R

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

    Column(modifier = Modifier.background(Brush.verticalGradient(colors = listOf(Color(0xFF2B1D0E),Color(0xFF1A1308)))))
    {
        // WELCOME section
        Spacer(Modifier.height(60.dp))

        Column(modifier = Modifier.fillMaxWidth(),horizontalAlignment = Alignment.CenterHorizontally)
        {
                Image(
                    painter = painterResource(R.drawable.logo_splash),
                    contentDescription = null,
                    modifier = Modifier.size(130.dp))

            Spacer(Modifier.height(16.dp))

            Text(
                text = "Welcome Back!",
                color = Color.White,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = "Sign in to continue managing your crew and attendance",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.75f),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 32.dp)
            )
        }

        Spacer(Modifier.height(28.dp))

        ElevatedCard(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
            shape = RoundedCornerShape(28.dp),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 12.dp
            )
        )
        {
            Column(
                modifier = Modifier.padding(24.dp)
            )
            {
                Text(
                    text = "Sign In",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                Spacer(Modifier.height(20.dp))

                // Role selector
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                )
                {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    )
                    {
                        Row(verticalAlignment = Alignment.CenterVertically)
                        {
                            RadioButton(
                                selected = role == LoginRole.ADMIN,
                                onClick = {
                                    role = LoginRole.ADMIN
                                }
                            )

                            Text("Admin")
                        }

                        Row(verticalAlignment = Alignment.CenterVertically)
                        {
                            RadioButton(
                                selected = role == LoginRole.SITE_INCHARGE,
                                onClick = {
                                    role = LoginRole.SITE_INCHARGE
                                }
                            )

                            Text("Site Incharge")
                        }
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Username field
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Username") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null
                        )
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp)
                )

                Spacer(Modifier.height(16.dp))

                // Password field
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Password") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.Lock,
                            contentDescription = null
                        )
                    },
                    trailingIcon = {
                        IconButton(
                            onClick = {
                                showPassword = !showPassword
                            }
                        ) {
                            Icon(
                                if (showPassword)
                                    Icons.Default.VisibilityOff
                                else
                                    Icons.Default.Visibility,
                                contentDescription = null
                            )
                        }
                    },
                    visualTransformation =
                        if (showPassword)
                            VisualTransformation.None
                        else
                            PasswordVisualTransformation(),
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp)
                )

                Spacer(Modifier.height(24.dp))

                // Login button
                Button(
                    onClick = {
                        if (username.isBlank() || password.isBlank()) {
                            Toast.makeText(context,"Please fill all fields",Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        scope.launch {
                            isLoading = true

                            try {
                                val response = RetrofitInstance.getApi(context).login(
                                    LoginRequest(
                                        username = username.trim(),
                                        password = password,
                                        loginAs = role.apiValue,
                                        unscopedSiteIncharge =
                                            (role == LoginRole.SITE_INCHARGE)
                                    )
                                )

                                if (!response.isSuccessful || response.body() == null) {
                                    Toast.makeText(context,"Invalid credentials",Toast.LENGTH_SHORT).show()
                                    return@launch
                                }

                                val body = response.body()!!
                                val token = body.access_token
                                val payload = decodeJwtPayload(token)
                                val apiRole = body.role ?: payload?.optString("role", "") ?: ""
                                val userName = payload?.optString("name", null)

                                if (role == LoginRole.SITE_INCHARGE)
                                {
                                    if (apiRole != "site_incharge")
                                    {
                                        Toast.makeText(context,"Selected role mismatch",Toast.LENGTH_SHORT).show()
                                        return@launch
                                    }
                                    tokenManager.saveToken(token)
                                    tokenManager.saveRole("site_incharge")
                                    userName?.let {tokenManager.saveUserName(it)}
                                    Toast.makeText(context,"Login successful",Toast.LENGTH_SHORT).show()
                                    goToAdminSiteSelection()
                                }
                                else
                                {
                                    if (apiRole != "admin")
                                    {
                                        Toast.makeText(context,"Selected role mismatch",Toast.LENGTH_SHORT).show()
                                        return@launch
                                    }

                                    tokenManager.saveToken(token)
                                    tokenManager.saveRole("admin")

                                    userName?.let {tokenManager.saveUserName(it)
                                    }

                                    goToAdminSiteSelection()
                                }
                            }
                            catch (e: Exception)
                            {
                                Toast.makeText(context,"Error: ${e.message}",Toast.LENGTH_SHORT).show()
                            }
                            finally {
                                isLoading = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    enabled = !isLoading,
                    shape = RoundedCornerShape(16.dp)
                )
                {
                    if (isLoading)
                    {
                        CircularProgressIndicator(modifier = Modifier.size(22.dp),strokeWidth = 2.dp)
                    }
                    else
                    {
                        Text(text = "Continue →",fontSize = 16.sp)
                    }
                }
            }
        }
        Spacer(Modifier.weight(1f))

        Text(
            text = "© ${Calendar.getInstance().get(Calendar.YEAR)} AINTSOL. All rights reserved.",
            modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodySmall
        )
    }
}
