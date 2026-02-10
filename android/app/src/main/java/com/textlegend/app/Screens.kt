package com.textlegend.app

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.tween
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.delay
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.Image
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ServerScreen(initialUrl: String, onSave: (String) -> Unit) {
    var url by remember { mutableStateOf(initialUrl) }
    CartoonBackground {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.Center) {
            Text(text = "服务器地址", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                label = { Text("例如 http://192.168.1.10:3000/") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(12.dp))
            Button(onClick = { onSave(url) }, modifier = Modifier.fillMaxWidth()) {
                Text("保存")
            }
        }
    }
}

@Composable
fun AuthScreen(vm: GameViewModel, onServerClick: () -> Unit, onAuthed: () -> Unit) {
    val realms by vm.realms.collectAsState()
    val captcha by vm.captcha.collectAsState()
    val msg by vm.loginMessage.collectAsState()
    val selectedRealm by vm.selectedRealmId.collectAsState()
    val toast by vm.toast.collectAsState()

    var tabIndex by remember { mutableStateOf(0) }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var captchaCode by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        vm.loadRealms()
        vm.refreshCaptcha()
    }

    CartoonBackground {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text(text = "文字传奇", style = MaterialTheme.typography.headlineSmall)
                TextButton(onClick = onServerClick) { Text("服务器") }
            }

        Spacer(modifier = Modifier.height(16.dp))

        RealmSelector(realms = realms, selectedRealm = selectedRealm, onSelect = vm::selectRealm)

        Spacer(modifier = Modifier.height(8.dp))

        TabRow(selectedTabIndex = tabIndex) {
            Tab(selected = tabIndex == 0, onClick = { tabIndex = 0 }, text = { Text("登录") })
            Tab(selected = tabIndex == 1, onClick = { tabIndex = 1 }, text = { Text("注册") })
        }

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(value = username, onValueChange = { username = it }, label = { Text("账号") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("密码") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = captchaCode,
                onValueChange = { captchaCode = it },
                label = { Text("验证码") },
                modifier = Modifier.weight(1f)
            )
            Spacer(modifier = Modifier.width(12.dp))
            val bitmap = remember(captcha?.svg) { captcha?.svg?.let { svgToImageBitmap(it) } }
            if (bitmap != null) {
                Box(
                    modifier = Modifier
                        .height(64.dp)
                        .width(200.dp)
                        .clickable { vm.refreshCaptcha() }
                ) {
                    androidx.compose.foundation.Image(
                        bitmap = bitmap,
                        contentDescription = "captcha",
                        modifier = Modifier.fillMaxSize()
                    )
                }
            } else {
                Box(
                    modifier = Modifier
                        .height(64.dp)
                        .width(200.dp)
                        .background(Color(0xFFEDEDED))
                        .clickable { vm.refreshCaptcha() },
                    contentAlignment = Alignment.Center
                ) {
                    Text("刷新")
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = {
                val token = captcha?.token.orEmpty()
                if (tabIndex == 0) {
                    vm.login(username, password, token, captchaCode, onAuthed)
                } else {
                    vm.register(username, password, token, captchaCode)
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (tabIndex == 0) "登录" else "注册")
        }

        if (!msg.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = msg ?: "", color = Color(0xFFCC3333))
        }

            if (!toast.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = toast ?: "", color = Color(0xFF2E7D32))
                LaunchedEffect(toast) { vm.clearToast() }
            }
        }
    }
}

@Composable
fun CharacterScreen(vm: GameViewModel, onEnter: (String) -> Unit, onLogout: () -> Unit) {
    val realms by vm.realms.collectAsState()
    val selectedRealm by vm.selectedRealmId.collectAsState()
    val chars by vm.characters.collectAsState()
    val toast by vm.toast.collectAsState()

    var name by remember { mutableStateOf("") }
    var classId by remember { mutableStateOf("warrior") }

    LaunchedEffect(Unit) {
        vm.loadRealms()
        vm.loadCharacters()
    }

    CartoonBackground {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(text = "角色选择", style = MaterialTheme.typography.headlineSmall)
                TextButton(onClick = onLogout) { Text("退出账号") }
            }

        RealmSelector(realms = realms, selectedRealm = selectedRealm, onSelect = {
            vm.selectRealm(it)
            vm.loadCharacters()
        })

        Spacer(modifier = Modifier.height(12.dp))
        Text(text = "已有角色", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        if (chars.isEmpty()) {
            Text("暂无角色")
        } else {
            LazyColumn(modifier = Modifier.weight(1f)) {
                items(chars) { c ->
                    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(text = c.name, fontWeight = FontWeight.Bold)
                                Text(text = "Lv ${c.level} ${classLabel(c.classId)}")
                            }
                            Row {
                                TextButton(onClick = { onEnter(c.name) }) { Text("进入") }
                                TextButton(onClick = { vm.deleteCharacter(c.name) }) { Text("删除") }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        Divider()
        Spacer(modifier = Modifier.height(12.dp))

        Text(text = "创建角色", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("角色名") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(8.dp))
        ClassSelector(selected = classId, onSelect = { classId = it })
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = { vm.createCharacter(name, classId) }, modifier = Modifier.fillMaxWidth()) { Text("创建") }

            if (!toast.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = toast ?: "", color = Color(0xFF2E7D32))
                LaunchedEffect(toast) { vm.clearToast() }
            }
        }
    }
}

