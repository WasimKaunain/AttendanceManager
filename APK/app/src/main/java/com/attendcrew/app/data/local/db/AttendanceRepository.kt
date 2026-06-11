package com.attendcrew.app.data.local.db

import android.content.Context

class AttendanceRepository(context: Context) {

    private val db = AppDatabase.getInstance(context)
    private val dao = db.attendanceDao()

    suspend fun getAttendanceForDay(workerId: String,date: String) = dao.getAttendanceForDay(workerId, date)
    suspend fun upsertAll(records: List<AttendanceEntity>) = dao.upsertAll(records)

    suspend fun getAll() = dao.getAll()

    suspend fun getFiltered(workerName: String?,dateFrom: String?,dateTo: String?) = dao.getFiltered(workerName,dateFrom,dateTo)

    suspend fun clearAll() = dao.clearAll()

    suspend fun count() = dao.count()

    suspend fun getByWorker(workerId: String) = dao.getByWorker(workerId)

    suspend fun getMonthlyAttendance(workerId: String,startDate: String,endDate: String) = dao.getMonthlyAttendance(workerId,startDate,endDate)

    fun observeFiltered(workerName: String?,dateFrom: String?,dateTo: String?) = dao.observeFiltered(workerName,dateFrom,dateTo)
}