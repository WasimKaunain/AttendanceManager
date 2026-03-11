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

// ── 3-D Stat Card ─────────────────────────────────────────────────────────────

@Composable
fun StatCard(
    label: String,
    value: String,
    accent: Color,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    val shape = RoundedCornerShape(18.dp)

    Box(
        modifier = modifier
            .shadow(
                elevation    = 12.dp,
                shape        = shape,
                ambientColor = Color.Black.copy(alpha = 0.07f),
                spotColor    = Color.Black.copy(alpha = 0.16f)
            )
            .clip(shape)
            .background(MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 18.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(24.dp))
            Text(
                text  = value,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    color      = MaterialTheme.colorScheme.onSurface,
                    fontSize   = 28.sp
                )
            )
            Text(
                text  = label,
                style = MaterialTheme.typography.bodySmall.copy(
                    color    = MaterialTheme.colorScheme.onSurfaceVariant,
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
            color      = MaterialTheme.colorScheme.onBackground
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
        color     = MaterialTheme.colorScheme.outline,
        thickness = 0.8.dp,
        modifier  = Modifier.padding(horizontal = 16.dp)
    )
}
