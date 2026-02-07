package com.textlegend.app

import android.content.Context
import java.util.UUID

class AppPreferences(private val context: Context) {
    private val prefs = context.getSharedPreferences("text_legend_prefs", Context.MODE_PRIVATE)

    fun getServerUrl(): String? = prefs.getString(KEY_SERVER_URL, null)

    fun setServerUrl(url: String) {
        prefs.edit().putString(KEY_SERVER_URL, url).apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun setToken(token: String?) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun getUsername(): String? = prefs.getString(KEY_USERNAME, null)

    fun setUsername(username: String?) {
        prefs.edit().putString(KEY_USERNAME, username).apply()
    }

    fun getRealmId(): Int = prefs.getInt(KEY_REALM_ID, 1)

    fun setRealmId(id: Int) {
        prefs.edit().putInt(KEY_REALM_ID, id).apply()
    }

    fun getDeviceId(): String {
        val existing = prefs.getString(KEY_DEVICE_ID, null)
        if (!existing.isNullOrBlank()) return existing
        val next = UUID.randomUUID().toString().replace("-", "")
        prefs.edit().putString(KEY_DEVICE_ID, next).apply()
        return next
    }

    fun setPendingDownloadId(id: Long) {
        prefs.edit().putLong(KEY_PENDING_DOWNLOAD_ID, id).apply()
    }

    fun getPendingDownloadId(): Long = prefs.getLong(KEY_PENDING_DOWNLOAD_ID, 0L)

    fun getThemeMode(): String = prefs.getString(KEY_THEME_MODE, "dark") ?: "dark"

    fun setThemeMode(mode: String) {
        prefs.edit().putString(KEY_THEME_MODE, mode).apply()
    }

    companion object {
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_TOKEN = "token"
        private const val KEY_USERNAME = "username"
        private const val KEY_REALM_ID = "realm_id"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_PENDING_DOWNLOAD_ID = "pending_download_id"
        private const val KEY_THEME_MODE = "theme_mode"
    }
}
