package com.wasim.attendancemanager.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wasim.attendancemanager.ui.theme.*

// ── Stat Card ─────────────────────────────────────────────────────────────────

@Composable
fun StatCard(
    label: String,
    value: String,
    accent: Color,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .shadow(
                elevation = 4.dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = accent.copy(alpha = 0.15f),
                spotColor   = accent.copy(alpha = 0.25f)
            ),
        shape  = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AppSurface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(accent.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(20.dp)
                )
            }
            Text(
                text  = value,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color      = AppTextPrimary,
                    fontSize   = 26.sp
                )
            )
            Text(
                text  = label,
                style = MaterialTheme.typography.bodySmall.copy(
                    color    = AppTextSecondary,
                    fontSize = 12.sp
                )
            )
        }
    }
}

// ── Section Header ────────────────────────────────────────────────────────────

@Composable
fun SectionHeader(title: String, modifier: Modifier = Modifier) {
    Text(
        text     = title,
        style    = MaterialTheme.typography.titleMedium.copy(
            fontWeight = FontWeight.SemiBold,
            color      = AppTextPrimary
        ),
        modifier = modifier
    )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

@Composable
fun StatusBadge(label: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text  = label,
            style = MaterialTheme.typography.labelSmall.copy(
                color      = color,
                fontWeight = FontWeight.SemiBold
            )
        )
    }
}

// ── Divider ───────────────────────────────────────────────────────────────────

@Composable
fun AppDividerLine() {
    HorizontalDivider(
        color     = AppDivider,
        thickness = 1.dp,
        modifier  = Modifier.padding(horizontal = 16.dp)
    )
}

