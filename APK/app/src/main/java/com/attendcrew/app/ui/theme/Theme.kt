package com.attendcrew.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = BrandPrimary,
    onPrimary = LightSurface,

    secondary = BrandSecondary,
    onSecondary = LightSurface,

    background = LightBackground,
    onBackground = TextPrimaryLight,

    surface = LightSurface,
    onSurface = TextPrimaryLight,

    surfaceVariant = LightSurface2,
    onSurfaceVariant = TextSecondaryLight,

    primaryContainer = BrandPrimary.copy(alpha = 0.12f),
    onPrimaryContainer = BrandPrimaryDark,

    secondaryContainer = BrandSecondary.copy(alpha = 0.14f),
    onSecondaryContainer = TextPrimaryLight,

    outline = LightOutline,
    outlineVariant = LightOutline.copy(alpha = 0.75f),

    error = StatusError,
    onError = LightSurface,
)

private val DarkColorScheme = darkColorScheme(
    primary = BrandPrimary,
    onPrimary = DarkBackground,

    secondary = BrandSecondary,
    onSecondary = DarkBackground,

    background = DarkBackground,
    onBackground = TextPrimaryDark,

    surface = DarkSurface,
    onSurface = TextPrimaryDark,

    surfaceVariant = DarkSurface2,
    onSurfaceVariant = TextSecondaryDark,

    primaryContainer = BrandPrimary.copy(alpha = 0.20f),
    onPrimaryContainer = TextPrimaryDark,

    secondaryContainer = BrandSecondary.copy(alpha = 0.20f),
    onSecondaryContainer = TextPrimaryDark,

    outline = DarkOutline,
    outlineVariant = DarkOutline.copy(alpha = 0.75f),

    error = StatusError,
    onError = DarkBackground,
)

@Composable
fun AttendanceManagerTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
        typography = Typography,
        content = content
    )
}
