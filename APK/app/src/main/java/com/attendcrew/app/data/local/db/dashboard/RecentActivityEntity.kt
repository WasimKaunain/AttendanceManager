package com.attendcrew.app.data.local.db.dashboard

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "dashboard_recent_activity",
    indices = [
        Index(value = ["date"])
    ]
)
data class RecentActivityEntity(

    @PrimaryKey(autoGenerate = true)
    val localId: Long = 0,

    val workerId: String,

    val workerName: String,

    val date: String,

    val checkInTime: String?,

    val checkOutTime: String?,

    val status: String?,

    val isLate: Boolean?,

    val totalHours: Double?
)