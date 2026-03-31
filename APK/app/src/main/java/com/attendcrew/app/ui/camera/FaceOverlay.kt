package com.attendcrew.app.ui.camera

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun FaceOverlay(
    status: FaceStatus,
    steadyProgress: Float = 0f,
    showInstructions: Boolean = true
) {
    // ── Border colour ─────────────────────────────────────────────────────
    val targetBorderColor = when (status) {
        FaceStatus.NO_FACE        -> Color.White
        FaceStatus.DETECTED       -> Color(0xFFFFCC00)
        FaceStatus.TOO_CLOSE      -> Color(0xFFFF4444)
        FaceStatus.TOO_FAR        -> Color(0xFFFFCC00)
        FaceStatus.NOT_CENTERED   -> Color(0xFFFFCC00)
        FaceStatus.EYES_CLOSED    -> Color(0xFFFFCC00)
        FaceStatus.LOW_BRIGHTNESS -> Color(0xFFFF4444)
        FaceStatus.BLINK_REQUIRED -> Color(0xFF40C8F4)
        FaceStatus.HOLD_STEADY    -> Color(0xFF51CF66)
        FaceStatus.READY          -> Color(0xFF00E676)
    }
    val borderColor by animateColorAsState(targetBorderColor, tween(200), label = "bc")

    // ── Pulse for HOLD_STEADY / READY ─────────────────────────────────────
    val pulseAlpha by rememberInfiniteTransition(label = "pulse").animateFloat(
        initialValue  = 0.55f, targetValue = 1.0f,
        animationSpec = infiniteRepeatable(tween(500, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label         = "pa"
    )
    val strokeAlpha = if (status == FaceStatus.HOLD_STEADY || status == FaceStatus.READY) pulseAlpha else 1f
    val strokeWidth by animateFloatAsState(if (status == FaceStatus.READY) 10f else 5f, tween(200), label = "sw")
    val scrimAlpha  = if (status == FaceStatus.HOLD_STEADY || status == FaceStatus.READY) 0.30f else 0.58f

    // ── Instruction text ──────────────────────────────────────────────────
    val instructionText = when (status) {
        FaceStatus.NO_FACE        -> "👤  Position your face\ninside the oval"
        FaceStatus.DETECTED       -> "⏳  Checking…"
        FaceStatus.TOO_CLOSE      -> "↔  Move farther away"
        FaceStatus.TOO_FAR        -> "↔  Move closer"
        FaceStatus.NOT_CENTERED   -> "🎯  Align face\ninside the oval"
        FaceStatus.EYES_CLOSED    -> "👁  Open your eyes"
        FaceStatus.LOW_BRIGHTNESS -> "💡  Move to a\nbrighter area"
        FaceStatus.BLINK_REQUIRED -> "😉  Please blink once"
        FaceStatus.HOLD_STEADY    -> "✋  Hold still…"
        FaceStatus.READY          -> "✅  Perfect!"
    }
    val instructionColor = when (status) {
        FaceStatus.TOO_CLOSE,
        FaceStatus.LOW_BRIGHTNESS -> Color(0xFFFF6B6B)
        FaceStatus.BLINK_REQUIRED -> Color(0xFF40C8F4)
        FaceStatus.HOLD_STEADY    -> Color(0xFF51CF66)
        FaceStatus.READY          -> Color(0xFF00E676)
        else                      -> Color.White
    }

    // ── LAYER 1: Scrim + oval cutout + oval border — drawn BEHIND children ─
    // Using drawBehind so Compose children render ON TOP of the canvas drawings
    Box(
        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
            .drawBehind {
                val ovalW = size.width  * 0.72f
                val ovalH = size.height * 0.52f
                val left  = (size.width  - ovalW) / 2f
                val top   = (size.height - ovalH) / 2f - size.height * 0.03f

                // Scrim
                drawRect(Color.Black.copy(alpha = scrimAlpha))

                // Transparent oval punch-through (requires Offscreen compositing)
                drawOval(
                    color = Color.Transparent, topLeft = Offset(left, top),
                    size  = Size(ovalW, ovalH), blendMode = BlendMode.Clear
                )

                // Oval border
                drawOval(
                    color   = borderColor.copy(alpha = strokeAlpha),
                    topLeft = Offset(left, top), size = Size(ovalW, ovalH),
                    style   = Stroke(width = strokeWidth)
                )

                // Corner brackets
                val tk = 38f; val bw = 7f
                val bc = borderColor.copy(alpha = strokeAlpha)
                drawLine(bc, Offset(left, top + tk),                 Offset(left, top),                      strokeWidth = bw)
                drawLine(bc, Offset(left, top),                      Offset(left + tk, top),                 strokeWidth = bw)
                drawLine(bc, Offset(left + ovalW - tk, top),         Offset(left + ovalW, top),              strokeWidth = bw)
                drawLine(bc, Offset(left + ovalW, top),              Offset(left + ovalW, top + tk),         strokeWidth = bw)
                drawLine(bc, Offset(left, top + ovalH - tk),         Offset(left, top + ovalH),              strokeWidth = bw)
                drawLine(bc, Offset(left, top + ovalH),              Offset(left + tk, top + ovalH),         strokeWidth = bw)
                drawLine(bc, Offset(left + ovalW - tk, top + ovalH), Offset(left + ovalW, top + ovalH),      strokeWidth = bw)
                drawLine(bc, Offset(left + ovalW, top + ovalH),      Offset(left + ovalW, top + ovalH - tk), strokeWidth = bw)

                // Hold-steady sweep arc
                if (steadyProgress > 0f && status == FaceStatus.HOLD_STEADY) {
                    drawArc(
                        color = Color(0xFF00E676), startAngle = -90f,
                        sweepAngle = 360f * steadyProgress, useCenter = false,
                        topLeft = Offset(left, top), size = Size(ovalW, ovalH),
                        style = Stroke(width = 9f, cap = StrokeCap.Round)
                    )
                }

                // Full ring when READY
                if (status == FaceStatus.READY) {
                    drawArc(
                        color = Color(0xFF00E676).copy(alpha = strokeAlpha * 0.9f),
                        startAngle = -90f, sweepAngle = 360f, useCenter = false,
                        topLeft = Offset(left, top), size = Size(ovalW, ovalH),
                        style = Stroke(width = 10f, cap = StrokeCap.Round)
                    )
                }
            }
    ) {
        // ── LAYER 2: Instruction text — bare text, no container, centred ──
        if (showInstructions) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text       = instructionText,
                    color      = instructionColor,
                    fontSize   = 26.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign  = TextAlign.Center,
                    lineHeight = 36.sp
                )

                if (status == FaceStatus.HOLD_STEADY) {
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text       = "${(steadyProgress * 100).toInt()}%",
                        color      = Color(0xFF51CF66),
                        fontSize   = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign  = TextAlign.Center
                    )
                }
            }
        }
    }
}