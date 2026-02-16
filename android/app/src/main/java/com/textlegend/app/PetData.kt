package com.textlegend.app

object PetData {
    // 宠物常量
    const val MAX_OWNED = 12
    const val BASE_SKILL_SLOTS = 3
    const val MAX_SKILL_SLOTS = 16
    const val COMPREHEND_COST_GOLD = 150000
    const val SYNTHESIS_COST_GOLD = 500000
    const val BOOK_UNLOCK_SLOT4_CHANCE = 0.35
    const val SYNTHESIS_UNLOCK_SLOT_CHANCE = 0.45

    // 稀有度顺序
    val RARITY_ORDER = listOf("normal", "excellent", "rare", "epic", "legendary", "supreme", "ultimate")

    // 稀有度标签
    val RARITY_LABELS = mapOf(
        "normal" to "普通",
        "excellent" to "优秀",
        "rare" to "稀有",
        "epic" to "史诗",
        "legendary" to "传说",
        "supreme" to "至尊",
        "ultimate" to "终极"
    )

    // 稀有度颜色（Compose颜色名称）
    val RARITY_COLORS = mapOf(
        "normal" to "Gray",
        "excellent" to "Green",
        "rare" to "Blue",
        "epic" to "Purple",
        "legendary" to "Orange",
        "supreme" to "Red",
        "ultimate" to "Gold"
    )

    // 成长系数范围
    val RARITY_GROWTH_RANGE = mapOf(
        "normal" to 1.0 to 1.12,
        "excellent" to 1.08 to 1.2,
        "rare" to 1.16 to 1.3,
        "epic" to 1.24 to 1.42,
        "legendary" to 1.34 to 1.56,
        "supreme" to 1.46 to 1.74,
        "ultimate" to 1.62 to 1.95
    )

    // 资质范围
    val RARITY_APTITUDE_RANGE = mapOf(
        "normal" to AptitudeRange(1400, 2600, 70, 130, 60, 120, 70, 130, 60, 120),
        "excellent" to AptitudeRange(1900, 3200, 95, 160, 85, 150, 95, 160, 85, 150),
        "rare" to AptitudeRange(2500, 3900, 125, 200, 110, 190, 125, 200, 110, 190),
        "epic" to AptitudeRange(3200, 4700, 160, 245, 140, 230, 160, 245, 140, 230),
        "legendary" to AptitudeRange(4000, 5600, 195, 295, 175, 280, 195, 295, 175, 280),
        "supreme" to AptitudeRange(5000, 6600, 240, 360, 220, 340, 240, 360, 220, 340),
        "ultimate" to AptitudeRange(6200, 8000, 300, 440, 280, 420, 300, 440, 280, 420)
    )

    // 物种（按稀有度）
    val SPECIES_BY_RARITY = mapOf(
        "normal" to listOf(
            "FieldWolf", "HillCat", "GreenBird", "StoneTurtle", "NightBat",
            "FireLizard", "SandFox", "WoodSprite", "PuppetBeast", "GrassSpirit"
        ),
        "excellent" to listOf(
            "SilverFox", "SkyHawk", "ThunderLeopard", "FrostDeer", "BlazeWolf",
            "AquaQilin", "IronApe", "OakSpirit", "RuneTurtle", "WindBird"
        ),
        "rare" to listOf(
            "CrimsonLion", "IceFox", "StormRhino", "AquaDragon", "ShadowLeopard",
            "StarLuan", "RiftBear", "VenomSerpent", "GhostWolf", "CloudDeer"
        ),
        "epic" to listOf(
            "NetherTiger", "SolarPhoenix", "StormDragon", "FrostQilin", "YoungXuanwu",
            "NineTailFox", "WarTigerMech", "GoldenRoc", "SoulSpider", "OceanKun"
        ),
        "legendary" to listOf(
            "ZhuLong", "YingLong", "BaiZe", "QiongQi", "TaoTie",
            "BiAn", "MingBird", "QingLuan", "BiFang", "WhiteTiger"
        ),
        "supreme" to listOf(
            "PrimordialDragon", "ChaosQilin", "UndyingCrow", "VoidXuanwu", "AllFormBaiZe",
            "NineNetherPhoenix", "PrisonXiezhi", "TiangangApe", "SkyZhuLong", "WildTaoTie"
        ),
        "ultimate" to listOf(
            "EndOriginDragon", "EternalPhoenix", "TaixuRoc", "WujiBaiZe", "GenesisQilin",
            "HunyuanXuanwu", "AbyssQiongQi", "SkyTorch", "OriginYingLong", "HongmengCrow"
        )
    )

