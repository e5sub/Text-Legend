package com.textlegend.app

import io.socket.client.IO
import io.socket.client.Socket
import io.socket.engineio.client.transports.Polling
import io.socket.engineio.client.transports.WebSocket
import kotlinx.serialization.json.Json
import org.json.JSONObject
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.math.max

class SocketManager(private val json: Json) {
    private var socket: Socket? = null
    private var antiKey: String? = null
    private var antiSeq: Long = 0
    private val pendingCmds: ArrayDeque<String> = ArrayDeque()
    private var lastStateJson: JSONObject? = null

    fun connect(
        baseUrl: String,
        token: String,
        charName: String,
        realmId: Int,
        deviceId: String,
        deviceFingerprint: String,
        clientVersion: Int,
        clientPlatform: String,
        onState: (GameState) -> Unit,
        onOutput: (OutputPayload) -> Unit,
        onAuthError: (String) -> Unit,
        onStatus: (String) -> Unit,
        onRawState: (String) -> Unit,
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
        onConsignHistory: (ConsignHistoryPayload) -> Unit,
        onActivityPointShopData: (ActivityPointShopPayload) -> Unit,
        onActivityDivineBeastExchangeData: (ActivityDivineBeastExchangePayload) -> Unit
    ) {
        disconnect()
        antiKey = null
        antiSeq = 0
        pendingCmds.clear()
        lastStateJson = null
        val socketBase = baseUrl.trim().removeSuffix("/")
        val options = IO.Options.builder()
            .setForceNew(true)
            .setReconnection(true)
            .setPath("/socket.io")
            .setTransports(arrayOf(WebSocket.NAME, Polling.NAME))
            .build()
        socket = IO.socket(socketBase, options).apply {
            on(Socket.EVENT_CONNECT) {
                onStatus("connected")
                emit("auth", JSONObject().apply {
                    put("token", token)
                    put("name", charName)
                    put("realmId", realmId)
                    put("deviceId", deviceId)
                    put("deviceFingerprint", deviceFingerprint)
                    put("clientVersion", clientVersion)
                    put("clientPlatform", clientPlatform)
                })
                emit("cmd", JSONObject().apply { put("text", "stats") })
                emit("state_request", JSONObject().apply { put("reason", "client_init") })
            }
            on(Socket.EVENT_CONNECT_ERROR) { args ->
                onStatus("connect_error: ${args.firstOrNull()?.toString() ?: "unknown"}")
            }
            on(Socket.EVENT_DISCONNECT) { args ->
                onStatus("disconnected: ${args.firstOrNull()?.toString() ?: "unknown"}")
            }
            on("auth_error") { args ->
                val msg = (args.firstOrNull() as? JSONObject)?.optString("error")
                    ?: "登录已过期"
                onAuthError(msg)
            }
            on("state") { args ->
                val raw = args.firstOrNull() ?: return@on
                val payloadObj = extractPayloadObject(raw) ?: return@on
                onStatus("state_received")
                runCatching {
                    val mergedObj = mergeStatePayload(lastStateJson, payloadObj)
                    lastStateJson = mergedObj
                    val stateJson = mergedObj.toString()
                    onRawState(stateJson)
                    val state = json.decodeFromString(GameState.serializer(), stateJson)
                    state.anti?.let { anti ->
                        if (!anti.key.isNullOrBlank()) antiKey = anti.key
                        antiSeq = max(antiSeq, anti.seq)
                    }
                    flushPendingCmds()
                    onState(state)
                }.onFailure {
                    val msg = it.message?.take(120) ?: "unknown"
                    onStatus("state_parse_failed: $msg")
                    onAuthError("状态解析失败")
                }
            }
            on("room_state") { args ->
                val payloadObj = extractPayloadObject(args.firstOrNull() ?: return@on) ?: return@on
                runCatching {
                    val base = lastStateJson ?: return@runCatching
                    val baseRoom = base.optJSONObject("room") ?: return@runCatching
                    val patchRoom = payloadObj.optJSONObject("room") ?: return@runCatching
                    val sameRoom =
                        baseRoom.optString("zoneId", "") == patchRoom.optString("zoneId", "") &&
                        baseRoom.optString("roomId", "") == patchRoom.optString("roomId", "")
                    if (!sameRoom) return@runCatching
                    val mergedObj = mergeRoomStatePayload(base, payloadObj)
                    lastStateJson = mergedObj
                    val stateJson = mergedObj.toString()
                    onRawState(stateJson)
                    val state = json.decodeFromString(GameState.serializer(), stateJson)
                    onState(state)
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
            on("pet_result") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onSimpleResult(json.decodeFromString(SimpleResult.serializer(), payload.toString())) }
            }
            on("character_action_result") { args ->
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
            on("activity_point_shop_data") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onActivityPointShopData(json.decodeFromString(ActivityPointShopPayload.serializer(), payload.toString())) }
            }
            on("activity_divine_beast_exchange_data") { args ->
                val payload = args.firstOrNull() as? JSONObject ?: return@on
                runCatching { onActivityDivineBeastExchangeData(json.decodeFromString(ActivityDivineBeastExchangePayload.serializer(), payload.toString())) }
            }
            connect()
        }
    }

    fun disconnect() {
        socket?.off()
        socket?.disconnect()
        socket = null
        antiKey = null
        antiSeq = 0
        pendingCmds.clear()
        lastStateJson = null
    }

    fun emitCmd(text: String) {
        if (antiKey.isNullOrBlank()) {
            enqueueCmd(text)
            return
        }
        val payload = JSONObject().apply {
            put("text", text)
            put("source", "ui")
        }
        // antiKey 校验已禁用
        socket?.emit("cmd", payload)
    }

    private fun enqueueCmd(text: String) {
        if (text.isBlank()) return
        if (pendingCmds.size >= 10) pendingCmds.removeFirst()
        pendingCmds.addLast(text)
    }

    private fun flushPendingCmds() {
        if (antiKey.isNullOrBlank() || socket == null) return
        while (pendingCmds.isNotEmpty()) {
            val text = pendingCmds.removeFirst()
            emitCmd(text)
        }
    }

    private fun signCmd(key: String, seq: Long, text: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        val secretKey = SecretKeySpec(key.toByteArray(Charsets.UTF_8), "HmacSHA256")
        mac.init(secretKey)
        val raw = "${seq}|${text}".toByteArray(Charsets.UTF_8)
        val bytes = mac.doFinal(raw)
        return bytes.joinToString("") { "%02x".format(it) }
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

    fun mailClaimAll() {
        socket?.emit("mail_claim_all", JSONObject())
    }

    fun mailDelete(mailId: Int, folder: String = "inbox") {
        socket?.emit("mail_delete", JSONObject().apply {
            put("mailId", mailId)
            put("folder", folder)
        })
    }

    fun mailDeleteAll(folder: String = "inbox") {
        socket?.emit("mail_delete_all", JSONObject().apply { put("folder", folder) })
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

    fun characterRename(newName: String) {
        socket?.emit("character_action", JSONObject().apply {
            put("action", "rename")
            put("newName", newName)
        })
    }

    fun characterMigrate(targetUsername: String, targetPassword: String) {
        socket?.emit("character_action", JSONObject().apply {
            put("action", "migrate")
            put("targetUsername", targetUsername)
            put("targetPassword", targetPassword)
        })
    }

    fun petTrain(petId: String, attr: String, count: Int) {
        socket?.emit("pet_action", JSONObject().apply {
            put("action", "train")
            put("petId", petId)
            put("attr", attr)
            put("count", count)
        })
    }

    fun petUseBook(petId: String, bookId: String) {
        socket?.emit("pet_action", JSONObject().apply {
            put("action", "use_book")
            put("petId", petId)
            put("bookId", bookId)
        })
    }

    fun petSynthesize(mainPetId: String, subPetId: String) {
        socket?.emit("pet_action", JSONObject().apply {
            put("action", "synthesize")
            put("mainPetId", mainPetId)
            put("subPetId", subPetId)
        })
    }

    fun petSynthesizeBelowEpic() {
        socket?.emit("pet_action", JSONObject().apply {
            put("action", "synthesize_below_epic")
        })
    }

    fun petEquipItem(petId: String, itemKey: String) {
        socket?.emit("pet_action", JSONObject().apply {
            put("action", "equip_item")
            put("petId", petId)
            put("itemKey", itemKey)
        })
    }

    fun petUnequipItem(petId: String, slot: String) {
        socket?.emit("pet_action", JSONObject().apply {
            put("action", "unequip_item")
            put("petId", petId)
            put("slot", slot)
        })
    }

    private fun extractPayloadObject(raw: Any): JSONObject? {
        return when (raw) {
            is JSONObject -> {
                when {
                    raw.opt("state") is JSONObject -> raw.optJSONObject("state")
                    raw.opt("data") is JSONObject -> raw.optJSONObject("data")
                    else -> raw
                }
            }
            is String -> runCatching {
                val obj = JSONObject(raw)
                when {
                    obj.opt("state") is JSONObject -> obj.optJSONObject("state")
                    obj.opt("data") is JSONObject -> obj.optJSONObject("data")
                    else -> obj
                }
            }.getOrNull()
            is Map<*, *> -> runCatching { JSONObject(raw) }.getOrNull()
            else -> runCatching { JSONObject(raw.toString()) }.getOrNull()
        }
    }

    private fun mergeStatePayload(base: JSONObject?, patch: JSONObject): JSONObject {
        if (base == null) return JSONObject(patch.toString())
        val merged = JSONObject(base.toString())
        val patchKeys = patch.keys()
        while (patchKeys.hasNext()) {
            val key = patchKeys.next()?.toString() ?: continue
            merged.put(key, patch.opt(key))
        }
        mergeNestedObject(merged, base, patch, "player")
        mergeNestedObject(merged, base, patch, "room")
        mergeNestedObject(merged, base, patch, "stats")
        return merged
    }

    private fun mergeRoomStatePayload(base: JSONObject, patch: JSONObject): JSONObject {
        val merged = JSONObject(base.toString())
        val patchKeys = patch.keys()
        while (patchKeys.hasNext()) {
            val key = patchKeys.next()?.toString() ?: continue
            merged.put(key, patch.opt(key))
        }
        mergeNestedObject(merged, base, patch, "room")
        return merged
    }

    private fun mergeNestedObject(merged: JSONObject, base: JSONObject, patch: JSONObject, key: String) {
        val baseObj = base.optJSONObject(key)
        val patchObj = patch.optJSONObject(key)
        if (baseObj == null && patchObj == null) return
        if (patch.has(key) && patchObj == null) return
        if (baseObj == null && patchObj != null) {
            merged.put(key, JSONObject(patchObj.toString()))
            return
        }
        if (baseObj != null && patchObj == null) {
            merged.put(key, JSONObject(baseObj.toString()))
            return
        }
        val next = JSONObject(baseObj!!.toString())
        val keys = patchObj!!.keys()
        while (keys.hasNext()) {
            val field = keys.next()?.toString() ?: continue
            next.put(field, patchObj.opt(field))
        }
        merged.put(key, next)
    }
}
