package com.attendcrew.app.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.attendcrew.app.data.local.db.site.SiteGeofenceDao
import com.attendcrew.app.data.local.db.site.SiteGeofenceEntity
import net.sqlcipher.database.SupportFactory

@Database(
    entities = [
        WorkerEntity::class,
        AttendanceOutboxEntity::class,
        SiteGeofenceEntity::class
    ],
    version = 3,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun workerDao(): WorkerDao
    abstract fun attendanceOutboxDao(): AttendanceOutboxDao
    abstract fun siteGeofenceDao(): SiteGeofenceDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: buildDb(context).also { INSTANCE = it }
            }
        }

        private fun buildDb(context: Context): AppDatabase {
            // Ensure SQLCipher native libs are loaded
            net.sqlcipher.database.SQLiteDatabase.loadLibs(context)

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
