package com.wasim.attendancemanager.ui.camera

import android.graphics.*
import androidx.camera.core.ImageProxy
import java.io.ByteArrayOutputStream

/**
 * Converts ImageProxy to a correctly-oriented upright Bitmap.
 * Applies the sensor rotation so the result always matches what the user sees
 * on screen — no rotated/sideways images sent to the server.
 *
 * @param rotationDegrees  from imageProxy.imageInfo.rotationDegrees
 * @param isFrontCamera    true = apply horizontal mirror flip (front cam is mirrored)
 */
fun ImageProxy.toBitmap(
    rotationDegrees: Int = 0,
    isFrontCamera: Boolean = false
): Bitmap {

    val yBuffer = planes[0].buffer
    val uBuffer = planes[1].buffer
    val vBuffer = planes[2].buffer

    val ySize = yBuffer.remaining()
    val uSize = uBuffer.remaining()
    val vSize = vBuffer.remaining()

    val nv21 = ByteArray(ySize + uSize + vSize)

    yBuffer.get(nv21, 0, ySize)
    vBuffer.get(nv21, ySize, vSize)
    uBuffer.get(nv21, ySize + vSize, uSize)

    val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)

    val out = ByteArrayOutputStream()
    yuvImage.compressToJpeg(Rect(0, 0, width, height), 100, out)

    val raw = BitmapFactory.decodeByteArray(out.toByteArray(), 0, out.size())

    // Build a matrix that rotates and optionally mirrors
    val matrix = Matrix()
    if (rotationDegrees != 0) {
        matrix.postRotate(rotationDegrees.toFloat())
    }
    if (isFrontCamera) {
        // Front camera sensor output is mirrored — flip horizontally to get natural image
        matrix.postScale(-1f, 1f, raw.width / 2f, raw.height / 2f)
    }

    return if (rotationDegrees != 0 || isFrontCamera) {
        Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, matrix, true)
    } else {
        raw
    }
}

/** Flips a bitmap horizontally (mirror). Used to un-mirror front camera captures. */
fun Bitmap.flipHorizontal(): Bitmap {
    val matrix = Matrix().apply { postScale(-1f, 1f, width / 2f, height / 2f) }
    return Bitmap.createBitmap(this, 0, 0, width, height, matrix, true)
}