package com.wasim.attendancemanager.utils.ml

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.*
import kotlinx.coroutines.tasks.await

class FaceDetectorHelper {

    private val detector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setMinFaceSize(0.2f)
            .build()
    )

    suspend fun detectFace(bitmap: Bitmap): Bitmap? {
        val image = InputImage.fromBitmap(bitmap, 0)
        val faces = detector.process(image).await()

        if (faces.isEmpty()) return null

        val face = faces[0]
        val bounds = face.boundingBox
        println("Faces detected: ${faces.size}")
        return Bitmap.createBitmap(
            bitmap,
            bounds.left.coerceAtLeast(0),
            bounds.top.coerceAtLeast(0),
            bounds.width().coerceAtMost(bitmap.width - bounds.left),
            bounds.height().coerceAtMost(bitmap.height - bounds.top)
        )
    }
}