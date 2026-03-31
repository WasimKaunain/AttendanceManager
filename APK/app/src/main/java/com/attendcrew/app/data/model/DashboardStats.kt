package com.attendcrew.app.data.model

data class DashboardStats(
    val site_name: String,
    val total_workers: Int,
    val active_workers: Int,
    val present_today: Int,
    val absent_today: Int,
    val checked_out_today: Int,
    val unenrolled_count: Int
)

data class WeeklyDay(
    val day: String,
    val date: String,
    val present: Int,
    val absent: Int
)

data class RecentActivity(
    val worker_id: String,
    val worker_name: String,
    val date: String,
    val check_in_time: String?,
    val check_out_time: String?,
    val status: String?,
    val is_late: Boolean?,
    val total_hours: Double?
)

