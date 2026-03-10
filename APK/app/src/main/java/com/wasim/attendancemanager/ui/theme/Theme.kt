package com.wasim.attendancemanager.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val AppColorScheme = lightColorScheme(
    primary            = AppPrimary,
    onPrimary          = AppOnPrimary,
    primaryContainer   = AppPrimaryLight,
    onPrimaryContainer = AppPrimaryDark,
    background         = AppBackground,
    onBackground       = AppTextPrimary,
    surface            = AppSurface,
    onSurface          = AppTextPrimary,
    surfaceVariant     = AppSurfaceVariant,
    onSurfaceVariant   = AppTextSecondary,
    outline            = AppDivider,
)

@Composable
fun AttendanceManagerTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AppColorScheme,
        typography  = Typography,
        content     = content
    )
}

