package com.attendcrew.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.navigation.NavController
import com.attendcrew.app.data.local.AppPreferences
import com.attendcrew.app.data.local.CurrencyOption
import com.attendcrew.app.data.local.TokenManager
import com.attendcrew.app.ui.components.AppCard
import com.attendcrew.app.ui.components.AppSectionTitle
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import com.attendcrew.app.R
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign

@Composable
fun ProfileScreen(
    navController: NavController,
    isDarkTheme: Boolean,
    onThemeToggle: (Boolean) -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { AppPreferences(context) }
    val tokenMgr = remember { TokenManager(context) }

    val userName = remember { tokenMgr.getUserName() ?: "Site In-charge" }
    val userRole = remember {
        tokenMgr.getRole()?.replace("_", " ")?.replaceFirstChar { it.uppercase() } ?: "Site In-charge"
    }
    val siteName = remember { tokenMgr.getSiteName() ?: tokenMgr.getSiteId() ?: "—" }
    var currency by remember { mutableStateOf(prefs.currency) }
    var showCurrencyDlg by remember { mutableStateOf(false) }
    var showBiometricDlg by remember { mutableStateOf(false) }
    var showPrivacyDlg by remember { mutableStateOf(false) }
    var showTermsDlg by remember { mutableStateOf(false) }
    var showDisclaimerDlg by remember { mutableStateOf(false) }
    var showLicensesDlg by remember { mutableStateOf(false) }
    var showLogoutDlg by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).verticalScroll(scrollState))
    {
        // ── Header (match other screens) ─────────────────────────────────────
        Box(modifier = Modifier.fillMaxWidth().height(260.dp))
        {
                Image(
                    painter = painterResource(R.drawable.hero_profile),
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop)

            Column(
                modifier = Modifier.align(Alignment.TopStart).padding(start = 24.dp,top = 110.dp,end = 120.dp)
            ) {
                Text(text = "Profile",color = Color.White,style = MaterialTheme.typography.headlineLarge,fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text(text = "Manage your account & preferences",color = Color.White,style = MaterialTheme.typography.titleMedium)
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).offset(y = (-40).dp),
            shape = RoundedCornerShape(28.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Row(modifier = Modifier.padding(20.dp),verticalAlignment = Alignment.CenterVertically)
            {
                Surface(
                    shape = CircleShape,color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
                ) {
                    Box(modifier = Modifier.size(64.dp),contentAlignment = Alignment.Center)
                    {
                        Text(userName.take(1).uppercase(),style = MaterialTheme.typography.headlineSmall,fontWeight = FontWeight.Bold,color = MaterialTheme.colorScheme.primary)
                    }
                }

                Spacer(Modifier.width(16.dp))

                Column {
                    Text(userName,style = MaterialTheme.typography.titleLarge,fontWeight = FontWeight.Bold)
                    Text(userRole,color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(siteName,color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        Spacer(Modifier.height((-20).dp))

        // ── Preferences ──────────────────────────────────────────────────────
        AppSectionTitle("App Preferences", modifier = Modifier.padding(horizontal = 20.dp))
        Spacer(Modifier.height(10.dp))

        ElevatedCard(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape = RoundedCornerShape(24.dp),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 6.dp))
        {
            SettingsSwitchRow(
                icon = if (isDarkTheme) Icons.Filled.DarkMode else Icons.Outlined.LightMode,
                title = "Dark Mode",
                subtitle = if (isDarkTheme) "Dark theme active" else "Light theme active",
                checked = isDarkTheme,
                onToggle = {
                    onThemeToggle(it)
                    prefs.isDarkTheme = it
                }
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))

            SettingsClickRow(
                icon = Icons.Outlined.AttachMoney,
                title = "Currency",
                subtitle = "${AppPreferences.symbolFor(currency)}  •  $currency",
                onClick = { showCurrencyDlg = true }
            )
        }

        Spacer(Modifier.height(14.dp))


        // ── Privacy & Biometrics ─────────────────────────────────────────────
        AppSectionTitle("Privacy & Security", modifier = Modifier.padding(horizontal = 20.dp))
        Spacer(Modifier.height(10.dp))

        ElevatedCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(24.dp),
            elevation = CardDefaults.elevatedCardElevation(
                defaultElevation = 6.dp
            )
        ) {
            SettingsClickRow(
                icon = Icons.Outlined.Fingerprint,
                title = "Biometric Data Notice",
                subtitle = "Face recognition data handling",
                onClick = { showBiometricDlg = true }
            )
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
            SettingsClickRow(
                icon = Icons.Outlined.PrivacyTip,
                title = "Privacy Policy",
                subtitle = "Data protection and user rights",
                onClick = { showPrivacyDlg = true }
            )
        }

        Spacer(Modifier.height(14.dp))

        // ── Legal ───────────────────────────────────────────────────────────-
        AppSectionTitle("Legal & Compliance", modifier = Modifier.padding(horizontal = 20.dp))
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
            SettingsClickRow(
                icon = Icons.Outlined.Gavel,
                title = "Terms of Use",
                subtitle = "Usage terms and responsibilities",
                onClick = { showTermsDlg = true }
            )
            HorizontalDivider(
                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
            )
            SettingsClickRow(
                icon = Icons.Outlined.Info,
                title = "Disclaimer",
                subtitle = "Important legal information",
                onClick = { showDisclaimerDlg = true }
            )
        }

        Spacer(Modifier.height(14.dp))

        // ── About ───────────────────────────────────────────────────────────-
        AppSectionTitle("About", modifier = Modifier.padding(horizontal = 20.dp))
        Spacer(Modifier.height(10.dp))

            ElevatedCard(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                shape = RoundedCornerShape(24.dp),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 6.dp
                )
            )
            {
                SettingsInfoRow(Icons.Outlined.Business,"Application","AttendCrew")
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                SettingsInfoRow(Icons.Outlined.AppSettingsAlt,"Version","1.2.0")
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))

                SettingsClickRow(
                icon = Icons.Outlined.Description,
                title = "Open Source Licenses",
                subtitle = "Third-party libraries and acknowledgements",
                onClick = { showLicensesDlg = true }
            )
        }

        Spacer(Modifier.height(14.dp))

        // ── Session ─────────────────────────────────────────────────────────-
        AppSectionTitle("Sign Out", modifier = Modifier.padding(horizontal = 20.dp))
        Spacer(Modifier.height(10.dp))

                ElevatedCard(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = Color(0xFFFFF1F2)),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 6.dp)
                )
                {
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable {showLogoutDlg = true}.padding(horizontal = 20.dp,vertical = 18.dp),
                        verticalAlignment = Alignment.CenterVertically
                    )
                    {
                        Icon(imageVector = Icons.Outlined.Logout,contentDescription = null,tint = Color(0xFFDC2626),modifier = Modifier.size(22.dp))
                        Spacer(Modifier.width(16.dp))
                        Column(
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(text = "Logout",style = MaterialTheme.typography.bodyLarge,fontWeight = FontWeight.SemiBold,color = Color(0xFFDC2626))
                            Text(text = "Sign out of your account",style = MaterialTheme.typography.bodySmall,color = Color(0xFF991B1B))
                        }

                        Icon(imageVector = Icons.Default.ChevronRight,contentDescription = null,tint = Color(0xFFDC2626))
                    }
                }
                Spacer(Modifier.height(20.dp))

                Text(
                    text = "AttendCrew v1.0.0",
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )

                Spacer(Modifier.height(6.dp))

                Text(
                    text = "Construction Workforce Management",
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.labelSmall
                )

        Spacer(Modifier.height(28.dp))
    }

    // ── Dialogs (unchanged) ─────────────────────────────────────────────────-

    if (showCurrencyDlg) {
        CurrencyDialog(
            current = currency,
            onSelect = { selected ->
                currency = selected
                prefs.currency = selected
                showCurrencyDlg = false
            },
            onDismiss = { showCurrencyDlg = false }
        )
    }

    if (showBiometricDlg) {
        InfoDialog(
            title = "Biometric Data Notice",
            onDismiss = { showBiometricDlg = false },
            content = """
This app collects facial biometric data (face embeddings) solely for attendance verification.

What we collect:
• A mathematical representation of your face (embedding vector)
• A reference photo for identity confirmation

How it is used:
• To verify worker identity during check-in and check-out
• Stored securely on our servers, never shared with third parties

Retention:
• Face data is retained for as long as the worker record is active
• Data is permanently deleted upon worker removal

Your rights:
• You may request deletion of your biometric data at any time by contacting your site manager or admin

By using this app you acknowledge and consent to the above.
            """.trimIndent()
        )
    }

    if (showPrivacyDlg) {
        InfoDialog(
            title = "Privacy Policy",
            onDismiss = { showPrivacyDlg = false },
            content = """
Attendance Manager is committed to protecting your privacy.

Data collected:
• Login credentials (username/password) — stored as secure tokens only
• Location data — used only at check-in/check-out to verify on-site presence
• Face biometric data — see Biometric Data Notice

Data storage:
• All data is stored on secure servers hosted on Render.com
• No data is sold or shared with advertisers

Access control:
• Site In-charges can only view data for their assigned site
• Admins have full access across all sites

Contact:
• For privacy concerns, contact your organisation's administrator
            """.trimIndent()
        )
    }

    if (showTermsDlg) {
        InfoDialog(
            title = "Terms of Use",
            onDismiss = { showTermsDlg = false },
            content = """
By using Attendance Manager you agree to the following terms:

1. Authorised use only — This app is for use by authorised personnel of your organisation only.

2. Accurate data — You must not attempt to falsify attendance records or enroll someone else's face.

3. Device security — You are responsible for keeping your device and login credentials secure.

4. No reverse engineering — You may not decompile, modify, or redistribute this application.

5. Termination — Access may be revoked at any time by your organisation's administrator.
            """.trimIndent()
        )
    }

    if (showDisclaimerDlg) {
        InfoDialog(
            title = "Disclaimer",
            onDismiss = { showDisclaimerDlg = false },
            content = """
Accuracy:
Face recognition technology is not 100% accurate. In rare cases, verification may fail for legitimate workers due to lighting, camera angle, or appearance changes.

Liability:
The developers of Attendance Manager are not liable for attendance disputes arising from system errors. Manual override by an administrator is always available.

Location:
GPS location is provided by the device and may have accuracy variations. The app is not responsible for GPS inaccuracies.

Connectivity:
The app requires an active internet connection. The developers are not responsible for data loss due to network interruptions.
            """.trimIndent()
        )
    }

    if (showLicensesDlg) {
        InfoDialog(
            title = "Open Source Licenses",
            onDismiss = { showLicensesDlg = false },
            content = """
This app uses the following open source libraries:

• ML Kit Face Detection — Google LLC (Apache 2.0)
  https://developers.google.com/ml-kit

• TensorFlow Lite — Google LLC (Apache 2.0)
  https://www.tensorflow.org/lite

• Retrofit — Square Inc. (Apache 2.0)
  https://square.github.io/retrofit

• OkHttp — Square Inc. (Apache 2.0)
  https://square.github.io/okhttp

• Jetpack Compose — Google LLC (Apache 2.0)
  https://developer.android.com/jetpack/compose

• CameraX — Google LLC (Apache 2.0)
  https://developer.android.com/training/camerax

• Gson — Google LLC (Apache 2.0)
  https://github.com/google/gson

• Kotlinx Coroutines — JetBrains (Apache 2.0)
  https://github.com/Kotlin/kotlinx.coroutines
            """.trimIndent()
        )
    }

    if (showLogoutDlg) {
        ConfirmDialog(
            title = "Logout",
            message = "Are you sure you want to logout?",
            confirmText = "Logout",
            confirmColor = MaterialTheme.colorScheme.error,
            onConfirm = {
                showLogoutDlg = false
                // Keep existing behavior
                tokenMgr.clearAll()
                navController.navigate("login") {
                    popUpTo(0)
                    launchSingleTop = true
                }
            },
            onDismiss = { showLogoutDlg = false }
        )
    }
}

