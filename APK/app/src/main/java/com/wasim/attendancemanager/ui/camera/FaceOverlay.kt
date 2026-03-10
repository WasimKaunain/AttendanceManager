package com.wasim.attendancemanager.ui.camera

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke

@Composable
fun FaceOverlay(status: FaceStatus) {

    val borderColor = when (status) {
        FaceStatus.NO_FACE -> Color.White
        FaceStatus.DETECTED -> Color.Yellow
        FaceStatus.READY -> Color.Green
    }

    Canvas(modifier = Modifier.fillMaxSize()) {

        val ovalWidth = size.width * 0.75f
        val ovalHeight = size.height * 0.5f
        val left = (size.width - ovalWidth) / 2
        val top = (size.height - ovalHeight) / 2

        // Dark overlay
        drawRect(Color.Black.copy(alpha = 0.6f))

        // Cutout
        drawOval(
            color = Color.Transparent,
            topLeft = Offset(left, top),
            size = Size(ovalWidth, ovalHeight),
            blendMode = BlendMode.Clear
        )

        // Border
        drawOval(
            color = borderColor,
            topLeft = Offset(left, top),
            size = Size(ovalWidth, ovalHeight),
            style = Stroke(width = 6f)
        )
    }
}