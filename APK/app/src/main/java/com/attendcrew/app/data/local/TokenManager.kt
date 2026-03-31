package com.attendcrew.app.data.local

import android.content.Context

class TokenManager(context: Context) {

    private val prefs = context.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)

    // ── Token ────────────────────────────────────────────────────────────────

    /**
     * Save token together with its expiry timestamp.
     * @param expiresInSeconds  lifetime of the token in seconds (default 7 days = 604800 s)
     */
    fun saveToken(token: String, expiresInSeconds: Long = 60L * 60 * 24 * 7) {
        val expiresAt = System.currentTimeMillis() + expiresInSeconds * 1_000L
        prefs.edit()
            .putString("access_token", token)
            .putLong("token_expires_at", expiresAt)
            .apply()
    }

    fun getToken(): String? = prefs.getString("access_token", null)

    /** Returns true if the stored token has passed its expiry time. */
    fun isTokenExpired(): Boolean {
        val expiresAt = prefs.getLong("token_expires_at", 0L)
        return expiresAt == 0L || System.currentTimeMillis() >= expiresAt
    }

    /** Returns true if a token exists AND has not expired yet. */
    fun isLoggedIn(): Boolean = getToken() != null && !isTokenExpired()

    fun clearToken() {
        prefs.edit().remove("access_token").remove("token_expires_at").apply()
    }

    // ── User Name ─────────────────────────────────────────────────────────────

    fun saveUserName(name: String) {
        prefs.edit().putString("user_name", name).apply()
    }

    fun getUserName(): String? = prefs.getString("user_name", null)

    // ── Role ─────────────────────────────────────────────────────────────────

    fun saveRole(role: String) {
        prefs.edit().putString("role", role).apply()
    }

    fun getRole(): String? = prefs.getString("role", null)

    // ── Site ID ───────────────────────────────────────────────────────────────

    fun saveSiteId(siteId: String) {
        prefs.edit().putString("site_id", siteId).apply()
    }

    fun getSiteId(): String? = prefs.getString("site_id", null)

    // ── Site Name ─────────────────────────────────────────────────────────────

    fun saveSiteName(name: String) {
        prefs.edit().putString("site_name", name).apply()
    }

    fun getSiteName(): String? = prefs.getString("site_name", null)

    // ── Clear all ─────────────────────────────────────────────────────────────

    /** Clears all stored auth data (use on logout). */
    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