@Composable
fun GameScreen(vm: GameViewModel, onExit: () -> Unit) {
    val state by vm.gameState.collectAsState()
    val outputs by vm.outputLog.collectAsState()
    val toast by vm.toast.collectAsState()
    val socketStatus by vm.socketStatus.collectAsState()
    val lastStateAt by vm.lastStateAt.collectAsState()
    val lastStateRaw by vm.lastStateRaw.collectAsState()

    var tabIndex by remember { mutableStateOf(0) }
    var chatInput by remember { mutableStateOf("") }
    var selectedMob by remember { mutableStateOf<MobInfo?>(null) }
    var quickTargetName by remember { mutableStateOf<String?>(null) }

    val innerNav = rememberNavController()

    LaunchedEffect(Unit) {
        vm.requestState("ui_enter")
    }
    LaunchedEffect(Unit) {
        repeat(8) {
            if (state == null) {
                vm.requestState("ui_retry")
            }
            delay(1500)
        }
    }

    LaunchedEffect(state?.mobs) {
        if (selectedMob != null && state?.mobs?.none { it.id == selectedMob?.id } == true) {
            selectedMob = null
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceVariant) {
            NavigationBarItem(
                selected = tabIndex == 0,
                onClick = {
                    tabIndex = 0
                    innerNav.navigate("main") { launchSingleTop = true; popUpTo("main") { inclusive = false } }
                },
                label = { Text("战斗") },
                icon = { Image(painter = painterResource(R.drawable.ic_battle), contentDescription = "战斗", modifier = Modifier.size(24.dp)) }
            )
            NavigationBarItem(
                selected = tabIndex == 1,
                onClick = {
                    tabIndex = 1
                    innerNav.navigate("main") { launchSingleTop = true; popUpTo("main") { inclusive = false } }
                },
                label = { Text("背包") },
                icon = { Image(painter = painterResource(R.drawable.ic_bag), contentDescription = "背包", modifier = Modifier.size(24.dp)) }
            )
            NavigationBarItem(
                selected = tabIndex == 2,
                onClick = {
                    tabIndex = 2
                    innerNav.navigate("main") { launchSingleTop = true; popUpTo("main") { inclusive = false } }
                },
                label = { Text("聊天") },
                icon = { Image(painter = painterResource(R.drawable.ic_chat), contentDescription = "聊天", modifier = Modifier.size(24.dp)) }
            )
            NavigationBarItem(
                selected = tabIndex == 3,
                onClick = {
                    tabIndex = 3
                    innerNav.navigate("main") { launchSingleTop = true; popUpTo("main") { inclusive = false } }
                },
                label = { Text("功能") },
                icon = { Image(painter = painterResource(R.drawable.ic_menu), contentDescription = "功能", modifier = Modifier.size(24.dp)) }
            )
            }
        }
    ) { innerPadding ->
        CartoonBackground {
            NavHost(
                navController = innerNav,
                startDestination = "main",
                modifier = Modifier.fillMaxSize().padding(innerPadding)
            ) {
            composable("main") {
                Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                    TopStatus(state = state)
                    Spacer(modifier = Modifier.height(8.dp))
                    if (state == null) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiary)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("正在连接服务器…")
                                if (!socketStatus.isNullOrBlank()) {
                                    Text("连接状态: ${socketStatus}")
                                }
                                if (lastStateAt != null) {
                                    Text("最近状态: ${((System.currentTimeMillis() - (lastStateAt ?: 0)) / 1000)} 秒前")
                                }
                                if (!lastStateRaw.isNullOrBlank()) {
                                    val preview = lastStateRaw!!.take(120).replace("\n", " ")
                                    Text("状态预览: $preview")
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Button(onClick = { vm.requestState("ui_manual") }) { Text("刷新状态") }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    when (tabIndex) {
                        0 -> BattleTab(state = state, selectedMob = selectedMob, onSelectMob = { selectedMob = it }, onGo = { dir -> vm.sendCmd("go $dir") }, onAttack = { mobName -> vm.sendCmd("attack $mobName") }, onCast = { skill, target ->
                            val cmd = if (skill.type == "heal" || skill.type == "summon") {
                                "cast ${skill.id}"
                            } else if (target != null) {
                                "cast ${skill.id} ${target.name}"
                            } else {
                                "cast ${skill.id}"
                            }
                            vm.sendCmd(cmd)
                        })
                        1 -> InventoryTab(state = state, onUse = { item ->
                            val key = if (item.key.isNotBlank()) item.key else item.id
                            if (item.type == "consumable" || item.type == "book") {
                                vm.sendCmd("use $key")
                            } else if (!item.slot.isNullOrBlank()) {
                                vm.sendCmd("equip $key")
                            }
                        })
                        2 -> ChatTab(
                            state = state,
                            outputs = outputs,
                            onCommand = vm::sendCmd,
                            onOpenModule = { module, name ->
                                if (!name.isNullOrBlank()) {
                                    quickTargetName = name
                                }
                                when (module) {
                                    "trade" -> innerNav.navigate("trade")
                                    "party" -> innerNav.navigate("party")
                                    "guild" -> innerNav.navigate("guild")
                                    "mail" -> innerNav.navigate("mail")
                                }
                            },
                            onJumpToBattle = { tabIndex = 0 },
                            input = chatInput,
                            onInputChange = { chatInput = it },
                            onSend = {
                            val msg = chatInput.trim()
                            if (msg.isNotEmpty()) {
                                vm.sendCmd("say $msg")
                                chatInput = ""
                            }
                        }
                        )
                        3 -> ActionsTab(
                            state = state,
                            onAction = { action ->
                                when (action) {
                                    "stats" -> innerNav.navigate("stats")
                                    "bag" -> tabIndex = 1
                                    "party" -> innerNav.navigate("party")
                                    "guild" -> innerNav.navigate("guild")
                                    "mail" -> innerNav.navigate("mail")
                                    "vip activate" -> innerNav.navigate("vip_activate")
                                    "vip claim" -> vm.sendCmd("vip claim")
                                    "afk" -> innerNav.navigate("afk")
                                    "autoskill off" -> vm.sendCmd("autoskill off")
                                    "trade" -> innerNav.navigate("trade")
                                    "consign" -> innerNav.navigate("consign")
                                    "sabak" -> innerNav.navigate("sabak")
                                    "shop" -> innerNav.navigate("shop")
                                    "forge" -> innerNav.navigate("forge")
                                    "refine" -> innerNav.navigate("refine")
                                    "effect" -> innerNav.navigate("effect")
                                    "repair" -> innerNav.navigate("repair")
                                    "changeclass" -> innerNav.navigate("changeclass")
                                    "drops" -> innerNav.navigate("drops")
                                    "rank" -> innerNav.navigate("rank")
                                    "train" -> innerNav.navigate("train")
                                    "settings" -> innerNav.navigate("settings")
                                    "switch" -> onExit()
                                    "logout" -> onExit()
                                    else -> vm.sendCmd(action)
                                }
                            }
                        )
                    }

                    if (!toast.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = toast ?: "", color = Color(0xFF2E7D32))
                        LaunchedEffect(toast) { vm.clearToast() }
                    }
                }
            }

            composable("stats") { StatsDialog(state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("party") { PartyDialog(vm = vm, state = state, prefillName = quickTargetName, onDismiss = { quickTargetName = null; innerNav.popBackStack() }) }
            composable("guild") { GuildDialog(vm = vm, prefillName = quickTargetName, onDismiss = { quickTargetName = null; innerNav.popBackStack() }) }
            composable("mail") { MailDialog(vm = vm, prefillName = quickTargetName, onDismiss = { quickTargetName = null; innerNav.popBackStack() }) }
            composable("trade") { TradeDialog(vm = vm, state = state, prefillName = quickTargetName, onDismiss = { quickTargetName = null; innerNav.popBackStack() }) }
            composable("consign") { ConsignDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("sabak") { SabakDialog(vm = vm, onDismiss = { innerNav.popBackStack() }) }
            composable("shop") { ShopDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("forge") { ForgeDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("refine") { RefineDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("effect") { EffectDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("repair") { RepairDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("changeclass") { ChangeClassDialog(vm = vm, onDismiss = { innerNav.popBackStack() }) }
            composable("drops") { DropsDialog(onDismiss = { innerNav.popBackStack() }) }
            composable("rank") { RankDialog(state = state, vm = vm, onDismiss = { innerNav.popBackStack() }) }
            composable("train") { TrainingDialog(vm = vm, onDismiss = { innerNav.popBackStack() }) }
            composable("vip_activate") { PromptDialog(title = "VIP激活", label = "激活码", onConfirm = {
                if (it.isNotBlank()) vm.sendCmd("vip activate ${it.trim()}")
                innerNav.popBackStack()
            }, onDismiss = { innerNav.popBackStack() }) }
            composable("afk") { AfkDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("settings") { SettingsScreen(vm = vm, onDismiss = { innerNav.popBackStack() }) }
        }
        }
    }
}

@Composable
private fun RealmSelector(realms: List<RealmInfo>, selectedRealm: Int, onSelect: (Int) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val label = realms.firstOrNull { it.id == selectedRealm }?.name ?: "选择服务器"
    Box {
        OutlinedButton(onClick = { expanded = true }) { Text("服务器: $label") }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            realms.forEach { realm ->
                DropdownMenuItem(text = { Text(realm.name) }, onClick = {
                    onSelect(realm.id)
                    expanded = false
                })
            }
        }
    }
}

@Composable
private fun ClassSelector(selected: String, onSelect: (String) -> Unit) {
    val options = listOf("warrior" to "战士", "mage" to "法师", "taoist" to "道士")
    var expanded by remember { mutableStateOf(false) }
    val label = options.firstOrNull { it.first == selected }?.second ?: selected
    Box {
        OutlinedButton(onClick = { expanded = true }) { Text("职业: $label") }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { (id, name) ->
                DropdownMenuItem(text = { Text(name) }, onClick = {
                    onSelect(id)
                    expanded = false
                })
            }
        }
    }
}

private fun classLabel(id: String): String = when (id) {
    "warrior" -> "战士"
    "mage" -> "法师"
    "taoist" -> "道士"
    else -> id
}

@Composable
private fun TopStatus(state: GameState?) {
    val stats = state?.stats
    val player = state?.player
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = player?.name ?: "未连接", style = MaterialTheme.typography.titleMedium)
                Text(text = "${classLabel(player?.classId ?: "")} Lv${player?.level ?: 0} | 金币 ${stats?.gold ?: 0}")
                Spacer(modifier = Modifier.height(6.dp))
                val hpProgress by animateFloatAsState(
                    targetValue = if (stats != null && stats.maxHp > 0) stats.hp.toFloat() / stats.maxHp else 0f,
                    label = "top_hp"
                )
                LinearProgressIndicator(
                    progress = hpProgress,
                    modifier = Modifier.fillMaxWidth().height(8.dp),
                    color = Color(0xFFE06B6B),
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )
                Text(text = "HP ${stats?.hp ?: 0}/${stats?.maxHp ?: 0}")
                Spacer(modifier = Modifier.height(4.dp))
                val expProgress by animateFloatAsState(
                    targetValue = if (stats != null && stats.expNext > 0) stats.exp.toFloat() / stats.expNext else 0f,
                    label = "top_exp"
                )
                LinearProgressIndicator(
                    progress = expProgress,
                    modifier = Modifier.fillMaxWidth().height(8.dp),
                    color = Color(0xFFE0B25C),
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )
                Text(text = "EXP ${stats?.exp ?: 0}/${stats?.expNext ?: 0}")
                if (state?.room != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "当前位置：${state.room.zone} - ${state.room.name}")
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.Start
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "攻击 ${stats?.atk ?: 0}")
                    Text(text = "魔法 ${stats?.mag ?: 0}")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "道术 ${stats?.spirit ?: 0}")
                    Text(text = "防御 ${stats?.def ?: 0}")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "魔御 ${stats?.mdef ?: 0}")
                    Text(text = "闪避 ${stats?.dodge ?: 0}%")
                }
                Spacer(modifier = Modifier.height(6.dp))
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "沙巴克加成 ${if (stats?.sabak_bonus == true) "有" else "无"}",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Start
                        )
                        Text(
                            text = "套装加成 ${if (stats?.set_bonus == true) "有" else "无"}",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Start
                        )
                        Text(
                            text = "在线人数 ${state?.online?.count ?: 0}",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Start
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(text = vipStatusText(stats), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
private fun BattleTab(
    state: GameState?,
    selectedMob: MobInfo?,
    onSelectMob: (MobInfo) -> Unit,
    onGo: (String) -> Unit,
    onAttack: (String) -> Unit,
    onCast: (SkillInfo, MobInfo?) -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { AppPreferences(context) }
    val scrollState: ScrollState = rememberScrollState()
    val panelBg = Color(0xFF2C2622)
    val panelBorder = Color(0xFF6E4B2D)
    val accent = Color(0xFFD79A4E)
    val textMain = Color(0xFFF4E8D6)
    var showPlayer by rememberSaveable {
        mutableStateOf(prefs.getBattlePanelExpanded("player", false))
    }
    var showSkills by rememberSaveable {
        mutableStateOf(prefs.getBattlePanelExpanded("skills", false))
    }
    var showMobs by rememberSaveable {
        mutableStateOf(prefs.getBattlePanelExpanded("mobs", false))
    }
    var showExits by rememberSaveable {
        mutableStateOf(prefs.getBattlePanelExpanded("exits", false))
    }

    Column(modifier = Modifier.fillMaxSize().verticalScroll(scrollState)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "战斗面板", style = MaterialTheme.typography.titleMedium, color = textMain)
        }
        Spacer(modifier = Modifier.height(12.dp))

        BattleSectionCard(
            title = "玩家",
            expanded = showPlayer,
            onToggle = {
                val next = !showPlayer
                showPlayer = next
                prefs.setBattlePanelExpanded("player", next)
            },
            summary = run {
                val p = state?.player
                if (p == null) "未连接" else "附近玩家 ${state?.players?.size ?: 0}"
            },
            panelBg = panelBg,
            panelBorder = panelBorder,
            textMain = textMain
        ) {
            val player = state?.player
            val stats = state?.stats
            if (player == null || stats == null) {
                Text("未连接", color = textMain)
            } else {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(player.name, fontWeight = FontWeight.SemiBold, color = textMain)
                    Text("Lv${player.level} ${classLabel(player.classId)}", color = textMain)
                }
                Spacer(modifier = Modifier.height(6.dp))
                BattleHpBar(
                    current = stats.hp,
                    max = stats.maxHp,
                    accent = accent,
                    animate = true
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text("HP ${stats.hp}/${stats.maxHp}", color = textMain)
            }
            val others = state?.players.orEmpty()
            if (others.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                Text("附近玩家", color = textMain)
                Spacer(modifier = Modifier.height(6.dp))
                BattlePillGrid(
                    items = others.map { it.name to { onAttack(it.name) } }
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        BattleSectionCard(
            title = "技能",
            expanded = showSkills,
            onToggle = {
                val next = !showSkills
                showSkills = next
                prefs.setBattlePanelExpanded("skills", next)
            },
            summary = "技能数量 ${state?.skills?.size ?: 0}",
            panelBg = panelBg,
            panelBorder = panelBorder,
            textMain = textMain
        ) {
            val skills = state?.skills.orEmpty()
            if (skills.isEmpty()) {
                Text("暂无技能", color = textMain)
            } else {
                BattlePillGrid(
                    items = skills.map { "${it.name} Lv${it.level}" to { onCast(it, selectedMob) } }
                )
            }
            val summons = state?.summons.orEmpty()
            if (summons.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                Text("召唤物", color = textMain)
                Spacer(modifier = Modifier.height(6.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(summons) { summon ->
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0xFF1F1A16),
                            border = BorderStroke(1.dp, panelBorder),
                            tonalElevation = 1.dp
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text("${summon.name} Lv${summon.level}", color = textMain, fontWeight = FontWeight.SemiBold)
                                Text("HP ${summon.hp}/${summon.maxHp}", color = textMain)
                                Text("攻击 ${summon.atk} 防御 ${summon.def}", color = textMain)
                                Text("魔御 ${summon.mdef}", color = textMain)
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        BattleSectionCard(
            title = "怪物",
            expanded = showMobs,
            onToggle = {
                val next = !showMobs
                showMobs = next
                prefs.setBattlePanelExpanded("mobs", next)
            },
            summary = "怪物数量 ${state?.mobs?.size ?: 0}",
            panelBg = panelBg,
            panelBorder = panelBorder,
            textMain = textMain
        ) {
            val mobs = state?.mobs.orEmpty()
            if (mobs.isEmpty()) {
                Text("暂无怪物", color = textMain)
            } else {
                mobs.forEach { mob ->
                    BattleMobCard(
                        mob = mob,
                        selected = selectedMob?.name == mob.name,
                        panelBg = panelBg,
                        panelBorder = panelBorder,
                        accent = accent,
                        textMain = textMain,
                        onClick = { onSelectMob(mob) }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
            if (selectedMob != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Button(onClick = { onAttack(selectedMob.name) }) { Text("攻击 ${selectedMob.name}") }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        BattleSectionCard(
            title = "方向",
            expanded = showExits,
            onToggle = {
                val next = !showExits
                showExits = next
                prefs.setBattlePanelExpanded("exits", next)
            },
            summary = "出口数量 ${state?.exits?.size ?: 0}",
            panelBg = panelBg,
            panelBorder = panelBorder,
            textMain = textMain
        ) {
            val exits = state?.exits.orEmpty().map { it.label to it.dir }
            if (exits.isEmpty()) {
                Text("暂无出口", color = textMain)
            } else {
                BattlePillGrid(
                    items = exits.map { it.first to { onGo(it.second) } }
                )
            }
        }
    }
}

@Composable
private fun BattleSectionCard(
    title: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    summary: String,
    panelBg: Color,
    panelBorder: Color,
    textMain: Color,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onToggle() },
            shape = RoundedCornerShape(10.dp),
            color = Color(0xFF2A221D),
            border = BorderStroke(1.dp, panelBorder)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(panelBorder, RoundedCornerShape(3.dp))
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(title, style = MaterialTheme.typography.titleSmall, color = textMain)
                    if (!expanded) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = summary,
                            color = Color(0xFFB7A189),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = Color(0xFF1F1A16),
                    border = BorderStroke(1.dp, panelBorder)
                ) {
                    Text(
                        if (expanded) "收起" else "展开",
                        color = textMain,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 2.dp)
                    )
                }
            }
        }

        if (expanded) {
            Spacer(modifier = Modifier.height(6.dp))
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = panelBg,
                border = BorderStroke(1.dp, panelBorder),
                tonalElevation = 2.dp
            ) {
                Column(modifier = Modifier.padding(12.dp), content = content)
            }
        }
    }
}

@Composable
private fun BattleHpBar(current: Int, max: Int, accent: Color, animate: Boolean = true) {
    val rawProgress = if (max > 0) current.toFloat() / max else 0f
    val progress = if (animate) {
        val animated by animateFloatAsState(targetValue = rawProgress, label = "battle_hp")
        animated
    } else {
        rawProgress
    }
    LinearProgressIndicator(
        progress = progress,
        modifier = Modifier
            .fillMaxWidth()
            .height(8.dp),
        color = accent,
        trackColor = Color(0xFF3A302A)
    )
}

@Composable
private fun BattlePillGrid(items: List<Pair<String, () -> Unit>>) {
    if (items.isEmpty()) return
    items.chunked(2).forEach { rowItems ->
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            rowItems.forEach { (label, onClick) ->
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                        .clickable { onClick() },
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFF1F1A16),
                    border = BorderStroke(1.dp, Color(0xFF6E4B2D)),
                    tonalElevation = 1.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(label, color = Color(0xFFF4E8D6), fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            if (rowItems.size == 1) Spacer(modifier = Modifier.weight(1f))
        }
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@Composable
private fun BattleMobCard(
    mob: MobInfo,
    selected: Boolean,
    panelBg: Color,
    panelBorder: Color,
    accent: Color,
    textMain: Color,
    onClick: () -> Unit
) {
    val border = if (selected) accent else panelBorder
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        color = panelBg,
        border = BorderStroke(1.dp, border),
        tonalElevation = if (selected) 3.dp else 1.dp
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(mob.name, color = textMain, fontWeight = FontWeight.SemiBold)
                Text("HP ${mob.hp}/${mob.maxHp}", color = textMain)
            }
            Spacer(modifier = Modifier.height(6.dp))
            BattleHpBar(current = mob.hp, max = mob.maxHp, accent = accent)
        }
    }
}

@Composable
  private fun InventoryTab(state: GameState?, onUse: (ItemInfo) -> Unit) {
      var bagPage by remember { mutableStateOf(0) }
      val bagPageSize = 12
      val isDark = isSystemInDarkTheme()
      val primaryText = if (isDark) Color(0xFFF4E8D6) else MaterialTheme.colorScheme.onSurface
      val secondaryText = if (isDark) Color(0xFFE0D2C1) else MaterialTheme.colorScheme.onSurfaceVariant
      LazyColumn(modifier = Modifier.fillMaxSize()) {
          item {
              Text(text = "装备", style = MaterialTheme.typography.titleSmall, color = primaryText)
          }
          item {
              val equipment = state?.equipment.orEmpty()
              if (equipment.isEmpty()) {
                  Text("暂无装备", color = secondaryText)
              } else {
                  val rows = equipment.chunked(2)
                  Column {
                      rows.forEach { row ->
                          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            row.forEach { eq ->
                                val item = eq.item
                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .heightIn(min = 96.dp),
                                    shape = RoundedCornerShape(10.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        if (item != null) {
                                            val effectInline = formatEffectInline(item.effects)
                                            RarityText(
                                                text = "${slotLabel(eq.slot)}：${item.name}${if (effectInline.isNotBlank()) "（$effectInline）" else ""}",
                                                rarity = item.rarity
                                            )
                                            val refine = eq.refine_level ?: 0
                                            val element = elementAtkFromEffects(item.effects)
                                              Row(
                                                  modifier = Modifier.fillMaxWidth(),
                                                  horizontalArrangement = Arrangement.SpaceBetween
                                              ) {
                                                  Text("锻造 +$refine", color = secondaryText)
                                                  Text("元素 +$element", color = secondaryText)
                                              }
                                              Text("耐久 ${eq.durability ?: 0}/${eq.max_durability ?: 0}", color = secondaryText)
                                          } else {
                                              Text("${slotLabel(eq.slot)}：无", color = secondaryText)
                                          }
                                      }
                                  }
                              }
                            if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
          item {
              Spacer(modifier = Modifier.height(8.dp))
              Text(text = "背包", style = MaterialTheme.typography.titleSmall, color = primaryText)
          }
        val bagItems = state?.items.orEmpty()
            .sortedWith(
                compareByDescending<ItemInfo> { rarityRank(it.rarity) }
                    .thenBy { it.name }
            )
        val bagPageInfo = paginate(bagItems, bagPage, bagPageSize)
        bagPage = bagPageInfo.page
        item {
            val rows = bagPageInfo.slice.chunked(2)
            Column {
                rows.forEach { row ->
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        row.forEach { item ->
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { onUse(item) },
                                shape = RoundedCornerShape(10.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    val isEquip = !item.slot.isNullOrBlank() || item.type == "weapon" || item.type == "armor" || item.type == "accessory"
                                    val effectInline = formatEffectInline(item.effects)
                                    val refine = item.refine_level
                                    val nameSuffixParts = mutableListOf<String>()
                                    if (effectInline.isNotBlank()) nameSuffixParts.add(effectInline)
                                    if (isEquip && refine > 0) nameSuffixParts.add("锻造+$refine")
                                    val nameSuffix = if (nameSuffixParts.isNotEmpty()) {
                                        "（" + nameSuffixParts.joinToString(" | ") + "）"
                                    } else ""
                                      RarityText(
                                          text = "${item.name} x${item.qty}$nameSuffix",
                                          rarity = item.rarity
                                      )
                                      if (isEquip) {
                                          val element = elementAtkFromEffects(item.effects)
                                          Text("${slotLabel(item.slot)}${if (element > 0) " 元素+$element" else ""}", color = secondaryText)
                                      } else {
                                          Text(itemTypeLabel(item.type), color = secondaryText)
                                      }
                                  }
                              }
                          }
                        if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
        item {
            if (bagPageInfo.totalPages > 1) {
                PagerControls(
                    info = bagPageInfo,
                    onPrev = { bagPage -= 1 },
                    onNext = { bagPage += 1 }
                )
            }
        }
    }
}

private fun normalizeRarityKey(rarity: String?): String? = rarity?.trim()?.lowercase()

private fun rarityRank(rarity: String?): Int = when (normalizeRarityKey(rarity)) {
    "ultimate" -> 6
    "supreme" -> 5
    "legendary" -> 4
    "epic" -> 3
    "rare" -> 2
    "uncommon" -> 1
    "common" -> 0
    else -> 0
}

  private fun rarityColor(rarity: String?): Color = when (normalizeRarityKey(rarity)) {
      "common" -> Color(0xFFB68E66)
      "uncommon" -> Color(0xFF5FCB7B)
      "rare" -> Color(0xFF6EA8FF)
      "epic" -> Color(0xFFB378FF)
      "legendary" -> Color(0xFFFFC06A)
      "supreme" -> Color(0xFFFF7D7D)
      "ultimate" -> Color(0xFFD64545)
      else -> Color(0xFFB68E66)
  }

  private fun brighten(color: Color, amount: Float): Color {
      val clamped = amount.coerceIn(0f, 1f)
      return Color(
          red = color.red + (1f - color.red) * clamped,
          green = color.green + (1f - color.green) * clamped,
          blue = color.blue + (1f - color.blue) * clamped,
          alpha = color.alpha
      )
  }

@Composable
  private fun RarityText(
      text: String,
      rarity: String?,
      modifier: Modifier = Modifier,
      maxLines: Int = Int.MAX_VALUE,
      overflow: TextOverflow = TextOverflow.Clip
  ) {
      val key = normalizeRarityKey(rarity)
      if (key == "ultimate") {
        val transition = rememberInfiniteTransition(label = "ultimateFlow")
        val shift by transition.animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(3500), RepeatMode.Restart),
            label = "ultimateShift"
        )
        val brush = Brush.horizontalGradient(
            colors = listOf(
                Color(0xFF7A1010),
                Color(0xFFD64545),
                Color(0xFFFF6B6B),
                Color(0xFFFF9A9A),
                Color(0xFFD64545)
            ),
            startX = -100f + 200f * shift,
            endX = 200f + 200f * shift
        )
        val baseStyle = LocalTextStyle.current
        Box(modifier = modifier) {
            Text(
                text = text,
                style = baseStyle.copy(color = Color(0xFF7A1010), drawStyle = Stroke(width = 2f)),
                maxLines = maxLines,
                overflow = overflow
            )
            Text(
                text = text,
                style = baseStyle.copy(
                    brush = brush,
                    shadow = Shadow(color = Color(0x66D64545), offset = Offset.Zero, blurRadius = 8f)
                ),
                maxLines = maxLines,
                overflow = overflow
            )
        }
      } else {
          val base = rarityColor(rarity)
          val color = if (isSystemInDarkTheme()) brighten(base, 0.35f) else base
          val style = LocalTextStyle.current.copy(
              color = color,
              shadow = Shadow(color = Color(0x99000000), offset = Offset.Zero, blurRadius = 6f)
          )
          Text(
              text = text,
              style = style,
              modifier = modifier,
              maxLines = maxLines,
              overflow = overflow
          )
      }
  }

private fun slotLabel(slot: String?): String = when (slot) {
    "weapon" -> "武器"
    "chest" -> "衣服"
    "head" -> "头盔"
    "feet" -> "鞋子"
    "waist" -> "腰带"
    "bracelet" -> "手镯"
    "neck" -> "项链"
    "ring_left" -> "左戒"
    "ring_right" -> "右戒"
    "ring" -> "戒指"
    "shield" -> "盾牌"
    else -> slot ?: "未知"
}

private fun itemTypeLabel(type: String?): String = when (type) {
    "book" -> "技能书"
    "material" -> "材料"
    "consumable" -> "消耗品"
    "weapon" -> "武器"
    "armor" -> "防具"
    "accessory" -> "饰品"
    "currency" -> "货币"
    else -> type ?: ""
}

private fun formatEffectText(effects: JsonObject?): String {
    if (effects == null) return ""
    val parts = mutableListOf<String>()
    val elementAtk = effects["elementAtk"]?.jsonPrimitive?.doubleOrNull ?: 0.0
    if (elementAtk > 0) parts.add("元素 +${elementAtk.toInt()}")
    val skillId = runCatching { effects["skill"]?.jsonPrimitive?.content }.getOrNull()
    if (!skillId.isNullOrBlank()) {
        parts.add("附加技能:${skillId}")
    }
    val keys = effects.keys.filter { it != "elementAtk" && it != "skill" }
    if (keys.isNotEmpty()) {
        parts.add("特效 ${keys.joinToString("、") { effectLabel(it) }}")
    }
    return parts.joinToString(" | ")
}

private fun formatEffectInline(effects: JsonObject?): String {
    if (effects == null) return ""
    val parts = mutableListOf<String>()
    val skillId = runCatching { effects["skill"]?.jsonPrimitive?.content }.getOrNull()
    if (!skillId.isNullOrBlank()) {
        parts.add("附加技能:${skillId}")
    }
    val keys = effects.keys.filter { it != "elementAtk" && it != "skill" }
    if (keys.isNotEmpty()) {
        parts.add(keys.joinToString("、") { effectLabel(it) })
    }
    return parts.joinToString(" ")
}

private fun effectLabel(key: String): String = when (key) {
    "combo" -> "连击"
    "fury" -> "狂攻"
    "unbreakable" -> "不磨"
    "defense" -> "守护"
    "dodge" -> "闪避"
    "poison" -> "毒"
    "healblock" -> "禁疗"
    else -> key
}

private fun vipStatusText(stats: StatsInfo?): String {
    if (stats == null) return "VIP 未知"
    if (!stats.vip) return "VIP 未激活"
    val ts = stats.vip_expires_at ?: 0L
    return if (ts <= 0L) "VIP 永久" else "VIP 到期 ${formatTime(ts)}"
}

private fun formatTime(ts: Long): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
    return sdf.format(Date(ts))
}

private fun partyMembersText(party: PartyInfo): String {
    val names = party.members.map { "${it.name}${if (it.online) "(在线)" else "(离线)"}" }
    return if (names.size <= 4) {
        names.joinToString("，")
    } else {
        names.take(4).joinToString("，") + "…"
    }
}

private fun elementAtkFromEffects(effects: JsonObject?): Int {
    val value = effects?.get("elementAtk")?.jsonPrimitive?.doubleOrNull ?: 0.0
    return if (value > 0) value.toInt() else 0
}

@Composable
private fun ChatTab(
    state: GameState?,
    outputs: List<OutputPayload>,
    onCommand: (String) -> Unit,
    onOpenModule: (String, String?) -> Unit,
    onJumpToBattle: () -> Unit,
    input: String,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit
) {
    var selectedName by remember { mutableStateOf<String?>(null) }
    val selectedPlayer = state?.players?.firstOrNull { it.name == selectedName }
    Column(modifier = Modifier.fillMaxSize()) {
        LazyColumn(modifier = Modifier.weight(1f), reverseLayout = true) {
            items(outputs) { line ->
                ChatLine(
                    output = line,
                    onNameClick = { name -> selectedName = name },
                    onLocationClick = { location ->
                        if (location == null) return@ChatLine
                        val zoneId = location.zoneId?.trim().orEmpty()
                        val roomId = location.roomId?.trim().orEmpty()
                        if (zoneId.isNotBlank() && roomId.isNotBlank()) {
                            onJumpToBattle()
                            onCommand("loc $zoneId:$roomId")
                        } else if (location.label.isNotBlank()) {
                            onJumpToBattle()
                            onCommand("loc ${location.label}")
                        }
                    }
                )
                Divider()
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(value = input, onValueChange = onInputChange, modifier = Modifier.weight(1f))
            Spacer(modifier = Modifier.width(8.dp))
            val roomLabel = state?.room?.let { "${it.zone} - ${it.name}" }
            OutlinedButton(
                onClick = {
                    if (!roomLabel.isNullOrBlank()) {
                        onCommand("say 我在 $roomLabel")
                        onInputChange("")
                    }
                },
                enabled = !roomLabel.isNullOrBlank()
            ) {
                Text("位置")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = onSend) { Text("发送") }
        }
    }

    if (!selectedName.isNullOrBlank()) {
        PlayerInfoDialog(
            name = selectedName ?: "",
            player = selectedPlayer,
            onDismiss = { selectedName = null },
            onCommand = onCommand,
            onOpenModule = onOpenModule
        )
    }
}

@Composable
private fun ChatLine(
    output: OutputPayload,
    onNameClick: (String) -> Unit,
    onLocationClick: (ChatLocation?) -> Unit
) {
    val prefix = output.prefix?.trim().orEmpty()
    val prefixColor = output.prefixColor?.trim().orEmpty()
    val color = output.color?.trim().orEmpty()
    val text = output.text?.trim().orEmpty()
    val isAnnounce = prefix == "公告" || prefixColor == "announce" || color == "announce"

    if (isAnnounce) {
        if (output.location?.label?.isNotBlank() == true) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(text = text, color = Color(0xFFE0B25C), fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.width(6.dp))
                LocationChip(label = output.location.label) {
                    onLocationClick(output.location)
                }
            }
        } else {
            Text(text = text, color = Color(0xFFE0B25C), fontWeight = FontWeight.SemiBold)
        }
        return
    }

    val guildMatch = Regex("^\\[行会\\]\\[([^\\]]+)\\]\\s*(.*)$").find(text)
    val normalMatch = Regex("^\\[([^\\[\\]]{1,20})\\]\\s*(.*)$").find(text)

    if (guildMatch != null) {
        val name = guildMatch.groupValues[1]
        val msg = guildMatch.groupValues[2]
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("[行会] ", color = Color(0xFF9C7A4B))
            Text(
                text = "[$name]",
                color = Color(0xFFD8C2A0),
                modifier = Modifier.clickable { onNameClick(name) }
            )
            ChatTitleBadge(title = output.rankTitle)
            Text(" $msg")
            if (output.location?.label?.isNotBlank() == true) {
                Spacer(modifier = Modifier.width(6.dp))
                LocationChip(label = output.location.label) {
                    onLocationClick(output.location)
                }
            }
        }
        return
    }

    if (normalMatch != null) {
        val name = normalMatch.groupValues[1]
        val msg = normalMatch.groupValues[2]
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "[$name]",
                color = Color(0xFFD8C2A0),
                modifier = Modifier.clickable { onNameClick(name) }
            )
            ChatTitleBadge(title = output.rankTitle)
            Text(" $msg")
            if (output.location?.label?.isNotBlank() == true) {
                Spacer(modifier = Modifier.width(6.dp))
                LocationChip(label = output.location.label) {
                    onLocationClick(output.location)
                }
            }
        }
        return
    }

    if (output.location?.label?.isNotBlank() == true) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(text)
            Spacer(modifier = Modifier.width(6.dp))
            LocationChip(label = output.location.label) {
                onLocationClick(output.location)
            }
        }
    } else {
        Text(text)
    }
}