    // 技能库
    val SKILL_LIBRARY = listOf(
        PetSkillInfo("pet_bash", "强力", "normal"),
        PetSkillInfo("pet_bash_adv", "高级强力", "advanced"),
        PetSkillInfo("pet_crit", "会心", "normal"),
        PetSkillInfo("pet_crit_adv", "高级会心", "advanced"),
        PetSkillInfo("pet_guard", "坚韧", "normal"),
        PetSkillInfo("pet_guard_adv", "高级坚韧", "advanced"),
        PetSkillInfo("pet_dodge", "敏捷", "normal"),
        PetSkillInfo("pet_dodge_adv", "高级敏捷", "advanced"),
        PetSkillInfo("pet_lifesteal", "吸血", "normal"),
        PetSkillInfo("pet_lifesteal_adv", "高级吸血", "advanced"),
        PetSkillInfo("pet_counter", "反击", "normal"),
        PetSkillInfo("pet_counter_adv", "高级反击", "advanced"),
        PetSkillInfo("pet_combo", "连击", "normal"),
        PetSkillInfo("pet_combo_adv", "高级连击", "advanced"),
        PetSkillInfo("pet_tough_skin", "硬皮", "normal"),
        PetSkillInfo("pet_tough_skin_adv", "高级硬皮", "advanced"),
        PetSkillInfo("pet_focus", "专注", "normal"),
        PetSkillInfo("pet_focus_adv", "高级专注", "advanced"),
        PetSkillInfo("pet_spirit", "灵能", "normal"),
        PetSkillInfo("pet_spirit_adv", "高级灵能", "advanced"),
        PetSkillInfo("pet_fury", "狂怒", "normal"),
        PetSkillInfo("pet_fury_adv", "高级狂怒", "advanced"),
        PetSkillInfo("pet_break", "破甲", "normal"),
        PetSkillInfo("pet_break_adv", "高级破甲", "advanced"),
        PetSkillInfo("pet_magic_break", "破魔", "normal"),
        PetSkillInfo("pet_magic_break_adv", "高级破魔", "advanced"),
        PetSkillInfo("pet_bloodline", "血脉", "normal"),
        PetSkillInfo("pet_bloodline_adv", "高级血脉", "advanced"),
        PetSkillInfo("pet_resolve", "不屈", "normal"),
        PetSkillInfo("pet_resolve_adv", "高级不屈", "advanced"),
        PetSkillInfo("pet_quick_step", "疾行", "normal"),
        PetSkillInfo("pet_quick_step_adv", "高级疾行", "advanced"),
        PetSkillInfo("pet_sunder", "撕裂", "normal"),
        PetSkillInfo("pet_sunder_adv", "高级撕裂", "advanced"),
        PetSkillInfo("pet_arcane_echo", "奥术回响", "normal"),
        PetSkillInfo("pet_arcane_echo_adv", "高级奥术回响", "advanced"),
        PetSkillInfo("pet_divine_guard", "神佑", "special"),
        PetSkillInfo("pet_kill_soul", "噬魂", "special"),
        PetSkillInfo("pet_war_horn", "战号", "special"),
        PetSkillInfo("pet_soul_chain", "魂链", "normal"),
        PetSkillInfo("pet_soul_chain_adv", "高级魂链", "advanced"),
        PetSkillInfo("pet_overload", "超载", "normal"),
        PetSkillInfo("pet_overload_adv", "高级超载", "advanced"),
        PetSkillInfo("pet_rebirth", "涅槃", "normal"),
        PetSkillInfo("pet_rebirth_adv", "高级涅槃", "advanced")
    )

