package com.attendcrew.app.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Premium palette notes:
 * - Brand color: Indigo (confident, enterprise)
 * - Backgrounds: slightly tinted to avoid harsh pure-white
 * - Surfaces: clean card layers in light, deep navy layers in dark
 * - Status colors: modern (emerald/amber/red)
 */

val AppPresent = Color(0xFF22C55E)      // Green
val AppAbsent = Color(0xFFEF4444)       // Red
val AppTextSecondary = Color(0xFF6B7280) // Gray

// Brand
val BrandPrimary = Color(0xFF4F46E5)     // Indigo 600
val BrandPrimaryDark = Color(0xFF4338CA) // Indigo 700
val BrandSecondary = Color(0xFF06B6D4)   // Cyan 500 (accent)

// Light surfaces
val LightBackground = Color(0xFFF7F8FC)
val LightSurface = Color(0xFFFFFFFF)
val LightSurface2 = Color(0xFFF1F3FA)
val LightOutline = Color(0xFFE5E7F0)

// Dark surfaces
val DarkBackground = Color(0xFF0B1020)
val DarkSurface = Color(0xFF0F172A)
val DarkSurface2 = Color(0xFF111C35)
val DarkOutline = Color(0xFF24314E)

// Text
val TextPrimaryLight = Color(0xFF0F172A)  // Slate 900
val TextSecondaryLight = Color(0xFF64748B) // Slate 500
val TextPrimaryDark = Color(0xFFE5E7EB)   // Slate 200
val TextSecondaryDark = Color(0xFF94A3B8) // Slate 400

// Status / semantic
val StatusSuccess = Color(0xFF10B981) // Emerald 500
val StatusWarning = Color(0xFFF59E0B) // Amber 500
val StatusError = Color(0xFFEF4444)   // Red 500
val StatusInfo = Color(0xFF3B82F6)    // Blue 500

// Utility
val DividerLight = LightOutline
val DividerDark = DarkOutline
val ScrimDark = Color(0x99000000)

// Soft shadow tint used for elevated cards (light mode)
val CardShadowTint = Color(0x1A4F46E5)