@Composable
private fun LocationChip(label: String, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = Color(0xFF3B2E25),
        border = BorderStroke(1.dp, Color(0xFF7C5A32)),
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = label,
            color = Color(0xFFE8D6B8),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
        )
    }
}

@Composable
private fun ChatTitleBadge(title: String?) {
    if (title.isNullOrBlank()) return
    Spacer(modifier = Modifier.width(6.dp))
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = Color(0xFF3B2E25),
        border = BorderStroke(1.dp, Color(0xFF7C5A32))
    ) {
        Text(
            text = title,
            color = Color(0xFFE8D6B8),
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

@Composable
private fun PlayerInfoDialog(
    name: String,
    player: PlayerBrief?,
    onDismiss: () -> Unit,
    onCommand: (String) -> Unit,
    onOpenModule: (String, String?) -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFF4A3429),
            tonalElevation = 4.dp,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("玩家信息", style = MaterialTheme.typography.titleMedium, color = Color(0xFFF4E8D6))
                Spacer(modifier = Modifier.height(10.dp))
                Text(name, fontWeight = FontWeight.SemiBold, color = Color(0xFFE8D6B8))
                if (player != null) {
                    Text("等级 Lv${player.level} ${classLabel(player.classId)}", color = Color(0xFFE8D6B8))
                    if (!player.guild.isNullOrBlank()) Text("行会 ${player.guild}", color = Color(0xFFE8D6B8))
                    Text("血量 ${player.hp}/${player.maxHp}", color = Color(0xFFE8D6B8))
                    Text("PK ${player.pk}", color = Color(0xFFE8D6B8))
                } else {
                    Text("暂无玩家详细信息", color = Color(0xFFE8D6B8))
                }

                Spacer(modifier = Modifier.height(16.dp))
                PlayerActionRow(
                    left = "攻击" to { onCommand("attack $name"); onDismiss() },
                    right = "观察" to { onCommand("observe $name"); onDismiss() }
                )
                Spacer(modifier = Modifier.height(10.dp))
                PlayerActionRow(
                    left = "交易" to { onOpenModule("trade", name); onDismiss() },
                    right = "组队" to { onOpenModule("party", name); onDismiss() }
                )
                Spacer(modifier = Modifier.height(10.dp))
                PlayerActionRow(
                    left = "行会" to { onOpenModule("guild", name); onDismiss() },
                    right = "邮件" to { onOpenModule("mail", name); onDismiss() }
                )

                Spacer(modifier = Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("关闭", color = Color(0xFFE8D6B8)) }
                }
            }
        }
    }
}

