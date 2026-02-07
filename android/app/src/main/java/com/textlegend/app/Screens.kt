package com.textlegend.app

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.delay
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.Image

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

    var tabIndex by remember { mutableStateOf(0) }
    var chatInput by remember { mutableStateOf("") }
    var selectedMob by remember { mutableStateOf<MobInfo?>(null) }

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
                    onClick = { tabIndex = 0 },
                    label = { Text("战斗") },
                    icon = { Image(painter = painterResource(R.drawable.ic_battle), contentDescription = "战斗", modifier = Modifier.size(18.dp)) }
                )
                NavigationBarItem(
                    selected = tabIndex == 1,
                    onClick = { tabIndex = 1 },
                    label = { Text("背包") },
                    icon = { Image(painter = painterResource(R.drawable.ic_bag), contentDescription = "背包", modifier = Modifier.size(18.dp)) }
                )
                NavigationBarItem(
                    selected = tabIndex == 2,
                    onClick = { tabIndex = 2 },
                    label = { Text("聊天") },
                    icon = { Image(painter = painterResource(R.drawable.ic_chat), contentDescription = "聊天", modifier = Modifier.size(18.dp)) }
                )
                NavigationBarItem(
                    selected = tabIndex == 3,
                    onClick = { tabIndex = 3 },
                    label = { Text("功能") },
                    icon = { Image(painter = painterResource(R.drawable.ic_menu), contentDescription = "功能", modifier = Modifier.size(18.dp)) }
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
                        2 -> ChatTab(outputs = outputs, input = chatInput, onInputChange = { chatInput = it }, onSend = {
                            val msg = chatInput.trim()
                            if (msg.isNotEmpty()) {
                                vm.sendCmd("say $msg")
                                chatInput = ""
                            }
                        })
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
            composable("party") { PartyDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
            composable("guild") { GuildDialog(vm = vm, onDismiss = { innerNav.popBackStack() }) }
            composable("mail") { MailDialog(vm = vm, onDismiss = { innerNav.popBackStack() }) }
            composable("trade") { TradeDialog(vm = vm, state = state, onDismiss = { innerNav.popBackStack() }) }
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
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = player?.name ?: "未连接", style = MaterialTheme.typography.titleMedium)
            Text(text = "${classLabel(player?.classId ?: "")} Lv${player?.level ?: 0} | 金币 ${stats?.gold ?: 0}")
            Spacer(modifier = Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = if (stats != null && stats.maxHp > 0) stats.hp.toFloat() / stats.maxHp else 0f,
                modifier = Modifier.fillMaxWidth().height(8.dp),
                color = Color(0xFFE06B6B),
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
            Text(text = "HP ${stats?.hp ?: 0}/${stats?.maxHp ?: 0}")
            Spacer(modifier = Modifier.height(4.dp))
            LinearProgressIndicator(
                progress = if (stats != null && stats.maxMp > 0) stats.mp.toFloat() / stats.maxMp else 0f,
                modifier = Modifier.fillMaxWidth().height(8.dp),
                color = Color(0xFF6CA8E0),
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
            Text(text = "MP ${stats?.mp ?: 0}/${stats?.maxMp ?: 0}")
            Spacer(modifier = Modifier.height(4.dp))
            LinearProgressIndicator(
                progress = if (stats != null && stats.expNext > 0) stats.exp.toFloat() / stats.expNext else 0f,
                modifier = Modifier.fillMaxWidth().height(8.dp),
                color = Color(0xFFE0B25C),
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
            Text(text = "EXP ${stats?.exp ?: 0}/${stats?.expNext ?: 0}")
            if (state?.room != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = "${state.room.zone} - ${state.room.name}")
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
    val scrollState: ScrollState = rememberScrollState()
    Column(modifier = Modifier.fillMaxSize().verticalScroll(scrollState)) {
        Text(text = "方向", style = MaterialTheme.typography.titleSmall)
        FlowRow(items = state?.exits?.map { it.label to it.dir }.orEmpty(), onClick = { dir -> onGo(dir) })
        Spacer(modifier = Modifier.height(8.dp))

        Text(text = "怪物", style = MaterialTheme.typography.titleSmall)
        FlowRow(items = state?.mobs?.map { it.name to it }.orEmpty(), onClick = { mob -> onSelectMob(mob) }, selectedLabel = selectedMob?.name)
        Spacer(modifier = Modifier.height(8.dp))

        if (selectedMob != null) {
            Button(onClick = { onAttack(selectedMob.name) }) { Text("攻击 ${selectedMob.name}") }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "技能", style = MaterialTheme.typography.titleSmall)
        FlowRow(items = state?.skills?.map { it.name to it }.orEmpty(), onClick = { skill -> onCast(skill, selectedMob) })
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "玩家", style = MaterialTheme.typography.titleSmall)
        FlowRow(items = state?.players?.map { it.name to it }.orEmpty(), onClick = { player -> onAttack(player.name) })
    }
}

@Composable
private fun InventoryTab(state: GameState?, onUse: (ItemInfo) -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        item {
            Text(text = "装备", style = MaterialTheme.typography.titleSmall)
        }
        items(state?.equipment.orEmpty()) { eq ->
            val item = eq.item
            if (item != null) {
                ListItem(headlineContent = { Text("${eq.slot}: ${item.name}") }, supportingContent = { Text("耐久 ${eq.durability ?: 0}/${eq.max_durability ?: 0}") })
            }
        }
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = "背包", style = MaterialTheme.typography.titleSmall)
        }
        items(state?.items.orEmpty()) { item ->
            ListItem(
                headlineContent = { Text("${item.name} x${item.qty}") },
                supportingContent = { Text(item.type) },
                modifier = Modifier.clickable { onUse(item) }
            )
        }
    }
}