    // 技能效果说明
    val SKILL_EFFECTS = mapOf(
        "pet_bash" to "被动：宠物物理伤害+4.5%",
        "pet_bash_adv" to "被动：宠物物理伤害+6.75%",
        "pet_crit" to "被动：宠物暴击率+4.5%",
        "pet_crit_adv" to "被动：宠物暴击率+6.75%",
        "pet_guard" to "被动：主人受到伤害-4.5%",
        "pet_guard_adv" to "被动：主人受到伤害-6.75%",
        "pet_dodge" to "被动：主人闪避率+3%",
        "pet_dodge_adv" to "被动：主人闪避率+4.5%",
        "pet_lifesteal" to "被动：宠物攻击吸血4.5%",
        "pet_lifesteal_adv" to "被动：宠物攻击吸血6.75%",
        "pet_counter" to "被动：宠物受击时6%反击",
        "pet_counter_adv" to "被动：宠物受击时9%反击",
        "pet_combo" to "被动：宠物攻击6%连击",
        "pet_combo_adv" to "被动：宠物攻击9%连击",
        "pet_tough_skin" to "被动：主人额外减伤7.5%",
        "pet_tough_skin_adv" to "被动：主人额外减伤11.25%",
        "pet_focus" to "被动：宠物命中率+3.75%",
        "pet_focus_adv" to "被动：宠物命中率+5.625%",
        "pet_spirit" to "被动：宠物法术伤害+4.5%",
        "pet_spirit_adv" to "被动：宠物法术伤害+6.75%",
        "pet_fury" to "被动：主人最终伤害+6%",
        "pet_fury_adv" to "被动：主人最终伤害+9%",
        "pet_break" to "被动：主人无视目标防御4.5%",
        "pet_break_adv" to "被动：主人无视目标防御6.75%",
        "pet_magic_break" to "被动：攻击时9%附加破魔(4.5秒)",
        "pet_magic_break_adv" to "被动：攻击时13.5%附加破魔(4.5秒)",
        "pet_bloodline" to "被动：主人治疗效果+9%",
        "pet_bloodline_adv" to "被动：主人治疗效果+13.5%",
        "pet_resolve" to "被动：主人控制抗性提升",
        "pet_resolve_adv" to "被动：主人控制抗性提升",
        "pet_quick_step" to "被动：主人速度提升",
        "pet_quick_step_adv" to "被动：主人速度提升",
        "pet_sunder" to "被动：主人造成流血概率提升",
        "pet_sunder_adv" to "被动：主人造成流血概率提升",
        "pet_arcane_echo" to "被动：法术命中时4.5%追加一段伤害",
        "pet_arcane_echo_adv" to "被动：法术命中时6.75%追加一段伤害",
        "pet_divine_guard" to "被动：受击4%触发神佑减伤14%",
        "pet_kill_soul" to "被动：击杀目标时恢复4.5%生命/法力",
        "pet_war_horn" to "被动：攻击附带禁疗概率提升",
        "pet_soul_chain" to "被动：宠物与主人分担6%伤害",
        "pet_soul_chain_adv" to "被动：宠物与主人分担9%伤害",
        "pet_overload" to "被动：技能伤害小幅增幅",
        "pet_overload_adv" to "被动：技能伤害增幅",
        "pet_rebirth" to "被动：濒死时12%几率涅槃复活",
        "pet_rebirth_adv" to "被动：濒死时18%几率涅槃复活"
    )

    // 技能书库
    val BOOK_LIBRARY = SKILL_LIBRARY.mapIndexed { index, skill ->
        PetBookInfo(
            id = "pet_book_${skill.id}",
            name = "宠物技能书·${skill.name}",
            skillId = skill.id,
            skillName = skill.name,
            tier = if (skill.grade == "normal") "low" else "high",
            priceGold = when (skill.grade) {
                "special" -> 280000
                "advanced" -> 120000
                else -> 60000 + index * 800
            }
        )
    }

    // 辅助类
    data class AptitudeRange(
        val hpMin: Int, val hpMax: Int,
        val atkMin: Int, val atkMax: Int,
        val defMin: Int, val defMax: Int,
        val magMin: Int, val magMax: Int,
        val speedMin: Int, val speedMax: Int
    )

    // 获取技能定义
    fun getSkillDef(skillId: String): PetSkillInfo? {
        return SKILL_LIBRARY.find { it.id == skillId }
    }

    // 获取技能等级
    fun getSkillTier(skillId: String): String {
        val def = getSkillDef(skillId) ?: return "low"
        return if (def.grade == "normal") "low" else "high"
    }

    // 获取技能书定义
    fun getBookDef(bookId: String): PetBookInfo? {
        return BOOK_LIBRARY.find { it.id == bookId }
    }

    // 获取稀有度标签
    fun getRarityLabel(rarity: String): String {
        return RARITY_LABELS[rarity] ?: "未知"
    }

    // 获取稀有度颜色
    fun getRarityColor(rarity: String): String {
        return RARITY_COLORS[rarity] ?: "Gray"
    }
}
