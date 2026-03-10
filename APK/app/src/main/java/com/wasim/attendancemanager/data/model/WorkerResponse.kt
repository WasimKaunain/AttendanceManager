package com.wasim.attendancemanager.data.model

data class WorkerResponse(
    val id: String,
    val full_name: String,
    val mobile: String,
    val site_id: String?,
    val status: String?
)
