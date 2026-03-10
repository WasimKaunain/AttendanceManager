package com.wasim.attendancemanager.utils.ml

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel
import kotlin.math.sqrt

object FaceEmbeddingManager {

    private var interpreter: Interpreter? = null

    fun initialize(context: Context) {
        if (interpreter != null) return

        val model = loadModelFile(context)
        interpreter = Interpreter(model)

        // 🔥 Warm up model
        val dummyInput = ByteBuffer.allocateDirect(1 * 112 * 112 * 3 * 4)
        dummyInput.order(ByteOrder.nativeOrder())
        val dummyOutput = Array(1) { FloatArray(192) }
        interpreter?.run(dummyInput, dummyOutput)
    }

    private fun loadModelFile(context: Context): ByteBuffer {
        val fileDescriptor = context.assets.openFd("mobilefacenet.tflite")
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    fun getEmbedding(bitmap: Bitmap): FloatArray {

        val inputSize = 112
        val resized = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)

        val inputBuffer = ByteBuffer.allocateDirect(1 * inputSize * inputSize * 3 * 4)
        inputBuffer.order(ByteOrder.nativeOrder())

        for (y in 0 until inputSize) {
            for (x in 0 until inputSize) {
                val pixel = resized.getPixel(x, y)

                inputBuffer.putFloat(((pixel shr 16 and 0xFF) - 127.5f) / 128f)
                inputBuffer.putFloat(((pixel shr 8 and 0xFF) - 127.5f) / 128f)
                inputBuffer.putFloat(((pixel and 0xFF) - 127.5f) / 128f)
            }
        }

        val output = Array(1) { FloatArray(192) }

        interpreter?.run(inputBuffer, output)

        return l2Normalize(output[0])
    }

    private fun l2Normalize(embedding: FloatArray): FloatArray {
        var sum = 0f
        for (v in embedding) sum += v * v
        val norm = sqrt(sum)

        return if (norm > 0) {
            embedding.map { it / norm }.toFloatArray()
        } else {
            embedding
        }
    }
}