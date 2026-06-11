package com.attendcrew.app.data.local.db.siteworker

import android.content.Context
import com.attendcrew.app.data.api.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object SiteWorkerSyncer {

    suspend fun syncWorkers(
        context: Context
    ): Result<Int> = withContext(Dispatchers.IO) {

        runCatching {

            val repo =
                SiteWorkerRepository(context)

            val api =
                RetrofitInstance.getApi(context)

            val response =
                api.getSiteWorkers()

            if (!response.isSuccessful) {
                error("Site worker sync failed")
            }

            val workers =
                response.body().orEmpty()

            repo.upsertAll(
                workers.map {
                    SiteWorkerEntity(
                        id = it.id,
                        fullName = it.full_name,
                        mobile = it.mobile,
                        role = it.role,
                        type = it.type,
                        status = it.status,
                        joiningDate = it.joining_date,
                        photoUrl = it.photo_url,
                        todayStatus = it.today_status,
                        shiftId = it.shift_id,
                        dailyRate = it.daily_rate,
                        hourlyRate = it.hourly_rate,
                        monthlySalary = it.monthly_salary
                    )
                }
            )

            workers.size
        }
    }
}