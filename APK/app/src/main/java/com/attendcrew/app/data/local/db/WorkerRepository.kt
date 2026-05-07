package com.attendcrew.app.data.local.db

import android.content.Context

class WorkerRepository(context: Context) {
    private val db = AppDatabase.getInstance(context)
    private val dao = db.workerDao()

    suspend fun upsertAll(workers: List<WorkerEntity>) = dao.upsertAll(workers)
    suspend fun getAll() = dao.getAll()
    suspend fun getById(workerId: Int) = dao.getById(workerId)
    suspend fun clearAll() = dao.clearAll()
    suspend fun count() = dao.count()
    suspend fun getMaxUpdatedAt() = dao.getMaxUpdatedAt()
}
