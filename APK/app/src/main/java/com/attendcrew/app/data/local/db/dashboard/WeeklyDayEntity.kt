package com.attendcrew.app.data.local.db.dashboard

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dashboard_weekly")
data class WeeklyDayEntity(

    @PrimaryKey
    val date: String,

    val day: String,

    val present: Int,

    val absent: Int
)