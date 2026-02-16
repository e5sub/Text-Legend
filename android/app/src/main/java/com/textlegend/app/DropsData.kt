package com.textlegend.app

data class DropEntry(val mob: String, val chance: String)

data class DropItem(val id: String, val name: String, val drops: List<DropEntry>)

data class DropSet(val id: String, val name: String, val items: List<DropItem>)

object DropsData {
    val sets: List<DropSet> = listOf(
        DropSet(
            id = "shengzhan",
            name = "圣战套装",
            items = listOf(
                DropItem("armor_taishan", "圣战宝甲", listOf(
                    DropEntry("赤月恶魔", "6%"), DropEntry("魔龙教主", "6%"), DropEntry("世界BOSS", "6%"), DropEntry("跨服BOSS", "6%"), DropEntry("沙巴克BOSS", "8%")
                )),
                DropItem("helm_holy", "圣战头盔(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("boots_holy", "圣战靴(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("belt_holy", "圣战腰带(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("ring_holy", "圣战戒指(套)", listOf(
                    DropEntry("黄泉教主", "4%"), DropEntry("赤月恶魔", "6%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                )),
                DropItem("necklace_soldier", "圣战项链(套)", listOf(
                    DropEntry("赤月恶魔", "8%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                )),
                DropItem("bracelet_soldier", "圣战手镯(套)", listOf(
                    DropEntry("赤月恶魔", "4%"), DropEntry("魔龙教主", "4%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                ))
            )
        ),
        DropSet(
            id = "fashen",
            name = "法神套装",
            items = listOf(
                DropItem("armor_mage", "法神披风", listOf(
                    DropEntry("赤月恶魔", "6%"), DropEntry("双头金刚", "8%"), DropEntry("魔龙教主", "6%"), DropEntry("世界BOSS", "6%"), DropEntry("跨服BOSS", "6%"), DropEntry("沙巴克BOSS", "8%")
                )),
                DropItem("helm_mage", "法神头盔(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("boots_mage", "法神靴(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("belt_mage", "法神腰带(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("ring_fashen", "法神戒指(套)", listOf(
                    DropEntry("黄泉教主", "4%"), DropEntry("赤月恶魔", "6%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                )),
                DropItem("necklace_fashen", "法神项链(套)", listOf(
                    DropEntry("赤月恶魔", "8%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                )),
                DropItem("bracelet_fashen", "法神手镯(套)", listOf(
                    DropEntry("赤月恶魔", "4%"), DropEntry("魔龙教主", "4%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                ))
            )
        ),
        DropSet(
            id = "tianzun",
            name = "天尊套装",
            items = listOf(
                DropItem("armor_tao", "天尊道袍", listOf(
                    DropEntry("赤月恶魔", "6%"), DropEntry("双头金刚", "8%"), DropEntry("魔龙教主", "6%"), DropEntry("世界BOSS", "6%"), DropEntry("跨服BOSS", "6%"), DropEntry("沙巴克BOSS", "8%")
                )),
                DropItem("helm_tao", "天尊头盔(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("boots_tao", "天尊靴(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("belt_tao", "天尊腰带(套)", listOf(
                    DropEntry("赤月恶魔", "2%"), DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "2%"), DropEntry("跨服BOSS", "2%"), DropEntry("沙巴克BOSS", "3%")
                )),
                DropItem("ring_tianzun", "天尊戒指(套)", listOf(
                    DropEntry("虹魔教主", "6%"), DropEntry("赤月恶魔", "6%"), DropEntry("双头血魔", "6%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                )),
                DropItem("necklace_tianzun", "天尊项链(套)", listOf(
                    DropEntry("赤月恶魔", "8%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                )),
                DropItem("bracelet_tianzun", "天尊手镯(套)", listOf(
                    DropEntry("赤月恶魔", "4%"), DropEntry("魔龙教主", "4%"), DropEntry("世界BOSS", "4%"), DropEntry("跨服BOSS", "4%"), DropEntry("沙巴克BOSS", "6%")
                ))
            )
        ),
        DropSet(
            id = "zhanshen",
            name = "战神套装",
            items = listOf(
                DropItem("armor_thunder", "雷霆战甲", listOf(
                    DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("helm_wargod", "战神头盔(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("boots_wargod", "战神靴子(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("belt_wargod", "战神腰带(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("ring_wargod", "战神戒指(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                )),
                DropItem("necklace_wargod", "战神项链(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                )),
                DropItem("bracelet_wargod", "战神手镯(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                ))
            )
        ),
        DropSet(
            id = "shengmo",
            name = "圣魔套装",
            items = listOf(
                DropItem("armor_flame", "烈焰魔衣", listOf(
                    DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("helm_sacred", "圣魔头盔(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("boots_sacred", "圣魔靴子(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("belt_sacred", "圣魔腰带(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("ring_sacred", "圣魔戒指(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                )),
                DropItem("necklace_sacred", "圣魔项链(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                )),
                DropItem("bracelet_sacred", "圣魔手镯(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                ))
            )
        ),
        DropSet(
            id = "zhenhun",
            name = "真魂套装",
            items = listOf(
                DropItem("armor_glow", "光芒道袍", listOf(
                    DropEntry("魔龙教主", "2%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("helm_true", "真魂头盔(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("boots_true", "真魂靴子(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("belt_true", "真魂腰带(套)", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1%")
                )),
                DropItem("ring_true", "真魂戒指(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                )),
                DropItem("necklace_true", "真魂项链(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                )),
                DropItem("bracelet_true", "真魂手镯(套)", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"), DropEntry("沙巴克BOSS", "0.6%")
                ))
            )
        ),
        DropSet(
            id = "luoqi",
            name = "洛奇套装",
            items = listOf(
                DropItem("sword_rochie", "洛奇王者之刃", listOf(DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"))),
                DropItem("staff_rochie", "洛奇王者权杖", listOf(DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"))),
                DropItem("sword_rochie_tao", "洛奇王者之剑", listOf(DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"))),
                DropItem("armor_rochie_war", "洛奇战甲", listOf(DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"))),
                DropItem("armor_rochie_mage", "洛奇法袍", listOf(DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"))),
                DropItem("armor_rochie_tao", "洛奇道袍", listOf(DropEntry("世界BOSS", "0.5%"), DropEntry("跨服BOSS", "0.5%"))),
                DropItem("helm_rochie_war", "洛奇头盔(战士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("helm_rochie_mage", "洛奇头盔(法师)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("helm_rochie_tao", "洛奇头盔(道士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("boots_rochie_war", "洛奇靴子(战士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("boots_rochie_mage", "洛奇靴子(法师)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("boots_rochie_tao", "洛奇靴子(道士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("belt_rochie_war", "洛奇腰带(战士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("belt_rochie_mage", "洛奇腰带(法师)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("belt_rochie_tao", "洛奇腰带(道士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("ring_rochie_war", "洛奇戒指(战士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("ring_rochie_mage", "洛奇戒指(法师)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("ring_rochie_tao", "洛奇戒指(道士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("bracelet_rochie_war", "洛奇手镯(战士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("bracelet_rochie_mage", "洛奇手镯(法师)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("bracelet_rochie_tao", "洛奇手镯(道士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("necklace_rochie_war", "洛奇项链(战士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("necklace_rochie_mage", "洛奇项链(法师)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%"))),
                DropItem("necklace_rochie_tao", "洛奇项链(道士)", listOf(DropEntry("世界BOSS", "0.3%"), DropEntry("跨服BOSS", "0.3%")))
            )
        ),
        DropSet(
            id = "skillbook",
            name = "技能书",
            items = listOf(
                DropItem("book_war_basic", "技能书: 基本剑术", listOf(DropEntry("鸡", "2%"), DropEntry("鹿", "2%"), DropEntry("稻草人", "1%"))),
                DropItem("book_war_attack", "技能书: 攻杀剑术", listOf(DropEntry("邪恶钳虫", "2%"), DropEntry("多钩猫", "1%"))),
                DropItem("book_war_assassinate", "技能书: 刺杀剑术", listOf(DropEntry("触龙神", "3%"), DropEntry("白野猪", "2%"))),
                DropItem("book_war_halfmoon", "技能书: 半月弯刀", listOf(DropEntry("沃玛教主", "4%"), DropEntry("祖玛教主", "4%"))),
                DropItem("book_war_fire", "技能书: 烈火剑法", listOf(DropEntry("祖玛教主", "4%"), DropEntry("赤月恶魔", "4%"))),
                DropItem("book_war_savage", "技能书: 野蛮冲撞", listOf(DropEntry("赤月恶魔", "3%"), DropEntry("黄泉教主", "3%"))),
                DropItem("book_war_earth_spike", "技能书: 彻地钉", listOf(DropEntry("世界BOSS", "3%"), DropEntry("跨服BOSS", "3%"))),
                DropItem("book_mage_fireball", "技能书: 小火球", listOf(DropEntry("稻草人", "2%"), DropEntry("鸡", "2%"))),
                DropItem("book_mage_resist", "技能书: 抗拒火环", listOf(DropEntry("邪恶钳虫", "2%"), DropEntry("多钩猫", "1%"))),
                DropItem("book_mage_inferno", "技能书: 地狱火", listOf(DropEntry("触龙神", "3%"), DropEntry("白野猪", "2%"))),
                DropItem("book_mage_explode", "技能书: 爆裂火球", listOf(DropEntry("沃玛教主", "4%"), DropEntry("祖玛教主", "4%"))),
                DropItem("book_mage_lightning", "技能书: 雷电术", listOf(DropEntry("祖玛教主", "4%"), DropEntry("牛魔王", "3%"))),
                DropItem("book_mage_flash", "技能书: 疾光电影", listOf(DropEntry("赤月恶魔", "3%"), DropEntry("黄泉教主", "3%"))),
                DropItem("book_mage_thunder", "技能书: 地狱雷光", listOf(DropEntry("牛魔王", "3%"), DropEntry("魔龙教主", "3%"))),
                DropItem("book_mage_thunderstorm", "技能书: 雷霆万钧", listOf(DropEntry("世界BOSS", "3%"), DropEntry("跨服BOSS", "3%"))),
                DropItem("book_mage_shield", "技能书: 魔法盾", listOf(DropEntry("魔龙教主", "4%"), DropEntry("沙巴克BOSS", "4%"))),
                DropItem("book_mage_ice", "技能书: 冰咆哮", listOf(DropEntry("沙巴克BOSS", "5%"))),
                DropItem("book_tao_heal", "技能书: 治愈术", listOf(DropEntry("鸡", "2%"), DropEntry("鹿", "2%"))),
                DropItem("book_tao_group_heal", "技能书: 群体治疗术", listOf(DropEntry("赤月恶魔", "3%"))),
                DropItem("book_tao_poison", "技能书: 施毒术", listOf(DropEntry("邪恶钳虫", "2%"), DropEntry("多钩猫", "1%"))),
                DropItem("book_tao_soul", "技能书: 灵魂火符", listOf(DropEntry("触龙神", "3%"), DropEntry("白野猪", "2%"))),
                DropItem("book_tao_invis", "技能书: 隐身术", listOf(DropEntry("沃玛教主", "4%"), DropEntry("祖玛教主", "4%"))),
                DropItem("book_tao_group_invis", "技能书: 群体隐身", listOf(DropEntry("赤月恶魔", "3%"), DropEntry("黄泉教主", "3%"))),
                DropItem("book_tao_armor", "技能书: 防御术", listOf(DropEntry("祖玛教主", "4%"), DropEntry("赤月恶魔", "4%"))),
                DropItem("book_tao_shield", "技能书: 神圣战甲术", listOf(DropEntry("黄泉教主", "3%"), DropEntry("魔龙教主", "3%"))),
                DropItem("book_tao_skeleton", "技能书: 召唤骷髅", listOf(DropEntry("牛魔王", "3%"), DropEntry("魔龙教主", "3%"))),
                DropItem("book_tao_summon", "技能书: 召唤神兽", listOf(DropEntry("魔龙教主", "4%"), DropEntry("沙巴克BOSS", "4%"))),
                DropItem("book_tao_white_tiger", "技能书: 召唤白虎", listOf(DropEntry("世界BOSS", "3%"), DropEntry("跨服BOSS", "3%")))
            )
        ),
        DropSet(
            id = "special",
            name = "特殊戒指",
            items = listOf(
                DropItem("ring_dodge", "躲避戒指", listOf(
                    DropEntry("牛魔王", "0.8%"), DropEntry("魔龙教主", "0.5%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_def", "防御戒指", listOf(
                    DropEntry("祖玛教主", "0.8%"), DropEntry("魔龙教主", "0.5%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_fire", "吸血戒指", listOf(
                    DropEntry("祖玛教主", "0.8%"), DropEntry("魔龙教主", "0.5%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_heal", "治愈戒指", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_magic", "麻痹戒指", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("牛魔王", "0.5%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_teleport", "弱化戒指", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("牛魔王", "0.6%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_protect", "护身戒指", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_revival", "复活戒指", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_break", "破防戒指", listOf(
                    DropEntry("魔龙教主", "0.5%"), DropEntry("暗之沃玛教主", "0.5%"), DropEntry("暗之祖玛教主", "0.5%"), DropEntry("暗之赤月恶魔", "0.5%"), DropEntry("暗之虹魔教主", "0.5%"), DropEntry("暗之骷髅精灵", "0.5%"), DropEntry("世界BOSS", "1.5%"), DropEntry("跨服BOSS", "1.5%"), DropEntry("沙巴克BOSS", "2%")
                )),
                DropItem("ring_recall", "记忆戒指", listOf(
                    DropEntry("魔龙教主", "0.3%"), DropEntry("暗之沃玛教主", "0.3%"), DropEntry("暗之祖玛教主", "0.3%"), DropEntry("暗之赤月恶魔", "0.3%"), DropEntry("暗之虹魔教主", "0.3%"), DropEntry("暗之骷髅精灵", "0.3%"), DropEntry("世界BOSS", "0.8%"), DropEntry("跨服BOSS", "0.8%"), DropEntry("沙巴克BOSS", "1.5%")
                ))
            )
        ),
        DropSet(
            id = "pet",
            name = "宠物",
            items = listOf(
                DropItem("pet_normal", "普通宠物(10种)", listOf(DropEntry("沃玛教主", "8%"), DropEntry("祖玛教主", "6%"))),
                DropItem("pet_excellent", "优秀宠物(10种)", listOf(DropEntry("祖玛教主", "7%"), DropEntry("触龙神", "5%"), DropEntry("白野猪", "4%"))),
                DropItem("pet_rare", "稀有宠物(10种)", listOf(DropEntry("赤月恶魔", "7%"), DropEntry("黄泉教主", "5%"), DropEntry("双头金刚", "4%"))),
                DropItem("pet_epic", "史诗宠物(10种)", listOf(DropEntry("魔龙教主", "8%"), DropEntry("世界BOSS", "8%"), DropEntry("跨服BOSS", "7%"))),
                DropItem("pet_legendary", "传说宠物(10种)", listOf(DropEntry("魔龙教主", "9%"), DropEntry("世界BOSS", "9%"), DropEntry("跨服BOSS", "8%"), DropEntry("沙巴克BOSS", "8%"))),
                DropItem("pet_supreme", "至尊宠物(10种)", listOf(DropEntry("世界BOSS", "10%"), DropEntry("跨服BOSS", "10%"), DropEntry("沙巴克BOSS", "8%"))),
                DropItem("pet_ultimate", "终极宠物(10种)", listOf(DropEntry("世界BOSS", "12%"), DropEntry("跨服BOSS", "12%"), DropEntry("沙巴克BOSS", "10%")))
            )
        ),
        DropSet(
            id = "petbook",
            name = "宠物技能书",
            items = listOf(
                DropItem("pet_book_low", "普通技能书(30种)", listOf(DropEntry("祖玛教主", "25%"), DropEntry("触龙神", "25%"), DropEntry("赤月恶魔", "30%"), DropEntry("白野猪", "25%"))),
                DropItem("pet_book_high", "高级技能书(15种)", listOf(DropEntry("魔龙教主", "5%"), DropEntry("世界BOSS", "5%"), DropEntry("跨服BOSS", "5%"), DropEntry("沙巴克BOSS", "6%"))),
                DropItem("pet_book_special", "特殊技能书(6种)", listOf(DropEntry("魔龙教主", "5%"), DropEntry("世界BOSS", "6%"), DropEntry("跨服BOSS", "6%"), DropEntry("沙巴克BOSS", "8%")))
            )
        )
    )
}
