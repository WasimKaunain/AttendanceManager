package com.attendcrew.app.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.attendcrew.app.data.local.db.site.SiteGeofenceDao
import com.attendcrew.app.data.local.db.site.SiteGeofenceEntity
import net.sqlcipher.database.SupportFactory
import com.attendcrew.app.data.local.db.siteworker.SiteWorkerDao
import com.attendcrew.app.data.local.db.siteworker.SiteWorkerEntity
import com.attendcrew.app.data.local.db.dashboard.DashboardDao
import com.attendcrew.app.data.local.db.dashboard.DashboardStatsEntity
import com.attendcrew.app.data.local.db.dashboard.WeeklyDayEntity
import com.attendcrew.app.data.local.db.dashboard.RecentActivityEntity

@Database(
    entities = [
        WorkerEntity::class,
        AttendanceEntity::class,
        AttendanceOutboxEntity::class,
        SiteGeofenceEntity::class,
        SiteWorkerEntity::class,
        DashboardStatsEntity::class,
        WeeklyDayEntity::class,
        RecentActivityEntity::class
    ],
    version = 7,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun workerDao(): WorkerDao

    abstract fun attendanceDao(): AttendanceDao
    abstract fun attendanceOutboxDao(): AttendanceOutboxDao
    abstract fun siteGeofenceDao(): SiteGeofenceDao
    abstract fun siteWorkerDao(): SiteWorkerDao
    abstract fun dashboardDao(): DashboardDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: buildDb(context).also { INSTANCE = it }
            }
        }

        private fun buildDb(context: Context): AppDatabase {
            // Load SQLCipher libs only when database is actually needed
            try {
                net.sqlcipher.database.SQLiteDatabase.loadLibs(context)
            } catch (e: Exception) {
                android.util.Log.e("AppDatabase", "SQLCipher load error: ${e.message}", e)
                throw e
            }

            val passphrase = DbKeyManager.getOrCreatePassphrase(context)
            val factory = SupportFactory(passphrase)

            return Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "attendance_manager.db"
            )
                .openHelperFactory(factory)
                .fallbackToDestructiveMigration()
                .build()
        }
    }
}