@Composable
private fun PlayerActionRow(
    left: Pair<String, () -> Unit>,
    right: Pair<String, () -> Unit>
) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        PlayerActionButton(label = left.first, onClick = left.second, modifier = Modifier.weight(1f))
        PlayerActionButton(label = right.first, onClick = right.second, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun PlayerActionButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.height(40.dp).clickable { onClick() },
        shape = RoundedCornerShape(999.dp),
        color = Color(0xFFED9F76)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(label, color = Color(0xFF3B2A21), fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun ActionsTab(
    state: GameState?,
    onAction: (String) -> Unit
) {
    val general = mutableListOf(
        ActionItem("角色状态", "stats", R.drawable.ic_status),
        ActionItem("背包管理", "bag", R.drawable.ic_bag),
        ActionItem("队伍", "party", R.drawable.ic_party),
        ActionItem("行会", "guild", R.drawable.ic_guild),
        ActionItem("邮件", "mail", R.drawable.ic_mail),
        ActionItem("交易", "trade", R.drawable.ic_trade)
    )
    val economy = mutableListOf(
        ActionItem("商店", "shop", R.drawable.ic_shop),
        ActionItem("修理装备", "repair", R.drawable.ic_repair),
        ActionItem("寄售", "consign", R.drawable.ic_consign)
    )
    val growth = mutableListOf(
        ActionItem("转职", "changeclass", R.drawable.ic_hat),
        ActionItem("装备合成", "forge", R.drawable.ic_forge),
        ActionItem("装备锻造", "refine", R.drawable.ic_refine),
        ActionItem("特效重置", "effect", R.drawable.ic_magic),
        ActionItem("套装掉落", "drops", R.drawable.ic_drops),
        ActionItem("修炼", "train", R.drawable.ic_train)
    )
    val events = mutableListOf(
        ActionItem("玩家排行", "rank", R.drawable.ic_rank),
        ActionItem("沙巴克", "sabak", R.drawable.ic_castle)
    )
    val system = mutableListOf(
        ActionItem("设置", "settings", R.drawable.ic_settings),
        ActionItem("切换角色", "switch", R.drawable.ic_switch),
        ActionItem("退出游戏", "logout", R.drawable.ic_logout)
    )
    val vip = mutableListOf<ActionItem>()
    if (state?.stats?.vip == false && state.vip_self_claim_enabled) {
        vip.add(ActionItem("VIP领取", "vip claim", R.drawable.ic_vip))
    }
    if (state?.stats?.vip == false) {
        vip.add(ActionItem("VIP激活", "vip activate", R.drawable.ic_vip))
    }
    val afk = listOf(
        if (hasAutoSkill(state?.stats))
            ActionItem("停止挂机", "autoskill off", R.drawable.ic_afk)
        else
            ActionItem("挂机", "afk", R.drawable.ic_afk)
    )

    Column(modifier = Modifier.fillMaxSize()) {
        Text(text = "常用功能", style = MaterialTheme.typography.titleSmall)
        CartoonGrid(items = general, onClick = { onAction(it) })
        Spacer(modifier = Modifier.height(8.dp))

        Text(text = "经济系统", style = MaterialTheme.typography.titleSmall)
        CartoonGrid(items = economy, onClick = { onAction(it) })
        Spacer(modifier = Modifier.height(8.dp))

        Text(text = "成长锻造", style = MaterialTheme.typography.titleSmall)
        CartoonGrid(items = growth, onClick = { onAction(it) })
        Spacer(modifier = Modifier.height(8.dp))

        if (vip.isNotEmpty()) {
            Text(text = "VIP", style = MaterialTheme.typography.titleSmall)
            CartoonGrid(items = vip, onClick = { onAction(it) })
            Spacer(modifier = Modifier.height(8.dp))
        }

        Text(text = "活动排行", style = MaterialTheme.typography.titleSmall)
        CartoonGrid(items = events, onClick = { onAction(it) })
        Spacer(modifier = Modifier.height(8.dp))

        Text(text = "系统", style = MaterialTheme.typography.titleSmall)
        CartoonGrid(items = system, onClick = { onAction(it) })
        Spacer(modifier = Modifier.height(8.dp))

        Text(text = "挂机", style = MaterialTheme.typography.titleSmall)
        CartoonGrid(items = afk, onClick = { onAction(it) })
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun ScreenScaffold(
    title: String,
    onBack: () -> Unit,
    scrollable: Boolean = true,
    content: @Composable ColumnScope.() -> Unit
) {
    var backLocked by remember { mutableStateOf(false) }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    OutlinedButton(
                        onClick = {
                            if (backLocked) return@OutlinedButton
                            backLocked = true
                            onBack()
                        }
                    ) { Text("返回") }
                }
            )
        }
    ) { innerPadding ->
        val base = Modifier.fillMaxSize().padding(innerPadding).padding(12.dp)
        val modifier = if (scrollable) base.verticalScroll(rememberScrollState()) else base
        CartoonBackground {
            Column(modifier = modifier, content = content)
        }
    }
}

@Composable
private fun CartoonBackground(content: @Composable BoxScope.() -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surface
                    )
                )
            ),
        content = content
    )
}

private data class ActionItem(val label: String, val action: String, val iconRes: Int)

@Composable
private fun CartoonGrid(items: List<ActionItem>, onClick: (String) -> Unit) {
    if (items.isEmpty()) {
        Text("暂无")
        return
    }
    items.chunked(3).forEach { rowItems ->
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            rowItems.forEach { entry ->
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .height(62.dp)
                        .clickable { onClick(entry.action) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Image(
                            painter = painterResource(id = entry.iconRes),
                            contentDescription = entry.label,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(entry.label, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
                    }
                }
            }
            if (rowItems.size == 1) Spacer(modifier = Modifier.weight(2f))
            if (rowItems.size == 2) Spacer(modifier = Modifier.weight(1f))
        }
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@Composable
  private fun ClickableListItem(
      headline: @Composable () -> Unit,
      supporting: @Composable (() -> Unit)? = null,
      selected: Boolean = false,
      onClick: () -> Unit
  ) {
    val bg = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.18f) else MaterialTheme.colorScheme.surfaceVariant
    val border = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.7f) else MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(8.dp),
        color = bg,
        border = BorderStroke(1.dp, border),
        tonalElevation = if (selected) 2.dp else 0.dp
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
            headline()
            if (supporting != null) {
                Spacer(modifier = Modifier.height(2.dp))
                supporting()
            }
        }
    }
}

@Composable
private fun ClickableTextRow(
    text: String,
    selected: Boolean = false,
    onClick: () -> Unit
) {
    val bg = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.18f) else MaterialTheme.colorScheme.surfaceVariant
    val border = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.7f) else MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(8.dp),
        color = bg,
        border = BorderStroke(1.dp, border),
        tonalElevation = if (selected) 2.dp else 0.dp
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal
        )
    }
}

@Composable
private fun OptionGrid(
    options: List<Pair<String, String>>,
    selected: String,
    onSelect: (String) -> Unit
) {
    val rows = options.chunked(2)
    Column {
        rows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { (value, label) ->
                    val isSelected = selected == value
                    val bg = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.18f) else MaterialTheme.colorScheme.surfaceVariant
                    val border = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.7f) else MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .padding(vertical = 4.dp)
                            .clickable { onSelect(value) },
                        shape = RoundedCornerShape(8.dp),
                        color = bg,
                        border = BorderStroke(1.dp, border),
                        tonalElevation = if (isSelected) 2.dp else 0.dp
                    ) {
                        Text(
                            text = label,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                        )
                    }
                }
                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

private fun hasAutoSkill(stats: StatsInfo?): Boolean {
    val value = stats?.autoSkillId ?: return false
    return when (value) {
        is JsonNull -> false
        is JsonArray -> value.isNotEmpty()
        is JsonPrimitive -> if (value.isString) value.content.isNotBlank() else true
        else -> true
    }
}

