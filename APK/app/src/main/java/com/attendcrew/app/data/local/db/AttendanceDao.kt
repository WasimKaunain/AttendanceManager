package com.attendcrew.app.data.local.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface AttendanceDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(records: List<AttendanceEntity>)

    @Query("""SELECT * FROM attendance ORDER BY date DESC""")
    suspend fun getAll(): List<AttendanceEntity>

    @Query("""SELECT * FROM attendance WHERE workerId = :workerId AND date = :date LIMIT 1""")
    suspend fun getAttendanceForDay(workerId: String,date: String): AttendanceEntity?
    @Query("""
        SELECT * FROM attendance
        WHERE
            (:workerName IS NULL OR workerName LIKE '%' || :workerName || '%')
            AND
            (:dateFrom IS NULL OR date >= :dateFrom)
            AND
            (:dateTo IS NULL OR date <= :dateTo)
        ORDER BY date DESC
    """)
    suspend fun getFiltered(workerName: String?,dateFrom: String?,dateTo: String?): List<AttendanceEntity>

    @Query("""
    SELECT * FROM attendance
    WHERE
        (:workerName IS NULL OR workerName LIKE '%' || :workerName || '%')
        AND
        (:dateFrom IS NULL OR date >= :dateFrom)
        AND
        (:dateTo IS NULL OR date <= :dateTo)
    ORDER BY date DESC
""")
    fun observeFiltered(
        workerName: String?,
        dateFrom: String?,
        dateTo: String?
    ): kotlinx.coroutines.flow.Flow<List<AttendanceEntity>>

    @Query("DELETE FROM attendance")
    suspend fun clearAll()

    @Query("SELECT COUNT(*) FROM attendance")
    suspend fun count(): Int

    @Query("""SELECT * FROM attendance WHERE workerId = :workerId ORDER BY date DESC""")
    suspend fun getByWorker(workerId: String): List<AttendanceEntity>

    @Query("""SELECT * FROM attendance WHERE workerId = :workerId AND date >= :startDate AND date <= :endDate""")
    suspend fun getMonthlyAttendance(workerId: String,startDate: String,endDate: String): List<AttendanceEntity>
}