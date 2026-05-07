package com.attendcrew.app.data.local.db.site

import android.content.Context
import com.attendcrew.app.data.api.RetrofitInstance
import com.attendcrew.app.data.local.db.AppDatabase
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object SiteSyncer {

    suspend fun syncCurrentSite(context: Context): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val api = RetrofitInstance.getApi(context)
            val resp = api.syncSite()
            if (!resp.isSuccessful) error("Site sync failed: ${resp.code()} ${resp.message()}")

            val body = resp.body() ?: error("Empty response")
            val s = body.site

            val polygonJson = if (!s.polygonCoords.isNullOrEmpty()) {
                Gson().toJson(s.polygonCoords)
            } else null

            val entity = SiteGeofenceEntity(
                siteId = s.id,
                siteName = s.name,
                boundaryType = s.boundaryType,
                latitude = s.latitude,
                longitude = s.longitude,
                radiusM = s.geofenceRadius,
                polygonJson = polygonJson,
                updatedAt = s.updatedAt
            )

            AppDatabase.getInstance(context).siteGeofenceDao().upsert(entity)
        }
    }
}
