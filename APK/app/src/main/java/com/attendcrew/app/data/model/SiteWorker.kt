package com.attendcrew.app.data.model

data class SiteWorker(
    val id: String,
    val full_name: String,
    val mobile: String,
    val role: String?,
    val type: String?,
    val status: String,
    val joining_date: String?,
    val photo_url: String?,
    val today_status: String,   // "present" | "absent" | "checked_out"
    val shift_id: String?,
    val daily_rate: Double?,
    val hourly_rate: Double?,
    val monthly_salary: Double?
)
