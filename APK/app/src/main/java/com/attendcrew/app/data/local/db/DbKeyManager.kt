package com.attendcrew.app.data.local.db

import android.content.Context
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.MessageDigest

/**
 * Generates and persists a database passphrase.
 *
 * - The passphrase is stored encrypted via AndroidX Security (AES-GCM key in Android Keystore).
 * - We derive a fixed-length 32-byte key for SQLCipher using SHA-256.
 */
object DbKeyManager {

    private const val PREF_FILE = "db_keys"
    private const val KEY_DB_PASSPHRASE = "room_db_passphrase"

    fun getOrCreatePassphrase(context: Context): ByteArray {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        val prefs = EncryptedSharedPreferences.create(
            context,
            PREF_FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

        val existing = prefs.getString(KEY_DB_PASSPHRASE, null)
        val raw = if (existing != null) {
            Base64.decode(existing, Base64.NO_WRAP)
        } else {
            val bytes = ByteArray(32)
            java.security.SecureRandom().nextBytes(bytes)
            prefs.edit().putString(KEY_DB_PASSPHRASE, Base64.encodeToString(bytes, Base64.NO_WRAP)).apply()
            bytes
        }

        // SQLCipher expects a passphrase; SupportFactory recommends passing byte[]
        // We'll normalize to 32 bytes via SHA-256 to be safe.
        return MessageDigest.getInstance("SHA-256").digest(raw)
    }
}