@Composable
private fun SettingsScreen(vm: GameViewModel, onDismiss: () -> Unit) {
    val themeMode by vm.themeMode.collectAsState()
    ScreenScaffold(title = "设置", onBack = onDismiss) {
        Text("主题模式")
        Spacer(modifier = Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            RadioButton(selected = themeMode == "system", onClick = { vm.setThemeMode("system") })
            Text("跟随系统")
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            RadioButton(selected = themeMode == "dark", onClick = { vm.setThemeMode("dark") })
            Text("暗黑模式")
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            RadioButton(selected = themeMode == "light", onClick = { vm.setThemeMode("light") })
            Text("浅色模式")
        }
    }
}

  @Composable
  private fun StatsDialog(state: GameState?, onDismiss: () -> Unit) {
      ScreenScaffold(title = "角色状态", onBack = onDismiss) {
          val stats = state?.stats
          val player = state?.player
          Card(
              modifier = Modifier.fillMaxWidth(),
              colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
              elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
          ) {
              Column(modifier = Modifier.padding(14.dp)) {
                  Text(
                      text = "${player?.name ?: "未知"}  Lv${player?.level ?: 0}",
                      style = MaterialTheme.typography.titleMedium,
                      fontWeight = FontWeight.SemiBold
                  )
                  if (stats != null) {
                      Spacer(modifier = Modifier.height(10.dp))
                      StatBar("生命", stats.hp, stats.maxHp, Color(0xFFE57373))
                      Spacer(modifier = Modifier.height(8.dp))
                      StatBar("法力", stats.mp, stats.maxMp, Color(0xFF64B5F6))
                      Spacer(modifier = Modifier.height(8.dp))
                      StatBar("经验", stats.exp, stats.expNext, Color(0xFFFFB74D))
                      Spacer(modifier = Modifier.height(12.dp))

                      val tiles = listOf(
                          Triple("攻击", stats.atk.toString(), R.drawable.ic_battle),
                          Triple("防御", stats.def.toString(), R.drawable.ic_status),
                          Triple("魔法", stats.mag.toString(), R.drawable.ic_magic),
                          Triple("道术", stats.spirit.toString(), R.drawable.ic_train),
                          Triple("魔防", stats.mdef.toString(), R.drawable.ic_status),
                          Triple("闪避", "${stats.dodge}%", R.drawable.ic_afk),
                          Triple("PK", stats.pk.toString(), R.drawable.ic_castle),
                          Triple("VIP", if (stats.vip) "是" else "否", R.drawable.ic_vip)
                      )
                      tiles.chunked(2).forEach { row ->
                          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                              row.forEach { (label, value, icon) ->
                                  val tint = when (label) {
                                      "攻击" -> Color(0xFFE06B6B)
                                      "防御" -> Color(0xFF8D6E63)
                                      "魔法" -> Color(0xFF5C6BC0)
                                      "道术" -> Color(0xFF4DB6AC)
                                      "魔防" -> Color(0xFF7E57C2)
                                      "闪避" -> Color(0xFF26A69A)
                                      "PK" -> Color(0xFFEF5350)
                                      "VIP" -> Color(0xFFF9A825)
                                      else -> MaterialTheme.colorScheme.primary
                                  }
                                  StatTile(label = label, value = value, iconRes = icon, tint = tint)
                              }
                              if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
                          }
                          Spacer(modifier = Modifier.height(8.dp))
                      }
                  }
              }
          }
      }
  }

@Composable
private fun PartyDialog(vm: GameViewModel, state: GameState?, prefillName: String?, onDismiss: () -> Unit) {
    var inviteName by remember { mutableStateOf(prefillName ?: "") }
    LaunchedEffect(prefillName) {
        if (!prefillName.isNullOrBlank()) inviteName = prefillName
    }
    val party = state?.party
    ScreenScaffold(title = "队伍", onBack = onDismiss) {
        if (party == null) {
            Text("当前未组队")
            Button(onClick = { vm.sendCmd("party create") }) { Text("创建队伍") }
        } else {
            Text("队长: ${party.leader}")
            party.members.forEach { member ->
                Text("${member.name} ${if (member.online) "在线" else "离线"}")
            }
            Row {
                OutlinedTextField(value = inviteName, onValueChange = { inviteName = it }, label = { Text("邀请玩家") })
                Spacer(modifier = Modifier.width(8.dp))
                Button(onClick = { if (inviteName.isNotBlank()) vm.sendCmd("party invite ${inviteName.trim()}") }) { Text("邀请") }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { vm.sendCmd("party leave") }) { Text("退出队伍") }
        }
    }
}

