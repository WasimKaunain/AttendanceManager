package com.attendcrew.app.data.model

data class GeofenceResponse(
    val inside: Boolean,
    val site_id: String?,
    val site_name: String?
)
