package com.attendcrew.app.data.local.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface WorkerDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(workers: List<WorkerEntity>)

    @Query("SELECT * FROM workers WHERE workerId = :workerId LIMIT 1")
    suspend fun getById(workerId: Int): WorkerEntity?

    @Query("SELECT * FROM workers")
    suspend fun getAll(): List<WorkerEntity>

    @Query("SELECT MAX(updatedAt) FROM workers")
    suspend fun getMaxUpdatedAt(): String?

    @Query("DELETE FROM workers")
    suspend fun clearAll()

    @Query("SELECT COUNT(*) FROM workers")
    suspend fun count(): Int
}
