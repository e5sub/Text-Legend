package com.textlegend.app

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.json.JSONArray

class ApiService(private val json: Json) {
    private val client = OkHttpClient()

    private fun url(base: String, path: String): String {
        val normalized = if (base.endsWith("/")) base.dropLast(1) else base
        val normalizedPath = if (path.startsWith("/")) path else "/$path"
        return "$normalized$normalizedPath"
    }

    suspend fun getCaptcha(baseUrl: String): CaptchaResponse = withContext(Dispatchers.IO) {
        val req = Request.Builder().url(url(baseUrl, "/api/captcha")).build()
        client.newCall(req).execute().use { res ->
            val body = res.body?.string().orEmpty()
            if (!res.isSuccessful) throw RuntimeException("captcha failed")
            json.decodeFromString(CaptchaResponse.serializer(), body)
        }
    }

    suspend fun getRealms(baseUrl: String): RealmsResponse = withContext(Dispatchers.IO) {
        val req = Request.Builder().url(url(baseUrl, "/api/realms")).build()
        client.newCall(req).execute().use { res ->
            val body = res.body?.string().orEmpty()
            if (!res.isSuccessful) throw RuntimeException("realms failed")
            json.decodeFromString(RealmsResponse.serializer(), body)
        }
    }

    suspend fun register(baseUrl: String, username: String, password: String, captchaToken: String, captchaCode: String) {
        val payload = mapOf(
            "username" to username,
            "password" to password,
            "captchaToken" to captchaToken,
            "captchaCode" to captchaCode
        )
        post(baseUrl, "/api/register", payload)
    }

    suspend fun login(
        baseUrl: String,
        username: String,
        password: String,
        captchaToken: String,
        captchaCode: String,
        realmId: Int
    ): LoginResponse {
        val payload = mapOf(
            "username" to username,
            "password" to password,
            "captchaToken" to captchaToken,
            "captchaCode" to captchaCode,
            "realmId" to realmId
        )
        return post(baseUrl, "/api/login", payload, LoginResponse.serializer())
    }

    suspend fun changePassword(baseUrl: String, token: String, oldPassword: String, newPassword: String) {
        val payload = mapOf(
            "token" to token,
            "oldPassword" to oldPassword,
            "newPassword" to newPassword
        )
        post(baseUrl, "/api/password", payload)
    }

    suspend fun createCharacter(baseUrl: String, token: String, name: String, classId: String, realmId: Int) {
        val payload = mapOf(
            "token" to token,
            "name" to name,
            "classId" to classId,
            "realmId" to realmId
        )
        post(baseUrl, "/api/character", payload)
    }

    suspend fun listCharacters(baseUrl: String, token: String, realmId: Int): List<CharacterBrief> = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url(url(baseUrl, "/api/characters?realmId=$realmId"))
            .addHeader("Authorization", "Bearer $token")
            .build()
        client.newCall(req).execute().use { res ->
            val body = res.body?.string().orEmpty()
            if (!res.isSuccessful) throw RuntimeException("characters failed")
            val obj = JSONObject(body)
            val ok = obj.optBoolean("ok", false)
            if (!ok) throw RuntimeException(obj.optString("error", "characters failed"))
            val charsJson = obj.optJSONArray("characters") ?: JSONArray()
            if (charsJson.length() == 0) return@use emptyList<CharacterBrief>()
            json.decodeFromString(ListSerializer(CharacterBrief.serializer()), charsJson.toString())
        }
    }

    suspend fun deleteCharacter(baseUrl: String, token: String, name: String, realmId: Int) {
        val payload = mapOf(
            "token" to token,
            "name" to name,
            "realmId" to realmId
        )
        post(baseUrl, "/api/character/delete", payload)
    }

    suspend fun getTrainingConfig(baseUrl: String): String = withContext(Dispatchers.IO) {
        val req = Request.Builder().url(url(baseUrl, "/api/training-config")).build()
        client.newCall(req).execute().use { res ->
            res.body?.string().orEmpty()
        }
    }

    suspend fun getInviteLink(baseUrl: String, token: String): InviteLinkResponse = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url(url(baseUrl, "/api/invite-link"))
            .addHeader("Authorization", "Bearer $token")
            .build()
        client.newCall(req).execute().use { res ->
            val body = res.body?.string().orEmpty()
            if (!res.isSuccessful) throw RuntimeException(extractError(body))
            json.decodeFromString(InviteLinkResponse.serializer(), body)
        }
    }

    suspend fun getInviteStats(baseUrl: String, token: String): InviteStatsResponse = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url(url(baseUrl, "/api/invite/stats"))
            .addHeader("Authorization", "Bearer $token")
            .build()
        client.newCall(req).execute().use { res ->
            val body = res.body?.string().orEmpty()
            if (!res.isSuccessful) throw RuntimeException(extractError(body))
            json.decodeFromString(InviteStatsResponse.serializer(), body)
        }
    }

    private suspend fun post(baseUrl: String, path: String, payload: Map<String, Any?>) {
        withContext(Dispatchers.IO) {
            val body = JSONObject(payload).toString().toRequestBody(JSON)
            val req = Request.Builder().url(url(baseUrl, path)).post(body).build()
            client.newCall(req).execute().use { res ->
                val responseBody = res.body?.string().orEmpty()
                if (!res.isSuccessful) {
                    throw RuntimeException(extractError(responseBody))
                }
                val ok = responseBody.contains("\"ok\":true")
                if (!ok && responseBody.contains("error")) {
                    throw RuntimeException(extractError(responseBody))
                }
            }
        }
    }

    private suspend fun <T> post(baseUrl: String, path: String, payload: Map<String, Any?>, serializer: kotlinx.serialization.KSerializer<T>): T {
        return withContext(Dispatchers.IO) {
            val body = JSONObject(payload).toString().toRequestBody(JSON)
            val req = Request.Builder().url(url(baseUrl, path)).post(body).build()
            client.newCall(req).execute().use { res ->
                val responseBody = res.body?.string().orEmpty()
                if (!res.isSuccessful) throw RuntimeException(extractError(responseBody))
                json.decodeFromString(serializer, responseBody)
            }
        }
    }

    private fun extractError(body: String): String {
        return try {
            JSONObject(body).optString("error", "请求失败")
        } catch (_: Exception) {
            "请求失败"
        }
    }

    companion object {
        private val JSON = "application/json; charset=utf-8".toMediaType()
    }
}