@Composable
private fun ChatTab(outputs: List<OutputPayload>, input: String, onInputChange: (String) -> Unit, onSend: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize()) {
        LazyColumn(modifier = Modifier.weight(1f), reverseLayout = true) {
            items(outputs) { line ->
                Text(text = line.text ?: "")
                Divider()
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row {
            OutlinedTextField(value = input, onValueChange = onInputChange, modifier = Modifier.weight(1f))
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = onSend) { Text("发送") }
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
        if (state?.stats?.autoSkillId != null)
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
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = { TextButton(onClick = onBack) { Text("返回") } }
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
                        .height(58.dp)
                        .clickable { onClick(entry.action) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Image(
                            painter = painterResource(id = entry.iconRes),
                            contentDescription = entry.label,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(entry.label, fontWeight = FontWeight.SemiBold)
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
        Text("${player?.name} Lv${player?.level}")
        if (stats != null) {
            Text("攻击 ${stats.atk} 防御 ${stats.def}")
            Text("魔法 ${stats.mag} 道术 ${stats.spirit}")
            Text("魔防 ${stats.mdef} 闪避 ${stats.dodge}%")
            Text("PK ${stats.pk} VIP ${if (stats.vip) "是" else "否"}")
        }
    }
}

@Composable
private fun PartyDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    var inviteName by remember { mutableStateOf("") }
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
private fun GuildDialog(vm: GameViewModel, onDismiss: () -> Unit) {
    val members by vm.guildMembers.collectAsState()
    val guildList by vm.guildList.collectAsState()
    var guildId by remember { mutableStateOf("") }
    var inviteName by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        vm.guildMembers()
        vm.guildList()
    }

    ScreenScaffold(title = "行会", onBack = onDismiss) {
        Text("成员")
        if (members?.ok == true) {
            members?.members?.forEach { member ->
                Text("${member.name} ${member.role} ${if (member.online) "在线" else "离线"}")
            }
        } else {
            Text("未加入行会")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text("行会列表")
        guildList?.guilds?.forEach { g ->
            Text("${g.id}: ${g.name} (${g.memberCount})")
        }
        OutlinedTextField(
            value = guildId,
            onValueChange = { guildId = it },
            label = { Text("申请行会ID") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )
        Button(onClick = {
            val id = guildId.toIntOrNull()
            if (id != null) vm.guildApply(id)
        }) { Text("申请加入") }

        OutlinedTextField(value = inviteName, onValueChange = { inviteName = it }, label = { Text("邀请玩家") })
        Button(onClick = { if (inviteName.isNotBlank()) vm.sendCmd("guild invite ${inviteName.trim()}") }) { Text("邀请") }
    }
}

@Composable
private fun MailDialog(vm: GameViewModel, onDismiss: () -> Unit) {
    val mailList by vm.mailList.collectAsState()
    var toName by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var itemKey by remember { mutableStateOf("") }
    var itemQty by remember { mutableStateOf("1") }
    var gold by remember { mutableStateOf("0") }

    LaunchedEffect(Unit) {
        vm.mailListInbox()
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
        OutlinedTextField(value = itemKey, onValueChange = { itemKey = it }, label = { Text("附件Key(可选)") })
        OutlinedTextField(value = itemQty, onValueChange = { itemQty = it }, label = { Text("附件数量") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        OutlinedTextField(value = gold, onValueChange = { gold = it }, label = { Text("金币") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        Button(onClick = {
            val items = if (itemKey.isNotBlank()) listOf(itemKey to (itemQty.toIntOrNull() ?: 1)) else emptyList()
            vm.mailSend(toName, title, body, items, gold.toIntOrNull() ?: 0)
        }) { Text("发送") }
    }
}

@Composable
private fun TradeDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    var targetName by remember { mutableStateOf("") }
    var itemName by remember { mutableStateOf("") }
    var itemQty by remember { mutableStateOf("1") }
    var gold by remember { mutableStateOf("0") }
    var search by remember { mutableStateOf("") }
    var page by remember { mutableStateOf(0) }
    val pageSize = 9
    val inventory = state?.items.orEmpty().filter { it.type != "currency" }
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
    var tab by remember { mutableStateOf("market") }
    var filter by remember { mutableStateOf("all") }
    var page by remember { mutableStateOf(0) }
    val pageSize = 9

    ScreenScaffold(title = "寄售", onBack = onDismiss) {
        Row {
            Button(onClick = { tab = "market"; page = 0; vm.sendCmd("consign list") }) { Text("市场") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(onClick = { tab = "mine"; page = 0; vm.sendCmd("consign my") }) { Text("我的寄售") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(onClick = { tab = "inventory"; page = 0 }) { Text("背包") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(onClick = { tab = "history"; page = 0; vm.sendCmd("consign history") }) { Text("历史") }
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
                            .clickable { buyId = item.id.toString() }
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
                            .clickable { buyId = item.id.toString() }
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
            val equipItems = state?.items?.filter { it.type in listOf("weapon", "armor", "accessory", "book") }.orEmpty()
            val filteredInv = filterInventory(equipItems, filter)
            val info = paginate(filteredInv, page, pageSize)
            page = info.page
            TwoColumnGrid(
                items = info.slice,
                render = { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { sellName = item.key.ifBlank { item.id } }
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
        Spacer(modifier = Modifier.height(8.dp))
        Text("上架物品")
        OutlinedTextField(value = sellName, onValueChange = { sellName = it }, label = { Text("物品名或Key") })
        OutlinedTextField(value = sellQty, onValueChange = { sellQty = it }, label = { Text("数量") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        OutlinedTextField(value = sellPrice, onValueChange = { sellPrice = it }, label = { Text("单价") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        Button(onClick = {
            val qty = sellQty.toIntOrNull() ?: 1
            val price = sellPrice.toIntOrNull() ?: 1
            if (sellName.isNotBlank()) vm.sendCmd("consign sell ${sellName.trim()} $qty $price")
        }) { Text("上架") }
        Spacer(modifier = Modifier.height(8.dp))
        Text("购买/下架")
        OutlinedTextField(value = buyId, onValueChange = { buyId = it }, label = { Text("寄售ID") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        OutlinedTextField(value = buyQty, onValueChange = { buyQty = it }, label = { Text("数量") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        Row {
            Button(onClick = {
                val id = buyId.toIntOrNull()
                val qty = buyQty.toIntOrNull() ?: 1
                if (id != null) vm.sendCmd("consign buy $id $qty")
            }) { Text("购买") }
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = {
                val id = buyId.toIntOrNull()
                if (id != null) vm.sendCmd("consign cancel $id")
            }) { Text("下架") }
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
            Text(
                text = "${item.name} (${item.price}金)",
                modifier = Modifier.clickable { selectedShop = item }
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
            Text(
                text = "${item.name} x${item.qty}",
                modifier = Modifier.clickable { sellItem = item }
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

    val mainOptions = buildForgeMainOptions(state)
    val secondaryOptions = buildInventoryOptions(state)

    ScreenScaffold(title = "装备合成", onBack = onDismiss) {
        DropdownField(label = "主件(可选已穿戴)", options = mainOptions, selected = mainSelection, onSelect = { mainSelection = it })
        DropdownField(label = "副件(背包)", options = secondaryOptions, selected = secondarySelection, onSelect = { secondarySelection = it })
        Button(onClick = {
            if (mainSelection.isNotBlank() && secondarySelection.isNotBlank()) {
                vm.sendCmd("forge ${mainSelection}|${secondarySelection}")
            }
        }) { Text("合成") }
        Text("说明: 需要两件相同装备，主件可用 equip:slot 或背包物品，副件必须为背包物品。")
        Text("仅支持传说及以上装备合成，合成后提升元素攻击。")
    }
}

@Composable
private fun RefineDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    var selection by remember { mutableStateOf("") }
    val options = buildForgeMainOptions(state)
    val refineConfig = state?.refine_config
    val refineLevel = resolveRefineLevel(state, selection)
    val successRate = if (refineConfig != null && refineLevel != null) {
        calcRefineSuccessRate(refineLevel, refineConfig)
    } else null
    ScreenScaffold(title = "装备锻造", onBack = onDismiss) {
        DropdownField(label = "锻造装备", options = options, selected = selection, onSelect = { selection = it })
        if (refineLevel != null && refineConfig != null && successRate != null) {
            Text("当前等级: +$refineLevel → +${refineLevel + 1}")
            Text("成功率: ${"%.1f".format(successRate)}%")
            Text("材料需求: ${refineConfig.material_count} 件史诗(不含)以下无特效装备")
        }
        Button(onClick = { if (selection.isNotBlank()) vm.sendCmd("refine $selection") }) { Text("锻造") }
    }
}

@Composable
private fun EffectDialog(vm: GameViewModel, state: GameState?, onDismiss: () -> Unit) {
    var mainSelection by remember { mutableStateOf("") }
    var secondarySelection by remember { mutableStateOf("") }
    val equipOptions = buildEquippedOptions(state)
    val inventoryOptions = buildInventoryOptions(state)
    val effectConfig = state?.effect_reset_config
    ScreenScaffold(title = "特效重置", onBack = onDismiss) {
        DropdownField(label = "主件(已穿戴)", options = equipOptions, selected = mainSelection, onSelect = { mainSelection = it })
        DropdownField(label = "副件(背包)", options = inventoryOptions, selected = secondarySelection, onSelect = { secondarySelection = it })
        if (effectConfig != null) {
            Text("成功率: ${effectConfig.success_rate}%")
            Text("多特效概率: 2条${effectConfig.double_rate}% 3条${effectConfig.triple_rate}% 4条${effectConfig.quadruple_rate}% 5条${effectConfig.quintuple_rate}%")
        }
        Button(onClick = {
            if (mainSelection.isNotBlank() && secondarySelection.isNotBlank()) {
                vm.sendCmd("effect ${mainSelection} ${secondarySelection}")
            }
        }) { Text("重置") }
        Text("说明: 主件必须是 equip:slot，副件为背包物品。")
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
            Text("${g.guildId} ${g.guildName}")
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
    ScreenScaffold(title = "修理装备", onBack = onDismiss) {
        Text("当前装备")
        state?.equipment?.forEach { eq ->
            val item = eq.item
            if (item != null) {
                Text("${eq.slot}: ${item.name} (${eq.durability ?: 0}/${eq.max_durability ?: 0})")
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row {
            Button(onClick = { vm.sendCmd("repair list") }) { Text("查看费用") }
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = { vm.sendCmd("repair") }) { Text("修理全部") }
        }
    }
}

@Composable
private fun ChangeClassDialog(vm: GameViewModel, onDismiss: () -> Unit) {
    var selected by remember { mutableStateOf("warrior") }
    ScreenScaffold(title = "转职", onBack = onDismiss) {
        Text("转职需要 100万金币 + 转职令牌")
        Spacer(modifier = Modifier.height(8.dp))
        DropdownField(
            label = "选择职业",
            options = listOf(
                "warrior" to "战士",
                "mage" to "法师",
                "taoist" to "道士"
            ),
            selected = selected,
            onSelect = { selected = it }
        )
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
    ScreenScaffold(title = "修炼", onBack = onDismiss) {
        DropdownField(
            label = "属性",
            options = listOf(
                "生命" to "生命",
                "魔法值" to "魔法值",
                "攻击" to "攻击",
                "防御" to "防御",
                "魔法" to "魔法",
                "魔御" to "魔御",
                "道术" to "道术",
                "敏捷" to "敏捷"
            ),
            selected = stat,
            onSelect = { stat = it }
        )
        OutlinedTextField(
            value = count,
            onValueChange = { count = it },
            label = { Text("次数") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )
        Button(onClick = {
            val times = count.toIntOrNull() ?: 1
            vm.sendCmd("train $stat $times")
            onDismiss()
        }) { Text("修炼") }
    }
}

@Composable
private fun RankDialog(state: GameState?, vm: GameViewModel, onDismiss: () -> Unit) {
    ScreenScaffold(title = "排行榜", onBack = onDismiss) {
        Text("世界BOSS排行")
        state?.worldBossRank?.forEachIndexed { idx, item ->
            Text("${idx + 1}. ${item.name} (${item.value})")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text("职业排行榜")
        Row {
            Button(onClick = { vm.sendCmd("rank warrior") }) { Text("战士") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(onClick = { vm.sendCmd("rank mage") }) { Text("法师") }
            Spacer(modifier = Modifier.width(6.dp))
            Button(onClick = { vm.sendCmd("rank taoist") }) { Text("道士") }
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
    return list.map { eq ->
        val name = eq.item?.name ?: eq.slot
        "equip:${eq.slot}" to "${eq.slot}: $name"
    }
}

private fun buildForgeMainOptions(state: GameState?): List<Pair<String, String>> {
    val options = mutableListOf<Pair<String, String>>()
    options.addAll(buildEquippedOptions(state))
    options.addAll(buildInventoryOptions(state))
    return options
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
    Row(verticalAlignment = Alignment.CenterVertically) {
        TextButton(onClick = onPrev, enabled = info.page > 0) { Text("上一页") }
        Text("第 ${info.page + 1}/${info.totalPages} 页")
        TextButton(onClick = onNext, enabled = info.page < info.totalPages - 1) { Text("下一页") }
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
