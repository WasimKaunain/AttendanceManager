package com.attendcrew.app.data.local.db.dashboard

import android.content.Context
import android.util.Log
import com.attendcrew.app.data.api.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object DashboardSyncer {

    private const val TAG = "DASHBOARD_SYNC"

    suspend fun syncDashboard(
        context: Context
    ): Result<Unit> = withContext(Dispatchers.IO) {

        runCatching {

            Log.d(TAG, "========== STARTED ==========")

            val api = RetrofitInstance.getApi(context)

            Log.d(TAG, "Creating repository")
            val repo = DashboardRepository(context)

            Log.d(TAG, "Calling dashboard stats API")
            val statsResp = api.getDashboardStats()

            Log.d(
                TAG,
                "Stats response received | success=${statsResp.isSuccessful}"
            )

            Log.d(TAG, "Calling weekly attendance API")
            val weeklyResp = api.getWeeklyAttendance()

            Log.d(
                TAG,
                "Weekly response received | success=${weeklyResp.isSuccessful}"
            )

            Log.d(TAG, "Calling recent activity API")
            val recentResp = api.getRecentActivity()

            Log.d(
                TAG,
                "Recent response received | success=${recentResp.isSuccessful}"
            )

            if (
                !statsResp.isSuccessful ||
                !weeklyResp.isSuccessful ||
                !recentResp.isSuccessful
            ) {
                error(
                    "Dashboard sync failed. " +
                            "stats=${statsResp.code()} " +
                            "weekly=${weeklyResp.code()} " +
                            "recent=${recentResp.code()}"
                )
            }

            Log.d(TAG, "Reading stats body")

            val stats =
                statsResp.body()
                    ?: error("Missing stats body")

            Log.d(
                TAG,
                "Stats loaded: site=${stats.site_name}, totalWorkers=${stats.total_workers}"
            )

            Log.d(TAG, "Saving dashboard stats")

            repo.saveStats(
                DashboardStatsEntity(
                    siteName = stats.site_name,
                    totalWorkers = stats.total_workers,
                    activeWorkers = stats.active_workers,
                    presentToday = stats.present_today,
                    absentToday = stats.absent_today,
                    checkedOutToday = stats.checked_out_today,
                    unenrolledCount = stats.unenrolled_count
                )
            )

            Log.d(TAG, "Dashboard stats saved")

            Log.d(TAG, "Clearing weekly table")
            repo.clearWeekly()

            Log.d(TAG, "Saving weekly records")

            repo.saveWeekly(
                weeklyResp.body()
                    .orEmpty()
                    .map {
                        WeeklyDayEntity(
                            date = it.date,
                            day = it.day,
                            present = it.present,
                            absent = it.absent
                        )
                    }
            )

            Log.d(TAG, "Weekly records saved")

            Log.d(TAG, "Clearing recent activity table")
            repo.clearRecent()

            Log.d(TAG, "Saving recent activity records")

            repo.saveRecent(
                recentResp.body()
                    .orEmpty()
                    .map {
                        RecentActivityEntity(
                            workerId = it.worker_id,
                            workerName = it.worker_name,
                            date = it.date,
                            checkInTime = it.check_in_time,
                            checkOutTime = it.check_out_time,
                            status = it.status,
                            isLate = it.is_late,
                            totalHours = it.total_hours
                        )
                    }
            )

            Log.d(TAG, "Recent activity saved")

            Log.d(TAG, "========== SUCCESS ==========")
            Unit

        }.onFailure { e ->

            Log.e(
                TAG,
                "========== FAILED ==========",
                e
            )
        }
    }
}