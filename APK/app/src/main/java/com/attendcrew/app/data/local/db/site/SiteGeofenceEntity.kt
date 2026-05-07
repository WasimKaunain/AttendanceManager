package com.attendcrew.app.data.local.db.site

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "site_geofence")
data class SiteGeofenceEntity(
    @PrimaryKey
    @ColumnInfo(name = "siteId")
    val siteId: String,

    @ColumnInfo(name = "siteName")
    val siteName: String,

    /** "circle" | "polygon" */
    @ColumnInfo(name = "boundaryType")
    val boundaryType: String,

    @ColumnInfo(name = "latitude")
    val latitude: Double,

    @ColumnInfo(name = "longitude")
    val longitude: Double,

    @ColumnInfo(name = "radiusM")
    val radiusM: Double? = null,

    /** JSON array: [{"lat":..,"lng":..}, ...] */
    @ColumnInfo(name = "polygonJson")
    val polygonJson: String? = null,

    /** From backend: sites.updated_at (ISO string), used for incremental refresh. */
    @ColumnInfo(name = "updatedAt")
    val updatedAt: String? = null
)
