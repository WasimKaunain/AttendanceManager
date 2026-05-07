package com.attendcrew.app.data.local.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface AttendanceOutboxDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: AttendanceOutboxEntity): Long

    @Update
    suspend fun update(item: AttendanceOutboxEntity)

    @Query("SELECT * FROM attendance_outbox WHERE status IN ('new','failed') ORDER BY createdAt ASC LIMIT :limit")
    suspend fun getPending(limit: Int = 20): List<AttendanceOutboxEntity>

    @Query("UPDATE attendance_outbox SET status = :status, lastError = :lastError, attemptCount = :attemptCount WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String, lastError: String?, attemptCount: Int)

    @Query("DELETE FROM attendance_outbox WHERE id = :id")
    suspend fun deleteById(id: Long)
}
