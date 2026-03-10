package com.wasim.attendancemanager.ui.camera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Vibrator
import android.os.VibratorManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.navigation.NavController
import com.google.gson.Gson
import com.wasim.attendancemanager.data.api.RetrofitInstance
import com.wasim.attendancemanager.utils.LocationHelper
import com.wasim.attendancemanager.utils.ml.FaceDetectorHelper
import com.wasim.attendancemanager.utils.ml.FaceEmbeddingManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.util.concurrent.Executors

@Composable
fun CameraScreen(
    navController: NavController,
    workerId: String,
    workerName: String,
    mode: String
) {

    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()

    var lensFacing by remember { mutableIntStateOf(CameraSelector.LENS_FACING_FRONT) }
    var isLoading by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var faceStatus by remember { mutableStateOf(FaceStatus.NO_FACE) }
    var isProcessing by remember { mutableStateOf(false) }

    val previewView = remember { PreviewView(context) }
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) {}

    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    // 🔥 Camera + Analyzer
    LaunchedEffect(lensFacing) {

        val cameraProvider = ProcessCameraProvider
            .getInstance(context)
            .get()

        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
        }

        val imageAnalyzer = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()

        imageAnalyzer.setAnalyzer(cameraExecutor) { imageProxy ->

            if (isProcessing) {
                imageProxy.close()
                return@setAnalyzer
            }

            val bitmap = imageProxy.toBitmap()  // ✅ Correct

            scope.launch {

                val faceDetector = FaceDetectorHelper()
                val face = faceDetector.detectFace(bitmap)

                if (face == null) {
                    faceStatus = FaceStatus.NO_FACE
                    imageProxy.close()
                    return@launch
                }

                faceStatus = FaceStatus.READY

                isProcessing = true
                isLoading = true

                vibrate(context)

                withContext(Dispatchers.Default) {

                    // ✅ Use singleton directly
                    val embedding = FaceEmbeddingManager.getEmbedding(face)
                    val embeddingJson = Gson().toJson(embedding.toList())

                    val compressedFile = compressImage(context, bitmap)

                    val success = uploadImage(
                        compressedFile,
                        workerId,
                        mode,
                        context,
                        embeddingJson
                    )

                    withContext(Dispatchers.Main) {
                        isLoading = false
                        if (success) {
                            showSuccessDialog = true
                        } else {
                            Toast.makeText(context, "Operation Failed", Toast.LENGTH_LONG).show()
                            isProcessing = false
                        }
                    }
                }

                imageProxy.close()
            }
        }

        val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build()

        cameraProvider.unbindAll()

        cameraProvider.bindToLifecycle(
            lifecycleOwner,
            cameraSelector,
            preview,
            imageAnalyzer
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            AndroidView(
                factory = { previewView },
                modifier = Modifier.fillMaxSize()
            )

            FaceOverlay(status = faceStatus)
        }

        Button(
            onClick = {
                lensFacing =
                    if (lensFacing == CameraSelector.LENS_FACING_FRONT)
                        CameraSelector.LENS_FACING_BACK
                    else
                        CameraSelector.LENS_FACING_FRONT
            },
            modifier = Modifier
                .padding(16.dp)
                .align(Alignment.CenterHorizontally)
        ) {
            Text("Flip Camera")
        }

        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier
                    .padding(16.dp)
                    .align(Alignment.CenterHorizontally)
            )
        }
    }

    if (showSuccessDialog) {

        val message = when (mode) {
            "enroll" -> "Enrollment successful : $workerName"
            "checkin" -> "Check-in successful : $workerName"
            else -> "Check-out successful : $workerName"
        }

        AlertDialog(
            onDismissRequest = {},
            confirmButton = {
                Button(
                    onClick = {
                        showSuccessDialog = false
                        navController.popBackStack()
                    }
                ) {
                    Text("OK")
                }
            },
            title = { Text("Success") },
            text = { Text(message) }
        )
    }
}

fun vibrate(context: Context) {

    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {

        val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            manager.defaultVibrator
        } else {
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        vibrator.vibrate(
            android.os.VibrationEffect.createOneShot(
                80,
                android.os.VibrationEffect.DEFAULT_AMPLITUDE
            )
        )
    }
}

fun compressImage(context: Context, bitmap: Bitmap): File {

    val maxSize = 720
    val ratio = bitmap.width.toFloat() / bitmap.height.toFloat()

    val newWidth: Int
    val newHeight: Int

    if (bitmap.width > bitmap.height) {
        newWidth = maxSize
        newHeight = (maxSize / ratio).toInt()
    } else {
        newHeight = maxSize
        newWidth = (maxSize * ratio).toInt()
    }

    val resizedBitmap = Bitmap.createScaledBitmap(bitmap,newWidth,newHeight,true)

    val file = File(
        context.cacheDir,
        "compressed_${System.currentTimeMillis()}.jpg"
    )

    file.outputStream().use {
        resizedBitmap.compress(Bitmap.CompressFormat.JPEG, 60, it)
    }

    return file
}

suspend fun uploadImage(
    file: File,
    workerId: String,
    mode: String,
    context: Context,
    embeddingJson: String
): Boolean {

    val api = RetrofitInstance.getApi(context)

    val embeddingBody =
        embeddingJson.toRequestBody("text/plain".toMediaTypeOrNull())

    val requestFile =
        file.asRequestBody("image/jpeg".toMediaTypeOrNull())

    val body =
        MultipartBody.Part.createFormData("photo", file.name, requestFile)

    val cleanWorkerId = workerId.trim().replace("`", "")
    val workerIdBody =
        cleanWorkerId.toRequestBody("text/plain".toMediaTypeOrNull())

    val locationHelper = LocationHelper(context)

    return suspendCancellableCoroutine { continuation ->

        locationHelper.getCurrentLocation { lat, lon ->

            CoroutineScope(Dispatchers.IO).launch {

                try {

                    val latBody =
                        lat.toString().toRequestBody("text/plain".toMediaTypeOrNull())

                    val lonBody =
                        lon.toString().toRequestBody("text/plain".toMediaTypeOrNull())

                    val response = when (mode) {
                        "enroll" ->
                            api.enrollFace(workerId, embeddingBody, body)

                        "checkin" ->
                            api.checkIn(workerIdBody, latBody, lonBody, embeddingBody, body)

                        else ->
                            api.checkOut(workerIdBody, latBody, lonBody, embeddingBody, body)
                    }

                    continuation.resume(response.isSuccessful, null)

                } catch (e: Exception) {
                    continuation.resume(false, null)
                }
            }
        }
    }
}