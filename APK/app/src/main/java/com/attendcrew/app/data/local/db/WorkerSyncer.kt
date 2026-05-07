package com.attendcrew.app.data.local.db

import android.content.Context
import com.attendcrew.app.data.api.RetrofitInstance
import com.attendcrew.app.data.model.offline.SyncWorker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object WorkerSyncer {

    /**
     * Fetches all workers (optionally incremental) including face embeddings and stores them in Room.
     *
     * @return number of workers inserted/updated.
     */
    suspend fun syncWorkers(context: Context, incremental: Boolean = true): Result<Int> = withContext(Dispatchers.IO) {
        runCatching {
            val repo = WorkerRepository(context)
            val api = RetrofitInstance.getApi(context)

            val updatedAfter = if (incremental) repo.getMaxUpdatedAt() else null

            val resp = api.syncWorkers(
                updatedAfter = updatedAfter,
                includeEmbeddings = true
            )

            if (!resp.isSuccessful) {
                error("Sync failed: ${resp.code()} ${resp.message()}")
            }

            val body = resp.body() ?: error("Empty response")

            val entities = body.workers.map { it.toEntity() }
            repo.upsertAll(entities)
            entities.size
        }
    }

    private fun SyncWorker.toEntity(): WorkerEntity {
        val emb = faceEmbedding?.toFloatArray()
        return WorkerEntity(
            workerId = id,
            fullName = fullName,
            mobile = mobile,
            status = status,
            updatedAt = updatedAt,
            embedding = emb
        )
    }
}
