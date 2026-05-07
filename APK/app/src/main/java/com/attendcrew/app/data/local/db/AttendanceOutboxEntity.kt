package com.attendcrew.app.data.local.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "attendance_outbox",
    indices = [
        Index(value = ["status"]),
        Index(value = ["createdAt"])
    ]
)
data class AttendanceOutboxEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "deviceAttendanceId")
    val deviceAttendanceId: String,

    @ColumnInfo(name = "workerId")
    val workerId: Int,

    /** "checkin" | "checkout" */
    @ColumnInfo(name = "mode")
    val mode: String,

    @ColumnInfo(name = "latitude")
    val latitude: Double,

    @ColumnInfo(name = "longitude")
    val longitude: Double,

    /** ISO-8601 UTC string */
    @ColumnInfo(name = "deviceTimeUtc")
    val deviceTimeUtc: String,

    @ColumnInfo(name = "localVerified")
    val localVerified: Boolean,

    @ColumnInfo(name = "similarityScore")
    val similarityScore: Float? = null,

    @ColumnInfo(name = "threshold")
    val threshold: Float? = null,

    /** Absolute file path to jpg to upload with the event (optional). */
    @ColumnInfo(name = "photoPath")
    val photoPath: String? = null,

    /** New -> in_flight -> synced -> failed */
    @ColumnInfo(name = "status")
    val status: String = "new",

    @ColumnInfo(name = "attemptCount")
    val attemptCount: Int = 0,

    @ColumnInfo(name = "lastError")
    val lastError: String? = null,

    @ColumnInfo(name = "createdAt")
    val createdAt: Long = System.currentTimeMillis()
)
