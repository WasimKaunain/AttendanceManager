package com.attendcrew.app.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.attendcrew.app.data.api.RetrofitInstance
import com.attendcrew.app.data.local.db.AttendanceOutboxRepository
import com.attendcrew.app.data.local.db.AttendanceOutboxEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import com.attendcrew.app.data.local.db.AttendanceSyncer
import java.io.File

class AttendanceSyncWorker(appContext: Context,params: WorkerParameters) : CoroutineWorker(appContext, params)
{
    override suspend fun doWork(): Result = withContext(Dispatchers.IO)
    {
        val repo = AttendanceOutboxRepository(applicationContext)
        val api = RetrofitInstance.getApi(applicationContext)

        val items = repo.pending(limit = 20)
        items.forEach {android.util.Log.d("OUTBOX_DEBUG","id=${it.id} mode=${it.mode} status=${it.status}")}
        if (items.isEmpty()) return@withContext Result.success()

        for (item in items)
        {
            val attempt = item.attemptCount + 1
            try {
                repo.mark(item.id, status = "in_flight", error = null, attemptCount = attempt)

                android.util.Log.d("MODE_DEBUG","Uploading outbox id=${item.id} mode=${item.mode} worker=${item.workerId}")
                val resp = uploadItem(api, item)

                if (resp.isSuccessful)
                {
                    android.util.Log.d("OUTBOX_SYNC", "Deleting id=${item.id}")

                    repo.delete(item.id)

                    android.util.Log.d("OUTBOX_SYNC", "Deleted id=${item.id}")
                    android.util.Log.d("OUTBOX_SYNC","Remaining pending = ${repo.pending(100).size}")

                    item.photoPath?.let { path ->
                        runCatching { File(path).delete() }}

                    // Refresh local attendance cache immediately
                    runCatching {AttendanceSyncer.syncAttendance(applicationContext)}

                }
                else {
                    val err = "${resp.code()} ${resp.message()}"
                    repo.mark(item.id, status = "failed", error = err, attemptCount = attempt)
                    // For 4xx, don't retry endlessly.
                    if (resp.code() in 400..499) return@withContext Result.success()
                    return@withContext Result.retry()
                }
            } catch (e: Exception) {
                repo.mark(item.id, status = "failed", error = e.message, attemptCount = attempt)
                return@withContext Result.retry()
            }
        }

        Result.success()
    }

    private suspend fun uploadItem(api: com.attendcrew.app.data.api.ApiService, item: AttendanceOutboxEntity): retrofit2.Response<Any> {
        val workerIdBody = item.workerId.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        val latBody = item.latitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        val lonBody = item.longitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        val timeBody = item.deviceTimeUtc.toRequestBody("text/plain".toMediaTypeOrNull())
        val verifiedBody = item.localVerified.toString().toRequestBody("text/plain".toMediaTypeOrNull())

        val similarityBody = item.similarityScore?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
        val thresholdBody = item.threshold?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
        val deviceIdBody = item.deviceAttendanceId.toRequestBody("text/plain".toMediaTypeOrNull())

        val photoPart = item.photoPath?.let { path ->
            val file = File(path)
            if (file.exists()) {
                val req = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("photo", file.name, req)
            } else null
        }

        return if (item.mode == "checkin") {
            api.offlineCheckIn(
                workerId = workerIdBody,
                latitude = latBody,
                longitude = lonBody,
                deviceTimeUtc = timeBody,
                localVerified = verifiedBody,
                similarityScore = similarityBody,
                threshold = thresholdBody,
                deviceAttendanceId = deviceIdBody,
                photo = photoPart
            )
        } else {
            api.offlineCheckOut(
                workerId = workerIdBody,
                latitude = latBody,
                longitude = lonBody,
                deviceTimeUtc = timeBody,
                localVerified = verifiedBody,
                similarityScore = similarityBody,
                threshold = thresholdBody,
                deviceAttendanceId = deviceIdBody,
                photo = photoPart
            )
        }
    }
}
