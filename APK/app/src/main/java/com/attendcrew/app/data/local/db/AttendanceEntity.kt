package com.attendcrew.app.data.local.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "attendance",
    indices = [
        Index(value = ["workerId"]),
        Index(value = ["workerName"]),
        Index(value = ["date"]),
        Index(value = ["status"])
    ]
)
data class AttendanceEntity(

    @PrimaryKey
    val id: String,

    val workerId: String,

    val workerName: String,

    val date: String,

    val checkInTime: String?,

    val checkOutTime: String?,

    val status: String?,

    val isLate: Boolean?,

    val totalHours: Double?,

    val geofenceValid: Boolean?
)