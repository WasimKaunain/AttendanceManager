package com.attendcrew.app.data.model

import com.google.gson.annotations.SerializedName

data class AdminSite(
    val id: String,
    val name: String,
    val address: String? = null,
    val latitude: Double,
    val longitude: Double,
    @SerializedName("geofence_radius")
    val geofenceRadius: Double? = null
)


