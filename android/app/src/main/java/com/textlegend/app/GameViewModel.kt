package com.textlegend.app

import android.app.Application
import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

class GameViewModel(application: Application) : AndroidViewModel(application) {
    private val prefs = AppPreferences(application)
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        explicitNulls = false
    }
    private val api = ApiService(json)
    private val socket = SocketManager(json)
    private val updateManager = UpdateManager(application)

    private val _serverUrl = MutableStateFlow(prefs.getServerUrl() ?: "https://cq.071717.xyz/")
    val serverUrl: StateFlow<String> = _serverUrl

    private val _realms = MutableStateFlow<List<RealmInfo>>(emptyList())
    val realms: StateFlow<List<RealmInfo>> = _realms

    private val _captcha = MutableStateFlow<CaptchaResponse?>(null)
    val captcha: StateFlow<CaptchaResponse?> = _captcha

    private val _loginMessage = MutableStateFlow<String?>(null)
    val loginMessage: StateFlow<String?> = _loginMessage

    private val _characters = MutableStateFlow<List<CharacterBrief>>(emptyList())
    val characters: StateFlow<List<CharacterBrief>> = _characters

    private val _gameState = MutableStateFlow<GameState?>(null)
    val gameState: StateFlow<GameState?> = _gameState

    private val _lastStateAt = MutableStateFlow<Long?>(null)
    val lastStateAt: StateFlow<Long?> = _lastStateAt

    private val _lastStateRaw = MutableStateFlow<String?>(null)
    val lastStateRaw: StateFlow<String?> = _lastStateRaw

    private val _outputLog = MutableStateFlow<List<OutputPayload>>(emptyList())
    val outputLog: StateFlow<List<OutputPayload>> = _outputLog
    private val _rankMessages = MutableStateFlow<List<String>>(emptyList())
    val rankMessages: StateFlow<List<String>> = _rankMessages

    private val _mailList = MutableStateFlow<MailListResponse?>(null)
    val mailList: StateFlow<MailListResponse?> = _mailList

    private val _guildMembers = MutableStateFlow<GuildMembersResponse?>(null)
    val guildMembers: StateFlow<GuildMembersResponse?> = _guildMembers

    private val _guildList = MutableStateFlow<GuildListResponse?>(null)
    val guildList: StateFlow<GuildListResponse?> = _guildList

    private val _guildApplications = MutableStateFlow<GuildApplicationsResponse?>(null)
    val guildApplications: StateFlow<GuildApplicationsResponse?> = _guildApplications

    private val _sabakInfo = MutableStateFlow<SabakInfoResponse?>(null)
    val sabakInfo: StateFlow<SabakInfoResponse?> = _sabakInfo

    private val _consignList = MutableStateFlow<ConsignListPayload?>(null)
    val consignList: StateFlow<ConsignListPayload?> = _consignList

    private val _consignHistory = MutableStateFlow<ConsignHistoryPayload?>(null)
    val consignHistory: StateFlow<ConsignHistoryPayload?> = _consignHistory

    private val _consignMarket = MutableStateFlow<List<ConsignItem>>(emptyList())
    val consignMarket: StateFlow<List<ConsignItem>> = _consignMarket

    private val _consignMine = MutableStateFlow<List<ConsignItem>>(emptyList())
    val consignMine: StateFlow<List<ConsignItem>> = _consignMine

    private val _shopItems = MutableStateFlow<List<ShopItem>>(emptyList())
    val shopItems: StateFlow<List<ShopItem>> = _shopItems

    private val _toast = MutableStateFlow<String?>(null)
    val toast: StateFlow<String?> = _toast

    private val _socketStatus = MutableStateFlow<String?>(null)
    val socketStatus: StateFlow<String?> = _socketStatus

    private val _selectedRealmId = MutableStateFlow(prefs.getRealmId())
    val selectedRealmId: StateFlow<Int> = _selectedRealmId

    private val _updateInfo = MutableStateFlow<UpdateManager.UpdateInfo?>(null)
    val updateInfo: StateFlow<UpdateManager.UpdateInfo?> = _updateInfo

    private val _themeMode = MutableStateFlow(prefs.getThemeMode())
    val themeMode: StateFlow<String> = _themeMode

    private var token: String? = prefs.getToken()
    private var username: String? = prefs.getUsername()

    fun hasServerConfig(): Boolean = !_serverUrl.value.isBlank()
    fun hasToken(): Boolean = !token.isNullOrBlank()

    fun getServerUrl(): String = _serverUrl.value

    fun setServerUrl(url: String) {
        val normalized = normalizeBaseUrl(url)
        _serverUrl.value = normalized
        prefs.setServerUrl(normalized)
    }

    fun refreshCaptcha() {
        viewModelScope.launch {
            runCatching {
                val data = api.getCaptcha(serverUrl.value)
                _captcha.value = data
            }.onFailure {
                _toast.value = "验证码获取失败"
            }
        }
    }

    fun loadRealms() {
        viewModelScope.launch {
            runCatching {
                val data = api.getRealms(serverUrl.value)
                _realms.value = data.realms
                if (data.realms.isNotEmpty() && _selectedRealmId.value == 0) {
                    _selectedRealmId.value = data.realms.first().id
                }
            }.onFailure {
                _toast.value = "服务器列表加载失败"
            }
        }
    }

    fun selectRealm(id: Int) {
        _selectedRealmId.value = id
        prefs.setRealmId(id)
    }

    fun login(username: String, password: String, captchaToken: String, captchaCode: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _loginMessage.value = null
            runCatching {
                val data = api.login(serverUrl.value, username, password, captchaToken, captchaCode, selectedRealmId.value)
                token = data.token
                this@GameViewModel.username = username
                prefs.setToken(data.token)
                prefs.setUsername(username)
                prefs.setRealmId(data.realmId)
                _selectedRealmId.value = data.realmId
                _characters.value = data.characters
                onSuccess()
            }.onFailure { err ->
                _loginMessage.value = err.message ?: "登录失败"
            }
        }
    }

    fun register(username: String, password: String, captchaToken: String, captchaCode: String) {
        viewModelScope.launch {
            _loginMessage.value = null
            runCatching {
                api.register(serverUrl.value, username, password, captchaToken, captchaCode)
                _loginMessage.value = "注册成功，请登录"
            }.onFailure { err ->
                _loginMessage.value = err.message ?: "注册失败"
            }
        }
    }

    fun loadCharacters() {
        val tokenValue = token ?: return
        viewModelScope.launch {
            runCatching {
                _characters.value = api.listCharacters(serverUrl.value, tokenValue, selectedRealmId.value)
            }.onFailure {
                _toast.value = it.message ?: "角色列表加载失败"
            }
        }
    }

    fun createCharacter(name: String, classId: String) {
        val tokenValue = token ?: return
        viewModelScope.launch {
            runCatching {
                api.createCharacter(serverUrl.value, tokenValue, name, classId, selectedRealmId.value)
                loadCharacters()
            }.onFailure { err ->
                _toast.value = err.message ?: "创建角色失败"
            }
        }
    }

    fun deleteCharacter(name: String) {
        val tokenValue = token ?: return
        viewModelScope.launch {
            runCatching {
                api.deleteCharacter(serverUrl.value, tokenValue, name, selectedRealmId.value)
                loadCharacters()
            }.onFailure { err ->
                _toast.value = err.message ?: "删除角色失败"
            }
        }
    }

    fun connectSocket(characterName: String) {
        val tokenValue = token ?: return
        val deviceId = prefs.getDeviceId()
        val fingerprint = computeDeviceFingerprint(getApplication())
        socket.connect(
            baseUrl = serverUrl.value,
            token = tokenValue,
            charName = characterName,
            realmId = selectedRealmId.value,
            deviceId = deviceId,
            deviceFingerprint = fingerprint,
            onState = { state ->
                _gameState.value = state
                _lastStateAt.value = System.currentTimeMillis()
            },
            onOutput = { output ->
                if (shouldShowChatLine(output)) {
                    _outputLog.value = (listOf(output) + _outputLog.value).take(400)
                }
                val text = output.text?.trim().orEmpty()
                if (text.contains("排行榜:")) {
                    val next = (listOf(text) + _rankMessages.value).distinct().take(6)
                    _rankMessages.value = next
                }
                parseShopItems(output.text)
            },
            onAuthError = { msg -> _toast.value = msg },
            onStatus = { status -> _socketStatus.value = status },
            onRawState = { raw -> _lastStateRaw.value = raw },
            onTradeInvite = { from -> _toast.value = "交易邀请：$from" },
            onMailList = { data -> _mailList.value = data },
            onMailSendResult = { res -> _toast.value = res.msg },
            onMailClaimResult = { res -> _toast.value = res.msg },
            onMailDeleteResult = { res -> _toast.value = res.msg },
            onGuildMembers = { data -> _guildMembers.value = data },
            onGuildList = { data -> _guildList.value = data },
            onGuildApplications = { data -> _guildApplications.value = data },
            onSimpleResult = { res -> _toast.value = res.msg },
            onSabakInfo = { data -> _sabakInfo.value = data },
            onConsignList = { data ->
                _consignList.value = data
                when (data.type) {
                    "market" -> _consignMarket.value = data.items
                    "mine" -> _consignMine.value = data.items
                }
            },
            onConsignHistory = { data -> _consignHistory.value = data }
        )
    }

    private fun shouldShowChatLine(output: OutputPayload): Boolean {
        val prefix = output.prefix?.trim().orEmpty()
        val prefixColor = output.prefixColor?.trim().orEmpty()
        val color = output.color?.trim().orEmpty()
        if (prefix == "公告" || prefixColor == "announce" || color == "announce") return true

        val text = output.text?.trim().orEmpty()
        if (text.isBlank()) return false

        val guildChat = Regex("^\\[行会\\]\\[[^\\]]+\\]\\s*.+$")
        val normalChat = Regex("^\\[[^\\[\\]]{1,20}\\]\\s*.+$")
        if (guildChat.matches(text)) return true

        if (normalChat.matches(text)) {
            val name = text.substringAfter("[").substringBefore("]")
            val blocked = setOf("系统", "公告", "提示", "队伍", "行会", "世界", "附近", "广播")
            return name !in blocked
        }
        return false
    }

    fun disconnectSocket() {
        socket.disconnect()
        _socketStatus.value = "disconnected"
    }

    fun sendCmd(text: String) {
        socket.emitCmd(text)
    }

    fun requestState(reason: String) {
        socket.requestState(reason)
    }

    fun mailListInbox() = socket.mailList()
    fun mailListSent() = socket.mailListSent()
    fun mailRead(id: Int) = socket.mailRead(id)
    fun mailClaim(id: Int) = socket.mailClaim(id)
    fun mailDelete(id: Int) = socket.mailDelete(id)
    fun mailSend(to: String, title: String, body: String, items: List<Pair<String, Int>>, gold: Int) =
        socket.mailSend(to, title, body, items, gold)

    fun guildMembers() = socket.guildMembers()
    fun guildList() = socket.guildList()
    fun guildApply(guildId: Int) = socket.guildApply(guildId)
    fun guildApplications() = socket.guildApplications()
    fun guildApprove(charName: String) = socket.guildApprove(charName)
    fun guildReject(charName: String) = socket.guildReject(charName)
    fun sabakInfo() = socket.sabakInfo()
    fun sabakRegisterConfirm(guildId: Int) = socket.sabakRegisterConfirm(guildId)

    fun requestShop() = sendCmd("shop")

    fun clearToast() {
        _toast.value = null
    }

    fun logout() {
        token = null
        username = null
        prefs.setToken(null)
        prefs.setUsername(null)
    }

    fun checkUpdate() {
        viewModelScope.launch {
            val current = getVersionCode(getApplication())
            val info = updateManager.checkForUpdate("e5sub/Text-Legend", current)
            _updateInfo.value = info
        }
    }

    fun startUpdate(activity: android.app.Activity) {
        val info = _updateInfo.value ?: return
        if (!updateManager.canRequestInstall()) {
            updateManager.requestInstallPermission(activity)
            return
        }
        val downloadId = updateManager.downloadAndInstall(info)
        prefs.setPendingDownloadId(downloadId)
    }

    fun onDownloadCompleted(id: Long) {
        updateManager.openDownloadedApk(id)
        prefs.setPendingDownloadId(0)
    }

    fun getPendingDownloadId(): Long = prefs.getPendingDownloadId()

    fun dismissUpdate() {
        _updateInfo.value = null
    }

    fun setThemeMode(mode: String) {
        _themeMode.value = mode
        prefs.setThemeMode(mode)
    }

    private fun normalizeBaseUrl(url: String): String {
        var next = url.trim()
        if (!next.startsWith("http://") && !next.startsWith("https://")) {
            next = "http://$next"
        }
        if (!next.endsWith("/")) next += "/"
        return next
    }

    private fun parseShopItems(text: String?) {
        if (text.isNullOrBlank()) return
        if (!text.startsWith("商店商品:")) return
        val payload = text.removePrefix("商店商品:").trim()
        if (payload.isBlank()) {
            _shopItems.value = emptyList()
            return
        }
        val entries = payload.split(",").map { it.trim() }.filter { it.isNotBlank() }
        val items = entries.mapNotNull { entry ->
            val match = Regex("(.+)\\((\\d+)金\\)").find(entry) ?: return@mapNotNull null
            val name = match.groupValues[1].trim()
            val price = match.groupValues[2].toIntOrNull() ?: 0
            ShopItem(name, price)
        }
        _shopItems.value = items
    }

    private fun getVersionCode(context: Context): Int {
        return try {
            val pm = context.packageManager
            val info = pm.getPackageInfo(context.packageName, 0)
            if (android.os.Build.VERSION.SDK_INT >= 28) info.longVersionCode.toInt() else info.versionCode
        } catch (_: Exception) {
            0
        }
    }
}

data class ShopItem(val name: String, val price: Int)
