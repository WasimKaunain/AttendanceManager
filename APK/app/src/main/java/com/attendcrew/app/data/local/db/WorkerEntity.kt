package com.attendcrew.app.data.local.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "workers",
    indices = [
        Index(value = ["workerId"], unique = true),
        Index(value = ["updatedAt"])
    ]
)
data class WorkerEntity(
    @PrimaryKey
    @ColumnInfo(name = "workerId")
    val workerId: Int,

    @ColumnInfo(name = "fullName")
    val fullName: String,

    @ColumnInfo(name = "mobile")
    val mobile: String? = null,

    /** Server-side status (active/inactive/...). */
    @ColumnInfo(name = "status")
    val status: String? = null,

    /** UTC ISO string or raw server value; used only for incremental sync decisions. */
    @ColumnInfo(name = "updatedAt")
    val updatedAt: String? = null,

    /** 192-float MobileFaceNet embedding persisted as a BLOB via [Converters]. */
    @ColumnInfo(name = "embedding")
    val embedding: FloatArray? = null
)
