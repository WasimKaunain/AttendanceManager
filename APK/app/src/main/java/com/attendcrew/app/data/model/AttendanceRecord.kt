package com.attendcrew.app.data.model

data class AttendanceRecord(
    val id: String,
    val worker_id: String,
    val worker_name: String,
    val date: String,
    val check_in_time: String?,
    val check_out_time: String?,
    val status: String?,
    val is_late: Boolean?,
    val total_hours: Double?,
    val geofence_valid: Boolean?
)

