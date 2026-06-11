package com.attendcrew.app.data.local.db

import android.content.Context
import com.attendcrew.app.data.api.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object AttendanceSyncer {

    suspend fun syncAttendance(
        context: Context
    ): Result<Int> = withContext(Dispatchers.IO) {

        runCatching {

            val repo = AttendanceRepository(context)

            val api = RetrofitInstance.getApi(context)

            val response = api.getSiteAttendance()

            if (!response.isSuccessful) {error("Attendance sync failed")}

            val records = response.body().orEmpty()



            android.util.Log.d("ATT_SYNC","Fetched ${records.size} attendance records")

            records.forEach {android.util.Log.d("ATT_SYNC","id=${it.id} worker=${it.worker_id} date=${it.date}")}

            repo.upsertAll(
                records.map {
                    AttendanceEntity(
                        id = it.id,
                        workerId = it.worker_id,
                        workerName = it.worker_name,
                        date = it.date,
                        checkInTime = it.check_in_time,
                        checkOutTime = it.check_out_time,
                        status = it.status,
                        isLate = it.is_late,
                        totalHours = it.total_hours,
                        geofenceValid = it.geofence_valid
                    )
                }
            )

            records.size
        }
    }
}