package com.attendcrew.app.data.local.db

import android.content.Context

class AttendanceOutboxRepository(context: Context) {
    private val db = AppDatabase.getInstance(context)
    private val dao = db.attendanceOutboxDao()

    suspend fun enqueue(item: AttendanceOutboxEntity): Long = dao.insert(item)
    suspend fun pending(limit: Int = 20) = dao.getPending(limit)
    suspend fun mark(id: Long, status: String, error: String?, attemptCount: Int) = dao.updateStatus(id, status, error, attemptCount)
    suspend fun delete(id: Long) = dao.deleteById(id)
}
