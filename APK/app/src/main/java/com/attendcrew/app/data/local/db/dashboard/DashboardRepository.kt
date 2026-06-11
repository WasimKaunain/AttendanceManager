package com.attendcrew.app.data.local.db.dashboard

import android.content.Context
import com.attendcrew.app.data.local.db.AppDatabase

class DashboardRepository(
    context: Context
) {

    private val dao =AppDatabase.getInstance(context).dashboardDao()

    suspend fun saveStats(stats: DashboardStatsEntity) = dao.upsertStats(stats)

    suspend fun saveWeekly(weekly: List<WeeklyDayEntity>) = dao.upsertWeekly(weekly)

    suspend fun saveRecent(recent: List<RecentActivityEntity>) = dao.upsertRecent(recent)

    suspend fun getStats() =dao.getStats()

    suspend fun getWeekly() =dao.getWeekly()

    suspend fun getRecent() =dao.getRecent()

    suspend fun clearWeekly() =dao.clearWeekly()

    suspend fun clearRecent() =dao.clearRecent()

    fun observeStats() =dao.observeStats()

    fun observeWeekly() =dao.observeWeekly()

    fun observeRecent() =dao.observeRecent()
}