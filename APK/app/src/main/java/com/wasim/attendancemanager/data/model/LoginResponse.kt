package com.wasim.attendancemanager.data.model

data class LoginResponse(
    val access_token: String,
    val role: String? = null,
    val site_id: String? = null
)
