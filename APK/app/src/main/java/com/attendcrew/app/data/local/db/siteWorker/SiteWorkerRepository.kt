package com.attendcrew.app.data.local.db.siteworker

import android.content.Context
import com.attendcrew.app.data.local.db.AppDatabase

class SiteWorkerRepository(context: Context) {

    private val dao =
        AppDatabase.getInstance(context)
            .siteWorkerDao()

    suspend fun upsertAll(workers: List<SiteWorkerEntity>) =
        dao.upsertAll(workers)

    suspend fun getFiltered(
        search: String?,
        status: String?
    ) = dao.getFiltered(search, status)

    suspend fun getAll() =
        dao.getAll()

    suspend fun clearAll() =
        dao.clearAll()

    suspend fun count() =
        dao.count()
}