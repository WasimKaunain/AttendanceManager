package com.wasim.attendancemanager.data.model

data class LoginResponse(
    val access_token: String,
    val role: String,
    val site_id: String?
)
