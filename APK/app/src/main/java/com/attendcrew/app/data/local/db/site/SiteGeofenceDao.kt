package com.attendcrew.app.data.local.db.site

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface SiteGeofenceDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: SiteGeofenceEntity)

    @Query("SELECT * FROM site_geofence WHERE siteId = :siteId LIMIT 1")
    suspend fun get(siteId: String): SiteGeofenceEntity?

    @Query("DELETE FROM site_geofence")
    suspend fun clear()
}
