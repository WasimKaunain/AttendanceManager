package com.attendcrew.app.data.model.offline

import com.google.gson.annotations.SerializedName

/** Backend shape we will add: GET /mobile/sync/site */
data class SiteSyncResponse(
    val site: SyncSite
)

data class SyncSite(
    val id: String,
    val name: String,

    @SerializedName("boundary_type")
    val boundaryType: String,

    val latitude: Double,
    val longitude: Double,

    @SerializedName("geofence_radius")
    val geofenceRadius: Double,

    @SerializedName("polygon_coords")
    val polygonCoords: List<PolygonPoint>? = null,

    val timezone: String? = null,

    @SerializedName("updated_at")
    val updatedAt: String? = null
)

data class PolygonPoint(
    val lat: Double,
    val lng: Double
)
