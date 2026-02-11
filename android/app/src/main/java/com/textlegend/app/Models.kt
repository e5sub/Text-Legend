package com.textlegend.app

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonElement

@Serializable
data class CaptchaResponse(
    val ok: Boolean = false,
    val token: String = "",
    val svg: String = ""
)

@Serializable
data class RealmInfo(
    val id: Int = 1,
    val name: String = ""
)

@Serializable
data class RealmsResponse(
    val ok: Boolean = false,
    val count: Int = 0,
    val realms: List<RealmInfo> = emptyList()
)

@Serializable
data class LoginResponse(
    val ok: Boolean = false,
    val token: String = "",
    val characters: List<CharacterBrief> = emptyList(),
    val realmId: Int = 1
)

@Serializable
data class GenericOkResponse(
    val ok: Boolean = false,
    val error: String? = null
)

@Serializable
data class CharacterBrief(
    val name: String = "",
    val level: Int = 1,
    @SerialName("class") val classId: String = ""
)

@Serializable
data class GameState(
    val player: PlayerInfo? = null,
    val room: RoomInfo? = null,
    val exits: List<ExitInfo> = emptyList(),
    val mobs: List<MobInfo> = emptyList(),
    val skills: List<SkillInfo> = emptyList(),
    val items: List<ItemInfo> = emptyList(),
    val stats: StatsInfo? = null,
    val summon: SummonInfo? = null,
    val summons: List<SummonInfo> = emptyList(),
    val equipment: List<EquipmentInfo> = emptyList(),
    val guild: String? = null,
    val guild_role: String? = null,
    val party: PartyInfo? = null,
    val training: TrainingInfo? = null,
    val online: OnlineInfo? = null,
    val trade: TradeInfo? = null,
    val sabak: SabakInfo? = null,
    val worldBossRank: List<RankInfo> = emptyList(),
    val worldBossClassRank: List<RankInfo>? = null,
    val worldBossNextRespawn: Long? = null,
    val crossRank: CrossRankInfo? = null,
    val players: List<PlayerBrief> = emptyList(),
    val bossRespawn: Long? = null,
    val server_time: Long? = null,
    val vip_self_claim_enabled: Boolean = true,
    val svip_settings: SvipSettings? = null,
    val state_throttle_enabled: Boolean = false,
    val state_throttle_interval_sec: Int = 0,
    val state_throttle_override_server_allowed: Boolean = false,
    val refine_material_count: Int = 0,
    val refine_config: RefineConfig? = null,
    val anti: AntiInfo? = null,
    val effect_reset_config: EffectResetConfig? = null
)

@Serializable
data class AntiInfo(
    val key: String? = null,
    val seq: Long = 0
)

@Serializable
data class PlayerInfo(
    val name: String = "",
    val classId: String = "",
    val level: Int = 1,
    val realmId: Int = 1,
    val guildId: Int? = null,
    val rankTitle: String? = null
)

@Serializable
data class RoomInfo(
    val zone: String = "",
    val name: String = "",
    val zoneId: String = "",
    val roomId: String = ""
)

@Serializable
data class ExitInfo(
    val dir: String = "",
    val label: String = ""
)

@Serializable
data class MobInfo(
    val id: String? = null,
    val name: String = "",
    val hp: Int = 0,
    @SerialName("max_hp") val maxHp: Int = 0,
    val mdef: Int = 0
)

@Serializable
data class SkillInfo(
    val id: String = "",
    val name: String = "",
    val mp: Int = 0,
    val type: String = "",
    val level: Int = 1,
    val exp: Int = 0,
    val expNext: Int = 0
)

@Serializable
data class ItemInfo(
    val id: String = "",
    val key: String = "",
    val name: String = "",
    val qty: Int = 1,
    val type: String = "",
    val slot: String? = null,
    val rarity: String? = null,
    val is_set: Boolean = false,
    val price: Int = 0,
    val hp: Int = 0,
    val mp: Int = 0,
    val atk: Int = 0,
    val def: Int = 0,
    val mdef: Int = 0,
    val mag: Int = 0,
    val spirit: Int = 0,
    val dex: Int = 0,
    val durability: Int? = null,
    val max_durability: Int? = null,
    val refine_level: Int = 0,
    val effects: JsonObject? = null,
    val is_shop_item: Boolean = false,
    val untradable: Boolean = false,
    val unconsignable: Boolean = false
)

