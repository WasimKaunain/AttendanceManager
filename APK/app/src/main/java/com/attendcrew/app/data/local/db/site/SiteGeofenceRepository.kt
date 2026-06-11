package com.attendcrew.app.data.local.db.site

import android.content.Context
import com.attendcrew.app.data.local.db.AppDatabase

class SiteGeofenceRepository(context: Context)
{
    private val dao = AppDatabase.getInstance(context).siteGeofenceDao()
    suspend fun getSite(siteId: String) = dao.get(siteId)
}