package com.attendcrew.app.data.local.db.siteworker

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface SiteWorkerDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(workers: List<SiteWorkerEntity>)

    @Query("""
        SELECT * FROM site_workers
        WHERE
            (:search IS NULL OR
             fullName LIKE '%' || :search || '%' OR
             mobile LIKE '%' || :search || '%' OR
             id LIKE '%' || :search || '%')
        AND
            (:status IS NULL OR status = :status)
        ORDER BY fullName ASC
    """)
    suspend fun getFiltered(
        search: String?,
        status: String?
    ): List<SiteWorkerEntity>

    @Query("SELECT * FROM site_workers")
    suspend fun getAll(): List<SiteWorkerEntity>

    @Query("DELETE FROM site_workers")
    suspend fun clearAll()

    @Query("SELECT COUNT(*) FROM site_workers")
    suspend fun count(): Int
}