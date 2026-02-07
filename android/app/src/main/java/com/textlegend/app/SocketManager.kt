package com.textlegend.app

import io.socket.client.IO
import io.socket.client.Socket
import io.socket.engineio.client.transports.Polling
import io.socket.engineio.client.transports.WebSocket
import kotlinx.serialization.json.Json
import org.json.JSONObject

class SocketManager(private val json: Json) {
    private var socket: Socket? = null

    fun connect(
        baseUrl: String,
        token: String,
        charName: String,
        realmId: Int,
        deviceId: String,
        deviceFingerprint: String,
        onState: (GameState) -> Unit,
        onOutput: (OutputPayload) -> Unit,
        onAuthError: (String) -> Unit,
        onTradeInvite: (String) -> Unit,
        onMailList: (MailListResponse) -> Unit,
        onMailSendResult: (SimpleResult) -> Unit,
        onMailClaimResult: (SimpleResult) -> Unit,
        onMailDeleteResult: (SimpleResult) -> Unit,
        onGuildMembers: (GuildMembersResponse) -> Unit,
        onGuildList: (GuildListResponse) -> Unit,
        onGuildApplications: (GuildApplicationsResponse) -> Unit,
        onSimpleResult: (SimpleResult) -> Unit,
        onSabakInfo: (SabakInfoResponse) -> Unit,
        onConsignList: (ConsignListPayload) -> Unit,
        onConsignHistory: (ConsignHistoryPayload) -> Unit
    ) {
        disconnect()
        val socketBase = baseUrl.trim().removeSuffix("/")
        val options = IO.Options.builder()
            .setForceNew(true)
            .setReconnection(true)
            .setPath("/socket.io")
            .setTransports(arrayOf(WebSocket.NAME, Polling.NAME))
            .build()
        socket = IO.socket(socketBase, options).apply {
            on(Socket.EVENT_CONNECT) {
                emit("auth", JSONObject().apply {
                    put("token", token)
                    put("name", charName)
                    put("realmId", realmId)
                    put("deviceId", deviceId)
                    put("deviceFingerprint", deviceFingerprint)
                })
                emit("cmd", JSONObject().apply { put("text", "stats") })
                emit("state_request", JSONObject().apply { put("reason", "client_init") })
            }
            on("auth_error") { args ->
                val msg = (args.firstOrNull() as? JSONObject)?.optString("error")
                    ?: "登录已过期"
                onAuthError(msg)
            }
            on("state") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching {
                    val state = json.decodeFromString(GameState.serializer(), payload.toString())
                    onState(state)
                }.onFailure {
                    onAuthError("状态解析失败")
                }
            }
            on("output") { args ->
                val payload = args.firstOrNull() as? JSONObject
                val output = if (payload != null) {
                    runCatching { json.decodeFromString(OutputPayload.serializer(), payload.toString()) }.getOrNull()
                } else null
                if (output != null) {
                    onOutput(output)
                } else {
                    val text = args.firstOrNull()?.toString()
                    if (!text.isNullOrBlank()) {
                        onOutput(OutputPayload(text = text))
                    }
                }
            }
            on("trade_invite") { args ->
                val from = (args.firstOrNull() as? JSONObject)?.optString("from")
                if (!from.isNullOrBlank()) onTradeInvite(from)
            }
            on("mail_list") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching {
                    onMailList(json.decodeFromString(MailListResponse.serializer(), payload.toString()))
                }
            }
            on("mail_send_result") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching {
                    onMailSendResult(json.decodeFromString(SimpleResult.serializer(), payload.toString()))
                }
            }
            on("mail_claim_result") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching {
                    onMailClaimResult(json.decodeFromString(SimpleResult.serializer(), payload.toString()))
                }
            }
            on("mail_delete_result") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching {
                    onMailDeleteResult(json.decodeFromString(SimpleResult.serializer(), payload.toString()))
                }
            }
            on("guild_members") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching {
                    onGuildMembers(json.decodeFromString(GuildMembersResponse.serializer(), payload.toString()))
                }
            }
            on("guild_list") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching {
                    onGuildList(json.decodeFromString(GuildListResponse.serializer(), payload.toString()))
                }
            }
            on("guild_applications") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching {
                    onGuildApplications(json.decodeFromString(GuildApplicationsResponse.serializer(), payload.toString()))
                }
            }
            on("guild_apply_result") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onSimpleResult(json.decodeFromString(SimpleResult.serializer(), payload.toString())) }
            }
            on("guild_approve_result") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onSimpleResult(json.decodeFromString(SimpleResult.serializer(), payload.toString())) }
            }
            on("guild_reject_result") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onSimpleResult(json.decodeFromString(SimpleResult.serializer(), payload.toString())) }
            }
            on("sabak_info") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onSabakInfo(json.decodeFromString(SabakInfoResponse.serializer(), payload.toString())) }
            }
            on("sabak_register_result") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onSimpleResult(json.decodeFromString(SimpleResult.serializer(), payload.toString())) }
            }
            on("consign_list") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onConsignList(json.decodeFromString(ConsignListPayload.serializer(), payload.toString())) }
            }
            on("consign_history") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onConsignHistory(json.decodeFromString(ConsignHistoryPayload.serializer(), payload.toString())) }
            }
            connect()
        }
    }

    fun disconnect() {
        socket?.off()
        socket?.disconnect()
        socket = null
    }

    fun emitCmd(text: String) {
        socket?.emit("cmd", JSONObject().apply { put("text", text); put("source", "ui") })
    }

    fun requestState(reason: String) {
        socket?.emit("state_request", JSONObject().apply { put("reason", reason) })
    }

    fun mailList() {
        socket?.emit("mail_list")
    }

    fun mailListSent() {
        socket?.emit("mail_list_sent")
    }

    fun mailRead(mailId: Int) {
        socket?.emit("mail_read", JSONObject().apply { put("mailId", mailId) })
    }

    fun mailClaim(mailId: Int) {
        socket?.emit("mail_claim", JSONObject().apply { put("mailId", mailId) })
    }

    fun mailDelete(mailId: Int) {
        socket?.emit("mail_delete", JSONObject().apply { put("mailId", mailId) })
    }

    fun mailSend(toName: String, title: String, body: String, items: List<Pair<String, Int>>, gold: Int) {
        val payload = JSONObject().apply {
            put("toName", toName)
            put("title", title)
            put("body", body)
            put("gold", gold)
            val arr = org.json.JSONArray()
            items.forEach { (key, qty) ->
                val entry = JSONObject()
                entry.put("key", key)
                entry.put("qty", qty)
                arr.put(entry)
            }
            put("items", arr)
        }
        socket?.emit("mail_send", payload)
    }

    fun guildMembers() {
        socket?.emit("guild_members")
    }

    fun guildList() {
        socket?.emit("guild_list")
    }

    fun guildApply(guildId: Int) {
        socket?.emit("guild_apply", JSONObject().apply { put("guildId", guildId) })
    }

    fun guildApplications() {
        socket?.emit("guild_applications")
    }

    fun guildApprove(charName: String) {
        socket?.emit("guild_approve", JSONObject().apply { put("charName", charName) })
    }

    fun guildReject(charName: String) {
        socket?.emit("guild_reject", JSONObject().apply { put("charName", charName) })
    }

    fun sabakInfo() {
        socket?.emit("sabak_info")
    }

    fun sabakRegisterConfirm(guildId: Int) {
        socket?.emit("sabak_register_confirm", JSONObject().apply { put("guildId", guildId) })
    }
}
