package com.attendcrew.app.data.local.db.dashboard

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface DashboardDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertStats(
        stats: DashboardStatsEntity
    )

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWeekly(
        days: List<WeeklyDayEntity>
    )

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertRecent(
        activities: List<RecentActivityEntity>
    )

    @Query("""SELECT * FROM dashboard_stats LIMIT 1""")
    suspend fun getStats(): DashboardStatsEntity?

    @Query("""SELECT * FROM dashboard_weekly ORDER BY date ASC""")
    suspend fun getWeekly(): List<WeeklyDayEntity>

    @Query("""SELECT * FROM dashboard_recent_activity ORDER BY date DESC""")
    suspend fun getRecent(): List<RecentActivityEntity>

    @Query("DELETE FROM dashboard_weekly")
    suspend fun clearWeekly()

    @Query("DELETE FROM dashboard_recent_activity")
    suspend fun clearRecent()

    @Query("DELETE FROM dashboard_stats")
    suspend fun clearStats()

    @Query("SELECT * FROM dashboard_stats LIMIT 1")
    fun observeStats(): Flow<DashboardStatsEntity?>

    @Query("SELECT * FROM dashboard_weekly ORDER BY date ASC")
    fun observeWeekly(): Flow<List<WeeklyDayEntity>>

    @Query("SELECT * FROM dashboard_recent_activity ORDER BY date DESC")
    fun observeRecent(): Flow<List<RecentActivityEntity>>
}