@Composable
private fun GuildDialog(vm: GameViewModel, prefillName: String?, onDismiss: () -> Unit) {
    val members by vm.guildMembers.collectAsState()
    val guildList by vm.guildList.collectAsState()
    var guildId by remember { mutableStateOf("") }
    var inviteName by remember { mutableStateOf(prefillName ?: "") }
    val roleOrder = remember { mapOf("leader" to 0, "vice_leader" to 1, "admin" to 2, "member" to 3) }
    LaunchedEffect(prefillName) {
        if (!prefillName.isNullOrBlank()) inviteName = prefillName
    }

    LaunchedEffect(Unit) {
        vm.guildMembers()
        vm.guildList()
    }

    ScreenScaffold(title = "行会", onBack = onDismiss) {
        val memberList = members?.members.orEmpty()
        val onlineCount = memberList.count { it.online }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = members?.guildName?.let { "行会：$it" } ?: "未加入行会",
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                if (members?.ok == true) {
                    Text("成员：${memberList.size}（在线 ${onlineCount}）")
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))
        Text("成员列表", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(6.dp))

        if (members?.ok == true) {
            val sortedMembers = memberList.sortedWith(
                compareBy<GuildMemberInfo> { roleOrder[it.role] ?: 9 }
                    .thenBy { it.name }
            )
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp)
            ) {
                items(sortedMembers) { member ->
                    val roleLabel = when (member.role) {
                        "leader" -> "会长"
                        "vice_leader" -> "副会长"
                        "admin" -> "管理"
                        else -> "成员"
                    }
                    val roleColor = when (member.role) {
                        "leader" -> Color(0xFFE9B44C)
                        "vice_leader" -> Color(0xFFF0A35E)
                        "admin" -> Color(0xFF6FB7A8)
                        else -> MaterialTheme.colorScheme.outline
                    }
                    val onlineText = if (member.online) "在线" else "离线"
                    val onlineColor = if (member.online) Color(0xFF7DDC90) else MaterialTheme.colorScheme.outline

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(member.name, fontWeight = FontWeight.SemiBold)
                                Text("Lv${member.level} ${classLabel(member.classId)}")
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Surface(
                                    shape = RoundedCornerShape(999.dp),
                                    color = roleColor.copy(alpha = 0.2f),
                                    border = BorderStroke(1.dp, roleColor.copy(alpha = 0.7f))
                                ) {
                                    Text(
                                        text = roleLabel,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                        color = roleColor,
                                        fontSize = 12.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(onlineText, color = onlineColor, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        } else {
            Text("未加入行会")
        }

        Spacer(modifier = Modifier.height(12.dp))
        Text("行会列表", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(6.dp))
        guildList?.guilds?.forEach { g ->
            Surface(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(g.name, fontWeight = FontWeight.SemiBold)
                        Text("ID ${g.id} · 人数 ${g.memberCount}", fontSize = 12.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = guildId,
            onValueChange = { guildId = it },
            label = { Text("申请行会ID") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(6.dp))
        Button(
            onClick = {
                val id = guildId.toIntOrNull()
                if (id != null) vm.guildApply(id)
            },
            modifier = Modifier.fillMaxWidth()
        ) { Text("申请加入") }

        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = inviteName,
            onValueChange = { inviteName = it },
            label = { Text("邀请玩家") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(6.dp))
        Button(
            onClick = { if (inviteName.isNotBlank()) vm.sendCmd("guild invite ${inviteName.trim()}") },
            modifier = Modifier.fillMaxWidth()
        ) { Text("邀请") }
    }
}

@Composable
private fun MailDialog(vm: GameViewModel, prefillName: String?, onDismiss: () -> Unit) {
    val mailList by vm.mailList.collectAsState()
    val state by vm.gameState.collectAsState()
    var toName by remember { mutableStateOf(prefillName ?: "") }
    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var itemKey by remember { mutableStateOf("") }
    var itemQty by remember { mutableStateOf("1") }
    var gold by remember { mutableStateOf("0") }
    var search by remember { mutableStateOf("") }
    var page by remember { mutableStateOf(0) }
    val pageSize = 9
    val inventory = state?.items.orEmpty().filter {
        it.type != "currency" && !it.untradable && !it.unconsignable
    }
    val filtered = inventory.filter { it.name.contains(search, ignoreCase = true) }
    val pageInfo = paginate(filtered, page, pageSize)
    page = pageInfo.page

    LaunchedEffect(Unit) {
        vm.mailListInbox()
    }
    LaunchedEffect(prefillName) {
        if (!prefillName.isNullOrBlank()) toName = prefillName
    }

    ScreenScaffold(title = "邮件", onBack = onDismiss) {
        Row {
            Button(onClick = { vm.mailListInbox() }) { Text("收件箱") }
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = { vm.mailListSent() }) { Text("发件箱") }
        }
        Spacer(modifier = Modifier.height(8.dp))
        mailList?.mails?.forEach { mail ->
            Text("#${mail.id} ${mail.title} 来自 ${mail.from_name ?: "-"}")
            Text(mail.body)
            Row {
                TextButton(onClick = { vm.mailRead(mail.id) }) { Text("标记已读") }
                TextButton(onClick = { vm.mailClaim(mail.id) }) { Text("领取") }
                TextButton(onClick = { vm.mailDelete(mail.id) }) { Text("删除") }
            }
            Divider()
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text("发送邮件")
        OutlinedTextField(value = toName, onValueChange = { toName = it }, label = { Text("收件人") })
        OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("标题") })
        OutlinedTextField(value = body, onValueChange = { body = it }, label = { Text("内容") })
        Text("从背包选择附件")
        OutlinedTextField(value = search, onValueChange = { search = it }, label = { Text("搜索背包物品") })
        Spacer(modifier = Modifier.height(6.dp))
        pageInfo.slice.chunked(2).forEach { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { item ->
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                itemKey = item.key.ifBlank { item.id }
                                itemQty = "1"
                            },
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            RarityText(text = item.name, rarity = item.rarity)
                            Text("x${item.qty}")
                        }
                    }
                }
                if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(6.dp))
        }
        if (pageInfo.totalPages > 1) {
            PagerControls(info = pageInfo, onPrev = { page -= 1 }, onNext = { page += 1 })
        }
        OutlinedTextField(value = itemQty, onValueChange = { itemQty = it }, label = { Text("附件数量") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        OutlinedTextField(value = gold, onValueChange = { gold = it }, label = { Text("金币") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        Button(onClick = {
            val items = if (itemKey.isNotBlank()) listOf(itemKey to (itemQty.toIntOrNull() ?: 1)) else emptyList()
            vm.mailSend(toName, title, body, items, gold.toIntOrNull() ?: 0)
        }) { Text("发送") }
    }
}

@Composable
private fun TradeDialog(vm: GameViewModel, state: GameState?, prefillName: String?, onDismiss: () -> Unit) {
    var targetName by remember { mutableStateOf(prefillName ?: "") }
    LaunchedEffect(prefillName) {
        if (!prefillName.isNullOrBlank()) targetName = prefillName
    }
    var itemName by remember { mutableStateOf("") }
    var itemQty by remember { mutableStateOf("1") }
    var gold by remember { mutableStateOf("0") }
    var search by remember { mutableStateOf("") }
    var page by remember { mutableStateOf(0) }
    val pageSize = 9
    val inventory = state?.items.orEmpty().filter {
        it.type != "currency" && !it.untradable && !it.unconsignable
    }
    val filtered = inventory.filter { it.name.contains(search, ignoreCase = true) }
    val pageInfo = paginate(filtered, page, pageSize)
    page = pageInfo.page
    ScreenScaffold(title = "交易", onBack = onDismiss) {
        if (state?.trade != null) {
            Text("交易对象: ${state.trade.partnerName}")
            Text("我的金币: ${state.trade.myGold} 对方金币: ${state.trade.partnerGold}")
            Text("我的物品: ${state.trade.myItems.joinToString { "${it.id}x${it.qty}" }}")
            Text("对方物品: ${state.trade.partnerItems.joinToString { "${it.id}x${it.qty}" }}")
            TextButton(onClick = { vm.sendCmd("trade lock") }) { Text("锁定") }
            TextButton(onClick = { vm.sendCmd("trade confirm") }) { Text("确认") }
            TextButton(onClick = { vm.sendCmd("trade cancel") }) { Text("取消") }
        } else {
            OutlinedTextField(value = targetName, onValueChange = { targetName = it }, label = { Text("交易对象") })
            Button(onClick = { if (targetName.isNotBlank()) vm.sendCmd("trade request ${targetName.trim()}") }) { Text("发起交易") }
            Button(onClick = { if (targetName.isNotBlank()) vm.sendCmd("trade accept ${targetName.trim()}") }) { Text("接受交易") }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text("添加物品/金币")
        OutlinedTextField(value = search, onValueChange = {
            search = it
            page = 0
        }, label = { Text("搜索背包物品") })
        TwoColumnGrid(
            items = pageInfo.slice,
            render = { item ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { itemName = item.key.ifBlank { item.id } }
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text(item.name, fontWeight = FontWeight.SemiBold)
                        Text("数量 ${item.qty}")
                    }
                }
            }
        )
        PagerControls(pageInfo, onPrev = { page -= 1 }, onNext = { page += 1 })
        OutlinedTextField(value = itemName, onValueChange = { itemName = it }, label = { Text("物品名或Key") })
        OutlinedTextField(value = itemQty, onValueChange = { itemQty = it }, label = { Text("数量") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        Button(onClick = {
            val qty = itemQty.toIntOrNull() ?: 1
            if (itemName.isNotBlank()) vm.sendCmd("trade add item ${itemName.trim()} $qty")
        }) { Text("加入物品") }
        OutlinedTextField(value = gold, onValueChange = { gold = it }, label = { Text("金币") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        Button(onClick = {
            val amount = gold.toIntOrNull() ?: 0
            if (amount > 0) vm.sendCmd("trade add gold $amount")
        }) { Text("加入金币") }
    }
}

@Composable
private fun ConsignDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    val consignMarket by vm.consignMarket.collectAsState()
    val consignMine by vm.consignMine.collectAsState()
    val consignHistory by vm.consignHistory.collectAsState()
    var sellName by remember { mutableStateOf("") }
    var sellQty by remember { mutableStateOf("1") }
    var sellPrice by remember { mutableStateOf("1") }
    var buyId by remember { mutableStateOf("") }
    var buyQty by remember { mutableStateOf("1") }
    var showSellDialog by remember { mutableStateOf(false) }
    var showBuyDialog by remember { mutableStateOf(false) }
    var sellItemLabel by remember { mutableStateOf("") }
    var buyItemLabel by remember { mutableStateOf("") }
    var tab by remember { mutableStateOf("market") }
    var filter by remember { mutableStateOf("all") }
    var page by remember { mutableStateOf(0) }
    val pageSize = 9

    ScreenScaffold(title = "寄售", onBack = onDismiss) {
        if (showSellDialog) {
            AlertDialog(
                onDismissRequest = { showSellDialog = false },
                title = { Text("上架物品") },
                text = {
                    Column {
                        Text(sellItemLabel)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = sellQty,
                            onValueChange = { sellQty = it },
                            label = { Text("数量") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                        OutlinedTextField(
                            value = sellPrice,
                            onValueChange = { sellPrice = it },
                            label = { Text("单价") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                    }
                },
                confirmButton = {
                    Button(onClick = {
                        val qty = sellQty.toIntOrNull() ?: 1
                        val price = sellPrice.toIntOrNull() ?: 1
                        if (sellName.isNotBlank()) vm.sendCmd("consign sell ${sellName.trim()} $qty $price")
                        showSellDialog = false
                    }) { Text("上架") }
                },
                dismissButton = {
                    TextButton(onClick = { showSellDialog = false }) { Text("取消") }
                }
            )
        }
        if (showBuyDialog) {
            AlertDialog(
                onDismissRequest = { showBuyDialog = false },
                title = { Text("购买物品") },
                text = {
                    Column {
                        Text(buyItemLabel)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = buyQty,
                            onValueChange = { buyQty = it },
                            label = { Text("数量") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                    }
                },
                confirmButton = {
                    Button(onClick = {
                        val id = buyId.toIntOrNull()
                        val qty = buyQty.toIntOrNull() ?: 1
                        if (id != null) vm.sendCmd("consign buy $id $qty")
                        showBuyDialog = false
                    }) { Text("购买") }
                },
                dismissButton = {
                    TextButton(onClick = { showBuyDialog = false }) { Text("取消") }
                }
            )
        }

        val activeTabColor = MaterialTheme.colorScheme.primaryContainer
        val inactiveTabColor = MaterialTheme.colorScheme.surfaceVariant
        Row {
            Button(
                onClick = { tab = "market"; page = 0; vm.sendCmd("consign list") },
                colors = ButtonDefaults.buttonColors(containerColor = if (tab == "market") activeTabColor else inactiveTabColor)
            ) { Text("市场") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(
                onClick = { tab = "mine"; page = 0; vm.sendCmd("consign my") },
                colors = ButtonDefaults.buttonColors(containerColor = if (tab == "mine") activeTabColor else inactiveTabColor)
            ) { Text("我的寄售") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(
                onClick = { tab = "inventory"; page = 0 },
                colors = ButtonDefaults.buttonColors(containerColor = if (tab == "inventory") activeTabColor else inactiveTabColor)
            ) { Text("背包") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(
                onClick = { tab = "history"; page = 0; vm.sendCmd("consign history") },
                colors = ButtonDefaults.buttonColors(containerColor = if (tab == "history") activeTabColor else inactiveTabColor)
            ) { Text("历史") }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row {
            FilterChip("全部", filter == "all") { filter = "all"; page = 0 }
            FilterChip("武器", filter == "weapon") { filter = "weapon"; page = 0 }
            FilterChip("防具", filter == "armor") { filter = "armor"; page = 0 }
            FilterChip("饰品", filter == "accessory") { filter = "accessory"; page = 0 }
            FilterChip("技能书", filter == "book") { filter = "book"; page = 0 }
        }
        Spacer(modifier = Modifier.height(8.dp))
        if (tab == "market") {
            val filtered = filterConsign(consignMarket, filter)
            val info = paginate(filtered, page, pageSize)
            page = info.page
            TwoColumnGrid(
                items = info.slice,
                render = { item ->
                    val name = item.item?.name ?: item.item_name ?: item.item_id
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                buyId = item.id.toString()
                                buyQty = "1"
                                buyItemLabel = "${name} · 数量 ${item.qty} · 单价 ${item.price} 金"
                                showBuyDialog = true
                            }
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(name, fontWeight = FontWeight.SemiBold)
                            Text("数量 ${item.qty}")
                            Text("价格 ${item.price} 金")
                        }
                    }
                }
            )
            PagerControls(info, onPrev = { page -= 1 }, onNext = { page += 1 })
        }
        if (tab == "mine") {
            val filtered = filterConsign(consignMine, filter)
            val info = paginate(filtered, page, pageSize)
            page = info.page
            TwoColumnGrid(
                items = info.slice,
                render = { item ->
                    val name = item.item?.name ?: item.item_name ?: item.item_id
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                buyId = item.id.toString()
                                buyQty = "1"
                                buyItemLabel = "${name} · 数量 ${item.qty} · 单价 ${item.price} 金"
                                showBuyDialog = true
                            }
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(name, fontWeight = FontWeight.SemiBold)
                            Text("数量 ${item.qty}")
                            Text("价格 ${item.price} 金")
                        }
                    }
                }
            )
            PagerControls(info, onPrev = { page -= 1 }, onNext = { page += 1 })
        }
        if (tab == "history") {
            val hist = consignHistory?.items.orEmpty()
            val info = paginate(hist, page, pageSize)
            page = info.page
            TwoColumnGrid(
                items = info.slice,
                render = { item ->
                    val name = item.item?.name ?: item.item_name ?: item.item_id
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(name, fontWeight = FontWeight.SemiBold)
                            Text("成交 ${item.qty} 价格 ${item.price} 金")
                        }
                    }
                }
            )
            PagerControls(info, onPrev = { page -= 1 }, onNext = { page += 1 })
        }
        if (tab == "inventory") {
            val consignable = state?.items
                ?.filter { it.type != "currency" && !it.untradable && !it.unconsignable }
                .orEmpty()
            val filteredInv = filterInventory(consignable, filter)
            val info = paginate(filteredInv, page, pageSize)
            page = info.page
            TwoColumnGrid(
                items = info.slice,
                render = { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                sellName = item.key.ifBlank { item.id }
                                sellQty = item.qty.toString()
                                sellItemLabel = "${item.name} · 数量 ${item.qty}"
                                showSellDialog = true
                            }
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(item.name, fontWeight = FontWeight.SemiBold)
                            Text("数量 ${item.qty}")
                        }
                    }
                }
            )
            PagerControls(info, onPrev = { page -= 1 }, onNext = { page += 1 })
        }
    }
}

@Composable
private fun ShopDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    val shopItems by vm.shopItems.collectAsState()
    var selectedShop by remember { mutableStateOf<ShopItem?>(null) }
    var buyQty by remember { mutableStateOf("1") }
    var sellItem by remember { mutableStateOf<ItemInfo?>(null) }
    var sellQty by remember { mutableStateOf("1") }
    var page by remember { mutableStateOf(0) }
    val pageSize = 9
    var sellPage by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) { vm.requestShop() }
    val pageInfo = paginate(shopItems, page, pageSize)
    page = pageInfo.page

    ScreenScaffold(title = "商店", onBack = onDismiss) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Button(onClick = { vm.requestShop() }) { Text("刷新商品") }
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = { vm.sendCmd("sell_bulk") }) { Text("一键售卖") }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text("商品列表")
        pageInfo.slice.forEach { item ->
            ClickableTextRow(
                text = "${item.name} (${item.price}金)",
                selected = selectedShop?.name == item.name,
                onClick = { selectedShop = item }
            )
        }
        PagerControls(pageInfo, onPrev = { page -= 1 }, onNext = { page += 1 })
        Spacer(modifier = Modifier.height(8.dp))
        Text("购买")
        Text("已选: ${selectedShop?.name ?: "无"}")
        OutlinedTextField(value = buyQty, onValueChange = { buyQty = it }, label = { Text("数量") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        Button(onClick = {
            val qty = buyQty.toIntOrNull() ?: 1
            val name = selectedShop?.name
            if (!name.isNullOrBlank()) vm.sendCmd("buy $name $qty")
        }) { Text("购买") }
        Spacer(modifier = Modifier.height(8.dp))
        Text("出售")
        Text("点击背包物品进行选择")
        val sellables = state?.items?.filter { it.type != "currency" } ?: emptyList()
        val sellPageInfo = paginate(sellables, sellPage, 9)
        sellPage = sellPageInfo.page
        sellPageInfo.slice.forEach { item ->
            ClickableTextRow(
                text = "${item.name} x${item.qty}",
                selected = sellItem?.id == item.id && sellItem?.key == item.key,
                onClick = { sellItem = item }
            )
        }
        PagerControls(sellPageInfo, onPrev = { sellPage -= 1 }, onNext = { sellPage += 1 })
        Text("已选: ${sellItem?.name ?: "无"}")
        OutlinedTextField(value = sellQty, onValueChange = { sellQty = it }, label = { Text("数量") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        Button(onClick = {
            val qty = sellQty.toIntOrNull() ?: 1
            val key = sellItem?.key ?: sellItem?.id
            if (!key.isNullOrBlank()) vm.sendCmd("sell $key $qty")
        }) { Text("出售") }
    }
}

@Composable
private fun ForgeDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    var mainSelection by remember { mutableStateOf("") }
    var secondarySelection by remember { mutableStateOf("") }

    val mainOptions = buildEquippedOptions(state)
    val secondaryOptions = buildForgeSecondaryOptions(state, mainSelection)

    ScreenScaffold(title = "装备合成", onBack = onDismiss) {
        if (secondarySelection.isNotBlank() && secondaryOptions.none { it.first == secondarySelection }) {
            secondarySelection = ""
        }
        Text("主件(已穿戴)")
        if (mainOptions.isEmpty()) {
            Text("暂无已穿戴装备", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            OptionGrid(options = mainOptions, selected = mainSelection, onSelect = { mainSelection = it })
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text("副件(背包匹配)")
        if (mainSelection.isBlank()) {
            Text("请先选择主件", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else if (secondaryOptions.isEmpty()) {
            Text("暂无可用副件", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            OptionGrid(options = secondaryOptions, selected = secondarySelection, onSelect = { secondarySelection = it })
        }
        Button(onClick = {
            if (mainSelection.isNotBlank() && secondarySelection.isNotBlank()) {
                vm.sendCmd("forge ${mainSelection}|${secondarySelection}")
            }
        }) { Text("合成") }
        Text("说明：需要两件相同装备，主件为已穿戴，副件自动匹配背包内符合条件的装备。")
        Text("仅支持传说及以上装备合成，合成后提升元素攻击。")
    }
}

@Composable
private fun RefineDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    var selection by remember { mutableStateOf("") }
    val options = buildEquippedOptions(state)
    val materialOptions = buildRefineMaterialOptions(state)
    val refineConfig = state?.refine_config
    val refineLevel = resolveRefineLevel(state, selection)
    val successRate = if (refineConfig != null && refineLevel != null) {
        calcRefineSuccessRate(refineLevel, refineConfig)
    } else null
    var showConfirm by remember { mutableStateOf(false) }
    ScreenScaffold(title = "装备锻造", onBack = onDismiss) {
        if (showConfirm) {
            AlertDialog(
                onDismissRequest = { showConfirm = false },
                title = { Text("确认锻造") },
                text = {
                    Column {
                        val label = options.firstOrNull { it.first == selection }?.second ?: selection
                        Text("装备: $label")
                        if (refineLevel != null) Text("当前等级: +$refineLevel → +${refineLevel + 1}")
                        if (successRate != null) Text("成功率: ${"%.1f".format(successRate)}%")
                    }
                },
                confirmButton = {
                    Button(onClick = {
                        if (selection.isNotBlank()) vm.sendCmd("refine $selection")
                        showConfirm = false
                    }) { Text("锻造") }
                },
                dismissButton = {
                    TextButton(onClick = { showConfirm = false }) { Text("取消") }
                }
            )
        }

        Text("点击已穿戴装备进行锻造")
        if (options.isEmpty()) {
            Text("暂无已穿戴装备", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            OptionGrid(options = options, selected = selection, onSelect = {
                selection = it
                showConfirm = true
            })
        }
        if (refineLevel != null && refineConfig != null && successRate != null) {
            Text("当前等级: +$refineLevel → +${refineLevel + 1}")
            Text("成功率: ${"%.1f".format(successRate)}%")
            Text("材料需求: ${refineConfig.material_count} 件史诗(不含)以下无特效装备")
        }
        if (materialOptions.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text("副件材料(背包符合)")
            OptionGrid(options = materialOptions, selected = "", onSelect = { })
        }
    }
}

@Composable
private fun EffectDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    var mainSelection by remember { mutableStateOf("") }
    var secondarySelection by remember { mutableStateOf("") }
    val equipOptions = buildEquippedOptions(state)
    val inventoryOptions = buildEffectSecondaryOptions(state, mainSelection)
    val effectConfig = state?.effect_reset_config
    var showConfirm by remember { mutableStateOf(false) }
    ScreenScaffold(title = "特效重置", onBack = onDismiss) {
        if (secondarySelection.isNotBlank() && inventoryOptions.none { it.first == secondarySelection }) {
            secondarySelection = ""
        }
        if (showConfirm) {
            AlertDialog(
                onDismissRequest = { showConfirm = false },
                title = { Text("确认重置") },
                text = {
                    Column {
                        val mainLabel = equipOptions.firstOrNull { it.first == mainSelection }?.second ?: mainSelection
                        val subLabel = inventoryOptions.firstOrNull { it.first == secondarySelection }?.second ?: secondarySelection
                        Text("主件: $mainLabel")
                        Text("副件: $subLabel")
                        if (effectConfig != null) {
                            Text("成功率: ${effectConfig.success_rate}%")
                        }
                    }
                },
                confirmButton = {
                    Button(onClick = {
                        if (mainSelection.isNotBlank() && secondarySelection.isNotBlank()) {
                            vm.sendCmd("effect ${mainSelection} ${secondarySelection}")
                        }
                        showConfirm = false
                    }) { Text("重置") }
                },
                dismissButton = {
                    TextButton(onClick = { showConfirm = false }) { Text("取消") }
                }
            )
        }

        Text("主件(已穿戴)")
        if (equipOptions.isEmpty()) {
            Text("暂无已穿戴装备", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            OptionGrid(options = equipOptions, selected = mainSelection, onSelect = { mainSelection = it })
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text("副件(背包匹配)")
        if (mainSelection.isBlank()) {
            Text("请先选择主件", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else if (inventoryOptions.isEmpty()) {
            Text("暂无可用副件", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            OptionGrid(options = inventoryOptions, selected = secondarySelection, onSelect = {
                secondarySelection = it
                if (mainSelection.isNotBlank()) showConfirm = true
            })
        }
        if (effectConfig != null) {
            Text("成功率: ${effectConfig.success_rate}%")
            Text("多特效概率: 2条${effectConfig.double_rate}% 3条${effectConfig.triple_rate}% 4条${effectConfig.quadruple_rate}% 5条${effectConfig.quintuple_rate}%")
        }
        Text("说明：主件为已穿戴，副件自动匹配背包内符合条件的装备。")
    }
}

@Composable
private fun SabakDialog(vm: GameViewModel, onDismiss: () -> Unit) {
    val info by vm.sabakInfo.collectAsState()
    var gid by remember { mutableStateOf("") }
    LaunchedEffect(Unit) { vm.sabakInfo() }
    ScreenScaffold(title = "沙巴克", onBack = onDismiss) {
        val current = info?.current
        Text("当前城主: ${current?.ownerGuildName ?: "无"}")
        Text("状态: ${if (current?.active == true) "攻城中" else "未开始"}")
        Spacer(modifier = Modifier.height(8.dp))
        Text("报名列表")
        info?.registrations?.forEach { g ->
            val name = g.guildName ?: "未知"
            val id = g.guildId?.toString() ?: "-"
            Text("$id $name")
        }
        if (info?.registrable == true) {
            Text("输入报名行会ID")
            OutlinedTextField(value = gid, onValueChange = { gid = it }, label = { Text("行会ID") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            Button(onClick = {
                val id = gid.toIntOrNull()
                if (id != null) vm.sabakRegisterConfirm(id)
            }) { Text("确认报名") }
        }
    }
}

@Composable
  private fun RepairDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
      fun slotLabel(slot: String): String = when (slot) {
          "weapon" -> "武器"
          "chest" -> "衣服"
          "feet" -> "鞋子"
          "ring_left" -> "左戒指"
          "ring_right" -> "右戒指"
          "head" -> "头盔"
          else -> slot
      }

      ScreenScaffold(title = "修理装备", onBack = onDismiss) {
          Column(
              modifier = Modifier.fillMaxWidth()
          ) {
              Text("当前装备", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
              Spacer(modifier = Modifier.height(8.dp))
              Card(
                  modifier = Modifier.fillMaxWidth(),
                  colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                  elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
              ) {
                  Column(modifier = Modifier.padding(12.dp)) {
                      val list = state?.equipment?.filter { it.item != null } ?: emptyList()
                      if (list.isEmpty()) {
                          Text("暂无可修理装备", color = MaterialTheme.colorScheme.onSurfaceVariant)
                      } else {
                          list.forEachIndexed { index, eq ->
                              val item = eq.item ?: return@forEachIndexed
                              val maxDur = eq.max_durability ?: 0
                              val cur = eq.durability ?: 0
                              val progress = if (maxDur > 0) cur.toFloat() / maxDur.toFloat() else 0f
                              Column(modifier = Modifier.fillMaxWidth()) {
                                  Row(
                                      modifier = Modifier.fillMaxWidth(),
                                      horizontalArrangement = Arrangement.SpaceBetween,
                                      verticalAlignment = Alignment.CenterVertically
                                  ) {
                                      Text(
                                          text = "${slotLabel(eq.slot)}: ${item.name}",
                                          style = MaterialTheme.typography.bodyMedium,
                                          fontWeight = FontWeight.Medium
                                      )
                                      Text(
                                          text = "${cur}/${maxDur}",
                                          style = MaterialTheme.typography.bodySmall,
                                          color = MaterialTheme.colorScheme.onSurfaceVariant
                                      )
                                  }
                                  Spacer(modifier = Modifier.height(6.dp))
                                  LinearProgressIndicator(
                                      progress = progress.coerceIn(0f, 1f),
                                      modifier = Modifier
                                          .fillMaxWidth()
                                          .height(6.dp)
                                          .clip(RoundedCornerShape(3.dp)),
                                      color = if (progress < 0.4f) Color(0xFFE57373) else Color(0xFF81C784),
                                      trackColor = MaterialTheme.colorScheme.surfaceVariant
                                  )
                              }
                              if (index != list.lastIndex) {
                                  Spacer(modifier = Modifier.height(10.dp))
                              }
                          }
                      }
                  }
              }
              Spacer(modifier = Modifier.height(12.dp))
              Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.spacedBy(12.dp)
              ) {
                  Button(
                      modifier = Modifier.weight(1f),
                      onClick = { vm.sendCmd("repair list") }
                  ) { Text("查看费用") }
                  Button(
                      modifier = Modifier.weight(1f),
                      onClick = { vm.sendCmd("repair all") }
                  ) { Text("修理全部") }
              }
          }
      }
  }

  @Composable
  private fun StatBar(label: String, value: Int, maxValue: Int, color: Color) {
      val progress = if (maxValue > 0) value.toFloat() / maxValue.toFloat() else 0f
      Column(modifier = Modifier.fillMaxWidth()) {
          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
              Text(label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
              Text("$value/$maxValue", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
          }
          Spacer(modifier = Modifier.height(4.dp))
          LinearProgressIndicator(
              progress = progress.coerceIn(0f, 1f),
              modifier = Modifier
                  .fillMaxWidth()
                  .height(6.dp)
                  .clip(RoundedCornerShape(3.dp)),
              color = color,
              trackColor = MaterialTheme.colorScheme.surface
          )
      }
  }

  @Composable
  private fun StatTile(label: String, value: String, iconRes: Int, tint: Color) {
      Surface(
          modifier = Modifier
              .weight(1f)
              .height(66.dp),
          shape = RoundedCornerShape(10.dp),
          color = MaterialTheme.colorScheme.surfaceVariant,
          border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
      ) {
          Row(
              modifier = Modifier.fillMaxSize().padding(horizontal = 10.dp),
              verticalAlignment = Alignment.CenterVertically
          ) {
              Surface(
                  shape = RoundedCornerShape(8.dp),
                  color = tint.copy(alpha = 0.15f)
              ) {
                  Image(
                      painter = painterResource(iconRes),
                      contentDescription = label,
                      modifier = Modifier.padding(6.dp).size(18.dp)
                  )
              }
              Spacer(modifier = Modifier.width(8.dp))
              Column {
                  Text(label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                  Text(value, fontWeight = FontWeight.SemiBold)
              }
          }
      }
  }

@Composable
private fun ChangeClassDialog(vm: GameViewModel, onDismiss: () -> Unit) {
    var selected by remember { mutableStateOf("warrior") }
    ScreenScaffold(title = "转职", onBack = onDismiss) {
        Text("转职需要 100万金币 + 转职令牌")
        Spacer(modifier = Modifier.height(8.dp))
        Text("选择职业")
        Spacer(modifier = Modifier.height(6.dp))
        val options = listOf(
            "warrior" to "战士",
            "mage" to "法师",
            "taoist" to "道士"
        )
        options.chunked(3).forEach { rowItems ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                rowItems.forEach { (id, label) ->
                    val isSelected = selected == id
                    val border = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
                    val bg = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .clickable { selected = id },
                        shape = RoundedCornerShape(12.dp),
                        color = bg,
                        border = BorderStroke(1.dp, border)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(label, fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal)
                        }
                    }
                }
                if (rowItems.size == 1) Spacer(modifier = Modifier.weight(2f))
                if (rowItems.size == 2) Spacer(modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(8.dp))
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = {
            vm.sendCmd("changeclass $selected")
            onDismiss()
        }) { Text("确认转职") }
    }
}

@Composable
private fun TrainingDialog(vm: GameViewModel, onDismiss: () -> Unit) {
    var stat by remember { mutableStateOf("攻击") }
    var count by remember { mutableStateOf("1") }
    var showConfirm by remember { mutableStateOf(false) }
    ScreenScaffold(title = "修炼", onBack = onDismiss) {
        if (showConfirm) {
            AlertDialog(
                onDismissRequest = { showConfirm = false },
                title = { Text("确认修炼") },
                text = {
                    Column {
                        Text("属性: $stat")
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = count,
                            onValueChange = { count = it },
                            label = { Text("次数") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                    }
                },
                confirmButton = {
                    Button(onClick = {
                        val times = count.toIntOrNull() ?: 1
                        vm.sendCmd("train $stat $times")
                        showConfirm = false
                        onDismiss()
                    }) { Text("修炼") }
                },
                dismissButton = {
                    TextButton(onClick = { showConfirm = false }) { Text("取消") }
                }
            )
        }
        Text("可修炼属性")
        Spacer(modifier = Modifier.height(6.dp))
        val options = listOf("生命", "魔法值", "攻击", "防御", "魔法", "魔御", "道术", "敏捷")
        options.chunked(3).forEach { rowItems ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                rowItems.forEach { label ->
                    val isSelected = stat == label
                    val border = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
                    val bg = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .clickable {
                                stat = label
                                showConfirm = true
                            },
                        shape = RoundedCornerShape(12.dp),
                        color = bg,
                        border = BorderStroke(1.dp, border)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(label, fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal, fontSize = 13.sp)
                        }
                    }
                }
                if (rowItems.size == 1) Spacer(modifier = Modifier.weight(2f))
                if (rowItems.size == 2) Spacer(modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun RankDialog(state: GameState?, vm: GameViewModel, onDismiss: () -> Unit) {
    val rankMessages by vm.rankMessages.collectAsState()
    var lastClass by rememberSaveable { mutableStateOf("warrior") }
    ScreenScaffold(title = "排行榜", onBack = onDismiss) {
        LaunchedEffect(Unit) {
            vm.sendCmd("rank $lastClass")
        }
        Text("世界BOSS排行")
        if (state?.worldBossRank.isNullOrEmpty()) {
            Text("暂无数据")
        } else {
            state?.worldBossRank?.forEachIndexed { idx, item ->
                Text("${idx + 1}. ${item.name} (${item.value})")
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text("职业排行榜")
        val tabItems = listOf("warrior" to "战士", "mage" to "法师", "taoist" to "道士")
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            tabItems.forEach { (id, label) ->
                val selected = lastClass == id
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                    border = BorderStroke(
                        1.dp,
                        if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
                        else MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
                    )
                ) {
                    Box(
                        modifier = Modifier
                            .clickable {
                                lastClass = id
                                vm.sendCmd("rank $id")
                            }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
            Surface(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
            ) {
                Box(
                    modifier = Modifier
                        .clickable { vm.sendCmd("rank $lastClass") }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("刷新")
                }
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        if (rankMessages.isEmpty()) {
            Text("点击上方按钮获取排行榜")
        } else {
            val grouped = rankMessages.mapNotNull { line ->
                val idx = line.indexOf("排行榜:")
                if (idx <= 0) null else line.substring(0, idx) to line.substring(idx + 4).trim()
            }.groupBy({ it.first }, { it.second })

            val title = when (lastClass) {
                "warrior" -> "战士"
                "mage" -> "法师"
                "taoist" -> "道士"
                else -> lastClass
            }
            val lines = grouped[title].orEmpty()
            Surface(
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("$title 排行榜", fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(8.dp))
                    if (lines.isEmpty()) {
                        Text("暂无数据", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        lines.joinToString(" ").split(Regex("\\s+"))
                            .filter { it.isNotBlank() }
                            .forEachIndexed { idx, entry ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("${idx + 1}. $entry")
                                }
                            }
                    }
                }
            }
        }
    }
}

@Composable
private fun AfkDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    val skills = state?.skills.orEmpty()
    val selected = remember { mutableStateListOf<String>() }
    ScreenScaffold(title = "挂机技能", onBack = onDismiss) {
        skills.forEach { skill ->
            val checked = selected.contains(skill.id)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth().clickable {
                    if (checked) selected.remove(skill.id) else selected.add(skill.id)
                }
            ) {
                Checkbox(checked = checked, onCheckedChange = {
                    if (it) selected.add(skill.id) else selected.remove(skill.id)
                })
                Text("${skill.name} (${skill.id})")
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row {
            Button(onClick = { vm.sendCmd("autoskill all") }) { Text("全选") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(onClick = { vm.sendCmd("autoskill off"); onDismiss() }) { Text("停止") }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = {
            if (selected.isEmpty()) {
                vm.sendCmd("autoskill off")
            } else {
                vm.sendCmd("autoskill set ${selected.joinToString(",")}")
            }
            onDismiss()
        }) { Text("保存") }
    }
}

@Composable
private fun DropsDialog(onDismiss: () -> Unit) {
    var selected by remember { mutableStateOf(DropsData.sets.first().id) }
    val setIndex = DropsData.sets.indexOfFirst { it.id == selected }.coerceAtLeast(0)
    val set = DropsData.sets[setIndex]
    ScreenScaffold(title = "套装掉落", onBack = onDismiss, scrollable = false) {
        TabRow(selectedTabIndex = setIndex) {
            DropsData.sets.forEachIndexed { index, entry ->
                Tab(
                    selected = index == setIndex,
                    onClick = { selected = entry.id },
                    text = { Text(entry.name) }
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = PaddingValues(6.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(set.items) { item ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text(item.name, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.height(4.dp))
                        item.drops.forEach { drop ->
                            Text("${drop.mob}: ${drop.chance}")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DropdownField(label: String, options: List<Pair<String, String>>, selected: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val display = options.firstOrNull { it.first == selected }?.second ?: selected.ifBlank { "请选择" }
    Column {
        Text(label)
        OutlinedButton(onClick = { expanded = true }) { Text(display) }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { option ->
                DropdownMenuItem(text = { Text(option.second) }, onClick = {
                    onSelect(option.first)
                    expanded = false
                })
            }
        }
    }
}

private fun buildInventoryOptions(state: GameState?): List<Pair<String, String>> {
    val items = state?.items.orEmpty()
    return items.map { item ->
        val key = if (item.key.isNotBlank()) item.key else item.id
        key to "${item.name} x${item.qty}"
    }
}

private fun buildEquippedOptions(state: GameState?): List<Pair<String, String>> {
    val list = state?.equipment.orEmpty()
    return list.mapNotNull { eq ->
        val item = eq.item ?: return@mapNotNull null
        val label = "${equipSlotLabel(eq.slot)}: ${item.name}"
        "equip:${eq.slot}" to label
    }
}

private fun equipSlotLabel(slot: String): String = when (slot) {
    "weapon" -> "武器"
    "chest" -> "衣服"
    "feet" -> "鞋子"
    "ring_left" -> "左戒指"
    "ring_right" -> "右戒指"
    "head" -> "头盔"
    else -> slot
}

private fun buildRefineMaterialOptions(state: GameState?): List<Pair<String, String>> {
    val items = state?.items.orEmpty()
    return items.filter { item ->
        val isEquip = !item.slot.isNullOrBlank() || item.type == "weapon" || item.type == "armor" || item.type == "accessory"
        val rarityOk = isBelowEpicRarity(item.rarity)
        val noEffects = !hasSpecialEffects(item.effects)
        val notShop = item.is_shop_item != true
        isEquip && rarityOk && noEffects && notShop && item.qty > 0
    }.map { item ->
        val key = if (item.key.isNotBlank()) item.key else item.id
        key to "${item.name} x${item.qty}"
    }
}

private fun isBelowEpicRarity(rarity: String?): Boolean {
    val rank = rarityRank(rarity)
    return rank in 1..2
}

private fun hasSpecialEffects(effects: JsonObject?): Boolean {
    return effects != null && effects.isNotEmpty()
}

private fun buildForgeMainOptions(state: GameState?): List<Pair<String, String>> {
    val options = mutableListOf<Pair<String, String>>()
    options.addAll(buildEquippedOptions(state))
    options.addAll(buildInventoryOptions(state))
    return options
}

private fun buildEffectSecondaryOptions(state: GameState?, mainSelection: String): List<Pair<String, String>> {
    if (state == null || mainSelection.isBlank() || !mainSelection.startsWith("equip:")) return emptyList()
    val slot = mainSelection.removePrefix("equip:").trim()
    val mainEq = state.equipment.firstOrNull { it.slot == slot } ?: return emptyList()
    val mainId = mainEq.item?.id ?: return emptyList()
    return state.items.orEmpty()
        .filter { it.id == mainId || it.key == mainId }
        .map { item ->
            val key = if (item.key.isNotBlank()) item.key else item.id
            key to "${item.name} x${item.qty}"
        }
}

private fun buildForgeSecondaryOptions(state: GameState?, mainSelection: String): List<Pair<String, String>> {
    if (state == null || mainSelection.isBlank() || !mainSelection.startsWith("equip:")) return emptyList()
    val slot = mainSelection.removePrefix("equip:").trim()
    val mainEq = state.equipment.firstOrNull { it.slot == slot } ?: return emptyList()
    val mainId = mainEq.item?.id ?: return emptyList()
    return state.items.orEmpty()
        .filter { it.id == mainId || it.key == mainId }
        .map { item ->
            val key = if (item.key.isNotBlank()) item.key else item.id
            key to "${item.name} x${item.qty}"
        }
}

private fun resolveRefineLevel(state: GameState?, selection: String): Int? {
    if (selection.isBlank() || state == null) return null
    if (selection.startsWith("equip:")) {
        val slot = selection.removePrefix("equip:").trim()
        val eq = state.equipment.firstOrNull { it.slot == slot }
        return eq?.refine_level ?: 0
    }
    val key = selection.trim()
    val item = state.items.firstOrNull { it.key == key || it.id == key }
    return item?.refine_level ?: 0
}

private fun calcRefineSuccessRate(currentLevel: Int, config: RefineConfig): Double {
    val nextLevel = currentLevel + 1
    if (nextLevel == 1) return 100.0
    val tier = kotlin.math.floor((nextLevel - 2) / 10.0).toInt()
    val rate = config.base_success_rate - tier * config.decay_rate
    return kotlin.math.max(1.0, rate)
}

private data class PageInfo<T>(val slice: List<T>, val page: Int, val totalPages: Int)

private fun <T> paginate(items: List<T>, page: Int, pageSize: Int): PageInfo<T> {
    val totalPages = kotlin.math.max(1, kotlin.math.ceil(items.size / pageSize.toDouble()).toInt())
    val safePage = page.coerceIn(0, totalPages - 1)
    val start = safePage * pageSize
    val slice = items.drop(start).take(pageSize)
    return PageInfo(slice, safePage, totalPages)
}

@Composable
private fun PagerControls(info: PageInfo<*>, onPrev: () -> Unit, onNext: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        OutlinedButton(onClick = onPrev, enabled = info.page > 0) { Text("上一页") }
        Spacer(modifier = Modifier.width(12.dp))
        Text("第 ${info.page + 1}/${info.totalPages} 页")
        Spacer(modifier = Modifier.width(12.dp))
        OutlinedButton(onClick = onNext, enabled = info.page < info.totalPages - 1) { Text("下一页") }
    }
}

@Composable
private fun FilterChip(label: String, active: Boolean, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = if (active) ButtonDefaults.buttonColors(containerColor = Color(0xFF1B3A57)) else ButtonDefaults.buttonColors()
    ) {
        Text(label)
    }
    Spacer(modifier = Modifier.width(4.dp))
}

private fun filterConsign(items: List<ConsignItem>, filter: String): List<ConsignItem> {
    if (filter == "all") return items
    return items.filter { entry ->
        val item = entry.item ?: return@filter false
        when (filter) {
            "accessory" -> isAccessory(item)
            else -> item.type == filter
        }
    }
}

private fun isAccessory(item: ItemInfo): Boolean {
    val slots = setOf("ring", "ring_left", "ring_right", "bracelet", "bracelet_left", "bracelet_right", "neck")
    return item.type == "accessory" || (item.slot != null && slots.contains(item.slot))
}

private fun filterInventory(items: List<ItemInfo>, filter: String): List<ItemInfo> {
    if (filter == "all") return items
    return items.filter { item ->
        when (filter) {
            "accessory" -> isAccessory(item)
            else -> item.type == filter
        }
    }
}

@Composable
private fun <T> TwoColumnGrid(items: List<T>, render: @Composable (T) -> Unit) {
    items.chunked(2).forEach { row ->
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            row.forEach { entry ->
                Box(modifier = Modifier.weight(1f)) {
                    render(entry)
                }
            }
            if (row.size == 1) {
                Box(modifier = Modifier.weight(1f)) { }
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@Composable
private fun PromptDialog(title: String, label: String, onConfirm: (String) -> Unit, onDismiss: () -> Unit) {
    var value by remember { mutableStateOf("") }
    ScreenScaffold(title = title, onBack = onDismiss) {
        OutlinedTextField(value = value, onValueChange = { value = it }, label = { Text(label) })
        Spacer(modifier = Modifier.height(8.dp))
        Row {
            Button(onClick = { onConfirm(value) }) { Text("确认") }
            Spacer(modifier = Modifier.width(8.dp))
            OutlinedButton(onClick = onDismiss) { Text("取消") }
        }
    }
}

@Composable
private fun <T> FlowRow(
    items: List<Pair<String, T>>,
    onClick: (T) -> Unit,
    selectedLabel: String? = null
) {
    if (items.isEmpty()) {
        Text("暂无")
        return
    }
    Column {
        items.chunked(3).forEach { rowItems ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                rowItems.forEach { entry ->
                    val label = entry.first
                    val isSelected = selectedLabel != null && selectedLabel == label
                    Button(
                        onClick = { onClick(entry.second) },
                        colors = if (isSelected) ButtonDefaults.buttonColors(containerColor = Color(0xFF1B3A57)) else ButtonDefaults.buttonColors()
                    ) { Text(label) }
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
        }
    }
}
