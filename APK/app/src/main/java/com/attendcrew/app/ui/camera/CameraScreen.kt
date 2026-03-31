package com.attendcrew.app.ui.camera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Vibrator
import android.os.VibratorManager
import android.view.WindowManager
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.navigation.NavController
import com.google.gson.Gson
import com.attendcrew.app.data.api.RetrofitInstance
import com.attendcrew.app.utils.LocationHelper
import com.attendcrew.app.utils.ml.FaceDetectorHelper
import com.attendcrew.app.utils.ml.FaceEmbeddingManager
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.util.concurrent.Executors

// ─────────────────────────────────────────────────────────────────────────────
// CameraScreen — entry point
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun CameraScreen(
    navController: NavController,
    workerId: String,
    workerName: String,
    mode: String
) {
    if (mode == "enroll") {
        EnrollmentCameraScreen(navController, workerId, workerName)
    } else {
        AttendanceCameraScreen(navController, workerId, workerName, mode)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ENROLLMENT — strict checks → auto-capture → preview → Retake / Confirm
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun EnrollmentCameraScreen(
    navController: NavController,
    workerId: String,
    workerName: String
) {
    val context        = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope          = rememberCoroutineScope()
    // Cast context to ComponentActivity to access window for brightness control
    val activity       = context as? ComponentActivity

    var lensFacing        by remember { mutableIntStateOf(CameraSelector.LENS_FACING_FRONT) }
    var torchEnabled      by remember { mutableStateOf(false) }
    var faceStatus        by remember { mutableStateOf(FaceStatus.NO_FACE) }
    var steadyProgress    by remember { mutableStateOf(0f) }
    var capturedBitmap    by remember { mutableStateOf<Bitmap?>(null) }
    var isUploading       by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var retakeKey         by remember { mutableIntStateOf(0) }

    val previewView    = remember { PreviewView(context) }
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    var cameraRef      by remember { mutableStateOf<Camera?>(null) }

    // ── Screen brightness helpers ─────────────────────────────────────────
    fun setScreenBrightness(brightness: Float) {
        activity?.window?.let { window ->
            val params: WindowManager.LayoutParams = window.attributes
            params.screenBrightness = brightness.coerceIn(0.01f, 1.0f)
            window.attributes = params
        }
    }
    fun resetScreenBrightness() {
        activity?.window?.let { window ->
            val params: WindowManager.LayoutParams = window.attributes
            params.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
            window.attributes = params
        }
    }

    // Restore brightness when screen leaves
    DisposableEffect(Unit) {
        onDispose { resetScreenBrightness() }
    }

    val analyzer = remember {
        FaceAnalyzer(
            strictMode       = true,
            lensFacing       = lensFacing,
            onFaceStatus     = { faceStatus = it },
            onSteadyProgress = { steadyProgress = it },
            onAutoCapture    = { bmp ->
                // bmp is already rotation-correct and un-mirrored from FaceAnalyzer
                capturedBitmap = bmp
            },
            onLowBrightness  = {
                if (lensFacing == CameraSelector.LENS_FACING_FRONT) {
                    setScreenBrightness(1.0f)
                }
            }
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) {}

    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    // Bind camera whenever lensFacing changes OR after a retake
    LaunchedEffect(lensFacing, retakeKey) {
        if (capturedBitmap != null) return@LaunchedEffect   // preview mode, camera not needed

        val provider = ProcessCameraProvider.getInstance(context).get()

        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
        }

        val imageAnalysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also { it.setAnalyzer(cameraExecutor, analyzer) }

        val selector = CameraSelector.Builder().requireLensFacing(lensFacing).build()
        provider.unbindAll()
        cameraRef = provider.bindToLifecycle(lifecycleOwner, selector, preview, imageAnalysis)
    }

    // Torch sync
    LaunchedEffect(torchEnabled) { cameraRef?.cameraControl?.enableTorch(torchEnabled) }

    // ── UI ────────────────────────────────────────────────────────────────────
    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {

        if (capturedBitmap == null) {
            // ── Live camera view ─────────────────────────────────────────────
            AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())
            FaceOverlay(status = faceStatus, steadyProgress = steadyProgress, showInstructions = true)

            // Top bar — title
            CameraTopBar(title = "Face Enrollment  ·  $workerName")

            // Bottom controls
            CameraBottomBar(
                onFlip       = {
                    torchEnabled = false
                    lensFacing   = if (lensFacing == CameraSelector.LENS_FACING_FRONT)
                        CameraSelector.LENS_FACING_BACK else CameraSelector.LENS_FACING_FRONT
                },
                onFlash      = { torchEnabled = !torchEnabled },
                flashEnabled = torchEnabled,
                onBack       = { navController.popBackStack() }
            )
        } else {
            // ── Preview / Confirm screen ─────────────────────────────────────
            Image(
                bitmap      = capturedBitmap!!.asImageBitmap(),
                contentDescription = "Captured photo",
                contentScale = ContentScale.Crop,
                modifier    = Modifier.fillMaxSize()
            )

            // Dim overlay
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.35f)))

            // Preview label
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .padding(top = 56.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Photo Preview", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text("Does this look good?", color = Color.White.copy(alpha = 0.75f), fontSize = 14.sp)
            }

            if (isUploading) {
                CircularProgressIndicator(
                    color    = Color.White,
                    modifier = Modifier.align(Alignment.Center).size(52.dp)
                )
            } else {
                // Retake / Confirm buttons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .padding(horizontal = 32.dp, vertical = 48.dp),
                    horizontalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            capturedBitmap = null
                            analyzer.reset()
                            faceStatus     = FaceStatus.NO_FACE
                            steadyProgress = 0f
                            retakeKey++   // triggers camera rebind
                        },
                        modifier = Modifier.weight(1f).height(52.dp),
                        shape    = RoundedCornerShape(14.dp),
                        colors   = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                        border   = androidx.compose.foundation.BorderStroke(1.5.dp, Color.White)
                    ) {
                        Icon(Icons.Default.Refresh, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Retake", fontWeight = FontWeight.SemiBold)
                    }

                    Button(
                        onClick = {
                            isUploading = true
                            scope.launch {
                                val bmp      = capturedBitmap!!
                                val errorMsg = enrollFace(context, bmp, workerId)
                                withContext(Dispatchers.Main) {
                                    isUploading = false
                                    if (errorMsg == null) {
                                        vibrate(context)
                                        showSuccessDialog = true
                                    } else {
                                        Toast.makeText(context, errorMsg, Toast.LENGTH_LONG).show()
                                        capturedBitmap = null
                                        analyzer.reset()
                                        faceStatus     = FaceStatus.NO_FACE
                                        steadyProgress = 0f
                                        retakeKey++
                                    }
                                }
                            }
                        },
                        modifier = Modifier.weight(1f).height(52.dp),
                        shape    = RoundedCornerShape(14.dp),
                        colors   = ButtonDefaults.buttonColors(containerColor = Color(0xFF51CF66))
                    ) {
                        Icon(Icons.Default.Check, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Confirm", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }

    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = {},
            confirmButton = {
                Button(onClick = {
                    showSuccessDialog = false
                    navController.popBackStack()
                }) { Text("OK") }
            },
            title = { Text("Enrolled Successfully") },
            text  = { Text("$workerName has been enrolled.") }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ATTENDANCE (Check-in / Check-out) — countdown 3·2·1 → capture → upload
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun AttendanceCameraScreen(
    navController: NavController,
    workerId: String,
    workerName: String,
    mode: String
) {
    val context        = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope          = rememberCoroutineScope()

    var lensFacing   by remember { mutableIntStateOf(CameraSelector.LENS_FACING_FRONT) }
    var torchEnabled by remember { mutableStateOf(false) }
    var faceStatus   by remember { mutableStateOf(FaceStatus.NO_FACE) }
    var countdown    by remember { mutableIntStateOf(-1) }   // -1 = not started
    var isUploading  by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var capturedBitmap by remember { mutableStateOf<Bitmap?>(null) }

    val previewView    = remember { PreviewView(context) }
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    var cameraRef      by remember { mutableStateOf<Camera?>(null) }

    val analyzer = remember {
        FaceAnalyzer(
            strictMode    = false,
            lensFacing    = lensFacing,
            onFaceStatus  = { faceStatus = it },
            onAutoCapture = { _ ->
                // Soft-gate passed — start countdown.
                // We intentionally do NOT store the soft-gate frame here.
                // At countdown==0 we grab a fresh previewView.bitmap so the
                // user has been holding still for the full 3 seconds.
                if (countdown == -1) countdown = 3
            }
        )
    }

    // Countdown logic
    LaunchedEffect(countdown) {
        if (countdown == 0) {
            // Take a FRESH snapshot — user has held still for 3 full seconds
            val rawBmp = previewView.bitmap
            if (rawBmp != null) {
                val bmp = if (lensFacing == CameraSelector.LENS_FACING_FRONT)
                    rawBmp.flipHorizontal() else rawBmp

                // Blur check
                val blurScore = computeBlurScore(bmp)
                if (blurScore < MIN_BLUR_SCORE) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Photo too blurry. Hold still and try again.", Toast.LENGTH_SHORT).show()
                        countdown = -1
                        analyzer.reset()
                    }
                    return@LaunchedEffect
                }

                vibrate(context)
                isUploading = true
                val errorMsg = attendanceAction(context, bmp, workerId, mode)
                withContext(Dispatchers.Main) {
                    isUploading = false
                    if (errorMsg == null) {
                        showSuccessDialog = true
                    } else {
                        Toast.makeText(context, errorMsg, Toast.LENGTH_LONG).show()
                        countdown = -1
                        capturedBitmap = null
                        analyzer.reset()
                    }
                }
            }
        } else if (countdown > 0) {
            delay(1000L)
            countdown--
        }
    }

    // Reset analyzer if face lost during countdown
    LaunchedEffect(faceStatus) {
        if (faceStatus == FaceStatus.NO_FACE && countdown > 0) {
            countdown = -1   // face lost, cancel countdown
            analyzer.reset()
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) {}
    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    LaunchedEffect(lensFacing) {
        val provider = ProcessCameraProvider.getInstance(context).get()
        val preview  = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
        val analysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build().also { it.setAnalyzer(cameraExecutor, analyzer) }
        val selector = CameraSelector.Builder().requireLensFacing(lensFacing).build()
        provider.unbindAll()
        cameraRef = provider.bindToLifecycle(lifecycleOwner, selector, preview, analysis)
    }

    LaunchedEffect(torchEnabled) { cameraRef?.cameraControl?.enableTorch(torchEnabled) }

    // ── UI ────────────────────────────────────────────────────────────────────
    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {

        AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())

        // Oval overlay — brief instructions so worker knows to align face
        FaceOverlay(status = faceStatus, showInstructions = true)

        CameraTopBar(
            title = if (mode == "checkin") "Check In  ·  $workerName" else "Check Out  ·  $workerName"
        )

        // Countdown badge
        if (countdown > 0) {
            val scale by animateFloatAsState(
                targetValue = 1f,
                animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
                label = "countdownScale"
            )
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text       = countdown.toString(),
                    color      = Color.White,
                    fontSize   = 96.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }

        if (isUploading) {
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(52.dp))
            }
        }

        CameraBottomBar(
            onFlip       = {
                torchEnabled = false
                countdown    = -1
                analyzer.reset()
                lensFacing   = if (lensFacing == CameraSelector.LENS_FACING_FRONT)
                    CameraSelector.LENS_FACING_BACK else CameraSelector.LENS_FACING_FRONT
            },
            onFlash      = { torchEnabled = !torchEnabled },
            flashEnabled = torchEnabled,
            onBack       = { navController.popBackStack() }
        )
    }

    if (showSuccessDialog) {
        val msg = if (mode == "checkin") "Check-in successful for $workerName"
                  else "Check-out successful for $workerName"
        AlertDialog(
            onDismissRequest = {},
            confirmButton = {
                Button(onClick = {
                    showSuccessDialog = false
                    navController.popBackStack()
                }) { Text("OK") }
            },
            title = { Text("Success") },
            text  = { Text(msg) }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun CameraTopBar(title: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.45f))
            .padding(horizontal = 16.dp, vertical = 14.dp)
    ) {
        Text(title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun BoxScope.CameraBottomBar(
    onFlip: () -> Unit,
    onFlash: () -> Unit,
    flashEnabled: Boolean,
    onBack: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .align(Alignment.BottomCenter)
            .background(Color.Black.copy(alpha = 0.5f))
            .padding(horizontal = 32.dp, vertical = 18.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment     = Alignment.CenterVertically
        ) {
            // Back
            CamIconButton(icon = Icons.Default.ArrowBack, label = "Back",  onClick = onBack)
            // Flash
            CamIconButton(
                icon      = if (flashEnabled) Icons.Default.FlashOn else Icons.Default.FlashOff,
                label     = if (flashEnabled) "Flash On" else "Flash Off",
                tint      = if (flashEnabled) Color(0xFFFFD43B) else Color.White,
                onClick   = onFlash
            )
            // Flip
            CamIconButton(icon = Icons.Default.FlipCameraAndroid, label = "Flip", onClick = onFlip)
        }
    }
}

@Composable
private fun CamIconButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    tint: Color = Color.White,
    onClick: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        IconButton(
            onClick  = onClick,
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.15f))
        ) {
            Icon(icon, contentDescription = label, tint = tint, modifier = Modifier.size(26.dp))
        }
        Spacer(Modifier.height(4.dp))
        Text(label, color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload helpers
// ─────────────────────────────────────────────────────────────────────────────

private suspend fun enrollFace(context: Context, bitmap: Bitmap, workerId: String): String? {
    return withContext(Dispatchers.IO) {
        try {
            val faceDetector  = FaceDetectorHelper()
            val faceBitmap    = faceDetector.detectFace(bitmap) ?: bitmap
            val embedding     = FaceEmbeddingManager.getEmbedding(faceBitmap)
            val embeddingJson = Gson().toJson(embedding.toList())
            val file          = compressImage(context, bitmap)

            val embeddingBody = embeddingJson.toRequestBody("text/plain".toMediaTypeOrNull())
            val requestFile   = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
            val photoPart     = MultipartBody.Part.createFormData("photo", file.name, requestFile)

            val resp = RetrofitInstance.getApi(context).enrollFace(workerId, embeddingBody, photoPart)
            if (resp.isSuccessful) null
            else parseError(resp.errorBody()?.string())
        } catch (e: Exception) { "Error: ${e.message}" }
    }
}

private suspend fun attendanceAction(
    context: Context,
    bitmap: Bitmap,
    workerId: String,
    mode: String
): String? = suspendCancellableCoroutine { cont ->
    val locationHelper = LocationHelper(context)
    locationHelper.getCurrentLocation(
        onResult = { lat, lon ->
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val faceDetector  = FaceDetectorHelper()
                    val faceBitmap    = faceDetector.detectFace(bitmap) ?: bitmap
                    val embedding     = FaceEmbeddingManager.getEmbedding(faceBitmap)
                    val embeddingJson = Gson().toJson(embedding.toList())
                    val file          = compressImage(context, bitmap)

                    val api          = RetrofitInstance.getApi(context)
                    val embBody      = embeddingJson.toRequestBody("text/plain".toMediaTypeOrNull())
                    val reqFile      = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
                    val photoPart    = MultipartBody.Part.createFormData("photo", file.name, reqFile)
                    val workerIdBody = workerId.trim().toRequestBody("text/plain".toMediaTypeOrNull())
                    val latBody      = lat.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                    val lonBody      = lon.toString().toRequestBody("text/plain".toMediaTypeOrNull())

                    val resp = if (mode == "checkin")
                        api.checkIn(workerIdBody, latBody, lonBody, embBody, photoPart)
                    else
                        api.checkOut(workerIdBody, latBody, lonBody, embBody, photoPart)

                    if (resp.isSuccessful) cont.resume(null, null)
                    else cont.resume(parseError(resp.errorBody()?.string()), null)
                } catch (e: Exception) { cont.resume("Error: ${e.message}", null) }
            }
        },
        onFailure = { cont.resume("Could not get location. Please enable GPS.", null) }
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────────────────────

/** Parse {"detail":"..."} JSON error body from the server into a readable string. */
fun parseError(body: String?): String {
    if (body == null) return "Server error. Try again."
    return try {
        // Simple extraction without a full JSON parser dependency
        val match = Regex(""""detail"\s*:\s*"([^"]+)"""").find(body)
        match?.groupValues?.get(1) ?: body
    } catch (_: Exception) { body }
}
// Higher score = sharper image. Blurry images have very low variance.
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum Laplacian variance for a usable photo. Tune if needed. */
private const val MIN_BLUR_SCORE = 80.0

/**
 * Computes the Laplacian variance of a bitmap (sharpness score).
 * Samples a centre crop at reduced resolution for speed.
 * Returns a value where higher = sharper. Below ~80 = blurry.
 */
fun computeBlurScore(bitmap: Bitmap): Double {
    // Downscale to 200×200 for fast computation
    val scaled = Bitmap.createScaledBitmap(bitmap, 200, 200, true)
    val w = scaled.width
    val h = scaled.height

    // Convert to grayscale and apply 3×3 Laplacian kernel
    // kernel: [0,1,0; 1,-4,1; 0,1,0]
    var sum    = 0.0
    var sumSq  = 0.0
    var count  = 0

    for (y in 1 until h - 1) {
        for (x in 1 until w - 1) {
            fun luma(px: Int): Double {
                val r = (px shr 16) and 0xFF
                val g = (px shr 8)  and 0xFF
                val b = px          and 0xFF
                return 0.299 * r + 0.587 * g + 0.114 * b
            }
            val lap = -4.0 * luma(scaled.getPixel(x,   y  )) +
                               luma(scaled.getPixel(x-1, y  )) +
                               luma(scaled.getPixel(x+1, y  )) +
                               luma(scaled.getPixel(x,   y-1)) +
                               luma(scaled.getPixel(x,   y+1))
            sum   += lap
            sumSq += lap * lap
            count++
        }
    }
    if (count == 0) return 0.0
    val mean     = sum   / count
    val variance = sumSq / count - mean * mean
    return variance
}

fun vibrate(context: Context) {    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        vibrator.vibrate(android.os.VibrationEffect.createOneShot(80, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
    }
}

fun compressImage(context: Context, bitmap: Bitmap): File {
    val maxSize  = 720
    val ratio    = bitmap.width.toFloat() / bitmap.height.toFloat()
    val newWidth : Int
    val newHeight: Int
    if (bitmap.width > bitmap.height) { newWidth = maxSize; newHeight = (maxSize / ratio).toInt() }
    else { newHeight = maxSize; newWidth = (maxSize * ratio).toInt() }
    val resized = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    val file    = File(context.cacheDir, "compressed_${System.currentTimeMillis()}.jpg")
    file.outputStream().use { resized.compress(Bitmap.CompressFormat.JPEG, 60, it) }
    return file
}
