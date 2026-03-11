package com.wasim.attendancemanager.ui.camera

import android.graphics.Bitmap
import android.os.Handler
import android.os.Looper
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import kotlin.math.abs

/**
 * Face analyzer for enrollment (strict) and checkin/checkout (soft-gate).
 *
 * KEY FIX: ML Kit returns bounding boxes in the ROTATED image coordinate space
 * (i.e. portrait = boxes are already portrait-oriented).
 * We must use the ROTATED dimensions for oval math, not raw sensor dimensions.
 *
 * @param strictMode         true = enrollment full checks, false = attendance soft-gate
 * @param onFaceStatus       UI status update — always called on main thread
 * @param onSteadyProgress   0.0–1.0 hold-steady arc progress — main thread
 * @param onAutoCapture      fire when ready to capture — main thread
 * @param onLowBrightness    fire when lighting is too dark — main thread
 */
class FaceAnalyzer(
    private val strictMode: Boolean,
    private val lensFacing: Int = CameraSelector.LENS_FACING_FRONT,
    private val onFaceStatus: (FaceStatus) -> Unit,
    private val onSteadyProgress: (Float) -> Unit = {},
    private val onAutoCapture: (Bitmap) -> Unit,   // ← carries the exact frame bitmap
    private val onLowBrightness: () -> Unit = {}
) : ImageAnalysis.Analyzer {

    companion object {
        private const val REQUIRED_STEADY_FRAMES = 10

        // Oval geometry matching FaceOverlay canvas math exactly:
        // ovalWidth = 72% of VIEW width,  centred horizontally
        // ovalHeight = 52% of VIEW height, centred vertically offset -3%
        // These are fractions of the DISPLAY (portrait) dimensions.
        private const val OVAL_X_START = 0.14f
        private const val OVAL_X_END   = 0.86f
        private const val OVAL_Y_START = 0.21f
        private const val OVAL_Y_END   = 0.73f
    }

    private val mainHandler = Handler(Looper.getMainLooper())

    private val detector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .setMinFaceSize(0.10f)
            .build()
    )

    @Volatile private var hasCaptured  = false
    @Volatile private var steadyFrames = 0

    // ── Blink state machine ────────────────────────────────────────────────
    // Phases in order:
    //   NEED_OPEN  — waiting to confirm eyes are open (initial state)
    //   NEED_CLOSE — eyes confirmed open, now wait for a close (the blink)
    //   NEED_REOPEN — saw close, wait for re-open to complete blink
    //   DONE       — blink confirmed
    private enum class BlinkPhase { NEED_OPEN, NEED_CLOSE, NEED_REOPEN, DONE }
    @Volatile private var blinkPhase = BlinkPhase.NEED_OPEN

    fun reset() {
        hasCaptured  = false
        steadyFrames = 0
        blinkPhase   = BlinkPhase.NEED_OPEN
    }

    private fun post(s: FaceStatus) = mainHandler.post { onFaceStatus(s) }
    private fun postP(p: Float)     = mainHandler.post { onSteadyProgress(p) }
    private fun postCapture(bmp: Bitmap) = mainHandler.post { onAutoCapture(bmp) }
    private fun postLow()           = mainHandler.post { onLowBrightness() }

    @OptIn(ExperimentalGetImage::class)
    override fun analyze(imageProxy: ImageProxy) {

        if (hasCaptured) { imageProxy.close(); return }

        val mediaImage  = imageProxy.image ?: run { imageProxy.close(); return }
        val rotationDeg = imageProxy.imageInfo.rotationDegrees
        val isFront     = lensFacing == CameraSelector.LENS_FACING_FRONT

        // Always decode bitmap now — needed for capture in both modes.
        // Rotation + mirror applied here so the saved image is always upright & un-mirrored.
        val bitmap: Bitmap? = try {
            imageProxy.toBitmap(rotationDeg, isFront)
        } catch (_: Exception) { null }

        // ── Determine the DISPLAY (rotated) width & height ────────────────
        val rotated = rotationDeg == 90 || rotationDeg == 270
        val dispW = if (rotated) imageProxy.height else imageProxy.width
        val dispH = if (rotated) imageProxy.width  else imageProxy.height

        val inputImage = InputImage.fromMediaImage(mediaImage, rotationDeg)

        detector.process(inputImage)
            .addOnSuccessListener { faces ->

                if (faces.isEmpty()) {
                    steadyFrames = 0; postP(0f)
                    post(FaceStatus.NO_FACE)
                    imageProxy.close(); return@addOnSuccessListener
                }

                val face = faces[0]
                val box  = face.boundingBox

                // ── Soft-gate (checkin / checkout) ─────────────────────────
                if (!strictMode) {
                    val faceWRatio = box.width().toFloat() / dispW.toFloat()
                    if (faceWRatio < 0.15f) {
                        post(FaceStatus.TOO_FAR)
                        imageProxy.close(); return@addOnSuccessListener
                    }
                    val ovalL = dispW * OVAL_X_START; val ovalR = dispW * OVAL_X_END
                    val ovalT = dispH * OVAL_Y_START; val ovalB = dispH * OVAL_Y_END
                    val cx = box.exactCenterX(); val cy = box.exactCenterY()
                    if (cx !in ovalL..ovalR || cy !in ovalT..ovalB) {
                        post(FaceStatus.NOT_CENTERED)
                        imageProxy.close(); return@addOnSuccessListener
                    }
                    if (bitmap == null) { imageProxy.close(); return@addOnSuccessListener }
                    hasCaptured = true
                    post(FaceStatus.READY); postCapture(bitmap)
                    imageProxy.close(); return@addOnSuccessListener
                }

                // ── Enrollment strict checks ───────────────────────────────

                // 1. Brightness
                if (bitmap != null) {
                    val luma = averageLuma(bitmap)
                    if (luma < 70f) {
                        steadyFrames = 0; postP(0f)
                        postLow(); post(FaceStatus.LOW_BRIGHTNESS)
                        imageProxy.close(); return@addOnSuccessListener
                    }
                }

                // 2. Distance
                val faceWRatio = box.width().toFloat() / dispW.toFloat()
                when {
                    faceWRatio > 0.70f -> {
                        steadyFrames = 0; postP(0f)
                        post(FaceStatus.TOO_CLOSE); imageProxy.close(); return@addOnSuccessListener
                    }
                    faceWRatio < 0.15f -> {
                        steadyFrames = 0; postP(0f)
                        post(FaceStatus.TOO_FAR); imageProxy.close(); return@addOnSuccessListener
                    }
                }

                // 3. Face center must be inside the oval, and bounding box must be
                //    mostly within the oval bounds (allow 15% overshoot on each edge)
                val ovalL  = dispW * OVAL_X_START;  val ovalR  = dispW * OVAL_X_END
                val ovalT  = dispH * OVAL_Y_START;  val ovalB  = dispH * OVAL_Y_END
                val ovalCx = (ovalL + ovalR) / 2f;  val ovalCy = (ovalT + ovalB) / 2f
                val ovalRx = (ovalR - ovalL) / 2f;  val ovalRy = (ovalB - ovalT) / 2f

                // Face centre must be inside the ellipse
                val faceCx = box.exactCenterX(); val faceCy = box.exactCenterY()
                val dxC = (faceCx - ovalCx) / ovalRx
                val dyC = (faceCy - ovalCy) / ovalRy
                val centerInOval = dxC * dxC + dyC * dyC <= 1.0f

                // Face bounding box must not extend beyond oval bounds by more than 15%
                val marginX = ovalRx * 0.15f
                val marginY = ovalRy * 0.15f
                val boxInOval = box.left   >= (ovalL - marginX) &&
                                box.right  <= (ovalR + marginX) &&
                                box.top    >= (ovalT - marginY) &&
                                box.bottom <= (ovalB + marginY)

                if (!centerInOval || !boxInOval) {
                    steadyFrames = 0; postP(0f)
                    post(FaceStatus.NOT_CENTERED); imageProxy.close(); return@addOnSuccessListener
                }

                // 4. Head angle (±12° — slightly relaxed from ±10° for usability)
                if (abs(face.headEulerAngleY) > 12f ||
                    abs(face.headEulerAngleX) > 12f ||
                    abs(face.headEulerAngleZ) > 12f) {
                    steadyFrames = 0; postP(0f)
                    post(FaceStatus.NOT_CENTERED); imageProxy.close(); return@addOnSuccessListener
                }

                // 5. Eye state — drives blink state machine
                val eyesOpen = (face.leftEyeOpenProbability  ?: 0f) >= 0.6f &&
                               (face.rightEyeOpenProbability ?: 0f) >= 0.6f

                // Advance blink phase
                blinkPhase = when (blinkPhase) {
                    BlinkPhase.NEED_OPEN   -> if (eyesOpen)  BlinkPhase.NEED_CLOSE  else BlinkPhase.NEED_OPEN
                    BlinkPhase.NEED_CLOSE  -> if (!eyesOpen) BlinkPhase.NEED_REOPEN else BlinkPhase.NEED_CLOSE
                    BlinkPhase.NEED_REOPEN -> if (eyesOpen)  BlinkPhase.DONE        else BlinkPhase.NEED_REOPEN
                    BlinkPhase.DONE        -> BlinkPhase.DONE
                }

                // If eyes are closed and blink not done yet, show EYES_CLOSED
                if (!eyesOpen && blinkPhase != BlinkPhase.DONE) {
                    steadyFrames = 0; postP(0f)
                    post(FaceStatus.EYES_CLOSED); imageProxy.close(); return@addOnSuccessListener
                }

                // 6. Liveness — require completed blink
                if (blinkPhase != BlinkPhase.DONE) {
                    steadyFrames = 0; postP(0f)
                    post(FaceStatus.BLINK_REQUIRED); imageProxy.close(); return@addOnSuccessListener
                }

                // 7. Eyes must STILL be open during hold-steady phase
                //    (catches the case where user blinks again mid-count)
                if (!eyesOpen) {
                    steadyFrames = 0; postP(0f)
                    post(FaceStatus.EYES_CLOSED); imageProxy.close(); return@addOnSuccessListener
                }


                // ✅ All checks passed — hold steady counter
                if (bitmap == null) { imageProxy.close(); return@addOnSuccessListener }
                steadyFrames++
                val progress = (steadyFrames.toFloat() / REQUIRED_STEADY_FRAMES).coerceIn(0f, 1f)
                postP(progress)

                if (steadyFrames < REQUIRED_STEADY_FRAMES) {
                    post(FaceStatus.HOLD_STEADY)
                    imageProxy.close(); return@addOnSuccessListener
                }

                // 🎯 All frames accumulated — CAPTURE the exact current frame
                hasCaptured = true
                postP(1f); post(FaceStatus.READY); postCapture(bitmap)
                imageProxy.close()
            }
            .addOnFailureListener {
                steadyFrames = 0; postP(0f)
                post(FaceStatus.NO_FACE)
                imageProxy.close()
            }
    }

    private fun averageLuma(bmp: Bitmap): Float {
        val step = 6; var sum = 0.0; var n = 0
        for (y in 0 until bmp.height step step)
            for (x in 0 until bmp.width step step) {
                val p = bmp.getPixel(x, y)
                sum += 0.299 * ((p shr 16) and 0xFF) +
                       0.587 * ((p shr 8)  and 0xFF) +
                       0.114 * (p          and 0xFF)
                n++
            }
        return if (n > 0) (sum / n).toFloat() else 0f
    }
}