@Serializable
data class EquipmentInfo(
    val slot: String = "",
    val durability: Int? = null,
    val max_durability: Int? = null,
    val refine_level: Int = 0,
    val item: ItemInfo? = null
)

@Serializable
data class StatsInfo(
    val hp: Int = 0,
    @SerialName("max_hp") val maxHp: Int = 0,
    val mp: Int = 0,
    @SerialName("max_mp") val maxMp: Int = 0,
    val exp: Int = 0,
    @SerialName("exp_next") val expNext: Int = 0,
    val gold: Int = 0,
    val yuanbao: Int = 0,
    val atk: Int = 0,
    val def: Int = 0,
    val mag: Int = 0,
    val spirit: Int = 0,
    val mdef: Int = 0,
    val pk: Int = 0,
    val vip: Boolean = false,
    val vip_expires_at: Long? = null,
    val svip: Boolean = false,
    val svip_expires_at: Long? = null,
    val dodge: Int = 0,
    val cultivation_level: Int = -1,
    val cultivation_bonus: Int = 0,
    val autoSkillId: JsonElement? = null,
    val autoFullEnabled: Boolean = false,
    val autoFullTrialAvailable: Boolean = false,
    val autoFullTrialRemainingSec: Int? = null,
    val sabak_bonus: Boolean = false,
    val set_bonus: Boolean = false
)

@Serializable
data class SvipSettings(
    val prices: SvipPrices? = null
)

@Serializable
data class SvipPrices(
    val month: Int = 0,
    val quarter: Int = 0,
    val year: Int = 0,
    val permanent: Int = 0
)

@Serializable
data class SummonInfo(
    val id: String = "",
    val name: String = "",
    val level: Int = 1,
    val levelMax: Int = 1,
    val exp: Int = 0,
    val exp_next: Int = 0,
    val hp: Int = 0,
    @SerialName("max_hp") val maxHp: Int = 0,
    val atk: Int = 0,
    val def: Int = 0,
    val mdef: Int = 0
)

@Serializable
data class PartyInfo(
    val size: Int = 0,
    val leader: String = "",
    val members: List<PartyMember> = emptyList()
)

@Serializable
data class PartyMember(
    val name: String = "",
    val online: Boolean = false
)

@Serializable
data class TrainingInfo(
    val hp: Int = 0,
    val mp: Int = 0,
    val atk: Int = 0,
    val def: Int = 0,
    val mag: Int = 0,
    val mdef: Int = 0,
    val spirit: Int = 0,
    val dex: Int = 0
)

@Serializable
data class OnlineInfo(
    val count: Int = 0
)

@Serializable
data class TradeInfo(
    val partnerName: String = "",
    val myItems: List<TradeItem> = emptyList(),
    val myGold: Int = 0,
    val partnerItems: List<TradeItem> = emptyList(),
    val partnerGold: Int = 0,
    val locked: Map<String, Boolean>? = null,
    val confirmed: Map<String, Boolean>? = null
)

@Serializable
data class TradeItem(
    val id: String = "",
    val qty: Int = 1,
    val effects: JsonObject? = null
)

@Serializable
data class SabakInfo(
    val inZone: Boolean = false,
    val active: Boolean = false,
    val ownerGuildId: Int? = null,
    val ownerGuildName: String? = null,
    val inPalace: Boolean = false,
    val palaceKillStats: List<SabakKillStat>? = null,
    val siegeEndsAt: Long? = null
)

@Serializable
data class SabakKillStat(
    val name: String = "",
    val kills: Int = 0
)

@Serializable
data class RankInfo(
    val name: String = "",
    val value: Int = 0,
    val attr: String? = null
)

@Serializable
data class CrossRankInfo(
    val active: Boolean = false,
    val startsAt: Long? = null,
    val endsAt: Long? = null,
    val entries: List<CrossRankEntry> = emptyList()
)

@Serializable
data class CrossRankEntry(
    val name: String = "",
    val kills: Int = 0
)

@Serializable
data class PlayerBrief(
    val name: String = "",
    val classId: String = "",
    val level: Int = 1,
    val hp: Int = 0,
    @SerialName("max_hp") val maxHp: Int = 0,
    val guild: String? = null,
    val guildId: Int? = null,
    val realmId: Int = 1,
    val pk: Int = 0
)

