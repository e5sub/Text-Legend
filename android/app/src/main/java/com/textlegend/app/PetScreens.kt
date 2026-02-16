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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogProperties

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
    val books = petState?.books ?: emptyMap()

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
            0 -> PetListTab(vm, pets, activePet, onDismiss)
            1 -> PetBooksTab(vm, books)
        }
    }
}

// 宠物列表Tab
@Composable
private fun PetListTab(
    vm: GameViewModel,
    pets: List<PetInfo>,
    activePet: PetInfo?,
    onDismiss: () -> Unit
) {
    var showResetDialog by remember { mutableStateOf(false) }
    var selectedPet by remember { mutableStateOf<PetInfo?>(null) }

    if (pets.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("暂无宠物，通过战斗BOSS获得宠物！")
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
                    selectedPet = pet
                    showResetDialog = true
                },
                onViewDetails = { onDismiss() } // TODO: 打开详情对话框
            )
        }
    }

    // 洗炼确认对话框
    if (showResetDialog && selectedPet != null) {
        PetResetDialog(
            pet = selectedPet!!,
            onConfirm = {
                vm.sendCmd("pet reset ${selectedPet!!.id}")
                showResetDialog = false
                selectedPet = null
            },
            onDismiss = {
                showResetDialog = false
                selectedPet = null
            }
        )
    }
}

// 宠物洗炼确认对话框
@Composable
private fun PetResetDialog(
    pet: PetInfo,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(text = "洗炼宠物资质", fontWeight = FontWeight.Bold)
        },
        text = {
            Column {
                Text(text = "确定要使用【金柳露】洗炼 ${pet.name} 的资质吗？")
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = Color(0xFFFFF3E0),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(text = "⚠️ 洗炼效果：", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFF6B6B))
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
                Text("确认洗炼")
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
    onViewDetails: () -> Unit
) {
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
            Text(text = "技能 (${pet.skills.size}/${pet.skillSlots})", fontSize = 12.sp)
            if (pet.skills.isEmpty()) {
                Text(text = "暂无技能", fontSize = 12.sp, color = Color.Gray)
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(4),
                    modifier = Modifier.height(60.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(pet.skills) { skillId ->
                        val skill = PetData.getSkillDef(skillId)
                        Surface(
                            color = Color(0xFFE0E0E0),
                            modifier = Modifier.clickable { /* TODO: 查看技能详情 */ }
                        ) {
                            Text(
                                text = skill?.name ?: skillId,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(4.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 操作按钮
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
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
                    Text("洗炼")
                }
                OutlinedButton(
                    onClick = onViewDetails,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("详情")
                }
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

// 技能书库Tab
@Composable
private fun PetBooksTab(
    vm: GameViewModel,
    books: Map<String, Int>
) {
    if (books.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("暂无技能书，通过战斗BOSS获得技能书！")
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
            PetBookCard(book = book, qty = qty)
        }
    }
}

// 技能书卡片
@Composable
private fun PetBookCard(book: PetBookInfo, qty: Int) {
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
        }
    }
}