// ── Reusable row components ────────────────────────────────────────────────────

@Composable
private fun SectionHeader(title: String) {
    Text(
        text     = title.uppercase(),
        style    = MaterialTheme.typography.labelSmall,
        color    = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 20.dp, top = 8.dp, bottom = 4.dp)
    )
}

@Composable
private fun SettingsSwitchRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onToggle: (Boolean) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color    = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier            = Modifier.padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment   = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(title,    style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall,  color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Switch(
                checked         = checked,
                onCheckedChange = onToggle,
                colors          = SwitchDefaults.colors(checkedThumbColor = MaterialTheme.colorScheme.primary)
            )
        }
        HorizontalDivider(modifier = Modifier.padding(start = 58.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
    }
}

@Composable
private fun SettingsClickRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    titleColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier          = Modifier.padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(title,    style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = titleColor)
                Text(subtitle, style = MaterialTheme.typography.bodySmall,  color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.Filled.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(20.dp))
        }
        HorizontalDivider(modifier = Modifier.padding(start = 58.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
    }
}

@Composable
private fun SettingsInfoRow(
    icon: ImageVector,
    title: String,
    value: String
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color    = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier          = Modifier.padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
            Spacer(Modifier.width(16.dp))
            Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            Text(value, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        HorizontalDivider(modifier = Modifier.padding(start = 58.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
    }
}

// ── Currency picker dialog ────────────────────────────────────────────────────

@Composable
private fun CurrencyDialog(
    current: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface) {
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                Text(
                    "Select Currency",
                    style    = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
                AppPreferences.CURRENCIES.forEach { option ->
                    CurrencyRow(option, selected = option.code == current, onClick = { onSelect(option.code) })
                }
            }
        }
    }
}