@Serializable
data class RefineConfig(
    val base_success_rate: Double = 0.0,
    val decay_rate: Double = 0.0,
    val material_count: Int = 0,
    val bonus_per_level: Double = 0.0
)

@Serializable
data class EffectResetConfig(
    val success_rate: Double = 0.0,
    val double_rate: Double = 0.0,
    val triple_rate: Double = 0.0,
    val quadruple_rate: Double = 0.0,
    val quintuple_rate: Double = 0.0
)

@Serializable
data class MailPayload(
    val id: Int = 0,
    val from_name: String? = null,
    val to_name: String? = null,
    val title: String = "",
    val body: String = "",
    val created_at: String? = null,
    val read_at: String? = null,
    val claimed_at: String? = null,
    val gold: Int = 0,
    val items: List<ItemInfo> = emptyList()
)

@Serializable
data class MailListResponse(
    val ok: Boolean = false,
    val mails: List<MailPayload> = emptyList(),
    val folder: String? = null
)

@Serializable
data class GuildMemberInfo(
    val name: String = "",
    val role: String = "",
    val online: Boolean = false,
    val level: Int = 1,
    val classId: String = ""
)

@Serializable
data class GuildMembersResponse(
    val ok: Boolean = false,
    val error: String? = null,
    val guildId: Int? = null,
    val guildName: String? = null,
    val members: List<GuildMemberInfo> = emptyList()
)

@Serializable
data class GuildInfo(
    val id: Int = 0,
    val name: String = "",
    val memberCount: Int = 0
)

@Serializable
data class GuildListResponse(
    val ok: Boolean = false,
    val guilds: List<GuildInfo> = emptyList()
)

@Serializable
data class GuildApplication(
    val id: Int = 0,
    val charName: String = "",
    val userId: Int = 0
)

@Serializable
data class GuildApplicationsResponse(
    val ok: Boolean = false,
    val error: String? = null,
    val applications: List<GuildApplication> = emptyList()
)

@Serializable
data class SabakInfoResponse(
    val ok: Boolean = false,
    val current: SabakSummary? = null,
    val registrable: Boolean = false,
    val registrations: List<SabakRegistration> = emptyList()
)

@Serializable
data class SabakSummary(
    val ownerGuildId: Int? = null,
    val ownerGuildName: String? = null,
    val active: Boolean = false,
    val startsAt: Long? = null,
    val endsAt: Long? = null
)

@Serializable
data class SabakRegistration(
    val guildId: Int? = null,
    val guildName: String? = null
)

@Serializable
data class SimpleResult(
    val ok: Boolean = false,
    val msg: String? = null
)

@Serializable
data class ConsignListPayload(
    val type: String = "market",
    val items: List<ConsignItem> = emptyList()
)

@Serializable
data class ConsignItem(
    val id: Int = 0,
    val seller_name: String? = null,
    val seller: String? = null,
    val item_id: String = "",
    val item_name: String? = null,
    val qty: Int = 1,
    val price: Int = 0,
    val created_at: String? = null,
    val expires_at: String? = null,
    val effects: JsonObject? = null,
    val refine_level: Int = 0,
    val item: ItemInfo? = null
)

@Serializable
data class ConsignHistoryPayload(
    val items: List<ConsignHistoryItem> = emptyList()
)

@Serializable
data class ConsignHistoryItem(
    val id: Int = 0,
    val buyer_name: String? = null,
    val buyer: String? = null,
    val item_id: String = "",
    val item_name: String? = null,
    val qty: Int = 1,
    val price: Int = 0,
    val created_at: String? = null,
    val effects: JsonObject? = null,
    val refine_level: Int = 0,
    val total: Int = 0,
    val soldAt: String? = null,
    val item: ItemInfo? = null
)

@Serializable
data class OutputPayload(
    val text: String? = null,
    val prefix: String? = null,
    val color: String? = null,
    val prefixColor: String? = null,
    val rankTitle: String? = null,
    val location: ChatLocation? = null
)

@Serializable
data class ChatLocation(
    val label: String = "",
    val zoneId: String? = null,
    val roomId: String? = null
)
