package com.attendcrew.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary            = AppPrimary,
    onPrimary          = AppOnPrimary,
    primaryContainer   = AppPrimaryLight.copy(alpha = 0.15f),
    onPrimaryContainer = AppPrimaryDark,
    background         = AppBackground,
    onBackground       = AppTextPrimary,
    surface            = AppSurface,
    onSurface          = AppTextPrimary,
    surfaceVariant     = AppSurfaceVariant,
    onSurfaceVariant   = AppTextSecondary,
    outline            = AppDivider,
    outlineVariant     = Color(0xFFE5E7EB),
)

private val DarkColorScheme = darkColorScheme(
    primary            = DarkPrimary,
    onPrimary          = DarkOnPrimary,
    primaryContainer   = Color(0xFF1E2A5E),
    onPrimaryContainer = DarkPrimary,
    background         = DarkBackground,
    onBackground       = Color(0xFFEBEDF5),
    surface            = DarkSurface,
    onSurface          = Color(0xFFEBEDF5),
    surfaceVariant     = DarkSurfaceVariant,
    onSurfaceVariant   = Color(0xFF8B92B2),
    outline            = Color(0xFF252A40),
    outlineVariant     = Color(0xFF1E2235),
)

@Composable
fun AttendanceManagerTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
        typography  = Typography,
        content     = content
    )
}