@Composable
private fun CurrencyRow(option: CurrencyOption, selected: Boolean, onClick: () -> Unit) {
    Row(
        modifier          = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(option.symbol, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold,
             modifier = Modifier.width(36.dp), color = MaterialTheme.colorScheme.primary)
        Column(Modifier.weight(1f)) {
            Text(option.code, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Text(option.name, style = MaterialTheme.typography.bodySmall,  color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        if (selected) Icon(Icons.Filled.Check, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
    }
    HorizontalDivider(modifier = Modifier.padding(start = 20.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
}

// ── Generic scrollable info dialog ───────────────────────────────────────────
// ── Confirmation Dialog ─────────────────────────────────────────────

@Composable
private fun ConfirmDialog(
    title: String,
    message: String,
    confirmText: String,
    confirmColor: Color,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(message) },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(confirmText, color = confirmColor)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
@Composable
private fun InfoDialog(title: String, content: String, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface) {
            Column {
                Text(
                    title,
                    style    = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 8.dp)
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
                Column(
                    modifier = Modifier
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp)
                        .heightIn(max = 420.dp)
                ) {
                    Text(content, style = MaterialTheme.typography.bodySmall, lineHeight = 20.sp,
                         color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
                Box(modifier = Modifier.fillMaxWidth().padding(12.dp), contentAlignment = Alignment.CenterEnd) {
                    TextButton(onClick = onDismiss) { Text("Close") }
                }
            }
        }
    }
}

