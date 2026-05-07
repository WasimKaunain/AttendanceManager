package com.attendcrew.app.data.model.offline

import com.google.gson.annotations.SerializedName

/** Matches backend: GET /mobile/sync/workers */
data class WorkersSyncResponse(
    val count: Int,
    val workers: List<SyncWorker>
)

data class SyncWorker(
    val id: Int,

    @SerializedName("full_name")
    val fullName: String,

    val mobile: String? = null,
    val status: String? = null,

    @SerializedName("updated_at")
    val updatedAt: String? = null,

    /** List of 192 floats when include_embeddings=true; may be null */
    @SerializedName("face_embedding")
    val faceEmbedding: List<Float>? = null
)
