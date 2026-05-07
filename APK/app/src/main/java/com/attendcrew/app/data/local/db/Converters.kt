package com.attendcrew.app.data.local.db

import androidx.room.TypeConverter

/**
 * Room converters for lightweight binary storage.
 *
 * We store face embeddings as ByteArray (FloatArray encoded as little-endian IEEE754 floats)
 * to keep the storage compact and fast.
 */
object Converters {

    @TypeConverter
    @JvmStatic
    fun floatArrayToBytes(value: FloatArray?): ByteArray? {
        if (value == null) return null
        val buffer = java.nio.ByteBuffer
            .allocate(value.size * 4)
            .order(java.nio.ByteOrder.LITTLE_ENDIAN)
        for (f in value) buffer.putFloat(f)
        return buffer.array()
    }

    @TypeConverter
    @JvmStatic
    fun bytesToFloatArray(value: ByteArray?): FloatArray? {
        if (value == null) return null
        if (value.isEmpty()) return FloatArray(0)
        val buffer = java.nio.ByteBuffer
            .wrap(value)
            .order(java.nio.ByteOrder.LITTLE_ENDIAN)
        val out = FloatArray(value.size / 4)
        var i = 0
        while (buffer.remaining() >= 4) {
            out[i++] = buffer.getFloat()
        }
        return if (i == out.size) out else out.copyOf(i)
    }
}
