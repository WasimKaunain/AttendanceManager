package com.attendcrew.app.data.local.db.siteworker

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "site_workers",
    indices = [
        Index(value = ["status"]),
        Index(value = ["todayStatus"])
    ]
)
data class SiteWorkerEntity(

    @PrimaryKey
    val id: String,

    val fullName: String,

    val mobile: String,

    val role: String?,

    val type: String?,

    val status: String,

    val joiningDate: String?,

    val photoUrl: String?,

    val todayStatus: String,

    val shiftId: String?,

    val dailyRate: Double?,

    val hourlyRate: Double?,

    val monthlySalary: Double?
)