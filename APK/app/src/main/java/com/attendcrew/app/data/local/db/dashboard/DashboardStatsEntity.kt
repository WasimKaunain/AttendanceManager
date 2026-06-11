package com.attendcrew.app.data.local.db.dashboard

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dashboard_stats")
data class DashboardStatsEntity(

    @PrimaryKey
    val siteName: String,

    val totalWorkers: Int,

    val activeWorkers: Int,

    val presentToday: Int,

    val absentToday: Int,

    val checkedOutToday: Int,

    val unenrolledCount: Int,

    val updatedAt: Long = System.currentTimeMillis()
)