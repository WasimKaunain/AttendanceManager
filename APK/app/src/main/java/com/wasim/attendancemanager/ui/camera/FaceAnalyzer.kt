package com.wasim.attendancemanager.ui.camera

import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.ExperimentalGetImage
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.*
import kotlin.OptIn
import kotlin.math.abs

class FaceAnalyzer(
    private val onFaceStatus: (FaceStatus) -> Unit,
    private val onAutoCapture: () -> Unit
) : ImageAnalysis.Analyzer {

    private val detector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .build()
    )

    private var hasCaptured = false

    @ExperimentalGetImage
    @OptIn(ExperimentalGetImage::class)
    override fun analyze(imageProxy: ImageProxy) {

        if (hasCaptured) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image ?: run {
            imageProxy.close()
            return
        }

        val image = InputImage.fromMediaImage(
            mediaImage,
            imageProxy.imageInfo.rotationDegrees
        )

        detector.process(image)
            .addOnSuccessListener { faces ->

                if (faces.isEmpty()) {
                    onFaceStatus(FaceStatus.NO_FACE)
                } else {

                    val face = faces[0]

                    val centered = abs(face.headEulerAngleY) < 10
                    val eyesOpen =
                        (face.leftEyeOpenProbability ?: 0f) > 0.6f &&
                                (face.rightEyeOpenProbability ?: 0f) > 0.6f

                    if (centered && eyesOpen) {
                        hasCaptured = true
                        onFaceStatus(FaceStatus.READY)
                        onAutoCapture()
                    } else {
                        onFaceStatus(FaceStatus.DETECTED)
                    }
                }

                imageProxy.close()
            }
            .addOnFailureListener {
                imageProxy.close()
            }
    }
}