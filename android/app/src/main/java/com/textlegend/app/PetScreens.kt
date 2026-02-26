package com.textlegend.app

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogProperties
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

// 宠物主对话框
@Composable
fun PetDialog(
    vm: GameViewModel,
    state: GameState?,
    onDismiss: () -> Unit
) {
    val petState = state?.pet
    val pets = petState?.pets ?: emptyList()
    val activePetId = petState?.activePetId
    val activePet = pets.find { it.id == activePetId }
    val books = normalizePetBooksMap(petState?.books)

    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("我的宠物", "技能书库")

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // 标题和返回按钮
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onDismiss) {
                Text("←", fontSize = 24.sp)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "宠物系统",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Tab选择
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            tabs.forEachIndexed { index, tab ->
                Button(
                    onClick = { selectedTab = index },
                    modifier = Modifier.weight(1f),
                    colors = if (selectedTab == index) {
                        ButtonDefaults.buttonColors(containerColor = Color(0xFF1B3A57))
                    } else {
                        ButtonDefaults.buttonColors()
                    }
                ) {
                    Text(tab)
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))

        when (selectedTab) {
            0 -> PetListTab(vm, pets, activePet, state?.items ?: emptyList(), onDismiss)
            1 -> PetBooksTab(vm, books, pets)
        }
    }
}

// 宠物列表 Tab
@Composable
private fun PetListTab(
    vm: GameViewModel,
    pets: List<PetInfo>,
    activePet: PetInfo?,
    bagItems: List<ItemInfo>,
    onDismiss: () -> Unit
) {
    var showResetDialog by remember { mutableStateOf(false) }
    var showTrainDialog by remember { mutableStateOf(false) }
    var showEquipDialog by remember { mutableStateOf(false) }
    var showSynthesizeDialog by remember { mutableStateOf(false) }
    var showBatchSynthesizeConfirm by remember { mutableStateOf(false) }
    var selectedPetId by remember { mutableStateOf<String?>(null) }
    val selectedPet = pets.find { it.id == selectedPetId }

    if (pets.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("暂无宠物，可通过挑战BOSS获得宠物。")
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(pets) { pet ->
            PetCard(
                pet = pet,
                isActive = pet.id == activePet?.id,
                onActivate = { vm.sendCmd("pet activate ${pet.id}") },
                onRelease = { vm.sendCmd("pet release") },
                onReset = {
                    selectedPetId = pet.id
                    showResetDialog = true
                },
                onTrain = {
                    selectedPetId = pet.id
                    showTrainDialog = true
                },
                onEquip = {
                    selectedPetId = pet.id
                    showEquipDialog = true
                },
                onViewDetails = { onDismiss() } // TODO: 打开详情对话框
            )
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { showSynthesizeDialog = true },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("宠物合成")
                }
                Button(
                    onClick = { showBatchSynthesizeConfirm = true },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8E24AA))
                ) {
                    Text("一键合成")
                }
            }
        }
    }

    // 洗练确认对话框
    if (showResetDialog && selectedPet != null) {
        PetResetDialog(
            pet = selectedPet!!,
            onConfirm = {
                vm.sendCmd("pet reset ${selectedPet!!.id}")
                showResetDialog = false
                selectedPetId = null
            },
            onDismiss = {
                showResetDialog = false
                selectedPetId = null
            }
        )
    }
    if (showTrainDialog && selectedPet != null) {
        PetTrainDialog(
            pet = selectedPet!!,
            onConfirm = { attr, count ->
                vm.petTrain(selectedPet!!.id, attr, count)
                showTrainDialog = false
                selectedPetId = null
            },
            onDismiss = {
                showTrainDialog = false
                selectedPetId = null
            }
        )
    }
    if (showEquipDialog && selectedPet != null) {
        PetEquipDialog(
            pet = selectedPet!!,
            bagItems = bagItems,
            onEquip = { itemKey ->
                vm.petEquipItem(selectedPet!!.id, itemKey)
            },
            onUnequip = { slot ->
                vm.petUnequipItem(selectedPet!!.id, slot)
            },
            onDismiss = {
                showEquipDialog = false
                selectedPetId = null
            }
        )
    }
    if (showSynthesizeDialog) {
        PetSynthesizeDialog(
            pets = pets,
            onConfirm = { mainPetId, subPetId ->
                vm.petSynthesize(mainPetId, subPetId)
                showSynthesizeDialog = false
            },
            onDismiss = { showSynthesizeDialog = false }
        )
    }
    if (showBatchSynthesizeConfirm) {
        AlertDialog(
            onDismissRequest = { showBatchSynthesizeConfirm = false },
            title = { Text("一键合成（史诗以下）") },
            text = {
                Text("将自动合成所有史诗以下且未出战、未穿戴装备的宠物，直到宠物不足或金币不足。")
            },
            confirmButton = {
                Button(onClick = {
                    vm.petSynthesizeBelowEpic()
                    showBatchSynthesizeConfirm = false
                }) { Text("确认执行") }
            },
            dismissButton = {
                TextButton(onClick = { showBatchSynthesizeConfirm = false }) { Text("取消") }
            }
        )
    }
}

// 宠物洗练确认对话框
@Composable
private fun PetResetDialog(
    pet: PetInfo,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(text = "洗练宠物资质", fontWeight = FontWeight.Bold)
        },
        text = {
            Column {
                Text(text = "确定要使用【金柳露】洗练 ${pet.name} 的资质吗？")
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = Color(0xFFFFF3E0),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(text = "提示：洗练效果", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFF6B6B))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = "• 宠物资质将重新随机生成", fontSize = 11.sp)
                        Text(text = "• 宠物等级将归零（Lv.1）", fontSize = 11.sp)
                        Text(text = "• 技能槽将恢复到初始状态", fontSize = 11.sp)
                        Text(text = "• 需要消耗：金柳露 x1", fontSize = 11.sp, color = Color(0xFFFF6B6B))
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = "此操作不可逆，请谨慎操作！", fontSize = 12.sp, color = Color.Gray)
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B6B))
            ) {
                Text("确认洗练")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

// 宠物卡片
@Composable
private fun PetCard(
    pet: PetInfo,
    isActive: Boolean,
    onActivate: () -> Unit,
    onRelease: () -> Unit,
    onReset: () -> Unit,
    onTrain: () -> Unit,
    onEquip: () -> Unit,
    onViewDetails: () -> Unit
) {
    var skillDialog by remember { mutableStateOf<Pair<String, String>?>(null) }
    val rarityLabel = PetData.getRarityLabel(pet.rarity)
    val rarityColor = when (pet.rarity) {
        "normal" -> Color.Gray
        "excellent" -> Color(0xFF4CAF50)
        "rare" -> Color(0xFF2196F3)
        "epic" -> Color(0xFF9C27B0)
        "legendary" -> Color(0xFFFF9800)
        "supreme" -> Color(0xFFFF5252)
        "ultimate" -> Color(0xFFFFD700)
        else -> Color.Gray
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isActive) {
                    Modifier.border(BorderStroke(2.dp, rarityColor))
                } else {
                    Modifier
                }
            )
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = pet.name,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            color = rarityColor,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = rarityLabel,
                                fontSize = 12.sp,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                        if (isActive) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                color = Color(0xFF4CAF50),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "出战",
                                    fontSize = 12.sp,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "${pet.role} Lv.${pet.level}", fontSize = 14.sp, color = Color.Gray)
                    Text(text = "成长: ${String.format("%.2f", pet.growth)}", fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 资质
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PetStatColumn("生命", pet.aptitude.hp)
                PetStatColumn("攻击", pet.aptitude.atk)
                PetStatColumn("防御", pet.aptitude.def)
                PetStatColumn("魔法", pet.aptitude.mag)
                PetStatColumn("敏捷", pet.aptitude.agility)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 技能槽和技能
            Text(text = "技能", fontSize = 12.sp)
            if (pet.skills.isEmpty()) {
                Text(text = "暂无技能", fontSize = 12.sp, color = Color.Gray)
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(4),
                    modifier = Modifier.height(60.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    itemsIndexed(pet.skills) { idx, skillId ->
                        val skill = PetData.getSkillDef(skillId)
                        val skillName = petSkillDisplayName(
                            skillId,
                            pet.skillNames.getOrNull(idx) ?: skill?.name
                        )
                        val effectText = petSkillEffectDisplay(
                            skillId,
                            pet.skillEffects.getOrNull(idx)
                        )
                        Surface(
                            color = Color(0xFFE0E0E0),
                            modifier = Modifier.clickable {
                                skillDialog = skillName to effectText
                            }
                        ) {
                            Text(
                                text = skillName,
                                fontSize = 10.sp,
                                color = Color(0xFF212121),
                                modifier = Modifier.padding(4.dp)
                            )
                        }
                    }
                }
            }
            if (skillDialog != null) {
                val (name, effect) = skillDialog!!
                AlertDialog(
                    onDismissRequest = { skillDialog = null },
                    title = { Text(name) },
                    text = { Text(effect.ifBlank { "暂无技能说明" }) },
                    confirmButton = {
                        TextButton(onClick = { skillDialog = null }) { Text("关闭") }
                    },
                    dismissButton = {}
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 操作按钮
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (!isActive) {
                    Button(
                        onClick = onActivate,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("出战")
                    }
                } else {
                    OutlinedButton(
                        onClick = onRelease,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("收回")
                    }
                }
                Button(
                    onClick = onReset,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B6B)),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("洗练")
                }
                OutlinedButton(
                    onClick = onTrain,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("修炼")
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onEquip,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("装备")
                }
                OutlinedButton(
                    onClick = onViewDetails,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("详情")
                }
                Spacer(modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun PetStatColumn(label: String, value: Int) {
    Column(
        modifier = Modifier.padding(horizontal = 2.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = label, fontSize = 10.sp, color = Color.Gray)
        Text(text = value.toString(), fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PetTrainDialog(
    pet: PetInfo,
    onConfirm: (attr: String, count: Int) -> Unit,
    onDismiss: () -> Unit
) {
    val attrOptions = listOf("生命", "魔法值", "攻击", "防御", "魔法", "魔御", "敏捷")
    var selectedAttr by remember { mutableStateOf(attrOptions.first()) }
    var countText by remember { mutableStateOf("1") }
    var attrExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("宠物修炼") },
        text = {
            Column {
                Text("宠物：${pet.name}")
                Spacer(modifier = Modifier.height(8.dp))
                ExposedDropdownMenuBox(
                    expanded = attrExpanded,
                    onExpandedChange = { attrExpanded = !attrExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedAttr,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("修炼属性") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = attrExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = attrExpanded,
                        onDismissRequest = { attrExpanded = false }
                    ) {
                        attrOptions.forEach { attr ->
                            DropdownMenuItem(
                                text = { Text(attr) },
                                onClick = {
                                    selectedAttr = attr
                                    attrExpanded = false
                                }
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = countText,
                    onValueChange = { countText = it.filter(Char::isDigit).take(4) },
                    label = { Text("次数") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text("每次消耗：金币 + 宠物修炼果 x1", fontSize = 12.sp, color = Color.Gray)
            }
        },
        confirmButton = {
            Button(onClick = {
                val count = countText.toIntOrNull()?.coerceAtLeast(1) ?: 1
                onConfirm(selectedAttr, count)
            }) { Text("确认修炼") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("取消") }
        }
    )
}

@Composable
private fun PetEquipDialog(
    pet: PetInfo,
    bagItems: List<ItemInfo>,
    onEquip: (itemKey: String) -> Unit,
    onUnequip: (slot: String) -> Unit,
    onDismiss: () -> Unit
) {
    val equippedItems = (pet.equippedItems ?: emptyList())
        .sortedBy { petEquipSlotOrder(it.slot) }
    val equipables = bagItems
        .filter { isPetEquipableItem(it) }
        .sortedWith(
            compareByDescending<ItemInfo> { itemRarityRank(it.rarity) }
                .thenByDescending { it.refine_level }
                .thenBy { it.name }
        )

    AlertDialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        title = { Text("宠物装备：${pet.name}") },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 460.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("已穿戴（点击卸下）", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                if (equippedItems.isEmpty()) {
                    Text("暂无已穿戴装备", color = Color.Gray, fontSize = 12.sp)
                } else {
                    equippedItems.chunked(2).forEach { rowItems ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            rowItems.forEach { item ->
                                Box(modifier = Modifier.weight(1f)) {
                                    PetEquippedItemCard(item = item, onUnequip = onUnequip)
                                }
                            }
                            if (rowItems.size < 2) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }

                Divider()
                Text("背包装备（点击穿戴）", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                if (equipables.isEmpty()) {
                    Text("背包里没有可穿戴装备", color = Color.Gray, fontSize = 12.sp)
                } else {
                    equipables.chunked(2).forEach { rowItems ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            rowItems.forEach { item ->
                                Box(modifier = Modifier.weight(1f)) {
                                    PetBagEquipItemCard(item = item, onEquip = onEquip)
                                }
                            }
                            if (rowItems.size < 2) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("关闭") }
        },
        dismissButton = {}
    )
}

// 技能书库 Tab
@Composable
private fun PetBooksTab(
    vm: GameViewModel,
    books: Map<String, Int>,
    pets: List<PetInfo>
) {
    var useBookTarget by remember { mutableStateOf<Pair<String, String>?>(null) }
    if (books.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("暂无技能书，可通过挑战BOSS获得技能书。")
        }
        return
    }

    val bookList = books.map { (id, qty) ->
        val book = PetData.getBookDef(id)
        Triple(id, book, qty)
    }.filter { it.second != null }.map { (id, book, qty) ->
        Triple(id, book!!, qty)
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(bookList) { (id, book, qty) ->
            PetBookCard(
                book = book,
                qty = qty,
                onUse = {
                    if (pets.isEmpty()) {
                        vm.showToast("暂无宠物可打书")
                    } else {
                        useBookTarget = id to book.skillName
                    }
                }
            )
        }
    }

    if (useBookTarget != null) {
        val (bookId, bookName) = useBookTarget!!
        PetUseBookDialog(
            pets = pets,
            bookName = bookName,
            onConfirm = { petId ->
                vm.petUseBook(petId, bookId)
                useBookTarget = null
            },
            onDismiss = { useBookTarget = null }
        )
    }
}

// 技能书卡片
@Composable
private fun PetBookCard(book: PetBookInfo, qty: Int, onUse: () -> Unit) {
    val skill = PetData.getSkillDef(book.skillId)
    val effect = PetData.SKILL_EFFECTS[book.skillId] ?: "未知效果"
    val tierColor = when (book.tier) {
        "high" -> Color(0xFFFF9800)
        else -> Color.Gray
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = book.skillName,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            color = tierColor,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = if (book.tier == "high") "高级" else "普通",
                                fontSize = 10.sp,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(text = skill?.name ?: book.skillName, fontSize = 12.sp, color = Color.Gray)
                }
                Text(text = "x$qty", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF4CAF50))
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(text = effect, fontSize = 12.sp, color = Color.DarkGray)
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedButton(onClick = onUse, modifier = Modifier.fillMaxWidth()) {
                Text("打书")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PetUseBookDialog(
    pets: List<PetInfo>,
    bookName: String,
    onConfirm: (petId: String) -> Unit,
    onDismiss: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    var selectedPetId by remember { mutableStateOf(pets.firstOrNull()?.id ?: "") }
    val selectedPet = pets.find { it.id == selectedPetId }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("宠物打书") },
        text = {
            Column {
                Text("技能书：$bookName")
                Spacer(modifier = Modifier.height(8.dp))
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                    OutlinedTextField(
                        value = selectedPet?.name ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("选择宠物") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        pets.forEach { pet ->
                            DropdownMenuItem(
                                text = { Text(pet.name) },
                                onClick = {
                                    selectedPetId = pet.id
                                    expanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                enabled = selectedPetId.isNotBlank(),
                onClick = { if (selectedPetId.isNotBlank()) onConfirm(selectedPetId) }
            ) { Text("确认打书") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("取消") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PetSynthesizeDialog(
    pets: List<PetInfo>,
    onConfirm: (mainPetId: String, subPetId: String) -> Unit,
    onDismiss: () -> Unit
) {
    if (pets.size < 2) {
        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text("宠物合成") },
            text = { Text("至少需要两只宠物才能合成。") },
            confirmButton = { TextButton(onClick = onDismiss) { Text("关闭") } },
            dismissButton = {}
        )
        return
    }
    var mainExpanded by remember { mutableStateOf(false) }
    var subExpanded by remember { mutableStateOf(false) }
    var mainPetId by remember { mutableStateOf(pets.first().id) }
    var subPetId by remember { mutableStateOf(pets.getOrNull(1)?.id ?: pets.first().id) }
    val mainPet = pets.find { it.id == mainPetId }
    val subCandidates = pets.filter { it.id != mainPetId }
    if (subCandidates.none { it.id == subPetId }) {
        subPetId = subCandidates.firstOrNull()?.id ?: ""
    }
    val subPet = subCandidates.find { it.id == subPetId }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("宠物合成") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("主宠外形保留，副宠作为材料（消耗金币）")
                ExposedDropdownMenuBox(expanded = mainExpanded, onExpandedChange = { mainExpanded = !mainExpanded }) {
                    OutlinedTextField(
                        value = mainPet?.name ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("主宠") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = mainExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(expanded = mainExpanded, onDismissRequest = { mainExpanded = false }) {
                        pets.forEach { pet ->
                            DropdownMenuItem(
                                text = { Text("${pet.name} Lv${pet.level}") },
                                onClick = {
                                    mainPetId = pet.id
                                    mainExpanded = false
                                }
                            )
                        }
                    }
                }
                ExposedDropdownMenuBox(expanded = subExpanded, onExpandedChange = { subExpanded = !subExpanded }) {
                    OutlinedTextField(
                        value = subPet?.name ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("副宠（材料）") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = subExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(expanded = subExpanded, onDismissRequest = { subExpanded = false }) {
                        subCandidates.forEach { pet ->
                            DropdownMenuItem(
                                text = { Text("${pet.name} Lv${pet.level}") },
                                onClick = {
                                    subPetId = pet.id
                                    subExpanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                enabled = mainPetId.isNotBlank() && subPetId.isNotBlank() && mainPetId != subPetId,
                onClick = { onConfirm(mainPetId, subPetId) }
            ) { Text("确认合成") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("取消") } }
    )
}

@Composable
private fun PetEquippedItemCard(
    item: PetEquippedItem,
    onUnequip: (slot: String) -> Unit
) {
    val slotKey = item.slot ?: ""
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = slotKey.isNotBlank()) {
                if (slotKey.isNotBlank()) onUnequip(slotKey)
            },
        shape = RoundedCornerShape(8.dp),
        tonalElevation = 1.dp
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
            Text(
                text = petEquipSlotLabel(item.slot),
                fontSize = 11.sp,
                color = Color.Gray
            )
            Text(
                text = formatPetEquippedName(item),
                color = petItemRarityColor(item.rarity),
                fontWeight = FontWeight.Medium
            )
            val statText = formatPetEquipStatsText(
                atk = item.atk,
                def = item.def,
                mdef = item.mdef,
                mag = item.mag,
                hp = item.hp,
                mp = item.mp,
                spirit = item.spirit,
                dex = item.dex
            )
            if (statText.isNotBlank()) {
                Text(statText, fontSize = 11.sp, color = Color(0xFF616161))
            }
            val extraText = buildList {
                if (item.refine_level > 0) add("锻造 +${item.refine_level}")
                val effectText = formatPetEffectInline(item.effects)
                if (effectText.isNotBlank()) add(effectText)
            }.joinToString(" | ")
            if (extraText.isNotBlank()) {
                Text(extraText, fontSize = 11.sp, color = Color(0xFF757575))
            }
            Text("点击卸下", fontSize = 11.sp, color = Color(0xFFD32F2F))
        }
    }
}

@Composable
private fun PetBagEquipItemCard(
    item: ItemInfo,
    onEquip: (itemKey: String) -> Unit
) {
    val itemKey = (item.key.ifBlank { item.id }).trim()
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = itemKey.isNotBlank()) {
                if (itemKey.isNotBlank()) onEquip(itemKey)
            },
        shape = RoundedCornerShape(8.dp),
        tonalElevation = 1.dp
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
            Text(
                text = "${formatBagEquipName(item)} x${item.qty}",
                color = petItemRarityColor(item.rarity),
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "部位：${petEquipSlotLabelFromItem(item.slot)}",
                fontSize = 11.sp,
                color = Color.Gray
            )
            val statText = formatPetEquipStatsText(
                atk = item.atk,
                def = item.def,
                mdef = item.mdef,
                mag = item.mag,
                hp = item.hp,
                mp = item.mp,
                spirit = item.spirit,
                dex = item.dex
            )
            if (statText.isNotBlank()) {
                Text(statText, fontSize = 11.sp, color = Color(0xFF616161))
            }
            val extraText = buildList {
                if (item.refine_level > 0) add("锻造 +${item.refine_level}")
                val effectText = formatPetEffectInline(item.effects)
                if (effectText.isNotBlank()) add(effectText)
            }.joinToString(" | ")
            if (extraText.isNotBlank()) {
                Text(extraText, fontSize = 11.sp, color = Color(0xFF757575))
            }
        }
    }
}

private fun isPetEquipableItem(item: ItemInfo): Boolean {
    if ((item.qty) <= 0) return false
    val slot = item.slot?.trim().orEmpty()
    if (slot.isBlank()) return false
    return slot in setOf(
        "weapon", "chest", "head", "waist", "feet", "neck",
        "ring", "bracelet", "ring_left", "ring_right", "bracelet_left", "bracelet_right"
    )
}

private fun petEquipSlotLabel(slot: String?): String = when (slot) {
    "weapon" -> "武器"
    "chest" -> "衣服"
    "head" -> "头盔"
    "waist" -> "腰带"
    "feet" -> "鞋子"
    "neck" -> "项链"
    "ring_left" -> "左戒指"
    "ring_right" -> "右戒指"
    "bracelet_left" -> "左手镯"
    "bracelet_right" -> "右手镯"
    else -> slot?.ifBlank { "装备" } ?: "装备"
}

private fun petEquipSlotLabelFromItem(slot: String?): String = when (slot) {
    "ring" -> "戒指"
    "bracelet" -> "手镯"
    else -> petEquipSlotLabel(slot)
}

private fun petEquipSlotOrder(slot: String?): Int = when (slot) {
    "weapon" -> 1
    "chest" -> 2
    "head" -> 3
    "waist" -> 4
    "feet" -> 5
    "neck" -> 6
    "ring_left" -> 7
    "ring_right" -> 8
    "bracelet_left" -> 9
    "bracelet_right" -> 10
    else -> 99
}

private fun itemRarityRank(rarity: String?): Int = when (rarity?.lowercase()) {
    "ultimate" -> 7
    "supreme" -> 6
    "legendary" -> 5
    "epic" -> 4
    "rare" -> 3
    "excellent" -> 2
    "normal" -> 1
    else -> 0
}

private fun petItemRarityColor(rarity: String?): Color = when (rarity?.lowercase()) {
    "ultimate" -> Color(0xFFFFD700)
    "supreme" -> Color(0xFFFF5252)
    "legendary" -> Color(0xFFFF9800)
    "epic" -> Color(0xFF9C27B0)
    "rare" -> Color(0xFF2196F3)
    "excellent" -> Color(0xFF4CAF50)
    else -> Color.Unspecified
}

private fun formatPetEquippedName(item: PetEquippedItem): String {
    val refine = if (item.refine_level > 0) " +${item.refine_level}" else ""
    return item.name + refine
}

private fun formatBagEquipName(item: ItemInfo): String {
    val refine = if (item.refine_level > 0) " +${item.refine_level}" else ""
    return item.name + refine
}

private fun petSkillDisplayName(skillId: String, rawName: String?): String {
    val cleaned = rawName?.trim().orEmpty()
    if (cleaned.isNotBlank()) return cleaned
    return when (skillId) {
        "pet_beast_aegis" -> "神兽护甲"
        else -> skillId
    }
}

private fun petSkillEffectDisplay(skillId: String, serverEffect: String?): String {
    val effect = serverEffect?.trim().orEmpty()
    if (effect.isNotBlank()) return effect
    return PetData.SKILL_EFFECTS[skillId]?.trim().orEmpty()
}

private fun normalizePetBooksMap(raw: JsonElement?): Map<String, Int> {
    val out = LinkedHashMap<String, Int>()
    when (raw) {
        is JsonObject -> {
            if (raw.isEmpty()) return emptyMap()
            for ((key, value) in raw) {
                val qty = value.jsonPrimitive.contentOrNull?.toIntOrNull() ?: continue
                if (qty > 0) out[key] = qty
            }
        }
        is JsonArray -> {
            raw.forEach { entry ->
                val obj = entry as? JsonObject ?: return@forEach
                val id = obj["id"]?.jsonPrimitive?.contentOrNull?.trim().orEmpty()
                val qty = obj["qty"]?.jsonPrimitive?.contentOrNull?.toIntOrNull() ?: 0
                if (id.isNotBlank() && qty > 0) out[id] = qty
            }
        }
        else -> return emptyMap()
    }
    return out
}

private fun formatPetEquipStatsText(
    atk: Int = 0,
    def: Int = 0,
    mdef: Int = 0,
    mag: Int = 0,
    hp: Int = 0,
    mp: Int = 0,
    spirit: Int = 0,
    dex: Int = 0
): String {
    val parts = mutableListOf<String>()
    if (atk != 0) parts += "攻${signedNum(atk)}"
    if (def != 0) parts += "防${signedNum(def)}"
    if (mdef != 0) parts += "魔御${signedNum(mdef)}"
    if (mag != 0) parts += "魔法${signedNum(mag)}"
    if (hp != 0) parts += "血${signedNum(hp)}"
    if (mp != 0) parts += "蓝${signedNum(mp)}"
    if (spirit != 0) parts += "道${signedNum(spirit)}"
    if (dex != 0) parts += "敏${signedNum(dex)}"
    return parts.joinToString(" ")
}

private fun signedNum(value: Int): String = if (value > 0) "+$value" else value.toString()

private fun formatPetEffectInline(effects: JsonObject?): String {
    if (effects == null || effects.isEmpty()) return ""
    val parts = mutableListOf<String>()
    val elementAtk = effects["elementAtk"]?.jsonPrimitive?.contentOrNull?.toDoubleOrNull()?.toInt() ?: 0
    if (elementAtk > 0) parts += "元素+$elementAtk"
    val keys = effects.keys.filter { it != "elementAtk" && it != "skill" }
    if (keys.isNotEmpty()) {
        parts += "特效 ${keys.joinToString("、") { petEffectLabel(it) }}"
    }
    return parts.joinToString(" ")
}

private fun petEffectLabel(key: String): String = when (key) {
    "combo" -> "连击"
    "fury" -> "狂攻"
    "unbreakable" -> "不磨"
    "defense" -> "守护"
    "dodge" -> "闪避"
    "poison" -> "毒"
    "healblock" -> "禁疗"
    else -> key
}
