const ADMIN_BASE = (() => {
  if (window.__ADMIN_BASE__) return String(window.__ADMIN_BASE__);
  const parts = window.location.pathname.split('/').filter(Boolean);
  const first = parts[0] || 'admin';
  return `/${first}`;
})();
function adminPath(path) {
  if (!path) return ADMIN_BASE;
  if (path.startsWith('/admin')) {
    return `${ADMIN_BASE}${path.slice('/admin'.length)}`;
  }
  if (path.startsWith('/')) return `${ADMIN_BASE}${path}`;
  return `${ADMIN_BASE}/${path}`;
}
const loginSection = document.getElementById('login');
const dashboardSection = document.getElementById('dashboard');
const loginMsg = document.getElementById('login-msg');
const usersList = document.getElementById('users-list');
const vipCodesResult = document.getElementById('vip-codes-result');
const vipCodesList = document.getElementById('vip-codes-list');
const vipCodesTableContainer = document.getElementById('vip-codes-table-container');
const vipCodesPrev = document.getElementById('vip-codes-prev');
const vipCodesNext = document.getElementById('vip-codes-next');
const vipCodesPage = document.getElementById('vip-codes-page');
const rechargeCodesResult = document.getElementById('recharge-codes-result');
const rechargeCodesList = document.getElementById('recharge-codes-list');
const rechargeCodesTableContainer = document.getElementById('recharge-codes-table-container');
const rechargeCodesPrev = document.getElementById('recharge-codes-prev');
const rechargeCodesNext = document.getElementById('recharge-codes-next');
const rechargeCodesPage = document.getElementById('recharge-codes-page');
const firstRechargeEnabledInput = document.getElementById('first-recharge-enabled');
const firstRechargeGrantDivineBeastInput = document.getElementById('first-recharge-grant-divine-beast');
const firstRechargeYuanbaoInput = document.getElementById('first-recharge-yuanbao');
const firstRechargeGoldInput = document.getElementById('first-recharge-gold');
const firstRechargeTrainingFruitInput = document.getElementById('first-recharge-training-fruit');
const firstRechargePetTrainingFruitInput = document.getElementById('first-recharge-pet-training-fruit');
const firstRechargeTreasureExpInput = document.getElementById('first-recharge-treasure-exp');
const firstRechargeLoadBtn = document.getElementById('first-recharge-load-btn');
const firstRechargeSaveBtn = document.getElementById('first-recharge-save-btn');
const firstRechargeReissueCharInput = document.getElementById('first-recharge-reissue-char');
const firstRechargeReissueRealmInput = document.getElementById('first-recharge-reissue-realm');
const firstRechargeReissueBtn = document.getElementById('first-recharge-reissue-btn');
const firstRechargeReissueDivineBeastBtn = document.getElementById('first-recharge-reissue-divine-beast-btn');
const firstRechargeReissueDivineBeastAllBtn = document.getElementById('first-recharge-reissue-divine-beast-all-btn');
const firstRechargeReissueAllBtn = document.getElementById('first-recharge-reissue-all-btn');
const firstRechargeMsg = document.getElementById('first-recharge-msg');
const inviteRewardEnabledInput = document.getElementById('invite-reward-enabled');
const inviteRewardRateInput = document.getElementById('invite-reward-rate');
const inviteRewardLoadBtn = document.getElementById('invite-reward-load-btn');
const inviteRewardSaveBtn = document.getElementById('invite-reward-save-btn');
const inviteRewardMsg = document.getElementById('invite-reward-msg');
const charMigrateCharInput = document.getElementById('char-migrate-char');
const charMigrateRealmInput = document.getElementById('char-migrate-realm');
const charMigrateTargetUserInput = document.getElementById('char-migrate-target-user');
const charMigrateBtn = document.getElementById('char-migrate-btn');
const charRestoreNameInput = document.getElementById('char-restore-name');
const charRestoreRealmInput = document.getElementById('char-restore-realm');
const charRestoreBtn = document.getElementById('char-restore-btn');
const charMigrateMsg = document.getElementById('char-migrate-msg');
const vipSelfClaimStatus = document.getElementById('vip-self-claim-status');
const vipSelfClaimMsg = document.getElementById('vip-self-claim-msg');
const vipSelfClaimToggle = document.getElementById('vip-self-claim-toggle');
const vipClaimLimitStatus = document.getElementById('vip-claim-limit-status');
const vipClaimLimitMsg = document.getElementById('vip-claim-limit-msg');
const vipClaimLimitToggle = document.getElementById('vip-claim-limit-toggle');
const svipPriceMonthInput = document.getElementById('svip-price-month');
const svipPriceQuarterInput = document.getElementById('svip-price-quarter');
const svipPriceYearInput = document.getElementById('svip-price-year');
const svipPricePermanentInput = document.getElementById('svip-price-permanent');
const svipSaveBtn = document.getElementById('svip-save-btn');
const svipMsg = document.getElementById('svip-msg');
const usersPaginationInfo = document.getElementById('users-pagination-info');
const backupMsg = document.getElementById('backup-msg');
const importFileInput = document.getElementById('import-file');
const themeToggleBtn = null;
const collapseAllBtn = null;
const dashboardServer = document.getElementById('dashboard-server');
const dashboardPlayers = document.getElementById('dashboard-players');
const dashboardEconomy = document.getElementById('dashboard-economy');
const dashboardOps = document.getElementById('dashboard-ops');
const dashboardRecentLogins = document.getElementById('dashboard-recent-logins');
const dashboardRefreshBtn = document.getElementById('dashboard-refresh-btn');
const dashboardMsg = document.getElementById('dashboard-msg');
const gmMailScopeSelect = document.getElementById('gm-mail-scope');
const gmMailRealmSelect = document.getElementById('gm-mail-realm');
const gmMailUserRow = document.getElementById('gm-mail-user-row');
const gmMailUsernameInput = document.getElementById('gm-mail-username');
const gmMailCharacterInput = document.getElementById('gm-mail-character');
const gmMailTitleInput = document.getElementById('gm-mail-title');
const gmMailBodyInput = document.getElementById('gm-mail-body');
const gmMailGoldInput = document.getElementById('gm-mail-gold');
const gmMailYuanbaoInput = document.getElementById('gm-mail-yuanbao');
const gmMailItemIdInput = document.getElementById('gm-mail-item-id');
const gmMailItemQtyInput = document.getElementById('gm-mail-item-qty');
const gmMailItemAddBtn = document.getElementById('gm-mail-item-add');
const gmMailItemList = document.getElementById('gm-mail-item-list');
const gmMailSendBtn = document.getElementById('gm-mail-send-btn');
const gmMailMsg = document.getElementById('gm-mail-msg');

const stateThrottleToggle = document.getElementById('state-throttle-toggle');
const stateThrottleOverrideAllowedToggle = document.getElementById('state-throttle-override-allowed');
const cacheMonsterHealthToggle = document.getElementById('cache-monster-health-toggle');
const stateThrottleIntervalInput = document.getElementById('state-throttle-interval');
const stateThrottleSaveBtn = document.getElementById('state-throttle-save');
const stateThrottleStatus = document.getElementById('state-throttle-status');
const stateThrottleMsg = document.getElementById('state-throttle-msg');
const playerSaveDebounceInput = document.getElementById('player-save-debounce');
const playerSaveMinIntervalInput = document.getElementById('player-save-min-interval');
const playerSaveManagedIntervalInput = document.getElementById('player-save-managed-interval');
const playerSaveDetachedIntervalInput = document.getElementById('player-save-detached-interval');
const playerSaveForceDeadlineInput = document.getElementById('player-save-force-deadline');
const playerSaveMaxWritesInput = document.getElementById('player-save-max-writes');
const roomVariantStatus = document.getElementById('room-variant-status');
const roomVariantMsg = document.getElementById('room-variant-msg');
const roomVariantInput = document.getElementById('room-variant-count');
const roomVariantSaveBtn = document.getElementById('room-variant-save');
const cmdRateGlobalLimitInput = document.getElementById('cmd-rate-global-limit');
const cmdRateGlobalWindowInput = document.getElementById('cmd-rate-global-window');
const cmdRateBurstLimitInput = document.getElementById('cmd-rate-burst-limit');
const cmdRateBurstWindowInput = document.getElementById('cmd-rate-burst-window');
const cmdCooldownConsignInput = document.getElementById('cmd-cooldown-consign');
const smtpEnabledInput = document.getElementById('smtp-enabled');
const smtpHostInput = document.getElementById('smtp-host');
const smtpPortInput = document.getElementById('smtp-port');
const smtpSecureInput = document.getElementById('smtp-secure');
const smtpUserInput = document.getElementById('smtp-user');
const smtpPasswordInput = document.getElementById('smtp-password');
const smtpFromInput = document.getElementById('smtp-from');
const smtpLoadBtn = document.getElementById('smtp-load-btn');
const smtpSaveBtn = document.getElementById('smtp-save-btn');
const smtpTestBtn = document.getElementById('smtp-test-btn');
const smtpMsg = document.getElementById('smtp-msg');

const VIP_CODES_PAGE_SIZE = 50;
const RECHARGE_CODES_PAGE_SIZE = 50;
let vipCodesPageIndex = 0;
let vipCodesTotal = 0;
let rechargeCodesPageIndex = 0;
let rechargeCodesTotal = 0;
const cmdCooldownTradeInput = document.getElementById('cmd-cooldown-trade');
const cmdCooldownMailInput = document.getElementById('cmd-cooldown-mail');
const cmdRateSaveBtn = document.getElementById('cmd-rate-save');
const cmdRateMsg = document.getElementById('cmd-rate-msg');
const usersSearchInput = document.getElementById('users-search');
const usersSearchBtn = document.getElementById('users-search-btn');
const sponsorsList = document.getElementById('sponsors-list');
const sponsorNameInput = document.getElementById('sponsor-name');
const sponsorAmountInput = document.getElementById('sponsor-amount');
const sponsorAddBtn = document.getElementById('sponsor-add-btn');
const sponsorRefreshBtn = document.getElementById('sponsor-refresh-btn');
const sponsorMsg = document.getElementById('sponsor-msg');
const sponsorsPaginationInfo = document.getElementById('sponsors-pagination-info');
const sponsorsPrevPageBtn = document.getElementById('sponsors-prev-page');
const sponsorsNextPageBtn = document.getElementById('sponsors-next-page');

// 修炼果配置相关
const tfMsg = document.getElementById('tf-msg');
const tfCoefficientInput = document.getElementById('tf-coefficient');
const tfDropRateInput = document.getElementById('tf-drop-rate');
const tfDropEnabledInput = document.getElementById('tf-drop-enabled');
const tfPetDropEnabledInput = document.getElementById('tf-pet-drop-enabled');
const tfSaveBtn = document.getElementById('tf-save-btn');

// 修炼系统配置相关
const trainingMsg = document.getElementById('training-msg');
const trainingInputs = {
  hp: document.getElementById('training-hp'),
  mp: document.getElementById('training-mp'),
  atk: document.getElementById('training-atk'),
  def: document.getElementById('training-def'),
  mag: document.getElementById('training-mag'),
  mdef: document.getElementById('training-mdef'),
  spirit: document.getElementById('training-spirit'),
  dex: document.getElementById('training-dex')
};
const trainingSaveBtn = document.getElementById('training-save-btn');

// 锻造系统配置相关
const refineMsg = document.getElementById('refine-msg');
const refineBaseSuccessRateInput = document.getElementById('refine-base-success-rate');
const refineDecayRateInput = document.getElementById('refine-decay-rate');
const refineMaterialCountInput = document.getElementById('refine-material-count');
const refineBonusPerLevelInput = document.getElementById('refine-bonus-per-level');
const refineSaveBtn = document.getElementById('refine-save-btn');

// 装备成长配置相关
const ultimateGrowthMsg = document.getElementById('ug-msg');
const ultimateGrowthEnabledInput = document.getElementById('ug-enabled');
const ultimateGrowthMaxLevelInput = document.getElementById('ug-max-level');
const ultimateGrowthPerLevelPctInput = document.getElementById('ug-per-level-pct');
const ultimateGrowthTierEveryInput = document.getElementById('ug-tier-every');
const ultimateGrowthTierBonusPctInput = document.getElementById('ug-tier-bonus-pct');
const ultimateGrowthBreakthroughEveryInput = document.getElementById('ug-breakthrough-every');
const ultimateGrowthBreakthroughMaterialCostInput = document.getElementById('ug-breakthrough-material-cost');
const ultimateGrowthGoldCostInput = document.getElementById('ug-gold-cost');
const ultimateGrowthSuccessRateEarlyInput = document.getElementById('ug-success-rate-early');
const ultimateGrowthSuccessRateMidInput = document.getElementById('ug-success-rate-mid');
const ultimateGrowthSuccessRateLateInput = document.getElementById('ug-success-rate-late');
const ultimateGrowthFailStackBonusPctInput = document.getElementById('ug-fail-stack-bonus-pct');
const ultimateGrowthFailStackCapPctInput = document.getElementById('ug-fail-stack-cap-pct');
const ultimateGrowthLoadBtn = document.getElementById('ug-load-btn');
const ultimateGrowthSaveBtn = document.getElementById('ug-save-btn');
const ULTIMATE_GROWTH_FIXED_MATERIAL_ID = 'ultimate_growth_stone';
const ULTIMATE_GROWTH_FIXED_BREAK_MATERIAL_ID = 'ultimate_growth_break_stone';

// 特效重置配置相关
const effectResetMsg = document.getElementById('effect-reset-msg');
const effectResetSuccessRateInput = document.getElementById('effect-reset-success-rate');
const effectResetDoubleRateInput = document.getElementById('effect-reset-double-rate');
const effectResetTripleRateInput = document.getElementById('effect-reset-triple-rate');
const effectResetQuadrupleRateInput = document.getElementById('effect-reset-quadruple-rate');
const effectResetQuintupleRateInput = document.getElementById('effect-reset-quintuple-rate');
const effectDropSingleChanceInput = document.getElementById('effect-drop-single-chance');
const effectDropDoubleChanceInput = document.getElementById('effect-drop-double-chance');
const equipSkillDropChanceInput = document.getElementById('equip-skill-drop-chance');
const effectResetSaveBtn = document.getElementById('effect-reset-save-btn');

// 宠物系统配置
const petSettingsMsg = document.getElementById('pet-settings-msg');
const petSettingsRefreshBtn = document.getElementById('pet-settings-refresh');
const petSettingsSaveBtn = document.getElementById('pet-settings-save');
const petSettingsResetSkillEffectsBtn = document.getElementById('pet-settings-reset-skill-effects');
const petMaxOwnedInput = document.getElementById('pet-max-owned');
const petBaseSkillSlotsInput = document.getElementById('pet-base-skill-slots');
const petMaxSkillSlotsInput = document.getElementById('pet-max-skill-slots');
const petSynthesisCostInput = document.getElementById('pet-synthesis-cost');
const petComprehendMaxSkillsInput = document.getElementById('pet-comprehend-max-skills');
const petBookUnlockSlot4ChanceInput = document.getElementById('pet-book-unlock-slot4-chance');
const petSynthesisUnlockSlotChanceInput = document.getElementById('pet-synthesis-unlock-slot-chance');
const petSynthesisInheritChanceInput = document.getElementById('pet-synthesis-inherit-chance');
const petSynthesisMultiSkillChanceInput = document.getElementById('pet-synthesis-multi-chance');
const petDropBaseExcellentInput = document.getElementById('pet-drop-base-excellent');
const petDropBaseRareInput = document.getElementById('pet-drop-base-rare');
const petDropBaseEpicInput = document.getElementById('pet-drop-base-epic');
const petDropBaseLegendaryInput = document.getElementById('pet-drop-base-legendary');
const petDropBaseSupremeInput = document.getElementById('pet-drop-base-supreme');
const petDropBaseUltimateInput = document.getElementById('pet-drop-base-ultimate');
const petDropMaxChanceInput = document.getElementById('pet-drop-max-chance');
const petDropBonusMinInput = document.getElementById('pet-drop-bonus-min');
const petDropWeightNormalInput = document.getElementById('pet-drop-weight-normal');
const petDropWeightExcellentInput = document.getElementById('pet-drop-weight-excellent');
const petDropWeightRareInput = document.getElementById('pet-drop-weight-rare');
const petDropWeightEpicInput = document.getElementById('pet-drop-weight-epic');
const petDropWeightLegendaryInput = document.getElementById('pet-drop-weight-legendary');
const petDropWeightSupremeInput = document.getElementById('pet-drop-weight-supreme');
const petDropWeightUltimateInput = document.getElementById('pet-drop-weight-ultimate');
const petBookBaseExcellentInput = document.getElementById('pet-book-base-excellent');
const petBookBaseRareInput = document.getElementById('pet-book-base-rare');
const petBookBaseEpicInput = document.getElementById('pet-book-base-epic');
const petBookBaseLegendaryInput = document.getElementById('pet-book-base-legendary');
const petBookBaseSupremeInput = document.getElementById('pet-book-base-supreme');
const petBookBaseUltimateInput = document.getElementById('pet-book-base-ultimate');
const petBookHighExcellentInput = document.getElementById('pet-book-high-excellent');
const petBookHighRareInput = document.getElementById('pet-book-high-rare');
const petBookHighEpicInput = document.getElementById('pet-book-high-epic');
const petBookHighLegendaryInput = document.getElementById('pet-book-high-legendary');
const petBookHighSupremeInput = document.getElementById('pet-book-high-supreme');
const petBookHighUltimateInput = document.getElementById('pet-book-high-ultimate');
const petBookSecondChanceInput = document.getElementById('pet-book-second-chance');
const petBookSecondEligibleInput = document.getElementById('pet-book-second-eligible');
const petBookSecondRequireSpecialInput = document.getElementById('pet-book-second-require-special');
const petGrowthMinNormalInput = document.getElementById('pet-growth-min-normal');
const petGrowthMaxNormalInput = document.getElementById('pet-growth-max-normal');
const petGrowthMinExcellentInput = document.getElementById('pet-growth-min-excellent');
const petGrowthMaxExcellentInput = document.getElementById('pet-growth-max-excellent');
const petGrowthMinRareInput = document.getElementById('pet-growth-min-rare');
const petGrowthMaxRareInput = document.getElementById('pet-growth-max-rare');
const petGrowthMinEpicInput = document.getElementById('pet-growth-min-epic');
const petGrowthMaxEpicInput = document.getElementById('pet-growth-max-epic');
const petGrowthMinLegendaryInput = document.getElementById('pet-growth-min-legendary');
const petGrowthMaxLegendaryInput = document.getElementById('pet-growth-max-legendary');
const petGrowthMinSupremeInput = document.getElementById('pet-growth-min-supreme');
const petGrowthMaxSupremeInput = document.getElementById('pet-growth-max-supreme');
const petGrowthMinUltimateInput = document.getElementById('pet-growth-min-ultimate');
const petGrowthMaxUltimateInput = document.getElementById('pet-growth-max-ultimate');
const petAptHpMinNormalInput = document.getElementById('pet-apt-hp-min-normal');
const petAptHpMaxNormalInput = document.getElementById('pet-apt-hp-max-normal');
const petAptAtkMinNormalInput = document.getElementById('pet-apt-atk-min-normal');
const petAptAtkMaxNormalInput = document.getElementById('pet-apt-atk-max-normal');
const petAptDefMinNormalInput = document.getElementById('pet-apt-def-min-normal');
const petAptDefMaxNormalInput = document.getElementById('pet-apt-def-max-normal');
const petAptMagMinNormalInput = document.getElementById('pet-apt-mag-min-normal');
const petAptMagMaxNormalInput = document.getElementById('pet-apt-mag-max-normal');
const petAptAgiMinNormalInput = document.getElementById('pet-apt-agi-min-normal');
const petAptAgiMaxNormalInput = document.getElementById('pet-apt-agi-max-normal');
const petAptHpMinExcellentInput = document.getElementById('pet-apt-hp-min-excellent');
const petAptHpMaxExcellentInput = document.getElementById('pet-apt-hp-max-excellent');
const petAptAtkMinExcellentInput = document.getElementById('pet-apt-atk-min-excellent');
const petAptAtkMaxExcellentInput = document.getElementById('pet-apt-atk-max-excellent');
const petAptDefMinExcellentInput = document.getElementById('pet-apt-def-min-excellent');
const petAptDefMaxExcellentInput = document.getElementById('pet-apt-def-max-excellent');
const petAptMagMinExcellentInput = document.getElementById('pet-apt-mag-min-excellent');
const petAptMagMaxExcellentInput = document.getElementById('pet-apt-mag-max-excellent');
const petAptAgiMinExcellentInput = document.getElementById('pet-apt-agi-min-excellent');
const petAptAgiMaxExcellentInput = document.getElementById('pet-apt-agi-max-excellent');
const petAptHpMinRareInput = document.getElementById('pet-apt-hp-min-rare');
const petAptHpMaxRareInput = document.getElementById('pet-apt-hp-max-rare');
const petAptAtkMinRareInput = document.getElementById('pet-apt-atk-min-rare');
const petAptAtkMaxRareInput = document.getElementById('pet-apt-atk-max-rare');
const petAptDefMinRareInput = document.getElementById('pet-apt-def-min-rare');
const petAptDefMaxRareInput = document.getElementById('pet-apt-def-max-rare');
const petAptMagMinRareInput = document.getElementById('pet-apt-mag-min-rare');
const petAptMagMaxRareInput = document.getElementById('pet-apt-mag-max-rare');
const petAptAgiMinRareInput = document.getElementById('pet-apt-agi-min-rare');
const petAptAgiMaxRareInput = document.getElementById('pet-apt-agi-max-rare');
const petAptHpMinEpicInput = document.getElementById('pet-apt-hp-min-epic');
const petAptHpMaxEpicInput = document.getElementById('pet-apt-hp-max-epic');
const petAptAtkMinEpicInput = document.getElementById('pet-apt-atk-min-epic');
const petAptAtkMaxEpicInput = document.getElementById('pet-apt-atk-max-epic');
const petAptDefMinEpicInput = document.getElementById('pet-apt-def-min-epic');
const petAptDefMaxEpicInput = document.getElementById('pet-apt-def-max-epic');
const petAptMagMinEpicInput = document.getElementById('pet-apt-mag-min-epic');
const petAptMagMaxEpicInput = document.getElementById('pet-apt-mag-max-epic');
const petAptAgiMinEpicInput = document.getElementById('pet-apt-agi-min-epic');
const petAptAgiMaxEpicInput = document.getElementById('pet-apt-agi-max-epic');
const petAptHpMinLegendaryInput = document.getElementById('pet-apt-hp-min-legendary');
const petAptHpMaxLegendaryInput = document.getElementById('pet-apt-hp-max-legendary');
const petAptAtkMinLegendaryInput = document.getElementById('pet-apt-atk-min-legendary');
const petAptAtkMaxLegendaryInput = document.getElementById('pet-apt-atk-max-legendary');
const petAptDefMinLegendaryInput = document.getElementById('pet-apt-def-min-legendary');
const petAptDefMaxLegendaryInput = document.getElementById('pet-apt-def-max-legendary');
const petAptMagMinLegendaryInput = document.getElementById('pet-apt-mag-min-legendary');
const petAptMagMaxLegendaryInput = document.getElementById('pet-apt-mag-max-legendary');
const petAptAgiMinLegendaryInput = document.getElementById('pet-apt-agi-min-legendary');
const petAptAgiMaxLegendaryInput = document.getElementById('pet-apt-agi-max-legendary');
const petAptHpMinSupremeInput = document.getElementById('pet-apt-hp-min-supreme');
const petAptHpMaxSupremeInput = document.getElementById('pet-apt-hp-max-supreme');
const petAptAtkMinSupremeInput = document.getElementById('pet-apt-atk-min-supreme');
const petAptAtkMaxSupremeInput = document.getElementById('pet-apt-atk-max-supreme');
const petAptDefMinSupremeInput = document.getElementById('pet-apt-def-min-supreme');
const petAptDefMaxSupremeInput = document.getElementById('pet-apt-def-max-supreme');
const petAptMagMinSupremeInput = document.getElementById('pet-apt-mag-min-supreme');
const petAptMagMaxSupremeInput = document.getElementById('pet-apt-mag-max-supreme');
const petAptAgiMinSupremeInput = document.getElementById('pet-apt-agi-min-supreme');
const petAptAgiMaxSupremeInput = document.getElementById('pet-apt-agi-max-supreme');
const petAptHpMinUltimateInput = document.getElementById('pet-apt-hp-min-ultimate');
const petAptHpMaxUltimateInput = document.getElementById('pet-apt-hp-max-ultimate');
const petAptAtkMinUltimateInput = document.getElementById('pet-apt-atk-min-ultimate');
const petAptAtkMaxUltimateInput = document.getElementById('pet-apt-atk-max-ultimate');
const petAptDefMinUltimateInput = document.getElementById('pet-apt-def-min-ultimate');
const petAptDefMaxUltimateInput = document.getElementById('pet-apt-def-max-ultimate');
const petAptMagMinUltimateInput = document.getElementById('pet-apt-mag-min-ultimate');
const petAptMagMaxUltimateInput = document.getElementById('pet-apt-mag-max-ultimate');
const petAptAgiMinUltimateInput = document.getElementById('pet-apt-agi-min-ultimate');
const petAptAgiMaxUltimateInput = document.getElementById('pet-apt-agi-max-ultimate');
const petSkillLibraryInput = document.getElementById('pet-skill-library');
const petSkillEffectsInput = document.getElementById('pet-skill-effects');
const PET_RARITY_ORDER = ['normal', 'excellent', 'rare', 'epic', 'legendary', 'supreme', 'ultimate'];
const petDropBaseInputs = {
  excellent: petDropBaseExcellentInput,
  rare: petDropBaseRareInput,
  epic: petDropBaseEpicInput,
  legendary: petDropBaseLegendaryInput,
  supreme: petDropBaseSupremeInput,
  ultimate: petDropBaseUltimateInput
};
const petDropWeightInputs = {
  normal: petDropWeightNormalInput,
  excellent: petDropWeightExcellentInput,
  rare: petDropWeightRareInput,
  epic: petDropWeightEpicInput,
  legendary: petDropWeightLegendaryInput,
  supreme: petDropWeightSupremeInput,
  ultimate: petDropWeightUltimateInput
};
const petBookBaseInputs = {
  excellent: petBookBaseExcellentInput,
  rare: petBookBaseRareInput,
  epic: petBookBaseEpicInput,
  legendary: petBookBaseLegendaryInput,
  supreme: petBookBaseSupremeInput,
  ultimate: petBookBaseUltimateInput
};
const petBookHighInputs = {
  excellent: petBookHighExcellentInput,
  rare: petBookHighRareInput,
  epic: petBookHighEpicInput,
  legendary: petBookHighLegendaryInput,
  supreme: petBookHighSupremeInput,
  ultimate: petBookHighUltimateInput
};
const petGrowthInputs = {
  normal: { min: petGrowthMinNormalInput, max: petGrowthMaxNormalInput },
  excellent: { min: petGrowthMinExcellentInput, max: petGrowthMaxExcellentInput },
  rare: { min: petGrowthMinRareInput, max: petGrowthMaxRareInput },
  epic: { min: petGrowthMinEpicInput, max: petGrowthMaxEpicInput },
  legendary: { min: petGrowthMinLegendaryInput, max: petGrowthMaxLegendaryInput },
  supreme: { min: petGrowthMinSupremeInput, max: petGrowthMaxSupremeInput },
  ultimate: { min: petGrowthMinUltimateInput, max: petGrowthMaxUltimateInput }
};
const petAptitudeInputs = {
  normal: {
    hp: { min: petAptHpMinNormalInput, max: petAptHpMaxNormalInput },
    atk: { min: petAptAtkMinNormalInput, max: petAptAtkMaxNormalInput },
    def: { min: petAptDefMinNormalInput, max: petAptDefMaxNormalInput },
    mag: { min: petAptMagMinNormalInput, max: petAptMagMaxNormalInput },
    agility: { min: petAptAgiMinNormalInput, max: petAptAgiMaxNormalInput }
  },
  excellent: {
    hp: { min: petAptHpMinExcellentInput, max: petAptHpMaxExcellentInput },
    atk: { min: petAptAtkMinExcellentInput, max: petAptAtkMaxExcellentInput },
    def: { min: petAptDefMinExcellentInput, max: petAptDefMaxExcellentInput },
    mag: { min: petAptMagMinExcellentInput, max: petAptMagMaxExcellentInput },
    agility: { min: petAptAgiMinExcellentInput, max: petAptAgiMaxExcellentInput }
  },
  rare: {
    hp: { min: petAptHpMinRareInput, max: petAptHpMaxRareInput },
    atk: { min: petAptAtkMinRareInput, max: petAptAtkMaxRareInput },
    def: { min: petAptDefMinRareInput, max: petAptDefMaxRareInput },
    mag: { min: petAptMagMinRareInput, max: petAptMagMaxRareInput },
    agility: { min: petAptAgiMinRareInput, max: petAptAgiMaxRareInput }
  },
  epic: {
    hp: { min: petAptHpMinEpicInput, max: petAptHpMaxEpicInput },
    atk: { min: petAptAtkMinEpicInput, max: petAptAtkMaxEpicInput },
    def: { min: petAptDefMinEpicInput, max: petAptDefMaxEpicInput },
    mag: { min: petAptMagMinEpicInput, max: petAptMagMaxEpicInput },
    agility: { min: petAptAgiMinEpicInput, max: petAptAgiMaxEpicInput }
  },
  legendary: {
    hp: { min: petAptHpMinLegendaryInput, max: petAptHpMaxLegendaryInput },
    atk: { min: petAptAtkMinLegendaryInput, max: petAptAtkMaxLegendaryInput },
    def: { min: petAptDefMinLegendaryInput, max: petAptDefMaxLegendaryInput },
    mag: { min: petAptMagMinLegendaryInput, max: petAptMagMaxLegendaryInput },
    agility: { min: petAptAgiMinLegendaryInput, max: petAptAgiMaxLegendaryInput }
  },
  supreme: {
    hp: { min: petAptHpMinSupremeInput, max: petAptHpMaxSupremeInput },
    atk: { min: petAptAtkMinSupremeInput, max: petAptAtkMaxSupremeInput },
    def: { min: petAptDefMinSupremeInput, max: petAptDefMaxSupremeInput },
    mag: { min: petAptMagMinSupremeInput, max: petAptMagMaxSupremeInput },
    agility: { min: petAptAgiMinSupremeInput, max: petAptAgiMaxSupremeInput }
  },
  ultimate: {
    hp: { min: petAptHpMinUltimateInput, max: petAptHpMaxUltimateInput },
    atk: { min: petAptAtkMinUltimateInput, max: petAptAtkMaxUltimateInput },
    def: { min: petAptDefMinUltimateInput, max: petAptDefMaxUltimateInput },
    mag: { min: petAptMagMinUltimateInput, max: petAptMagMaxUltimateInput },
    agility: { min: petAptAgiMinUltimateInput, max: petAptAgiMaxUltimateInput }
  }
};
let petSettingsCache = null;

// 法宝配置相关
const treasureMsg = document.getElementById('treasure-msg');
const treasureSlotCountInput = document.getElementById('treasure-slot-count');
const treasureMaxLevelInput = document.getElementById('treasure-max-level');
const treasureUpgradeConsumeInput = document.getElementById('treasure-upgrade-consume');
const treasureAdvanceConsumeInput = document.getElementById('treasure-advance-consume');
const treasureAdvancePerStageInput = document.getElementById('treasure-advance-per-stage');
const treasureAdvanceBonusPerStackInput = document.getElementById('treasure-advance-bonus-per-stack');
const treasureWorldBossDropMultiplierInput = document.getElementById('treasure-world-boss-drop-multiplier');
const treasureCrossBossDropMultiplierInput = document.getElementById('treasure-cross-boss-drop-multiplier');
const treasureTowerXuanmingDropChanceInput = document.getElementById('treasure-tower-xuanming-drop-chance');
const treasureSaveBtn = document.getElementById('treasure-save-btn');

// 世界BOSS相关
const wbMsg = document.getElementById('wb-msg');
const wbPlayerBonusList = document.getElementById('wb-player-bonus-list');
const wbKillRealmInput = document.getElementById('wb-kill-realm');
const wbKillCountInput = document.getElementById('wb-kill-count');
const wbKillMsg = document.getElementById('wb-kill-msg');
const wbBaseExpInput = document.getElementById('wb-base-exp');
const wbBaseGoldInput = document.getElementById('wb-base-gold');

// 特殊BOSS相关
const sbMsg = document.getElementById('sb-msg');
const sbPlayerBonusList = document.getElementById('sb-player-bonus-list');
const sbKillRealmInput = document.getElementById('sb-kill-realm');
const sbKillCountInput = document.getElementById('sb-kill-count');
const sbKillMsg = document.getElementById('sb-kill-msg');
const sbBaseExpInput = document.getElementById('sb-base-exp');
const sbBaseGoldInput = document.getElementById('sb-base-gold');

// 修真BOSS相关
const cbMsg = document.getElementById('cb-msg');
const cbBaseHpInput = document.getElementById('cb-base-hp');
const cbBaseAtkInput = document.getElementById('cb-base-atk');
const cbBaseDefInput = document.getElementById('cb-base-def');
const cbBaseMdefInput = document.getElementById('cb-base-mdef');
const cbBaseExpInput = document.getElementById('cb-base-exp');
const cbBaseGoldInput = document.getElementById('cb-base-gold');
const cbRespawnMinsInput = document.getElementById('cb-respawn-mins');
const cbDropBonusInput = document.getElementById('cb-drop-bonus');
const cbPlayerBonusList = document.getElementById('cb-player-bonus-list');
const cbKillRealmInput = document.getElementById('cb-kill-realm');
const cbKillCountInput = document.getElementById('cb-kill-count');
const cbKillMsg = document.getElementById('cb-kill-msg');
const pbMsg = document.getElementById('pb-msg');
const pbVipHpInput = document.getElementById('pb-vip-hp');
const pbVipAtkInput = document.getElementById('pb-vip-atk');
const pbVipDefInput = document.getElementById('pb-vip-def');
const pbVipMdefInput = document.getElementById('pb-vip-mdef');
const pbVipExpInput = document.getElementById('pb-vip-exp');
const pbVipGoldInput = document.getElementById('pb-vip-gold');
const pbVipRespawnMinsInput = document.getElementById('pb-vip-respawn-mins');
const pbVipDropBonusInput = document.getElementById('pb-vip-drop-bonus');
const pbSvipHpInput = document.getElementById('pb-svip-hp');
const pbSvipAtkInput = document.getElementById('pb-svip-atk');
const pbSvipDefInput = document.getElementById('pb-svip-def');
const pbSvipMdefInput = document.getElementById('pb-svip-mdef');
const pbSvipExpInput = document.getElementById('pb-svip-exp');
const pbSvipGoldInput = document.getElementById('pb-svip-gold');
const pbSvipRespawnMinsInput = document.getElementById('pb-svip-respawn-mins');
const pbSvipDropBonusInput = document.getElementById('pb-svip-drop-bonus');

const sabakTimeStartHourInput = document.getElementById('sabak-time-start-hour');
const sabakTimeStartMinuteInput = document.getElementById('sabak-time-start-minute');
const sabakTimeDurationInput = document.getElementById('sabak-time-duration');
const crossRankStartHourInput = document.getElementById('cross-rank-start-hour');
const crossRankStartMinuteInput = document.getElementById('cross-rank-start-minute');
const crossRankDurationInput = document.getElementById('cross-rank-duration');
const eventTimeMsg = document.getElementById('event-time-msg');
const activityPointShopMsg = document.getElementById('activity-point-shop-msg');
const activityPointShopLoadBtn = document.getElementById('activity-point-shop-load-btn');
const activityPointShopAddBtn = document.getElementById('activity-point-shop-add-btn');
const activityPointShopSaveBtn = document.getElementById('activity-point-shop-save-btn');
const activityPointShopItemSearchInput = document.getElementById('activity-point-shop-item-search');
const activityPointShopList = document.getElementById('activity-point-shop-list');
let activityPointShopRowsCache = [];
let activityPointShopItemOptionsCache = [];
let activityPointShopItemSearchKeyword = '';
const harvestSignMsg = document.getElementById('harvest-sign-msg');
const harvestSignLoadBtn = document.getElementById('harvest-sign-load-btn');
const harvestSignAddBtn = document.getElementById('harvest-sign-add-btn');
const harvestSignSaveBtn = document.getElementById('harvest-sign-save-btn');
const harvestSignTitleInput = document.getElementById('harvest-sign-title');
const harvestSignPointsInput = document.getElementById('harvest-sign-points');
const harvestSignGoldInput = document.getElementById('harvest-sign-gold');
const harvestSignItemSearchInput = document.getElementById('harvest-sign-item-search');
const harvestSignList = document.getElementById('harvest-sign-list');
let harvestSignRowsCache = [];
let harvestSignItemOptionsCache = [];
let harvestSignItemSearchKeyword = '';
const harvestRewardMsg = document.getElementById('harvest-reward-msg');
const harvestRewardLoadBtn = document.getElementById('harvest-reward-load-btn');
const harvestRewardAddBtn = document.getElementById('harvest-reward-add-btn');
const harvestRewardSaveBtn = document.getElementById('harvest-reward-save-btn');
const harvestRewardItemSearchInput = document.getElementById('harvest-reward-item-search');
const harvestRewardList = document.getElementById('harvest-reward-list');
let harvestRewardRowsCache = [];
let harvestRewardItemOptionsCache = [];
let harvestRewardItemSearchKeyword = '';
const divineBeastFragmentMsg = document.getElementById('divine-beast-fragment-msg');
const divineBeastFragmentLoadBtn = document.getElementById('divine-beast-fragment-load-btn');
const divineBeastFragmentAddBtn = document.getElementById('divine-beast-fragment-add-btn');
const divineBeastFragmentSaveBtn = document.getElementById('divine-beast-fragment-save-btn');
const divineBeastFragmentList = document.getElementById('divine-beast-fragment-list');
let divineBeastFragmentRowsCache = [];
let divineBeastFragmentOptionsCache = [];
const equipmentRecycleMsg = document.getElementById('equipment-recycle-msg');
const equipmentRecycleLoadBtn = document.getElementById('equipment-recycle-load-btn');
const equipmentRecycleAddBtn = document.getElementById('equipment-recycle-add-btn');
const equipmentRecycleSaveBtn = document.getElementById('equipment-recycle-save-btn');
const equipmentRecycleItemSearchInput = document.getElementById('equipment-recycle-item-search');
const equipmentRecycleList = document.getElementById('equipment-recycle-list');
let equipmentRecycleRowsCache = [];
let equipmentRecycleItemOptionsCache = [];
let equipmentRecycleItemSearchKeyword = '';
const guildSystemMsg = document.getElementById('guild-system-msg');
const guildSystemLoadBtn = document.getElementById('guild-system-load-btn');
const guildSystemShopAddBtn = document.getElementById('guild-system-shop-add-btn');
const guildSystemSaveBtn = document.getElementById('guild-system-save-btn');
const guildSystemLimitGoldInput = document.getElementById('guild-system-limit-gold');
const guildSystemLimitPointsInput = document.getElementById('guild-system-limit-points');
const guildSystemCostGoldInput = document.getElementById('guild-system-cost-gold');
const guildSystemCostPointsInput = document.getElementById('guild-system-cost-points');
const guildSystemGainGoldInput = document.getElementById('guild-system-gain-gold');
const guildSystemGainPointsInput = document.getElementById('guild-system-gain-points');
const guildSystemItemSearchInput = document.getElementById('guild-system-item-search');
const guildSystemShopList = document.getElementById('guild-system-shop-list');
let guildSystemShopRowsCache = [];
let guildSystemItemOptionsCache = [];
let guildSystemItemSearchKeyword = '';
const guildBuildingMsg = document.getElementById('guild-building-msg');
const guildBuildingLoadBtn = document.getElementById('guild-building-load-btn');
const guildBuildingSaveBtn = document.getElementById('guild-building-save-btn');
const guildBuildingLevelSummary = document.getElementById('guild-building-level-summary');
const guildBuildingDurationStepInput = document.getElementById('guild-building-duration-step');
const guildBuildingMemberBaseInput = document.getElementById('guild-building-member-base');
const guildBuildingMemberPerLevelInput = document.getElementById('guild-building-member-per-level');
const guildBuildingExpPerLevelInput = document.getElementById('guild-building-exp-per-level');
const guildBuildingGoldPerLevelInput = document.getElementById('guild-building-gold-per-level');
const guildBuildingHpPerLevelInput = document.getElementById('guild-building-hp-per-level');
const guildBuildingAtkPerLevelInput = document.getElementById('guild-building-atk-per-level');
const guildBuildingMagPerLevelInput = document.getElementById('guild-building-mag-per-level');
const guildBuildingSpiritPerLevelInput = document.getElementById('guild-building-spirit-per-level');
const guildBuildingDefPerLevelInput = document.getElementById('guild-building-def-per-level');
const guildBuildingMdefPerLevelInput = document.getElementById('guild-building-mdef-per-level');
let guildBuildingLevelRowsCache = [];

function getGuildBuildingDurationStepSec() {
  const step = Math.floor(Number(guildBuildingDurationStepInput?.value || 300));
  return Math.max(1, step);
}

function inferGuildBuildingDurationStepSec(durationsSec = []) {
  const values = Array.isArray(durationsSec) ? durationsSec : [];
  const lvl1 = Math.floor(Number(values[1] || 0));
  if (lvl1 > 0) return lvl1;
  for (let i = 1; i < values.length; i += 1) {
    const prev = Math.floor(Number(values[i - 1] || 0));
    const curr = Math.floor(Number(values[i] || 0));
    const diff = curr - prev;
    if (diff > 0) return diff;
  }
  return 300;
}

// 每日幸运玩家相关
const dailyLuckyMsg = document.getElementById('daily-lucky-msg');
const dailyLuckyTableContainer = document.getElementById('daily-lucky-table-container');
const dailyLuckyList = document.getElementById('daily-lucky-list');

const adminPwModal = document.getElementById('admin-pw-modal');
const adminPwTitle = document.getElementById('admin-pw-title');
const adminPwText = document.getElementById('admin-pw-text');
const adminPwInput = document.getElementById('admin-pw-input');
const adminPwCancel = document.getElementById('admin-pw-cancel');
const adminPwSubmit = document.getElementById('admin-pw-submit');

function getRealmIdFromInput(input, fallback = 1) {
  const raw = input?.value;
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// 存储区服数据用于后续使用
let realmsCache = [];

async function loadEventTimeSettings() {
  if (!eventTimeMsg) return;
  eventTimeMsg.textContent = '';
  try {
    const data = await api('/admin/event-time-settings', 'GET');
    if (data?.sabak) {
      if (sabakTimeStartHourInput) sabakTimeStartHourInput.value = data.sabak.startHour ?? '';
      if (sabakTimeStartMinuteInput) sabakTimeStartMinuteInput.value = data.sabak.startMinute ?? '';
      if (sabakTimeDurationInput) sabakTimeDurationInput.value = data.sabak.durationMinutes ?? '';
    }
    if (data?.crossRank) {
      if (crossRankStartHourInput) crossRankStartHourInput.value = data.crossRank.startHour ?? '';
      if (crossRankStartMinuteInput) crossRankStartMinuteInput.value = data.crossRank.startMinute ?? '';
      if (crossRankDurationInput) crossRankDurationInput.value = data.crossRank.durationMinutes ?? '';
    }
    eventTimeMsg.textContent = '加载成功';
    eventTimeMsg.style.color = 'green';
    setTimeout(() => {
      eventTimeMsg.textContent = '';
    }, 1500);
  } catch (err) {
    eventTimeMsg.textContent = `加载失败: ${err.message}`;
    eventTimeMsg.style.color = 'red';
  }
}

async function saveEventTimeSettings() {
  if (!eventTimeMsg) return;
  eventTimeMsg.textContent = '';
  try {
    const payload = {
      sabak: {
        startHour: Number(sabakTimeStartHourInput?.value),
        startMinute: Number(sabakTimeStartMinuteInput?.value),
        durationMinutes: Number(sabakTimeDurationInput?.value),
        siegeMinutes: Number(sabakTimeDurationInput?.value)
      },
      crossRank: {
        startHour: Number(crossRankStartHourInput?.value),
        startMinute: Number(crossRankStartMinuteInput?.value),
        durationMinutes: Number(crossRankDurationInput?.value)
      }
    };
    await api('/admin/event-time-settings/update', 'POST', payload);
    eventTimeMsg.textContent = '保存成功';
    eventTimeMsg.style.color = 'green';
    setTimeout(() => {
      eventTimeMsg.textContent = '';
    }, 1500);
  } catch (err) {
    eventTimeMsg.textContent = `保存失败: ${err.message}`;
    eventTimeMsg.style.color = 'red';
  }
}

async function loadActivityPointShopConfig() {
  if (!activityPointShopList || !activityPointShopMsg) return;
  activityPointShopMsg.textContent = '';
  try {
    const data = await api('/admin/activity-point-shop', 'GET');
    const config = data?.config || { version: 2, items: [] };
    if (activityPointShopItemSearchInput) {
      activityPointShopItemSearchKeyword = String(activityPointShopItemSearchInput.value || '').trim();
    }
    activityPointShopItemOptionsCache = Array.isArray(data?.itemOptions) ? data.itemOptions : [];
    activityPointShopRowsCache = (Array.isArray(config.items) ? config.items : []).map((item, index) => ({
      _id: String(item?.id || `aps_${index + 1}`),
      itemId: String(item?.itemId || '').trim(),
      qty: Math.max(1, Math.floor(Number(item?.qty || 1))),
      cost: Math.max(1, Math.floor(Number(item?.cost || 1)))
    })).filter((row) => row.itemId);
    renderActivityPointShopRows();
    activityPointShopMsg.textContent = '加载成功';
    activityPointShopMsg.style.color = 'green';
    setTimeout(() => { activityPointShopMsg.textContent = ''; }, 1500);
  } catch (err) {
    activityPointShopMsg.textContent = `加载失败: ${err.message}`;
    activityPointShopMsg.style.color = 'red';
  }
}

function activityPointShopEmptyItem() {
  return {
    _id: `aps_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    itemId: '',
    qty: 1,
    cost: 1
  };
}

function getActivityPointShopItemDisplayText(item) {
  const name = String(item?.name || item?.id || '');
  return name;
}

function buildActivityPointShopItemSelectHtml(selectedId = '', keyword = '') {
  const selected = String(selectedId || '').trim();
  const kw = String(keyword || activityPointShopItemSearchKeyword || '').trim().toLowerCase();
  const options = Array.isArray(activityPointShopItemOptionsCache) ? activityPointShopItemOptionsCache : [];
  const filtered = kw
    ? options.filter((it) => {
        const id = String(it?.id || '').toLowerCase();
        const name = String(it?.name || '').toLowerCase();
        const type = String(it?.type || '').toLowerCase();
        return id.includes(kw) || name.includes(kw) || type.includes(kw);
      })
    : options;
  const selectedExists = filtered.some((it) => String(it?.id || '') === selected);
  const selectedOption = !selectedExists && selected
    ? options.find((it) => String(it?.id || '') === selected)
    : null;
  const finalList = selectedOption ? [selectedOption, ...filtered] : filtered;
  const optionHtml = finalList.map((it) => {
    const id = String(it?.id || '').replace(/"/g, '&quot;');
    const text = getActivityPointShopItemDisplayText(it).replace(/"/g, '&quot;');
    return `<option value="${id}"${id === selected ? ' selected' : ''}>${text}</option>`;
  }).join('');
  return `<select data-k="itemId"><option value="">请选择物品</option>${optionHtml}</select>`;
}

function renderActivityPointShopRows() {
  if (!activityPointShopList) return;
  const rows = Array.isArray(activityPointShopRowsCache) ? activityPointShopRowsCache : [];
  activityPointShopList.innerHTML = '';
  if (!rows.length) {
    activityPointShopList.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">暂无商品，点击“添加商品”</td></tr>';
    return;
  }
  rows.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(index);
    tr.dataset.shopId = String(item?._id || '');
    tr.innerHTML = `
      <td>
        ${buildActivityPointShopItemSelectHtml(item.itemId)}
      </td>
      <td><input data-k="qty" type="number" min="1" value="${Math.max(1, Number(item.qty || 1))}"></td>
      <td><input data-k="cost" type="number" min="1" value="${Math.max(1, Number(item.cost || 1))}"></td>
      <td><button type="button" class="btn-small" data-act="del">删除</button></td>
    `;
    activityPointShopList.appendChild(tr);
  });
}

function collectActivityPointShopConfigFromUi() {
  const rows = [];
  if (!activityPointShopList) return { version: 2, items: rows };
  activityPointShopList.querySelectorAll('tr[data-index]').forEach((tr) => {
    const getVal = (k) => tr.querySelector(`[data-k="${k}"]`);
    const rewardItemId = String(getVal('itemId')?.value || '').trim();
    if (!rewardItemId) return;
    const shopId = String(tr.dataset.shopId || '').trim() || `aps_${rewardItemId}`;
    rows.push({
      id: shopId,
      itemId: rewardItemId,
      qty: Math.max(1, Math.floor(Number(getVal('qty')?.value || 1))),
      cost: Math.max(1, Math.floor(Number(getVal('cost')?.value || 1)))
    });
  });
  return { version: 2, items: rows };
}

async function saveActivityPointShopConfig() {
  if (!activityPointShopList || !activityPointShopMsg) return;
  activityPointShopMsg.textContent = '';
  try {
    const config = collectActivityPointShopConfigFromUi();
    const data = await api('/admin/activity-point-shop/update', 'POST', { config });
    activityPointShopRowsCache = (Array.isArray(data?.config?.items) ? data.config.items : config.items).map((item, index) => ({
      _id: String(item?.id || `aps_${index + 1}`),
      itemId: String(item?.itemId || '').trim(),
      qty: Math.max(1, Math.floor(Number(item?.qty || 1))),
      cost: Math.max(1, Math.floor(Number(item?.cost || 1)))
    })).filter((row) => row.itemId);
    renderActivityPointShopRows();
    activityPointShopMsg.textContent = '保存成功';
    activityPointShopMsg.style.color = 'green';
    setTimeout(() => { activityPointShopMsg.textContent = ''; }, 1500);
  } catch (err) {
    activityPointShopMsg.textContent = `保存失败: ${err.message}`;
    activityPointShopMsg.style.color = 'red';
  }
}

async function loadHarvestSignConfig() {
  if (!harvestSignList || !harvestSignMsg) return;
  harvestSignMsg.textContent = '';
  try {
    const data = await api('/admin/harvest-season-sign', 'GET');
    const config = data?.config || { version: 1, title: '丰收签到奖励', points: 20, gold: 200000, items: [] };
    if (harvestSignItemSearchInput) {
      harvestSignItemSearchKeyword = String(harvestSignItemSearchInput.value || '').trim();
    }
    harvestSignItemOptionsCache = Array.isArray(data?.itemOptions) ? data.itemOptions : [];
    if (harvestSignTitleInput) harvestSignTitleInput.value = String(config.title || '丰收签到奖励');
    if (harvestSignPointsInput) harvestSignPointsInput.value = Math.max(0, Math.floor(Number(config.points || 0)));
    if (harvestSignGoldInput) harvestSignGoldInput.value = Math.max(0, Math.floor(Number(config.gold || 0)));
    harvestSignRowsCache = (Array.isArray(config.items) ? config.items : []).map((item, index) => ({
      _id: String(item?.id || `harvest_sign_${index + 1}`),
      itemId: String(item?.id || '').trim(),
      qty: Math.max(1, Math.floor(Number(item?.qty || 1)))
    })).filter((row) => row.itemId);
    renderHarvestSignRows();
    harvestSignMsg.textContent = '加载成功';
    harvestSignMsg.style.color = 'green';
    setTimeout(() => { harvestSignMsg.textContent = ''; }, 1500);
  } catch (err) {
    harvestSignMsg.textContent = `加载失败: ${err.message}`;
    harvestSignMsg.style.color = 'red';
  }
}

function harvestSignEmptyItem() {
  return {
    _id: `harvest_sign_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    itemId: '',
    qty: 1
  };
}

function buildHarvestSignItemSelectHtml(selectedId = '', keyword = '') {
  const selected = String(selectedId || '').trim();
  const kw = String(keyword || harvestSignItemSearchKeyword || '').trim().toLowerCase();
  const options = Array.isArray(harvestSignItemOptionsCache) ? harvestSignItemOptionsCache : [];
  const filtered = kw
    ? options.filter((it) => {
        const id = String(it?.id || '').toLowerCase();
        const name = String(it?.name || '').toLowerCase();
        const type = String(it?.type || '').toLowerCase();
        return id.includes(kw) || name.includes(kw) || type.includes(kw);
      })
    : options;
  const selectedExists = filtered.some((it) => String(it?.id || '') === selected);
  const selectedOption = !selectedExists && selected
    ? options.find((it) => String(it?.id || '') === selected)
    : null;
  const finalList = selectedOption ? [selectedOption, ...filtered] : filtered;
  const optionHtml = finalList.map((it) => {
    const id = String(it?.id || '').replace(/"/g, '&quot;');
    const text = getActivityPointShopItemDisplayText(it).replace(/"/g, '&quot;');
    return `<option value="${id}"${id === selected ? ' selected' : ''}>${text}</option>`;
  }).join('');
  return `<select data-k="itemId"><option value="">请选择物品</option>${optionHtml}</select>`;
}

function renderHarvestSignRows() {
  if (!harvestSignList) return;
  const rows = Array.isArray(harvestSignRowsCache) ? harvestSignRowsCache : [];
  harvestSignList.innerHTML = '';
  if (!rows.length) {
    harvestSignList.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;">暂无附加物品，可直接保存纯金币/积分签到奖励</td></tr>';
    return;
  }
  rows.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(index);
    tr.innerHTML = `
      <td>${buildHarvestSignItemSelectHtml(item.itemId)}</td>
      <td><input data-k="qty" type="number" min="1" value="${Math.max(1, Number(item.qty || 1))}"></td>
      <td><button type="button" class="btn-small" data-act="del">删除</button></td>
    `;
    harvestSignList.appendChild(tr);
  });
}

function collectHarvestSignConfigFromUi() {
  const items = [];
  if (harvestSignList) {
    harvestSignList.querySelectorAll('tr[data-index]').forEach((tr) => {
      const itemId = String(tr.querySelector('select[data-k="itemId"]')?.value || '').trim();
      const qty = Math.max(1, Math.floor(Number(tr.querySelector('input[data-k="qty"]')?.value || 1)));
      if (!itemId) return;
      items.push({ id: itemId, qty });
    });
  }
  return {
    version: 1,
    title: String(harvestSignTitleInput?.value || '丰收签到奖励').trim() || '丰收签到奖励',
    points: Math.max(0, Math.floor(Number(harvestSignPointsInput?.value || 0))),
    gold: Math.max(0, Math.floor(Number(harvestSignGoldInput?.value || 0))),
    items
  };
}

async function saveHarvestSignConfig() {
  if (!harvestSignMsg) return;
  harvestSignMsg.textContent = '';
  try {
    const config = collectHarvestSignConfigFromUi();
    const data = await api('/admin/harvest-season-sign/update', 'POST', { config });
    const normalized = data?.config || config;
    if (harvestSignTitleInput) harvestSignTitleInput.value = String(normalized.title || '丰收签到奖励');
    if (harvestSignPointsInput) harvestSignPointsInput.value = Math.max(0, Math.floor(Number(normalized.points || 0)));
    if (harvestSignGoldInput) harvestSignGoldInput.value = Math.max(0, Math.floor(Number(normalized.gold || 0)));
    harvestSignRowsCache = (Array.isArray(normalized.items) ? normalized.items : []).map((item, index) => ({
      _id: String(item?.id || `harvest_sign_${index + 1}`),
      itemId: String(item?.id || '').trim(),
      qty: Math.max(1, Math.floor(Number(item?.qty || 1)))
    })).filter((row) => row.itemId);
    renderHarvestSignRows();
    harvestSignMsg.textContent = '保存成功';
    harvestSignMsg.style.color = 'green';
    setTimeout(() => { harvestSignMsg.textContent = ''; }, 1500);
  } catch (err) {
    harvestSignMsg.textContent = `保存失败: ${err.message}`;
    harvestSignMsg.style.color = 'red';
  }
}

async function loadHarvestRewardConfig() {
  if (!harvestRewardList || !harvestRewardMsg) return;
  harvestRewardMsg.textContent = '';
  try {
    const data = await api('/admin/harvest-season-rewards', 'GET');
    const config = data?.config || { version: 1, items: [] };
    if (harvestRewardItemSearchInput) {
      harvestRewardItemSearchKeyword = String(harvestRewardItemSearchInput.value || '').trim();
    }
    harvestRewardItemOptionsCache = Array.isArray(data?.itemOptions) ? data.itemOptions : [];
    harvestRewardRowsCache = (Array.isArray(config.items) ? config.items : []).map((item, index) => ({
      _id: String(item?.id || `harvest_cfg_${index + 1}`),
      threshold: Math.max(1, Math.floor(Number(item?.threshold || 1))),
      title: String(item?.title || '丰收挂机奖励').trim() || '丰收挂机奖励',
      gold: Math.max(0, Math.floor(Number(item?.gold || 0))),
      itemId: String(item?.itemId || '').trim(),
      itemQty: Math.max(1, Math.floor(Number(item?.itemQty || 1)))
    }));
    renderHarvestRewardRows();
    harvestRewardMsg.textContent = '加载成功';
    harvestRewardMsg.style.color = 'green';
    setTimeout(() => { harvestRewardMsg.textContent = ''; }, 1500);
  } catch (err) {
    harvestRewardMsg.textContent = `加载失败: ${err.message}`;
    harvestRewardMsg.style.color = 'red';
  }
}

function harvestRewardEmptyItem() {
  return {
    _id: `harvest_cfg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    threshold: 30,
    title: '丰收挂机奖励',
    gold: 0,
    itemId: '',
    itemQty: 1
  };
}

function buildHarvestRewardItemSelectHtml(selectedId = '', keyword = '') {
  const selected = String(selectedId || '').trim();
  const kw = String(keyword || harvestRewardItemSearchKeyword || '').trim().toLowerCase();
  const options = Array.isArray(harvestRewardItemOptionsCache) ? harvestRewardItemOptionsCache : [];
  const filtered = kw
    ? options.filter((it) => {
        const id = String(it?.id || '').toLowerCase();
        const name = String(it?.name || '').toLowerCase();
        const type = String(it?.type || '').toLowerCase();
        return id.includes(kw) || name.includes(kw) || type.includes(kw);
      })
    : options;
  const selectedExists = filtered.some((it) => String(it?.id || '') === selected);
  const selectedOption = !selectedExists && selected
    ? options.find((it) => String(it?.id || '') === selected)
    : null;
  const finalList = selectedOption ? [selectedOption, ...filtered] : filtered;
  const optionHtml = finalList.map((it) => {
    const id = String(it?.id || '').replace(/"/g, '&quot;');
    const text = getActivityPointShopItemDisplayText(it).replace(/"/g, '&quot;');
    return `<option value="${id}"${id === selected ? ' selected' : ''}>${text}</option>`;
  }).join('');
  return `<select data-k="itemId"><option value="">无附加物品</option>${optionHtml}</select>`;
}

function renderHarvestRewardRows() {
  if (!harvestRewardList) return;
  const rows = Array.isArray(harvestRewardRowsCache) ? harvestRewardRowsCache : [];
  harvestRewardList.innerHTML = '';
  if (!rows.length) {
    harvestRewardList.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;">暂无档位，点击“添加档位”</td></tr>';
    return;
  }
  rows.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(index);
    tr.dataset.rewardId = String(item?._id || '');
    tr.innerHTML = `
      <td colspan="6" class="harvest-reward-cell">
        <div class="harvest-reward-grid">
          <div class="harvest-reward-field harvest-reward-field-threshold">
            <span class="harvest-reward-label">分钟</span>
            <input class="harvest-threshold-input" data-k="threshold" type="number" min="1" value="${Math.max(1, Number(item.threshold || 1))}">
          </div>
          <div class="harvest-reward-field harvest-reward-field-title">
            <span class="harvest-reward-label">标题</span>
            <input class="harvest-title-input" data-k="title" type="text" value="${String(item.title || '丰收挂机奖励')}">
          </div>
          <div class="harvest-reward-field harvest-reward-field-gold">
            <span class="harvest-reward-label">金币</span>
            <input class="harvest-gold-input" data-k="gold" type="number" min="0" value="${Math.max(0, Number(item.gold || 0))}">
          </div>
          <div class="harvest-reward-field harvest-reward-field-item">
            <span class="harvest-reward-label">附加物品</span>
            ${buildHarvestRewardItemSelectHtml(item.itemId)}
          </div>
          <div class="harvest-reward-field harvest-reward-field-qty">
            <span class="harvest-reward-label">数量</span>
            <input class="harvest-qty-input" data-k="itemQty" type="number" min="1" value="${Math.max(1, Number(item.itemQty || 1))}">
          </div>
          <div class="harvest-reward-field harvest-reward-field-action">
            <span class="harvest-reward-label">操作</span>
            <button type="button" class="btn-small" data-act="del">删除</button>
          </div>
        </div>
      </td>
    `;
    harvestRewardList.appendChild(tr);
  });
}

function collectHarvestRewardConfigFromUi() {
  const rows = [];
  if (!harvestRewardList) return { version: 1, items: rows };
  harvestRewardList.querySelectorAll('tr[data-index]').forEach((tr) => {
    const getVal = (k) => tr.querySelector(`[data-k="${k}"]`);
    const threshold = Math.max(1, Math.floor(Number(getVal('threshold')?.value || 1)));
    const title = String(getVal('title')?.value || '丰收挂机奖励').trim() || '丰收挂机奖励';
    const gold = Math.max(0, Math.floor(Number(getVal('gold')?.value || 0)));
    const itemId = String(getVal('itemId')?.value || '').trim();
    const itemQty = Math.max(1, Math.floor(Number(getVal('itemQty')?.value || 1)));
    if (!gold && !itemId) return;
    const rewardId = String(tr.dataset.rewardId || '').trim() || `harvest_${threshold}`;
    rows.push({
      id: rewardId,
      threshold,
      title,
      gold,
      itemId,
      itemQty
    });
  });
  return { version: 1, items: rows };
}

async function saveHarvestRewardConfig() {
  if (!harvestRewardList || !harvestRewardMsg) return;
  harvestRewardMsg.textContent = '';
  try {
    const config = collectHarvestRewardConfigFromUi();
    const data = await api('/admin/harvest-season-rewards/update', 'POST', { config });
    const normalized = data?.config || config;
    harvestRewardRowsCache = (Array.isArray(normalized.items) ? normalized.items : []).map((item, index) => ({
      _id: String(item?.id || `harvest_cfg_${index + 1}`),
      threshold: Math.max(1, Math.floor(Number(item?.threshold || 1))),
      title: String(item?.title || '丰收挂机奖励').trim() || '丰收挂机奖励',
      gold: Math.max(0, Math.floor(Number(item?.gold || 0))),
      itemId: String(item?.itemId || '').trim(),
      itemQty: Math.max(1, Math.floor(Number(item?.itemQty || 1)))
    }));
    renderHarvestRewardRows();
    harvestRewardMsg.textContent = '保存成功';
    harvestRewardMsg.style.color = 'green';
    setTimeout(() => { harvestRewardMsg.textContent = ''; }, 1500);
  } catch (err) {
    harvestRewardMsg.textContent = `保存失败: ${err.message}`;
    harvestRewardMsg.style.color = 'red';
  }
}

async function loadDivineBeastFragmentExchangeConfig() {
  if (!divineBeastFragmentList || !divineBeastFragmentMsg) return;
  divineBeastFragmentMsg.textContent = '';
  try {
    const data = await api('/admin/divine-beast-fragment-exchange', 'GET');
    const config = data?.config || { version: 1, items: [] };
    divineBeastFragmentOptionsCache = Array.isArray(data?.beastOptions) ? data.beastOptions : [];
    divineBeastFragmentRowsCache = (Array.isArray(config.items) ? config.items : []).map((item, index) => ({
      _id: String(item?.id || `dbf_${index + 1}`),
      species: String(item?.species || '').trim(),
      cost: Math.max(1, Math.floor(Number(item?.cost || 1)))
    })).filter((row) => row.species);
    renderDivineBeastFragmentRows();
    divineBeastFragmentMsg.textContent = '加载成功';
    divineBeastFragmentMsg.style.color = 'green';
    setTimeout(() => { divineBeastFragmentMsg.textContent = ''; }, 1500);
  } catch (err) {
    divineBeastFragmentMsg.textContent = `加载失败: ${err.message}`;
    divineBeastFragmentMsg.style.color = 'red';
  }
}

function divineBeastFragmentEmptyItem() {
  return {
    _id: `dbf_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    species: '',
    cost: 1
  };
}

function buildDivineBeastSpeciesSelectHtml(selectedSpecies = '') {
  const selected = String(selectedSpecies || '').trim();
  const options = Array.isArray(divineBeastFragmentOptionsCache) ? divineBeastFragmentOptionsCache : [];
  const selectedExists = options.some((it) => String(it?.name || '') === selected);
  const selectedOption = !selectedExists && selected ? { id: selected, name: selected } : null;
  const finalList = selectedOption ? [selectedOption, ...options] : options;
  const optionHtml = finalList.map((it) => {
    const name = String(it?.name || it?.id || '').replace(/"/g, '&quot;');
    return `<option value="${name}"${name === selected ? ' selected' : ''}>${name}</option>`;
  }).join('');
  return `<select data-k="species"><option value="">请选择神兽</option>${optionHtml}</select>`;
}

function renderDivineBeastFragmentRows() {
  if (!divineBeastFragmentList) return;
  const rows = Array.isArray(divineBeastFragmentRowsCache) ? divineBeastFragmentRowsCache : [];
  divineBeastFragmentList.innerHTML = '';
  if (!rows.length) {
    divineBeastFragmentList.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;">暂无兑换项，点击“添加兑换项”</td></tr>';
    return;
  }
  rows.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(index);
    tr.dataset.exchangeId = String(item?._id || '');
    tr.innerHTML = `
      <td>${buildDivineBeastSpeciesSelectHtml(item.species)}</td>
      <td><input data-k="cost" type="number" min="1" value="${Math.max(1, Number(item.cost || 1))}"></td>
      <td><button type="button" class="btn-small" data-act="del">删除</button></td>
    `;
    divineBeastFragmentList.appendChild(tr);
  });
}

function collectDivineBeastFragmentConfigFromUi() {
  const rows = [];
  if (!divineBeastFragmentList) return { version: 1, items: rows };
  divineBeastFragmentList.querySelectorAll('tr[data-index]').forEach((tr) => {
    const species = String(tr.querySelector('[data-k="species"]')?.value || '').trim();
    if (!species) return;
    const cost = Math.max(1, Math.floor(Number(tr.querySelector('[data-k="cost"]')?.value || 1)));
    const exchangeId = String(tr.dataset.exchangeId || '').trim() || `dbf_${rows.length + 1}`;
    rows.push({
      id: exchangeId,
      species,
      cost
    });
  });
  return { version: 1, items: rows };
}

async function saveDivineBeastFragmentExchangeConfig() {
  if (!divineBeastFragmentList || !divineBeastFragmentMsg) return;
  divineBeastFragmentMsg.textContent = '';
  try {
    const config = collectDivineBeastFragmentConfigFromUi();
    const data = await api('/admin/divine-beast-fragment-exchange/update', 'POST', { config });
    divineBeastFragmentRowsCache = (Array.isArray(data?.config?.items) ? data.config.items : config.items).map((item, index) => ({
      _id: String(item?.id || `dbf_${index + 1}`),
      species: String(item?.species || '').trim(),
      cost: Math.max(1, Math.floor(Number(item?.cost || 1)))
    })).filter((row) => row.species);
    renderDivineBeastFragmentRows();
    divineBeastFragmentMsg.textContent = '保存成功';
    divineBeastFragmentMsg.style.color = 'green';
    setTimeout(() => { divineBeastFragmentMsg.textContent = ''; }, 1500);
  } catch (err) {
    divineBeastFragmentMsg.textContent = `保存失败: ${err.message}`;
    divineBeastFragmentMsg.style.color = 'red';
  }
}

async function loadEquipmentRecycleConfig() {
  if (!equipmentRecycleList || !equipmentRecycleMsg) return;
  equipmentRecycleMsg.textContent = '';
  try {
    const data = await api('/admin/equipment-recycle-settings', 'GET');
    const config = data?.config || { version: 1, items: [] };
    if (equipmentRecycleItemSearchInput) {
      equipmentRecycleItemSearchKeyword = String(equipmentRecycleItemSearchInput.value || '').trim();
    }
    equipmentRecycleItemOptionsCache = Array.isArray(data?.itemOptions) ? data.itemOptions : [];
    equipmentRecycleRowsCache = (Array.isArray(config.items) ? config.items : []).map((item, index) => ({
      _id: String(item?.id || `er_${index + 1}`),
      rewardId: String(item?.rewardId || item?.itemId || '').trim(),
      rewardQty: Math.max(1, Math.floor(Number(item?.rewardQty || item?.qty || 1))),
      cost: Math.max(1, Math.floor(Number(item?.cost || 1))),
      currency: ['epic', 'legendary', 'supreme'].includes(String(item?.currency || 'epic').trim().toLowerCase())
        ? String(item?.currency || 'epic').trim().toLowerCase()
        : 'epic',
      limitType: ['none', 'daily', 'weekly', 'lifetime'].includes(String(item?.limitType || 'none')) ? String(item?.limitType || 'none') : 'none',
      limit: Math.max(1, Math.floor(Number(item?.limit || 1)))
    })).filter((row) => row.rewardId);
    renderEquipmentRecycleRows();
    equipmentRecycleMsg.textContent = '加载成功';
    equipmentRecycleMsg.style.color = 'green';
    setTimeout(() => { equipmentRecycleMsg.textContent = ''; }, 1500);
  } catch (err) {
    equipmentRecycleMsg.textContent = `加载失败: ${err.message}`;
    equipmentRecycleMsg.style.color = 'red';
  }
}

function equipmentRecycleEmptyItem() {
  return {
    _id: `er_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    rewardId: '',
    rewardQty: 1,
    cost: 1,
    currency: 'epic',
    limitType: 'none',
    limit: 1
  };
}

function buildEquipmentRecycleItemSelectHtml(selectedId = '', keyword = '') {
  const selected = String(selectedId || '').trim();
  const kw = String(keyword || equipmentRecycleItemSearchKeyword || '').trim().toLowerCase();
  const options = Array.isArray(equipmentRecycleItemOptionsCache) ? equipmentRecycleItemOptionsCache : [];
  const filtered = kw
    ? options.filter((it) => {
        const id = String(it?.id || '').toLowerCase();
        const name = String(it?.name || '').toLowerCase();
        const type = String(it?.type || '').toLowerCase();
        return id.includes(kw) || name.includes(kw) || type.includes(kw);
      })
    : options;
  const selectedExists = filtered.some((it) => String(it?.id || '') === selected);
  const selectedOption = !selectedExists && selected
    ? options.find((it) => String(it?.id || '') === selected)
    : null;
  const finalList = selectedOption ? [selectedOption, ...filtered] : filtered;
  const optionHtml = finalList.map((it) => {
    const id = String(it?.id || '').replace(/"/g, '&quot;');
    const text = String(it?.name || it?.id || '').replace(/"/g, '&quot;');
    return `<option value="${id}"${id === selected ? ' selected' : ''}>${text}</option>`;
  }).join('');
  return `<select data-k="rewardId"><option value="">请选择物品</option>${optionHtml}</select>`;
}

function renderEquipmentRecycleRows() {
  if (!equipmentRecycleList) return;
  const rows = Array.isArray(equipmentRecycleRowsCache) ? equipmentRecycleRowsCache : [];
  equipmentRecycleList.innerHTML = '';
  if (!rows.length) {
    equipmentRecycleList.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;">暂无兑换项，点击“添加兑换项”</td></tr>';
    return;
  }
  rows.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(index);
    tr.dataset.exchangeId = String(item?._id || '');
    tr.innerHTML = `
      <td>${buildEquipmentRecycleItemSelectHtml(item.rewardId)}</td>
      <td><input data-k="rewardQty" type="number" min="1" value="${Math.max(1, Number(item.rewardQty || 1))}" style="width: 72px;"></td>
      <td><input data-k="cost" type="number" min="1" value="${Math.max(1, Number(item.cost || 1))}" style="width: 88px;"></td>
      <td>
        <select data-k="currency">
          <option value="epic"${item.currency === 'epic' ? ' selected' : ''}>史诗精华</option>
          <option value="legendary"${item.currency === 'legendary' ? ' selected' : ''}>传说精华</option>
          <option value="supreme"${item.currency === 'supreme' ? ' selected' : ''}>至尊精华</option>
        </select>
      </td>
      <td>
        <div class="equipment-recycle-limit-row">
          <select data-k="limitType">
            <option value="none"${item.limitType === 'none' ? ' selected' : ''}>不限</option>
            <option value="daily"${item.limitType === 'daily' ? ' selected' : ''}>日限</option>
            <option value="weekly"${item.limitType === 'weekly' ? ' selected' : ''}>周限</option>
            <option value="lifetime"${item.limitType === 'lifetime' ? ' selected' : ''}>终身限</option>
          </select>
          <input data-k="limit" type="number" min="1" value="${Math.max(1, Number(item.limit || 1))}">
        </div>
      </td>
      <td><button type="button" class="btn-small" data-act="del">删除</button></td>
    `;
    equipmentRecycleList.appendChild(tr);
  });
}

function collectEquipmentRecycleConfigFromUi() {
  const rows = [];
  if (!equipmentRecycleList) return { version: 1, items: rows };
  equipmentRecycleList.querySelectorAll('tr[data-index]').forEach((tr) => {
    const rewardId = String(tr.querySelector('[data-k="rewardId"]')?.value || '').trim();
    if (!rewardId) return;
    const exchangeId = String(tr.dataset.exchangeId || '').trim() || `er_${rows.length + 1}`;
    const limitType = ['none', 'daily', 'weekly', 'lifetime'].includes(String(tr.querySelector('[data-k="limitType"]')?.value || 'none'))
      ? String(tr.querySelector('[data-k="limitType"]')?.value || 'none')
      : 'none';
    rows.push({
      id: exchangeId,
      rewardId,
      rewardQty: Math.max(1, Math.floor(Number(tr.querySelector('[data-k="rewardQty"]')?.value || 1))),
      cost: Math.max(1, Math.floor(Number(tr.querySelector('[data-k="cost"]')?.value || 1))),
      currency: ['epic', 'legendary', 'supreme'].includes(String(tr.querySelector('[data-k="currency"]')?.value || 'epic').trim().toLowerCase())
        ? String(tr.querySelector('[data-k="currency"]')?.value || 'epic').trim().toLowerCase()
        : 'epic',
      limitType,
      limit: limitType === 'none' ? 0 : Math.max(1, Math.floor(Number(tr.querySelector('[data-k="limit"]')?.value || 1)))
    });
  });
  return { version: 1, items: rows };
}

async function saveEquipmentRecycleConfig() {
  if (!equipmentRecycleList || !equipmentRecycleMsg) return;
  equipmentRecycleMsg.textContent = '';
  try {
    const config = collectEquipmentRecycleConfigFromUi();
    const data = await api('/admin/equipment-recycle-settings/update', 'POST', { config });
    equipmentRecycleRowsCache = (Array.isArray(data?.config?.items) ? data.config.items : config.items).map((item, index) => ({
      _id: String(item?.id || `er_${index + 1}`),
      rewardId: String(item?.rewardId || item?.itemId || '').trim(),
      rewardQty: Math.max(1, Math.floor(Number(item?.rewardQty || item?.qty || 1))),
      cost: Math.max(1, Math.floor(Number(item?.cost || 1))),
      currency: ['epic', 'legendary', 'supreme'].includes(String(item?.currency || 'epic').trim().toLowerCase())
        ? String(item?.currency || 'epic').trim().toLowerCase()
        : 'epic',
      limitType: ['none', 'daily', 'weekly', 'lifetime'].includes(String(item?.limitType || 'none')) ? String(item?.limitType || 'none') : 'none',
      limit: Math.max(1, Math.floor(Number(item?.limit || 1)))
    })).filter((row) => row.rewardId);
    renderEquipmentRecycleRows();
    equipmentRecycleMsg.textContent = '保存成功';
    equipmentRecycleMsg.style.color = 'green';
    setTimeout(() => { equipmentRecycleMsg.textContent = ''; }, 1500);
  } catch (err) {
    equipmentRecycleMsg.textContent = `保存失败: ${err.message}`;
    equipmentRecycleMsg.style.color = 'red';
  }
}

function guildSystemEmptyShopItem() {
  return {
    _id: `gs_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    id: '',
    qty: 1,
    cost: 1
  };
}

function buildGuildSystemItemSelectHtml(selectedId = '', keyword = '') {
  const selected = String(selectedId || '').trim();
  const kw = String(keyword || guildSystemItemSearchKeyword || '').trim().toLowerCase();
  const options = Array.isArray(guildSystemItemOptionsCache) ? guildSystemItemOptionsCache : [];
  const filtered = kw
    ? options.filter((it) => {
        const id = String(it?.id || '').toLowerCase();
        const name = String(it?.name || '').toLowerCase();
        const type = String(it?.type || '').toLowerCase();
        return id.includes(kw) || name.includes(kw) || type.includes(kw);
      })
    : options;
  const selectedExists = filtered.some((it) => String(it?.id || '') === selected);
  const selectedOption = !selectedExists && selected
    ? options.find((it) => String(it?.id || '') === selected)
    : null;
  const finalList = selectedOption ? [selectedOption, ...filtered] : filtered;
  const optionHtml = finalList.map((it) => {
    const id = String(it?.id || '').replace(/"/g, '&quot;');
    const text = String(it?.name || it?.id || '').replace(/"/g, '&quot;');
    return `<option value="${id}"${id === selected ? ' selected' : ''}>${text}</option>`;
  }).join('');
  return `<select data-k="id"><option value="">请选择物品</option>${optionHtml}</select>`;
}

function renderGuildSystemShopRows() {
  if (!guildSystemShopList) return;
  const rows = Array.isArray(guildSystemShopRowsCache) ? guildSystemShopRowsCache : [];
  guildSystemShopList.innerHTML = '';
  if (!rows.length) {
    guildSystemShopList.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">暂无商城商品，点击“添加商城商品”</td></tr>';
    return;
  }
  rows.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(index);
    tr.dataset.shopId = String(item?._id || '');
    tr.innerHTML = `
      <td>${buildGuildSystemItemSelectHtml(item.id)}</td>
      <td><input data-k="qty" type="number" min="1" value="${Math.max(1, Number(item.qty || 1))}" style="width: 72px;"></td>
      <td><input data-k="cost" type="number" min="1" value="${Math.max(1, Number(item.cost || 1))}" style="width: 88px;"></td>
      <td><button type="button" class="btn-small" data-act="del">删除</button></td>
    `;
    guildSystemShopList.appendChild(tr);
  });
}

function collectGuildSystemConfigFromUi() {
  const shopItems = [];
  if (guildSystemShopList) {
    guildSystemShopList.querySelectorAll('tr[data-index]').forEach((tr) => {
      const id = String(tr.querySelector('[data-k="id"]')?.value || '').trim();
      if (!id) return;
      shopItems.push({
        id,
        qty: Math.max(1, Math.floor(Number(tr.querySelector('[data-k="qty"]')?.value || 1))),
        cost: Math.max(1, Math.floor(Number(tr.querySelector('[data-k="cost"]')?.value || 1)))
      });
    });
  }
  return {
    donateLimits: {
      gold: Math.max(0, Math.floor(Number(guildSystemLimitGoldInput?.value || 0))),
      points: Math.max(0, Math.floor(Number(guildSystemLimitPointsInput?.value || 0)))
    },
    donateCost: {
      gold: Math.max(0, Math.floor(Number(guildSystemCostGoldInput?.value || 0))),
      points: Math.max(0, Math.floor(Number(guildSystemCostPointsInput?.value || 0)))
    },
    contributionGain: {
      gold: Math.max(0, Math.floor(Number(guildSystemGainGoldInput?.value || 0))),
      points: Math.max(0, Math.floor(Number(guildSystemGainPointsInput?.value || 0)))
    },
    shopItems
  };
}

async function loadGuildSystemConfig() {
  if (!guildSystemMsg) return;
  guildSystemMsg.textContent = '';
  try {
    const data = await api('/admin/guild-system-settings', 'GET');
    const config = data?.config || {};
    guildSystemItemOptionsCache = Array.isArray(data?.itemOptions) ? data.itemOptions : [];
    guildSystemShopRowsCache = (Array.isArray(config.shopItems) ? config.shopItems : []).map((item, index) => ({
      _id: `gs_${index + 1}`,
      id: String(item?.id || '').trim(),
      qty: Math.max(1, Math.floor(Number(item?.qty || 1))),
      cost: Math.max(1, Math.floor(Number(item?.cost || 1)))
    })).filter((row) => row.id);
    if (guildSystemLimitGoldInput) guildSystemLimitGoldInput.value = Math.max(0, Number(config?.donateLimits?.gold || 0));
    if (guildSystemLimitPointsInput) guildSystemLimitPointsInput.value = Math.max(0, Number(config?.donateLimits?.points || 0));
    if (guildSystemCostGoldInput) guildSystemCostGoldInput.value = Math.max(0, Number(config?.donateCost?.gold || 0));
    if (guildSystemCostPointsInput) guildSystemCostPointsInput.value = Math.max(0, Number(config?.donateCost?.points || 0));
    if (guildSystemGainGoldInput) guildSystemGainGoldInput.value = Math.max(0, Number(config?.contributionGain?.gold || 0));
    if (guildSystemGainPointsInput) guildSystemGainPointsInput.value = Math.max(0, Number(config?.contributionGain?.points || 0));
    renderGuildSystemShopRows();
    guildSystemMsg.textContent = '加载成功';
    guildSystemMsg.style.color = 'green';
    setTimeout(() => { guildSystemMsg.textContent = ''; }, 1500);
  } catch (err) {
    guildSystemMsg.textContent = `加载失败: ${err.message}`;
    guildSystemMsg.style.color = 'red';
  }
}

async function saveGuildSystemConfig() {
  if (!guildSystemMsg) return;
  guildSystemMsg.textContent = '';
  try {
    const config = collectGuildSystemConfigFromUi();
    const data = await api('/admin/guild-system-settings/update', 'POST', { config });
    guildSystemItemOptionsCache = Array.isArray(guildSystemItemOptionsCache) ? guildSystemItemOptionsCache : [];
    guildSystemShopRowsCache = (Array.isArray(data?.config?.shopItems) ? data.config.shopItems : config.shopItems).map((item, index) => ({
      _id: `gs_${index + 1}`,
      id: String(item?.id || '').trim(),
      qty: Math.max(1, Math.floor(Number(item?.qty || 1))),
      cost: Math.max(1, Math.floor(Number(item?.cost || 1)))
    })).filter((row) => row.id);
    renderGuildSystemShopRows();
    guildSystemMsg.textContent = '保存成功';
    guildSystemMsg.style.color = 'green';
    setTimeout(() => { guildSystemMsg.textContent = ''; }, 1500);
  } catch (err) {
    guildSystemMsg.textContent = `保存失败: ${err.message}`;
    guildSystemMsg.style.color = 'red';
  }
}

function renderGuildBuildingLevelRows() {
  const rows = Array.isArray(guildBuildingLevelRowsCache) ? guildBuildingLevelRowsCache : [];
  const stepSec = getGuildBuildingDurationStepSec();
  if (!guildBuildingLevelSummary) return;
  if (rows.length <= 0) {
    guildBuildingLevelSummary.textContent = '暂无等级配置';
    return;
  }
  const maxLevel = Math.max(0, rows.length - 1);
  const lastThreshold = Math.max(0, Math.floor(Number(rows[maxLevel]?.threshold || 0)));
  const prevThreshold = maxLevel > 0
    ? Math.max(0, Math.floor(Number(rows[maxLevel - 1]?.threshold || 0)))
    : 0;
  const thresholdStep = Math.max(1, lastThreshold - prevThreshold, lastThreshold || 100000);
  const lvl1 = 1 * stepSec;
  const lvl5 = 5 * stepSec;
  const lvl10 = 10 * stepSec;
  guildBuildingLevelSummary.textContent = `行会建筑等级无上限。当前基础门槛配置到 ${maxLevel} 级（最高门槛 ${lastThreshold}），超出后门槛按每级 +${thresholdStep} 递增；升级时长按每级 +${stepSec} 秒（例如设置 ${stepSec} 时：1级=${lvl1}s，5级=${lvl5}s，10级=${lvl10}s）。`;
}

function collectGuildBuildingConfigFromUi() {
  const readPct = (input, fallback = 0) => {
    const numeric = Number(input?.value ?? fallback);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.round(numeric * 10) / 10;
  };
  const thresholds = (Array.isArray(guildBuildingLevelRowsCache) ? guildBuildingLevelRowsCache : [])
    .map((row) => Math.max(0, Math.floor(Number(row?.threshold || 0))));
  if (thresholds.length <= 0) {
    thresholds.push(0, 100000);
  }
  const stepSec = getGuildBuildingDurationStepSec();
  const durationsSec = thresholds.map((_, idx) => idx * stepSec);
  return {
    thresholds,
    durationsSec,
    gains: {
      memberBaseLimit: Math.max(1, Math.floor(Number(guildBuildingMemberBaseInput?.value || 1))),
      memberPerLevel: Math.max(1, Math.floor(Number(guildBuildingMemberPerLevelInput?.value || 1))),
      expPctPerLevel: readPct(guildBuildingExpPerLevelInput),
      goldPctPerLevel: readPct(guildBuildingGoldPerLevelInput),
      hpPctPerLevel: readPct(guildBuildingHpPerLevelInput),
      atkPctPerLevel: readPct(guildBuildingAtkPerLevelInput),
      magPctPerLevel: readPct(guildBuildingMagPerLevelInput),
      spiritPctPerLevel: readPct(guildBuildingSpiritPerLevelInput),
      defPctPerLevel: readPct(guildBuildingDefPerLevelInput),
      mdefPctPerLevel: readPct(guildBuildingMdefPerLevelInput)
    }
  };
}

async function loadGuildBuildingConfig() {
  if (!guildBuildingMsg) return;
  guildBuildingMsg.textContent = '';
  try {
    const data = await api('/admin/guild-building-settings', 'GET');
    const config = data?.config || {};
    const thresholds = Array.isArray(config.thresholds) ? config.thresholds : [];
    const durationsSec = Array.isArray(config.durationsSec) ? config.durationsSec : [];
    const stepSec = inferGuildBuildingDurationStepSec(durationsSec);
    if (guildBuildingDurationStepInput) guildBuildingDurationStepInput.value = stepSec;
    guildBuildingLevelRowsCache = thresholds.map((threshold, index) => ({
      threshold: Math.max(0, Math.floor(Number(threshold || 0)))
    }));
    renderGuildBuildingLevelRows();
    const gains = config.gains || {};
    if (guildBuildingMemberBaseInput) guildBuildingMemberBaseInput.value = Math.max(1, Number(gains.memberBaseLimit || 20));
    if (guildBuildingMemberPerLevelInput) guildBuildingMemberPerLevelInput.value = Math.max(1, Number(gains.memberPerLevel || 5));
    if (guildBuildingExpPerLevelInput) guildBuildingExpPerLevelInput.value = Math.max(0, Number(gains.expPctPerLevel ?? 0.2));
    if (guildBuildingGoldPerLevelInput) guildBuildingGoldPerLevelInput.value = Math.max(0, Number(gains.goldPctPerLevel ?? 0.2));
    if (guildBuildingHpPerLevelInput) guildBuildingHpPerLevelInput.value = Math.max(0, Number(gains.hpPctPerLevel ?? 0.2));
    if (guildBuildingAtkPerLevelInput) guildBuildingAtkPerLevelInput.value = Math.max(0, Number(gains.atkPctPerLevel ?? 0.2));
    if (guildBuildingMagPerLevelInput) guildBuildingMagPerLevelInput.value = Math.max(0, Number(gains.magPctPerLevel ?? 0.2));
    if (guildBuildingSpiritPerLevelInput) guildBuildingSpiritPerLevelInput.value = Math.max(0, Number(gains.spiritPctPerLevel ?? 0.2));
    if (guildBuildingDefPerLevelInput) guildBuildingDefPerLevelInput.value = Math.max(0, Number(gains.defPctPerLevel ?? 0.2));
    if (guildBuildingMdefPerLevelInput) guildBuildingMdefPerLevelInput.value = Math.max(0, Number(gains.mdefPctPerLevel ?? 0.2));
    guildBuildingMsg.textContent = '加载成功';
    guildBuildingMsg.style.color = 'green';
    setTimeout(() => { guildBuildingMsg.textContent = ''; }, 1500);
  } catch (err) {
    guildBuildingMsg.textContent = `加载失败: ${err.message}`;
    guildBuildingMsg.style.color = 'red';
  }
}

async function saveGuildBuildingConfig() {
  if (!guildBuildingMsg) return;
  guildBuildingMsg.textContent = '';
  try {
    const config = collectGuildBuildingConfigFromUi();
    const data = await api('/admin/guild-building-settings/update', 'POST', { config });
    const nextConfig = data?.config || config;
    const stepSec = inferGuildBuildingDurationStepSec(nextConfig?.durationsSec || config?.durationsSec || []);
    if (guildBuildingDurationStepInput) guildBuildingDurationStepInput.value = stepSec;
    guildBuildingLevelRowsCache = (Array.isArray(nextConfig.thresholds) ? nextConfig.thresholds : []).map((threshold, index) => ({
      threshold: Math.max(0, Math.floor(Number(threshold || 0)))
    }));
    renderGuildBuildingLevelRows();
    guildBuildingMsg.textContent = '保存成功';
    guildBuildingMsg.style.color = 'green';
    setTimeout(() => { guildBuildingMsg.textContent = ''; }, 1500);
  } catch (err) {
    guildBuildingMsg.textContent = `保存失败: ${err.message}`;
    guildBuildingMsg.style.color = 'red';
  }
}

// 每日幸运玩家管理
async function refreshDailyLucky() {
  if (!dailyLuckyMsg) return;
  dailyLuckyMsg.textContent = '';
  try {
    await api('/admin/daily-lucky/refresh', 'POST');
    dailyLuckyMsg.textContent = '刷新成功';
    dailyLuckyMsg.style.color = 'green';
    setTimeout(() => {
      dailyLuckyMsg.textContent = '';
    }, 2000);
  } catch (err) {
    dailyLuckyMsg.textContent = `刷新失败: ${err.message}`;
    dailyLuckyMsg.style.color = 'red';
  }
}

async function showDailyLuckyInfo() {
  if (!dailyLuckyList) return;
  try {
    const data = await api('/admin/daily-lucky-info', 'GET');
    const items = data.data || [];
    
    dailyLuckyList.innerHTML = '';
    if (!items.length) {
      dailyLuckyList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">暂无数据</td></tr>';
      return;
    }
    
    items.forEach(item => {
      const tr = document.createElement('tr');
      
      const tdRealm = document.createElement('td');
      tdRealm.textContent = `${item.realmId} - ${item.realmName}`;
      tr.appendChild(tdRealm);
      
      const tdDate = document.createElement('td');
      tdDate.textContent = item.date || '无';
      tr.appendChild(tdDate);
      
      const tdName = document.createElement('td');
      tdName.textContent = item.lucky?.name || '无';
      tr.appendChild(tdName);
      
      const tdAttr = document.createElement('td');
      tdAttr.textContent = item.lucky?.attr || '无';
      tr.appendChild(tdAttr);
      
      dailyLuckyList.appendChild(tr);
    });
    
    dailyLuckyTableContainer.style.display = 'block';
  } catch (err) {
    dailyLuckyList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #dc3545;">加载失败: ${err.message}</td></tr>`;
  }
}

async function loadWorldBossKillCount() {
  if (!wbKillCountInput || !wbKillRealmInput) return;
  if (wbKillMsg) wbKillMsg.textContent = '';
  try {
    const realmId = getRealmIdFromInput(wbKillRealmInput, 1);
    const data = await api(`/admin/worldboss-killcount?realmId=${realmId}`, 'GET');
    wbKillCountInput.value = data.count ?? '';
    if (wbKillMsg) {
      wbKillMsg.textContent = '已读取';
      wbKillMsg.style.color = 'green';
      setTimeout(() => {
        wbKillMsg.textContent = '';
      }, 1500);
    }
  } catch (err) {
    if (wbKillMsg) {
      wbKillMsg.textContent = `读取失败: ${err.message}`;
      wbKillMsg.style.color = 'red';
    }
  }
}

async function saveWorldBossKillCount(countOverride = null) {
  if (!wbKillCountInput) return;
  if (wbKillMsg) wbKillMsg.textContent = '';
  try {
    const realmId = getRealmIdFromInput(wbKillRealmInput, 1);
    const countValue = countOverride !== null ? countOverride : Number(wbKillCountInput.value);
    const normalized = Math.max(0, Math.floor(Number(countValue) || 0));
    await api('/admin/worldboss-killcount/update', 'POST', { realmId, count: normalized });
    wbKillCountInput.value = normalized;
    if (wbKillMsg) {
      wbKillMsg.textContent = '已保存';
      wbKillMsg.style.color = 'green';
      setTimeout(() => {
        wbKillMsg.textContent = '';
      }, 1500);
    }
  } catch (err) {
    if (wbKillMsg) {
      wbKillMsg.textContent = `保存失败: ${err.message}`;
      wbKillMsg.style.color = 'red';
    }
  }
}

async function loadSpecialBossKillCount() {
  if (!sbKillCountInput || !sbKillRealmInput) return;
  if (sbKillMsg) sbKillMsg.textContent = '';
  try {
    const realmId = getRealmIdFromInput(sbKillRealmInput, 1);
    const data = await api(`/admin/specialboss-killcount?realmId=${realmId}`, 'GET');
    sbKillCountInput.value = data.count ?? '';
    if (sbKillMsg) {
      sbKillMsg.textContent = '已读取';
      sbKillMsg.style.color = 'green';
      setTimeout(() => {
        sbKillMsg.textContent = '';
      }, 1500);
    }
  } catch (err) {
    if (sbKillMsg) {
      sbKillMsg.textContent = `读取失败: ${err.message}`;
      sbKillMsg.style.color = 'red';
    }
  }
}

async function saveSpecialBossKillCount(countOverride = null) {
  if (!sbKillCountInput) return;
  if (sbKillMsg) sbKillMsg.textContent = '';
  try {
    const realmId = getRealmIdFromInput(sbKillRealmInput, 1);
    const countValue = countOverride !== null ? countOverride : Number(sbKillCountInput.value);
    const normalized = Math.max(0, Math.floor(Number(countValue) || 0));
    await api('/admin/specialboss-killcount/update', 'POST', { realmId, count: normalized });
    sbKillCountInput.value = normalized;
    if (sbKillMsg) {
      sbKillMsg.textContent = '已保存';
      sbKillMsg.style.color = 'green';
      setTimeout(() => {
        sbKillMsg.textContent = '';
      }, 1500);
    }
  } catch (err) {
    if (sbKillMsg) {
      sbKillMsg.textContent = `保存失败: ${err.message}`;
      sbKillMsg.style.color = 'red';
    }
  }
}

async function loadCultivationBossKillCount() {
  if (!cbKillCountInput || !cbKillRealmInput) return;
  if (cbKillMsg) cbKillMsg.textContent = '';
  try {
    const realmId = getRealmIdFromInput(cbKillRealmInput, 1);
    const data = await api(`/admin/cultivationboss-killcount?realmId=${realmId}`, 'GET');
    cbKillCountInput.value = data.count ?? '';
    if (cbKillMsg) {
      cbKillMsg.textContent = '已读取';
      cbKillMsg.style.color = 'green';
      setTimeout(() => {
        cbKillMsg.textContent = '';
      }, 1500);
    }
  } catch (err) {
    if (cbKillMsg) {
      cbKillMsg.textContent = `读取失败: ${err.message}`;
      cbKillMsg.style.color = 'red';
    }
  }
}

async function saveCultivationBossKillCount(countOverride = null) {
  if (!cbKillCountInput) return;
  if (cbKillMsg) cbKillMsg.textContent = '';
  try {
    const realmId = getRealmIdFromInput(cbKillRealmInput, 1);
    const countValue = countOverride !== null ? countOverride : Number(cbKillCountInput.value);
    const normalized = Math.max(0, Math.floor(Number(countValue) || 0));
    await api('/admin/cultivationboss-killcount/update', 'POST', { realmId, count: normalized });
    cbKillCountInput.value = normalized;
    if (cbKillMsg) {
      cbKillMsg.textContent = '已保存';
      cbKillMsg.style.color = 'green';
      setTimeout(() => {
        cbKillMsg.textContent = '';
      }, 1500);
    }
  } catch (err) {
    if (cbKillMsg) {
      cbKillMsg.textContent = `保存失败: ${err.message}`;
      cbKillMsg.style.color = 'red';
    }
  }
}

// 自定义模态框
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmText = document.getElementById('confirm-text');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');

const alertModal = document.getElementById('alert-modal');
const alertTitle = document.getElementById('alert-title');
const alertText = document.getElementById('alert-text');
const alertOk = document.getElementById('alert-ok');

const promptModal = document.getElementById('prompt-modal');
const promptTitle = document.getElementById('prompt-title');
const promptText = document.getElementById('prompt-text');
const promptInput = document.getElementById('prompt-input');
const promptCancel = document.getElementById('prompt-cancel');
const promptOk = document.getElementById('prompt-ok');

let pendingPwUser = null;
let confirmCallback = null;
let alertCallback = null;
let promptCallback = null;

let adminToken = localStorage.getItem('adminToken');
let currentUsersPage = 1;
let totalUsersPages = 1;
let currentUsersSearch = '';
let currentSponsorsPage = 1;
let totalSponsorsPages = 1;
let allSponsorsData = [];

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
}

// 自定义弹窗函数
function customConfirm(title, message) {
  return new Promise((resolve) => {
    confirmCallback = resolve;
    confirmTitle.textContent = title;
    confirmText.textContent = message;
    confirmModal.classList.remove('hidden');
  });
}

function customAlert(title, message) {
  return new Promise((resolve) => {
    alertCallback = resolve;
    alertTitle.textContent = title;
    alertText.textContent = message;
    alertModal.classList.remove('hidden');
  });
}

function customPrompt(title, message, defaultValue = '') {
  return new Promise((resolve) => {
    promptCallback = resolve;
    promptTitle.textContent = title;
    promptText.textContent = message;
    promptInput.value = defaultValue;
    promptModal.classList.remove('hidden');
    setTimeout(() => promptInput.focus(), 0);
  });
}

// 模态框事件绑定
confirmCancel.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  if (confirmCallback) {
    confirmCallback(false);
    confirmCallback = null;
  }
});

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 锻造系统配置
async function loadRefineSettings() {
  if (!refineMsg) return;
  refineMsg.textContent = '';
  try {
    const data = await api('/admin/refine-settings', 'GET');
    if (data.baseSuccessRate !== undefined && refineBaseSuccessRateInput) {
      refineBaseSuccessRateInput.value = data.baseSuccessRate;
    }
    if (data.decayRate !== undefined && refineDecayRateInput) {
      refineDecayRateInput.value = data.decayRate;
    }
    if (data.materialCount !== undefined && refineMaterialCountInput) {
      refineMaterialCountInput.value = data.materialCount;
    }
    if (data.bonusPerLevel !== undefined && refineBonusPerLevelInput) {
      refineBonusPerLevelInput.value = data.bonusPerLevel;
    }
    refineMsg.textContent = '加载成功';
    refineMsg.style.color = 'green';
    setTimeout(() => {
      refineMsg.textContent = '';
    }, 2000);
  } catch (err) {
    refineMsg.textContent = `加载失败: ${err.message}`;
    refineMsg.style.color = 'red';
  }
}

async function saveRefineSettings() {
  if (!refineMsg) return;
  refineMsg.textContent = '';
  try {
    const baseSuccessRate = refineBaseSuccessRateInput ? Number(refineBaseSuccessRateInput.value) : undefined;
    const decayRate = refineDecayRateInput ? Number(refineDecayRateInput.value) : undefined;
    const materialCount = refineMaterialCountInput ? Number(refineMaterialCountInput.value) : undefined;
    const bonusPerLevel = refineBonusPerLevelInput ? Number(refineBonusPerLevelInput.value) : undefined;

    if (baseSuccessRate !== undefined && (isNaN(baseSuccessRate) || baseSuccessRate < 1 || baseSuccessRate > 100)) {
      refineMsg.textContent = '基础成功率必须在1-100之间';
      refineMsg.style.color = 'red';
      return;
    }
    if (decayRate !== undefined && (isNaN(decayRate) || decayRate < 0)) {
      refineMsg.textContent = '衰减率必须为有效数字且不小于0';
      refineMsg.style.color = 'red';
      return;
    }
    if (materialCount !== undefined && (isNaN(materialCount) || materialCount < 1)) {
      refineMsg.textContent = '材料数量必须为正整数';
      refineMsg.style.color = 'red';
      return;
    }
    if (bonusPerLevel !== undefined && (isNaN(bonusPerLevel) || bonusPerLevel < 0)) {
      refineMsg.textContent = '每级加成值必须为有效数字且不小于0';
      refineMsg.style.color = 'red';
      return;
    }

    await api('/admin/refine-settings/update', 'POST', { baseSuccessRate, decayRate, materialCount, bonusPerLevel });
    refineMsg.textContent = '保存成功，立即生效';
    refineMsg.style.color = 'green';
    setTimeout(() => {
      refineMsg.textContent = '';
    }, 2000);
  } catch (err) {
    refineMsg.textContent = `保存失败: ${err.message}`;
    refineMsg.style.color = 'red';
  }
}

function setUltimateGrowthMsg(text, color = 'green', clearDelay = 1800) {
  if (!ultimateGrowthMsg) return;
  ultimateGrowthMsg.textContent = text || '';
  ultimateGrowthMsg.style.color = color;
  if (text && clearDelay > 0) {
    setTimeout(() => {
      if (ultimateGrowthMsg) ultimateGrowthMsg.textContent = '';
    }, clearDelay);
  }
}

async function loadUltimateGrowthSettings() {
  if (!ultimateGrowthMsg) return;
  setUltimateGrowthMsg('');
  try {
    const data = await api('/admin/ultimate-growth-settings', 'GET');
    const cfg = data?.settings || {};
    if (ultimateGrowthEnabledInput) ultimateGrowthEnabledInput.checked = cfg.enabled !== false;
    if (ultimateGrowthMaxLevelInput) ultimateGrowthMaxLevelInput.value = Number(cfg.maxLevel ?? 0);
    if (ultimateGrowthPerLevelPctInput) ultimateGrowthPerLevelPctInput.value = Number(cfg.perLevelPct ?? 0.006);
    if (ultimateGrowthTierEveryInput) ultimateGrowthTierEveryInput.value = Number(cfg.tierEvery ?? 20);
    if (ultimateGrowthTierBonusPctInput) ultimateGrowthTierBonusPctInput.value = Number(cfg.tierBonusPct ?? 0.03);
    if (ultimateGrowthBreakthroughEveryInput) ultimateGrowthBreakthroughEveryInput.value = Number(cfg.breakthroughEvery ?? 20);
    if (ultimateGrowthBreakthroughMaterialCostInput) ultimateGrowthBreakthroughMaterialCostInput.value = Number(cfg.breakthroughMaterialCost ?? 1);
    if (ultimateGrowthGoldCostInput) ultimateGrowthGoldCostInput.value = Number(cfg.goldCost ?? 50000);
    if (ultimateGrowthSuccessRateEarlyInput) ultimateGrowthSuccessRateEarlyInput.value = Number(cfg.successRateEarly ?? 100);
    if (ultimateGrowthSuccessRateMidInput) ultimateGrowthSuccessRateMidInput.value = Number(cfg.successRateMid ?? 70);
    if (ultimateGrowthSuccessRateLateInput) ultimateGrowthSuccessRateLateInput.value = Number(cfg.successRateLate ?? 45);
    if (ultimateGrowthFailStackBonusPctInput) ultimateGrowthFailStackBonusPctInput.value = Number(cfg.failStackBonusPct ?? 0.03);
    if (ultimateGrowthFailStackCapPctInput) ultimateGrowthFailStackCapPctInput.value = Number(cfg.failStackCapPct ?? 0.45);
    setUltimateGrowthMsg('加载成功');
  } catch (err) {
    setUltimateGrowthMsg(`加载失败: ${err.message}`, 'red', 0);
  }
}

async function saveUltimateGrowthSettings() {
  if (!ultimateGrowthMsg) return;
  setUltimateGrowthMsg('');
  try {
    const payload = {
      enabled: ultimateGrowthEnabledInput ? Boolean(ultimateGrowthEnabledInput.checked) : true,
      maxLevel: Math.max(0, Math.floor(Number(ultimateGrowthMaxLevelInput?.value || 0))),
      perLevelPct: Number(ultimateGrowthPerLevelPctInput?.value),
      tierEvery: Math.max(1, Math.floor(Number(ultimateGrowthTierEveryInput?.value || 1))),
      tierBonusPct: Number(ultimateGrowthTierBonusPctInput?.value),
      materialId: ULTIMATE_GROWTH_FIXED_MATERIAL_ID,
      breakthroughEvery: Math.max(1, Math.floor(Number(ultimateGrowthBreakthroughEveryInput?.value || 1))),
      breakthroughMaterialId: ULTIMATE_GROWTH_FIXED_BREAK_MATERIAL_ID,
      breakthroughMaterialCost: Math.max(1, Math.floor(Number(ultimateGrowthBreakthroughMaterialCostInput?.value || 1))),
      goldCost: Math.max(0, Math.floor(Number(ultimateGrowthGoldCostInput?.value || 0))),
      successRateEarly: Number(ultimateGrowthSuccessRateEarlyInput?.value),
      successRateMid: Number(ultimateGrowthSuccessRateMidInput?.value),
      successRateLate: Number(ultimateGrowthSuccessRateLateInput?.value),
      failStackBonusPct: Number(ultimateGrowthFailStackBonusPctInput?.value),
      failStackCapPct: Number(ultimateGrowthFailStackCapPctInput?.value)
    };
    if (!Number.isFinite(payload.perLevelPct) || payload.perLevelPct < 0) throw new Error('每级成长比例必须大于等于0');
    if (!Number.isFinite(payload.tierBonusPct) || payload.tierBonusPct < 0) throw new Error('每阶额外比例必须大于等于0');
    if (!Number.isFinite(payload.successRateEarly) || payload.successRateEarly < 0 || payload.successRateEarly > 100) throw new Error('前期成功率必须在0-100之间');
    if (!Number.isFinite(payload.successRateMid) || payload.successRateMid < 0 || payload.successRateMid > 100) throw new Error('中期成功率必须在0-100之间');
    if (!Number.isFinite(payload.successRateLate) || payload.successRateLate < 0 || payload.successRateLate > 100) throw new Error('后期成功率必须在0-100之间');
    if (!Number.isFinite(payload.failStackBonusPct) || payload.failStackBonusPct < 0) throw new Error('失败保底增幅必须大于等于0');
    if (!Number.isFinite(payload.failStackCapPct) || payload.failStackCapPct < 0) throw new Error('失败保底上限必须大于等于0');

    await api('/admin/ultimate-growth-settings/update', 'POST', { settings: payload });
    setUltimateGrowthMsg('保存成功，立即生效');
    await loadUltimateGrowthSettings();
  } catch (err) {
    setUltimateGrowthMsg(`保存失败: ${err.message}`, 'red', 0);
  }
}

// 特效重置配置
async function loadEffectResetSettings() {
  if (!effectResetMsg) return;
  effectResetMsg.textContent = '';
  try {
    const data = await api('/admin/effect-reset-settings', 'GET');
    if (data.successRate !== undefined && effectResetSuccessRateInput) {
      effectResetSuccessRateInput.value = data.successRate;
    }
    if (data.doubleRate !== undefined && effectResetDoubleRateInput) {
      effectResetDoubleRateInput.value = data.doubleRate;
    }
    if (data.tripleRate !== undefined && effectResetTripleRateInput) {
      effectResetTripleRateInput.value = data.tripleRate;
    }
    if (data.quadrupleRate !== undefined && effectResetQuadrupleRateInput) {
      effectResetQuadrupleRateInput.value = data.quadrupleRate;
    }
    if (data.quintupleRate !== undefined && effectResetQuintupleRateInput) {
      effectResetQuintupleRateInput.value = data.quintupleRate;
    }
    if (data.dropSingleChance !== undefined && effectDropSingleChanceInput) {
      effectDropSingleChanceInput.value = data.dropSingleChance;
    }
    if (data.dropDoubleChance !== undefined && effectDropDoubleChanceInput) {
      effectDropDoubleChanceInput.value = data.dropDoubleChance;
    }
    if (data.equipSkillDropChance !== undefined && equipSkillDropChanceInput) {
      equipSkillDropChanceInput.value = data.equipSkillDropChance;
    }
    effectResetMsg.textContent = '加载成功';
    effectResetMsg.style.color = 'green';
    setTimeout(() => {
      effectResetMsg.textContent = '';
    }, 2000);
  } catch (err) {
    effectResetMsg.textContent = `加载失败: ${err.message}`;
    effectResetMsg.style.color = 'red';
  }
}

async function saveEffectResetSettings() {
  if (!effectResetMsg) return;
  effectResetMsg.textContent = '';
  try {
    const successRate = effectResetSuccessRateInput ? Number(effectResetSuccessRateInput.value) : undefined;
    const doubleRate = effectResetDoubleRateInput ? Number(effectResetDoubleRateInput.value) : undefined;
    const tripleRate = effectResetTripleRateInput ? Number(effectResetTripleRateInput.value) : undefined;
    const quadrupleRate = effectResetQuadrupleRateInput ? Number(effectResetQuadrupleRateInput.value) : undefined;
    const quintupleRate = effectResetQuintupleRateInput ? Number(effectResetQuintupleRateInput.value) : undefined;
    const dropSingleChance = effectDropSingleChanceInput ? Number(effectDropSingleChanceInput.value) : undefined;
    const dropDoubleChance = effectDropDoubleChanceInput ? Number(effectDropDoubleChanceInput.value) : undefined;
    const equipSkillDropChance = equipSkillDropChanceInput ? Number(equipSkillDropChanceInput.value) : undefined;

    if (successRate !== undefined && (isNaN(successRate) || successRate < 0 || successRate > 100)) {
      effectResetMsg.textContent = '成功率必须在0-100之间';
      effectResetMsg.style.color = 'red';
      return;
    }
    if (doubleRate !== undefined && (isNaN(doubleRate) || doubleRate < 0 || doubleRate > 100)) {
      effectResetMsg.textContent = '双特效概率必须在0-100之间';
      effectResetMsg.style.color = 'red';
      return;
    }
    if (tripleRate !== undefined && (isNaN(tripleRate) || tripleRate < 0 || tripleRate > 100)) {
      effectResetMsg.textContent = '3特效概率必须在0-100之间';
      effectResetMsg.style.color = 'red';
      return;
    }
    if (quadrupleRate !== undefined && (isNaN(quadrupleRate) || quadrupleRate < 0 || quadrupleRate > 100)) {
      effectResetMsg.textContent = '4特效概率必须在0-100之间';
      effectResetMsg.style.color = 'red';
      return;
    }
    if (quintupleRate !== undefined && (isNaN(quintupleRate) || quintupleRate < 0 || quintupleRate > 100)) {
      effectResetMsg.textContent = '5特效概率必须在0-100之间';
      effectResetMsg.style.color = 'red';
      return;
    }
    if (dropSingleChance !== undefined && (isNaN(dropSingleChance) || dropSingleChance < 0 || dropSingleChance > 100)) {
      effectResetMsg.textContent = '单特效掉落概率必须在0-100之间';
      effectResetMsg.style.color = 'red';
      return;
    }
    if (dropDoubleChance !== undefined && (isNaN(dropDoubleChance) || dropDoubleChance < 0 || dropDoubleChance > 100)) {
      effectResetMsg.textContent = '双特效掉落概率必须在0-100之间';
      effectResetMsg.style.color = 'red';
      return;
    }
    if (equipSkillDropChance !== undefined && (isNaN(equipSkillDropChance) || equipSkillDropChance < 0 || equipSkillDropChance > 100)) {
      effectResetMsg.textContent = '附加技能掉落概率必须在0-100之间';
      effectResetMsg.style.color = 'red';
      return;
    }

    await api('/admin/effect-reset-settings/update', 'POST', { successRate, doubleRate, tripleRate, quadrupleRate, quintupleRate, dropSingleChance, dropDoubleChance, equipSkillDropChance });
    effectResetMsg.textContent = '保存成功，立即生效';
    effectResetMsg.style.color = 'green';
    setTimeout(() => {
      effectResetMsg.textContent = '';
    }, 2000);
  } catch (err) {
    effectResetMsg.textContent = `保存失败: ${err.message}`;
    effectResetMsg.style.color = 'red';
  }
}

function setInputValue(input, value) {
  if (!input) return;
  input.value = value ?? '';
}

function readNumberValue(input, fallback, invalidFlag) {
  if (!input) return fallback;
  const raw = input.value;
  if (raw === '' || raw === null || raw === undefined) return fallback;
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    invalidFlag.invalid = true;
    return fallback;
  }
  return num;
}

function parseSkillLibrary(text) {
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const list = [];
  const errors = [];
  lines.forEach((line, index) => {
    const parts = line.split(',').map(part => part.trim());
    if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) {
      errors.push(index + 1);
      return;
    }
    list.push({ id: parts[0], name: parts[1], grade: parts[2] });
  });
  return { list, errors };
}

function parseSkillEffects(text) {
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const effects = {};
  const errors = [];
  lines.forEach((line, index) => {
    const pos = line.indexOf('=');
    if (pos <= 0 || pos === line.length - 1) {
      errors.push(index + 1);
      return;
    }
    const id = line.slice(0, pos).trim();
    const desc = line.slice(pos + 1).trim();
    if (!id || !desc) {
      errors.push(index + 1);
      return;
    }
    effects[id] = desc;
  });
  return { effects, errors };
}

function formatSkillLibrary(list) {
  if (!Array.isArray(list)) return '';
  return list.map(item => `${item.id || ''},${item.name || ''},${item.grade || ''}`).join('\n');
}

function formatSkillEffects(effects, skillLibrary) {
  const lines = [];
  const used = new Set();
  if (Array.isArray(skillLibrary)) {
    skillLibrary.forEach((skill) => {
      const id = skill?.id;
      if (!id || effects?.[id] === undefined) return;
      lines.push(`${id}=${effects[id]}`);
      used.add(id);
    });
  }
  Object.keys(effects || {}).forEach((id) => {
    if (used.has(id)) return;
    lines.push(`${id}=${effects[id]}`);
  });
  return lines.join('\n');
}

function applyPetSettingsToForm(settings) {
  if (!settings) return;
  setInputValue(petMaxOwnedInput, settings.maxOwned);
  setInputValue(petBaseSkillSlotsInput, settings.baseSkillSlots);
  setInputValue(petMaxSkillSlotsInput, settings.maxSkillSlots);
  setInputValue(petSynthesisCostInput, settings.synthesisCostGold);
  setInputValue(petComprehendMaxSkillsInput, settings.comprehendMaxSkills);
  setInputValue(petBookUnlockSlot4ChanceInput, settings.bookUnlockSlot4Chance);
  setInputValue(petSynthesisUnlockSlotChanceInput, settings.synthesisUnlockSlotChance);
  setInputValue(petSynthesisInheritChanceInput, settings.synthesisInheritChance);
  setInputValue(petSynthesisMultiSkillChanceInput, settings.synthesisMultiSkillChance);
  setInputValue(petDropMaxChanceInput, settings.dropMaxChance);
  setInputValue(petDropBonusMinInput, settings.dropBonusMin);
  Object.entries(petDropBaseInputs).forEach(([rarity, input]) => {
    setInputValue(input, settings.dropBaseChanceByCap?.[rarity]);
  });
  Object.entries(petDropWeightInputs).forEach(([rarity, input]) => {
    setInputValue(input, settings.dropRarityWeights?.[rarity]);
  });
  Object.entries(petBookBaseInputs).forEach(([rarity, input]) => {
    setInputValue(input, settings.bookBaseChanceByCap?.[rarity]);
  });
  Object.entries(petBookHighInputs).forEach(([rarity, input]) => {
    setInputValue(input, settings.bookHighChanceByCap?.[rarity]);
  });
  setInputValue(petBookSecondChanceInput, settings.bookSecondDropChance);
  if (petBookSecondEligibleInput) {
    petBookSecondEligibleInput.value = Array.isArray(settings.bookSecondEligibleRarities)
      ? settings.bookSecondEligibleRarities.join(',')
      : '';
  }
  if (petBookSecondRequireSpecialInput) {
    petBookSecondRequireSpecialInput.checked = !!settings.bookSecondRequireSpecialBoss;
  }
  Object.entries(petGrowthInputs).forEach(([rarity, inputs]) => {
    const range = settings.rarityGrowthRange?.[rarity] || [];
    setInputValue(inputs.min, range[0]);
    setInputValue(inputs.max, range[1]);
  });
  Object.entries(petAptitudeInputs).forEach(([rarity, stats]) => {
    const range = settings.rarityAptitudeRange?.[rarity] || {};
    Object.entries(stats).forEach(([stat, inputs]) => {
      const values = range?.[stat] || [];
      setInputValue(inputs.min, values[0]);
      setInputValue(inputs.max, values[1]);
    });
  });
  if (petSkillLibraryInput) petSkillLibraryInput.value = formatSkillLibrary(settings.skillLibrary);
  if (petSkillEffectsInput) petSkillEffectsInput.value = formatSkillEffects(settings.skillEffects, settings.skillLibrary);
}

async function loadPetSettings() {
  if (!petSettingsMsg) return;
  petSettingsMsg.textContent = '';
  try {
    const data = await api('/admin/pet-settings', 'GET');
    if (!data?.settings) {
      petSettingsMsg.textContent = '加载失败：返回数据为空';
      petSettingsMsg.style.color = 'red';
      return;
    }
    petSettingsCache = data.settings;
    applyPetSettingsToForm(petSettingsCache);
    petSettingsMsg.textContent = '加载成功';
    petSettingsMsg.style.color = 'green';
    setTimeout(() => {
      if (petSettingsMsg) petSettingsMsg.textContent = '';
    }, 1500);
  } catch (err) {
    petSettingsMsg.textContent = `加载失败: ${err.message}`;
    petSettingsMsg.style.color = 'red';
  }
}

async function savePetSettings() {
  if (!petSettingsMsg) return;
  petSettingsMsg.textContent = '';
  const invalidFlag = { invalid: false };
  const base = petSettingsCache ? JSON.parse(JSON.stringify(petSettingsCache)) : {};
  base.dropBaseChanceByCap = base.dropBaseChanceByCap || {};
  base.dropRarityWeights = base.dropRarityWeights || {};
  base.bookBaseChanceByCap = base.bookBaseChanceByCap || {};
  base.bookHighChanceByCap = base.bookHighChanceByCap || {};
  base.rarityGrowthRange = base.rarityGrowthRange || {};
  base.rarityAptitudeRange = base.rarityAptitudeRange || {};
  base.bookSecondEligibleRarities = base.bookSecondEligibleRarities || [];

  base.maxOwned = readNumberValue(petMaxOwnedInput, base.maxOwned, invalidFlag);
  base.baseSkillSlots = readNumberValue(petBaseSkillSlotsInput, base.baseSkillSlots, invalidFlag);
  base.maxSkillSlots = readNumberValue(petMaxSkillSlotsInput, base.maxSkillSlots, invalidFlag);
  base.synthesisCostGold = readNumberValue(petSynthesisCostInput, base.synthesisCostGold, invalidFlag);
  base.comprehendMaxSkills = readNumberValue(petComprehendMaxSkillsInput, base.comprehendMaxSkills, invalidFlag);
  base.bookUnlockSlot4Chance = readNumberValue(petBookUnlockSlot4ChanceInput, base.bookUnlockSlot4Chance, invalidFlag);
  base.synthesisUnlockSlotChance = readNumberValue(petSynthesisUnlockSlotChanceInput, base.synthesisUnlockSlotChance, invalidFlag);
  base.synthesisInheritChance = readNumberValue(petSynthesisInheritChanceInput, base.synthesisInheritChance, invalidFlag);
  base.synthesisMultiSkillChance = readNumberValue(petSynthesisMultiSkillChanceInput, base.synthesisMultiSkillChance, invalidFlag);
  base.dropMaxChance = readNumberValue(petDropMaxChanceInput, base.dropMaxChance, invalidFlag);
  base.dropBonusMin = readNumberValue(petDropBonusMinInput, base.dropBonusMin, invalidFlag);
  Object.entries(petDropBaseInputs).forEach(([rarity, input]) => {
    base.dropBaseChanceByCap[rarity] = readNumberValue(input, base.dropBaseChanceByCap[rarity], invalidFlag);
  });
  Object.entries(petDropWeightInputs).forEach(([rarity, input]) => {
    base.dropRarityWeights[rarity] = readNumberValue(input, base.dropRarityWeights[rarity], invalidFlag);
  });
  Object.entries(petBookBaseInputs).forEach(([rarity, input]) => {
    base.bookBaseChanceByCap[rarity] = readNumberValue(input, base.bookBaseChanceByCap[rarity], invalidFlag);
  });
  Object.entries(petBookHighInputs).forEach(([rarity, input]) => {
    base.bookHighChanceByCap[rarity] = readNumberValue(input, base.bookHighChanceByCap[rarity], invalidFlag);
  });
  base.bookSecondDropChance = readNumberValue(petBookSecondChanceInput, base.bookSecondDropChance, invalidFlag);
  if (petBookSecondEligibleInput) {
    const raw = petBookSecondEligibleInput.value || '';
    base.bookSecondEligibleRarities = raw.split(',').map(item => item.trim()).filter(Boolean);
  }
  if (petBookSecondRequireSpecialInput) {
    base.bookSecondRequireSpecialBoss = !!petBookSecondRequireSpecialInput.checked;
  }
  Object.entries(petGrowthInputs).forEach(([rarity, inputs]) => {
    const current = base.rarityGrowthRange[rarity] || [];
    const min = readNumberValue(inputs.min, current[0], invalidFlag);
    const max = readNumberValue(inputs.max, current[1], invalidFlag);
    base.rarityGrowthRange[rarity] = [min, max];
  });
  Object.entries(petAptitudeInputs).forEach(([rarity, stats]) => {
    const current = base.rarityAptitudeRange[rarity] || {};
    base.rarityAptitudeRange[rarity] = { ...current };
    Object.entries(stats).forEach(([stat, inputs]) => {
      const currentValues = current[stat] || [];
      const min = readNumberValue(inputs.min, currentValues[0], invalidFlag);
      const max = readNumberValue(inputs.max, currentValues[1], invalidFlag);
      base.rarityAptitudeRange[rarity][stat] = [min, max];
    });
  });

  if (invalidFlag.invalid) {
    petSettingsMsg.textContent = '存在无效数字，请检查输入';
    petSettingsMsg.style.color = 'red';
    return;
  }

  if (petSkillLibraryInput) {
    const parsed = parseSkillLibrary(petSkillLibraryInput.value);
    if (parsed.errors.length) {
      petSettingsMsg.textContent = `技能库格式错误：第 ${parsed.errors.join(', ')} 行`;
      petSettingsMsg.style.color = 'red';
      return;
    }
    base.skillLibrary = parsed.list;
  }
  if (petSkillEffectsInput) {
    const parsed = parseSkillEffects(petSkillEffectsInput.value);
    if (parsed.errors.length) {
      petSettingsMsg.textContent = `技能效果格式错误：第 ${parsed.errors.join(', ')} 行`;
      petSettingsMsg.style.color = 'red';
      return;
    }
    base.skillEffects = parsed.effects;
  }

  try {
    const data = await api('/admin/pet-settings/update', 'POST', { settings: base });
    if (data?.settings) {
      petSettingsCache = data.settings;
      applyPetSettingsToForm(petSettingsCache);
    }
    petSettingsMsg.textContent = '保存成功';
    petSettingsMsg.style.color = 'green';
    setTimeout(() => {
      if (petSettingsMsg) petSettingsMsg.textContent = '';
    }, 1500);
  } catch (err) {
    petSettingsMsg.textContent = `保存失败: ${err.message}`;
    petSettingsMsg.style.color = 'red';
  }
}

confirmOk.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  if (confirmCallback) {
    confirmCallback(true);
    confirmCallback = null;
  }
});

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

alertOk.addEventListener('click', () => {
  alertModal.classList.add('hidden');
  if (alertCallback) {
    alertCallback();
    alertCallback = null;
  }
});

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

promptCancel.addEventListener('click', () => {
  promptModal.classList.add('hidden');
  if (promptCallback) {
    promptCallback(null);
    promptCallback = null;
  }
});

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

promptOk.addEventListener('click', () => {
  promptModal.classList.add('hidden');
  if (promptCallback) {
    promptCallback(promptInput.value);
    promptCallback = null;
  }
});

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    promptModal.classList.add('hidden');
    if (promptCallback) {
      promptCallback(promptInput.value);
      promptCallback = null;
    }
  }
});

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

function initCollapsibleBlocks() {
  return;
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function api(path, method, body) {
  const res = await fetch(adminPath(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken ? `Bearer ${adminToken}` : ''
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!text) {
    throw new Error('服务器返回空响应');
  }
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

async function loadDashboardStats() {
  if (!dashboardServer) return;
  if (dashboardMsg) dashboardMsg.textContent = '加载中...';
  try {
    const data = await api('/admin/dashboard-stats', 'GET');
    const server = data.server || {};
    const config = data.config || {};
    const counts = data.counts || {};
    const economy = data.economy || {};
    const activity = data.activity || {};

    renderStatList(dashboardServer, [
      { label: '服务器时间', value: formatAdminTime(server.time) },
      { label: '运行时长', value: formatDuration(server.uptimeSec) },
      { label: 'Node版本', value: server.nodeVersion || '-' },
      { label: '进程内存', value: formatBytes(server.memory?.rss) },
      { label: '堆内存', value: `${formatBytes(server.memory?.heapUsed)} / ${formatBytes(server.memory?.heapTotal)}` },
      { label: '负载(1/5/15)', value: Array.isArray(server.loadAvg) ? server.loadAvg.map(n => Number(n).toFixed(2)).join(' / ') : '-' },
      { label: '数据库', value: config.dbClient || '-' },
      { label: '后台路径', value: config.adminBase || '-' }
    ]);

    renderStatList(dashboardPlayers, [
      { label: '在线玩家', value: formatNumber(activity.onlinePlayers) },
      { label: '托管玩家', value: formatNumber(activity.managedPlayers) },
      { label: '24h活跃玩家', value: formatNumber(activity.activeUsers24h) },
      { label: '今日新增', value: formatNumber(counts.newUsersToday) },
      { label: '总账号', value: formatNumber(counts.users) },
      { label: '总角色', value: formatNumber(counts.characters) },
      { label: '24h活跃角色', value: formatNumber(counts.activeCharacters24h) },
      { label: '总行会', value: formatNumber(counts.guilds) },
      { label: '区服数量', value: formatNumber(counts.realms) }
    ]);

    renderStatList(dashboardEconomy, [
      { label: '金币总量', value: formatNumber(economy.totalGold) },
      { label: '元宝总量', value: formatNumber(economy.totalYuanbao) },
      { label: '平均等级', value: formatNumber(economy.avgLevel) }
    ]);

    renderStatList(dashboardOps, [
      { label: '活跃会话(24h)', value: formatNumber(activity.activeSessions24h) },
      { label: '邮件总数', value: formatNumber(counts.mails) },
      { label: '寄售总数', value: formatNumber(counts.consignments) },
      { label: '寄售历史', value: formatNumber(counts.consignmentHistory) }
    ]);

    renderRecentLogins(dashboardRecentLogins, data.recentLogins || []);

    if (dashboardMsg) {
      dashboardMsg.textContent = `更新时间：${formatAdminTime(server.time)}`;
      dashboardMsg.style.color = '';
    }
  } catch (err) {
    if (dashboardMsg) {
      dashboardMsg.textContent = `加载失败: ${err.message}`;
      dashboardMsg.style.color = 'red';
    }
  }
}

async function login() {
  loginMsg.textContent = '';
  try {
    const data = await api('/admin/login', 'POST', {
      username: document.getElementById('admin-user').value.trim(),
      password: document.getElementById('admin-pass').value.trim()
    });
      adminToken = data.token;
      localStorage.setItem('adminToken', adminToken);
      showDashboard();
      await loadDashboardStats();
      await refreshUsers();
      await refreshVipSelfClaimStatus();
      await refreshVipClaimLimitStatus();
      await loadSmtpSettings();
      await loadSvipSettings();
      await loadFirstRechargeSettings();
      await loadInviteRewardSettings();
      await refreshStateThrottleStatus();
    await refreshRoomVariantStatus();
    await refreshRealms();
    await loadWorldBossSettings();
    await loadSpecialBossSettings();
    await loadCultivationBossSettings();
    await loadPersonalBossSettings();
    await loadEventTimeSettings();
    await loadActivityPointShopConfig();
    await loadDivineBeastFragmentExchangeConfig();
  } catch (err) {
    loginMsg.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function refreshUsers(page = 1) {
  try {
    const searchParam = currentUsersSearch ? `&search=${encodeURIComponent(currentUsersSearch)}` : '';
    const data = await api(`/admin/users?page=${page}&limit=10${searchParam}`, 'GET');
    currentUsersPage = data.page;
    totalUsersPages = data.totalPages;
    
    usersList.innerHTML = '';
    if (!data.users || data.users.length === 0) {
      usersList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">暂无用户</td></tr>';
      usersPaginationInfo.textContent = currentUsersSearch ? `未找到匹配"${currentUsersSearch}"的用户` : '';
      return;
    }
    
    usersPaginationInfo.textContent = `第 ${data.page} / ${data.totalPages} 页 (共 ${data.total} 个用户)`;
    
    data.users.forEach((u) => {
      const tr = document.createElement('tr');
      
      // 用户名
      const tdName = document.createElement('td');
      tdName.textContent = u.username;
      tdName.style.cursor = 'pointer';
      tdName.title = u.is_admin ? '点击取消 GM' : '点击设为 GM';
      tdName.addEventListener('click', async () => {
        const nextAdmin = !u.is_admin;
        const actionLabel = nextAdmin ? '设为 GM' : '取消 GM';
        const confirmed = await customConfirm('确认操作', `确认对用户 "${u.username}" 执行 ${actionLabel} 吗？`);
        if (!confirmed) return;
        await quickToggleGM(u.username, nextAdmin);
      });
      tr.appendChild(tdName);
      
      // GM权限
      const tdGM = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = u.is_admin ? 'badge badge-yes' : 'badge badge-no';
      badge.textContent = u.is_admin ? '是' : '否';
      tdGM.appendChild(badge);
      tr.appendChild(tdGM);
      
      // 创建时间
      const tdTime = document.createElement('td');
      tdTime.textContent = new Date(u.created_at).toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      tr.appendChild(tdTime);
      
      // 操作按钮
      const tdAction = document.createElement('td');
      if (u.is_admin) {
        const btnDemote = document.createElement('button');
        btnDemote.className = 'btn-small btn-demote';
        btnDemote.textContent = '取消GM';
        btnDemote.addEventListener('click', () => quickToggleGM(u.username, false));
        tdAction.appendChild(btnDemote);
      } else {
        const btnPromote = document.createElement('button');
        btnPromote.className = 'btn-small btn-promote';
        btnPromote.textContent = '设为GM';
        btnPromote.addEventListener('click', () => quickToggleGM(u.username, true));
        tdAction.appendChild(btnPromote);
      }

      const btnPassword = document.createElement('button');
      btnPassword.className = 'btn-small btn-password';
      btnPassword.textContent = '改密码';
      btnPassword.addEventListener('click', () => resetUserPassword(u.username));
      tdAction.appendChild(btnPassword);

      const btnForceOffline = document.createElement('button');
      btnForceOffline.className = 'btn-small';
      btnForceOffline.textContent = '强制下线';
      btnForceOffline.style.background = '#d46f00';
      btnForceOffline.style.boxShadow = '0 4px 10px rgba(212, 111, 0, 0.3)';
      btnForceOffline.addEventListener('click', () => forceOfflineUser(u.username));
      tdAction.appendChild(btnForceOffline);
      
      // 删除按钮
      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-small btn-delete';
      btnDelete.textContent = '删除';
      btnDelete.style.background = '#6c757d';
      btnDelete.style.boxShadow = '0 4px 10px rgba(108, 117, 125, 0.3)';
      btnDelete.addEventListener('click', () => deleteUserAccount(u.id, u.username));
      tdAction.appendChild(btnDelete);
      
      tr.appendChild(tdAction);
      
      usersList.appendChild(tr);
    });
  } catch (err) {
    usersList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #dc3545;">${err.message}</td></tr>`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function quickToggleGM(username, isAdmin) {
  try {
    await api('/admin/users/promote', 'POST', { username, isAdmin });
    await refreshUsers(currentUsersPage);
  } catch (err) {
    await customAlert('操作失败', `操作失败: ${err.message}`);
  }
}

async function forceOfflineUser(username) {
  const confirmed = await customConfirm('强制下线', `确认强制下线用户 "${username}" 的所有在线角色，并清除登录状态吗？`);
  if (!confirmed) return;
  try {
    const data = await api('/admin/users/force-offline', 'POST', { username });
    await customAlert('操作成功', `已强制下线用户 "${username}"。处理角色数：${Number(data?.kicked || 0)}。`);
    await refreshUsers(currentUsersPage);
  } catch (err) {
    await customAlert('操作失败', `强制下线失败: ${err.message}`);
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function deleteUserAccount(userId, username) {
  const confirmed1 = await customConfirm('确认删除', `确定要删除用户 "${username}" 吗？\n\n此操作将删除该用户的所有数据（角色、邮件、行会等），且无法恢复！`);
  if (!confirmed1) {
    return;
  }

  const confirmed2 = await customConfirm('再次确认', `再次确认：真的要删除用户 "${username}" 吗？`);
  if (!confirmed2) {
    return;
  }

  try {
    await api('/admin/users/delete', 'POST', { userId });
    await customAlert('删除成功', '用户已删除');
    await refreshUsers(currentUsersPage);
  } catch (err) {
    await customAlert('删除失败', `删除失败: ${err.message}`);
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

function renderPlayerBonusList(configs) {
  const tbody = document.getElementById('wb-player-bonus-list');
  tbody.innerHTML = '';

  if (!configs || configs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">暂无配置，点击"添加配置"添加</td></tr>';
    return;
  }

  configs.sort((a, b) => a.min - b.min);

  configs.forEach((config, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding: 4px 6px;"><input type="number" min="1" value="${config.min}" data-field="min" style="width: 60px; font-size: 12px; padding: 2px 4px;"></td>
      <td style="padding: 4px 6px;"><input type="number" min="0" value="${config.hp || 0}" data-field="hp" style="width: 60px; font-size: 12px; padding: 2px 4px;"></td>
      <td style="padding: 4px 6px;"><input type="number" min="0" value="${config.atk || 0}" data-field="atk" style="width: 60px; font-size: 12px; padding: 2px 4px;"></td>
      <td style="padding: 4px 6px;"><input type="number" min="0" value="${config.def || 0}" data-field="def" style="width: 60px; font-size: 12px; padding: 2px 4px;"></td>
      <td style="padding: 4px 6px;"><input type="number" min="0" value="${config.mdef || 0}" data-field="mdef" style="width: 60px; font-size: 12px; padding: 2px 4px;"></td>
      <td style="padding: 4px 6px;">
        <button class="btn-small btn-delete" data-index="${index}" style="padding: 2px 6px; font-size: 11px;">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 绑定删除按钮事件
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      configs.splice(index, 1);
      renderPlayerBonusList(configs);
    });
  });
}

function getPlayerBonusConfigFromUI() {
  const tbody = document.getElementById('wb-player-bonus-list');
  const rows = tbody.querySelectorAll('tr');
  const configs = [];

  rows.forEach(tr => {
    const minInput = tr.querySelector('input[data-field="min"]');
    const hpInput = tr.querySelector('input[data-field="hp"]');
    const atkInput = tr.querySelector('input[data-field="atk"]');
    const defInput = tr.querySelector('input[data-field="def"]');
    const mdefInput = tr.querySelector('input[data-field="mdef"]');

    if (minInput) {
      configs.push({
        min: Number(minInput.value) || 0,
        hp: Number(hpInput?.value) || 0,
        atk: Number(atkInput?.value) || 0,
        def: Number(defInput?.value) || 0,
        mdef: Number(mdefInput?.value) || 0
      });
    }
  });

  return configs;
}

async function loadWorldBossSettings() {
  if (!document.getElementById('wb-msg')) return;
  const msg = document.getElementById('wb-msg');
  msg.textContent = '';
  try {
    const data = await api('/admin/worldboss-settings', 'GET');
    document.getElementById('wb-base-hp').value = data.baseHp || '';
    document.getElementById('wb-base-atk').value = data.baseAtk || '';
    document.getElementById('wb-base-def').value = data.baseDef || '';
    document.getElementById('wb-base-mdef').value = data.baseMdef || '';
    document.getElementById('wb-drop-bonus').value = data.dropBonus || '';
    document.getElementById('wb-respawn-mins').value = data.respawnMinutes || '';
      renderPlayerBonusList(data.playerBonusConfig || []);
      loadWorldBossKillCount();
    msg.textContent = '加载成功';
    msg.style.color = 'green';
  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveWorldBossSettings() {
  if (!document.getElementById('wb-msg')) return;
  const msg = document.getElementById('wb-msg');
  msg.textContent = '';
  try {
    const playerBonusConfig = getPlayerBonusConfigFromUI();
    await api('/admin/worldboss-settings/update', 'POST', {
      baseHp: Number(document.getElementById('wb-base-hp').value),
      baseAtk: Number(document.getElementById('wb-base-atk').value),
      baseDef: Number(document.getElementById('wb-base-def').value),
      baseMdef: Number(document.getElementById('wb-base-mdef').value),
      baseExp: Number(wbBaseExpInput?.value),
      baseGold: Number(wbBaseGoldInput?.value),
      dropBonus: Number(document.getElementById('wb-drop-bonus').value),
      respawnMinutes: Number(document.getElementById('wb-respawn-mins').value),
      playerBonusConfig
    });
    msg.textContent = '保存成功';
    msg.style.color = 'green';
  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

function addPlayerBonusConfig() {
  const tbody = document.getElementById('wb-player-bonus-list');
  const currentConfigs = getPlayerBonusConfigFromUI();
  currentConfigs.push({ min: 1, hp: 0, atk: 0, def: 0, mdef: 0 });
  renderPlayerBonusList(currentConfigs);
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function resetUserPassword(username) {
  if (!adminPwModal || !adminPwInput) return;
  pendingPwUser = username;
  adminPwTitle.textContent = '修改密码';
  adminPwText.textContent = `设置用户 "${username}" 的新密码`;
  adminPwInput.value = '';
  adminPwModal.classList.remove('hidden');
  setTimeout(() => adminPwInput.focus(), 0);
}

async function createVipCodes() {
  vipCodesResult.textContent = '';
  vipCodesTableContainer.style.display = 'none';
  try {
    const count = Number(document.getElementById('vip-count').value || 1);
    const durationType = document.getElementById('vip-duration')?.value || 'month';
    const data = await api('/admin/vip/create', 'POST', { count, durationType });
    vipCodesResult.textContent = `成功生成 ${data.codes.length} 个激活码:\n\n` + data.codes.join('\n');
  } catch (err) {
    vipCodesResult.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function listVipCodes() {
  vipCodesResult.textContent = '';
  vipCodesList.innerHTML = '';
  vipCodesTableContainer.style.display = 'none';
  
  try {
    const data = await api(`/admin/vip/list?page=${vipCodesPageIndex + 1}&limit=${VIP_CODES_PAGE_SIZE}`, 'GET');
    if (!data.codes || data.codes.length === 0) {
      vipCodesResult.textContent = '暂无激活码';
      vipCodesTotal = data.total || 0;
      if (vipCodesPage) vipCodesPage.textContent = '第 1/1 页';
      if (vipCodesPrev) vipCodesPrev.disabled = true;
      if (vipCodesNext) vipCodesNext.disabled = true;
      return;
    }
    
    vipCodesTableContainer.style.display = 'block';
    vipCodesTotal = data.total || data.codes.length;
    const totalPages = Math.max(1, Math.ceil(vipCodesTotal / VIP_CODES_PAGE_SIZE));
    if (vipCodesPage) vipCodesPage.textContent = `第 ${vipCodesPageIndex + 1}/${totalPages} 页`;
    if (vipCodesPrev) vipCodesPrev.disabled = vipCodesPageIndex <= 0;
    if (vipCodesNext) vipCodesNext.disabled = vipCodesPageIndex >= totalPages - 1;
    data.codes.forEach((c) => {
      const tr = document.createElement('tr');
      const typeMap = {
        month: '月卡',
        quarter: '季卡',
        year: '年卡',
        permanent: '永久',
        custom: '自定义'
      };
      
      // 激活码
      const tdCode = document.createElement('td');
      tdCode.textContent = c.code;
      tdCode.style.fontFamily = 'monospace';
      tr.appendChild(tdCode);

      // 类型
      const tdType = document.createElement('td');
      const durationType = (c.duration_type || '').toLowerCase();
      if (durationType === 'custom' && c.duration_days) {
        tdType.textContent = `自定义(${c.duration_days}天)`;
      } else if (durationType) {
        tdType.textContent = typeMap[durationType] || durationType;
      } else {
        tdType.textContent = '永久';
      }
      tr.appendChild(tdType);
      
      // 状态
      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = c.used_by_user_id ? 'badge badge-no' : 'badge badge-yes';
      statusBadge.textContent = c.used_by_user_id ? '已使用' : '未使用';
      tdStatus.appendChild(statusBadge);
      tr.appendChild(tdStatus);
      
      // 使用者ID
      const tdUser = document.createElement('td');
      tdUser.textContent = c.used_by_user_id || '-';
      tr.appendChild(tdUser);
      
      // 使用时间
      const tdTime = document.createElement('td');
      if (c.used_at) {
        tdTime.textContent = new Date(c.used_at).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        tdTime.textContent = '-';
      }
      tr.appendChild(tdTime);
      
      vipCodesList.appendChild(tr);
    });
  } catch (err) {
    vipCodesResult.textContent = err.message;
  }
}

async function createRechargeCodes() {
  if (!rechargeCodesResult || !rechargeCodesTableContainer) return;
  rechargeCodesResult.textContent = '';
  rechargeCodesTableContainer.style.display = 'none';
  try {
    const count = Number(document.getElementById('recharge-count').value || 1);
    const amount = Number(document.getElementById('recharge-amount').value || 0);
    const data = await api('/admin/recharge/create', 'POST', { count, amount });
    rechargeCodesResult.textContent = `成功生成 ${data.codes.length} 个卡密 (每个 ${data.amount} 元宝):\n\n` + data.codes.join('\n');
    rechargeCodesPageIndex = 0;
    rechargeCodesTotal = 0;
  } catch (err) {
    rechargeCodesResult.textContent = err.message;
  }
}

async function listRechargeCodes() {
  if (!rechargeCodesResult || !rechargeCodesList || !rechargeCodesTableContainer) return;
  rechargeCodesResult.textContent = '';
  rechargeCodesList.innerHTML = '';
  rechargeCodesTableContainer.style.display = 'none';

  try {
    const data = await api(`/admin/recharge/list?page=${rechargeCodesPageIndex + 1}&limit=${RECHARGE_CODES_PAGE_SIZE}`, 'GET');
    if (!data.codes || data.codes.length === 0) {
      rechargeCodesResult.textContent = '暂无卡密';
      rechargeCodesTotal = data.total || 0;
      if (rechargeCodesPage) rechargeCodesPage.textContent = '第 1/1 页';
      if (rechargeCodesPrev) rechargeCodesPrev.disabled = true;
      if (rechargeCodesNext) rechargeCodesNext.disabled = true;
      return;
    }

    rechargeCodesTableContainer.style.display = 'block';
    rechargeCodesTotal = data.total || data.codes.length;
    const totalPages = Math.max(1, Math.ceil(rechargeCodesTotal / RECHARGE_CODES_PAGE_SIZE));
    if (rechargeCodesPage) rechargeCodesPage.textContent = `第 ${rechargeCodesPageIndex + 1}/${totalPages} 页`;
    if (rechargeCodesPrev) rechargeCodesPrev.disabled = rechargeCodesPageIndex <= 0;
    if (rechargeCodesNext) rechargeCodesNext.disabled = rechargeCodesPageIndex >= totalPages - 1;
    data.codes.forEach((c) => {
      const tr = document.createElement('tr');

      const tdCode = document.createElement('td');
      tdCode.textContent = c.code;
      tdCode.style.fontFamily = 'monospace';
      tr.appendChild(tdCode);

      const tdAmount = document.createElement('td');
      tdAmount.textContent = c.amount || 0;
      tr.appendChild(tdAmount);

      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = c.used_by_user_id ? 'badge badge-no' : 'badge badge-yes';
      statusBadge.textContent = c.used_by_user_id ? '已使用' : '未使用';
      tdStatus.appendChild(statusBadge);
      tr.appendChild(tdStatus);

      const tdUser = document.createElement('td');
      tdUser.textContent = c.used_by_user_id || '-';
      tr.appendChild(tdUser);

      const tdChar = document.createElement('td');
      tdChar.textContent = c.used_by_char_name || '-';
      tr.appendChild(tdChar);

      const tdTime = document.createElement('td');
      if (c.used_at) {
        tdTime.textContent = new Date(c.used_at).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        tdTime.textContent = '-';
      }
      tr.appendChild(tdTime);

      rechargeCodesList.appendChild(tr);
    });
  } catch (err) {
    rechargeCodesResult.textContent = err.message;
  }
}

function setFirstRechargeMsg(text, color = '') {
  if (!firstRechargeMsg) return;
  firstRechargeMsg.textContent = text || '';
  if (color) firstRechargeMsg.style.color = color;
}

function applyFirstRechargeConfigToForm(config) {
  const items = Array.isArray(config?.items) ? config.items : [];
  const qtyById = new Map(items.map((it) => [String(it?.id || '').trim(), Math.max(0, Math.floor(Number(it?.qty || 0)))]));
  if (firstRechargeEnabledInput) firstRechargeEnabledInput.checked = config?.enabled !== false;
  if (firstRechargeGrantDivineBeastInput) firstRechargeGrantDivineBeastInput.checked = config?.grantDivineBeast !== false;
  if (firstRechargeYuanbaoInput) firstRechargeYuanbaoInput.value = Math.max(0, Math.floor(Number(config?.yuanbao || 0)));
  if (firstRechargeGoldInput) firstRechargeGoldInput.value = Math.max(0, Math.floor(Number(config?.gold || 0)));
  if (firstRechargeTrainingFruitInput) firstRechargeTrainingFruitInput.value = qtyById.get('training_fruit') || 0;
  if (firstRechargePetTrainingFruitInput) firstRechargePetTrainingFruitInput.value = qtyById.get('pet_training_fruit') || 0;
  if (firstRechargeTreasureExpInput) firstRechargeTreasureExpInput.value = qtyById.get('treasure_exp_material') || 0;
}

async function loadFirstRechargeSettings() {
  if (!firstRechargeMsg) return;
  setFirstRechargeMsg('');
  try {
    const data = await api('/admin/first-recharge-settings', 'GET');
    applyFirstRechargeConfigToForm(data?.config || {});
    setFirstRechargeMsg('首充配置加载成功', 'green');
    setTimeout(() => setFirstRechargeMsg(''), 1500);
  } catch (err) {
    setFirstRechargeMsg(`加载失败: ${err.message}`, 'red');
  }
}

async function saveFirstRechargeSettings() {
  if (!firstRechargeMsg) return;
  const toInt = (el, fallback = 0) => Math.max(0, Math.floor(Number(el?.value ?? fallback) || 0));
  const config = {
    enabled: !!firstRechargeEnabledInput?.checked,
    grantDivineBeast: !!firstRechargeGrantDivineBeastInput?.checked,
    yuanbao: toInt(firstRechargeYuanbaoInput, 0),
    gold: toInt(firstRechargeGoldInput, 0),
    items: [
      { id: 'training_fruit', qty: toInt(firstRechargeTrainingFruitInput, 0) },
      { id: 'pet_training_fruit', qty: toInt(firstRechargePetTrainingFruitInput, 0) },
      { id: 'treasure_exp_material', qty: toInt(firstRechargeTreasureExpInput, 0) }
    ].filter((it) => it.qty > 0)
  };
  setFirstRechargeMsg('');
  try {
    const data = await api('/admin/first-recharge-settings/update', 'POST', { config });
    applyFirstRechargeConfigToForm(data?.config || config);
    setFirstRechargeMsg('首充配置保存成功', 'green');
    setTimeout(() => setFirstRechargeMsg(''), 1500);
  } catch (err) {
    setFirstRechargeMsg(`保存失败: ${err.message}`, 'red');
  }
}

async function reissueFirstRechargeWelfare() {
  if (!firstRechargeMsg) return;
  const charName = String(firstRechargeReissueCharInput?.value || '').trim();
  const realmId = Math.max(1, Math.floor(Number(firstRechargeReissueRealmInput?.value || 1) || 1));
  if (!charName) {
    setFirstRechargeMsg('请输入要补发的角色名', 'red');
    return;
  }
  if (!window.confirm(`确认给角色【${charName}】补发首充礼包吗？补发后该账号会打标，后续不可重复补发。`)) {
    return;
  }
  setFirstRechargeMsg('补发中...');
  try {
    const data = await api('/admin/first-recharge-settings/reissue', 'POST', { charName, realmId });
    const rewardText = Array.isArray(data?.rewardText) && data.rewardText.length ? `：${data.rewardText.join('、')}` : '';
    setFirstRechargeMsg(`补发成功（${data?.online ? '在线' : '离线'}）${rewardText}`, 'green');
    setTimeout(() => setFirstRechargeMsg(''), 2500);
  } catch (err) {
    setFirstRechargeMsg(`补发失败: ${err.message}`, 'red');
  }
}

async function reissueDivineBeastForCharacter() {
  if (!firstRechargeMsg) return;
  const charName = String(firstRechargeReissueCharInput?.value || '').trim();
  const realmId = Math.max(1, Math.floor(Number(firstRechargeReissueRealmInput?.value || 1) || 1));
  if (!charName) {
    setFirstRechargeMsg('请输入要补发的角色名', 'red');
    return;
  }
  if (!window.confirm(`确认给角色【${charName}】补发马年神兽吗？`)) return;
  setFirstRechargeMsg('补发马年神兽中...');
  try {
    const data = await api('/admin/first-recharge-settings/reissue-divine-beast', 'POST', {
      charName,
      realmId,
      ignoreFirstRechargeMarker: true
    });
    const petName = String(data?.pet?.name || data?.pet?.role || '马年神兽');
    setFirstRechargeMsg(`马年神兽补发成功（${data?.online ? '在线' : '离线'}）：${petName}`, 'green');
    setTimeout(() => setFirstRechargeMsg(''), 2500);
  } catch (err) {
    setFirstRechargeMsg(`补发马年神兽失败: ${err.message}`, 'red');
  }
}

async function reissueDivineBeastForAllRechargeUsers() {
  if (!firstRechargeMsg) return;
  const realmRaw = String(firstRechargeReissueRealmInput?.value || '').trim();
  const realmId = realmRaw ? Math.max(1, Math.floor(Number(realmRaw) || 1)) : null;
  const realmText = realmId ? `优先区服【${realmId}】` : '所有区服';
  if (!window.confirm(`确认批量给全部充值角色补发马年神兽吗？将跳过已补发神兽标记角色。(${realmText})`)) {
    return;
  }
  setFirstRechargeMsg('批量补发马年神兽中，请稍候...');
  try {
    const data = await api('/admin/first-recharge-settings/reissue-divine-beast-all', 'POST', { realmId });
    const summary = [
      `充值角色${Number(data?.totalRechargeChars || 0)}`,
      `成功${Number(data?.success || 0)}`,
      `已标记跳过${Number(data?.markedSkipped || 0)}`,
      `无角色跳过${Number(data?.noCharacterSkipped || 0)}`,
      `失败${Number(data?.failed || 0)}`
    ].join('，');
    const failures = Array.isArray(data?.failures) && data.failures.length ? `；失败样本：${data.failures.join(' | ')}` : '';
    setFirstRechargeMsg(`批量补发马年神兽完成：${summary}${failures}`, Number(data?.failed || 0) > 0 ? '#cc7a00' : 'green');
  } catch (err) {
    setFirstRechargeMsg(`批量补发马年神兽失败: ${err.message}`, 'red');
  }
}

async function reissueAllRechargeUsersFirstRechargeWelfare() {
  if (!firstRechargeMsg) return;
  const realmRaw = String(firstRechargeReissueRealmInput?.value || '').trim();
  const realmId = realmRaw ? Math.max(1, Math.floor(Number(realmRaw) || 1)) : null;
  const realmText = realmId ? `优先区服【${realmId}】` : '所有区服';
  if (!window.confirm(`确认批量补发全部充值玩家首充礼包吗？将跳过已打标账号。(${realmText})`)) {
    return;
  }
  setFirstRechargeMsg('批量补发中，请稍候...');
  try {
    const data = await api('/admin/first-recharge-settings/reissue-all', 'POST', { realmId });
    const summary = [
      `充值角色${Number(data?.totalRechargeChars || data?.totalRechargeUsers || 0)}`,
      `成功${Number(data?.success || 0)}`,
      `已标记跳过${Number(data?.markedSkipped || 0)}`,
      `无角色跳过${Number(data?.noCharacterSkipped || 0)}`,
      `失败${Number(data?.failed || 0)}`
    ].join('，');
    const failures = Array.isArray(data?.failures) && data.failures.length ? `；失败样本：${data.failures.join(' | ')}` : '';
    setFirstRechargeMsg(`批量补发完成：${summary}${failures}`, Number(data?.failed || 0) > 0 ? '#cc7a00' : 'green');
  } catch (err) {
    setFirstRechargeMsg(`批量补发失败: ${err.message}`, 'red');
  }
}

function setInviteRewardMsg(text, color = '') {
  if (!inviteRewardMsg) return;
  inviteRewardMsg.textContent = text || '';
  if (color) inviteRewardMsg.style.color = color;
}

function setCharMigrateMsg(text, color = '') {
  if (!charMigrateMsg) return;
  charMigrateMsg.textContent = text || '';
  if (color) charMigrateMsg.style.color = color;
}

async function migrateCharacterToAnotherAccount() {
  if (!charMigrateMsg) return;
  const charName = String(charMigrateCharInput?.value || '').trim();
  const targetUsername = String(charMigrateTargetUserInput?.value || '').trim();
  const realmId = Math.max(1, Math.floor(Number(charMigrateRealmInput?.value || 1) || 1));
  if (!charName) {
    setCharMigrateMsg('请输入角色名', 'red');
    return;
  }
  if (!targetUsername) {
    setCharMigrateMsg('请输入目标账号(用户名)', 'red');
    return;
  }
  if (!window.confirm(`确认将角色【${charName}】(区服${realmId}) 迁移到账号【${targetUsername}】吗？角色必须离线。`)) {
    return;
  }
  setCharMigrateMsg('迁移中...');
  try {
    const data = await api('/admin/characters/migrate', 'POST', { charName, realmId, targetUsername });
    const fromUserId = Number(data?.fromUserId || 0);
    const toUserId = Number(data?.toUserId || 0);
    setCharMigrateMsg(`迁移成功：${charName}（区服${realmId}） ${fromUserId} -> ${toUserId}（${data?.targetUsername || targetUsername}）`, 'green');
    setTimeout(() => setCharMigrateMsg(''), 3000);
  } catch (err) {
    setCharMigrateMsg(`迁移失败: ${err.message}`, 'red');
  }
}

async function restoreDeletedCharacterByAdmin() {
  if (!charMigrateMsg) return;
  const charName = String(charRestoreNameInput?.value || '').trim();
  const realmId = Math.max(1, Math.floor(Number(charRestoreRealmInput?.value || 1) || 1));
  if (!charName) {
    setCharMigrateMsg('请输入要恢复的已删除角色名', 'red');
    return;
  }
  if (!window.confirm(`确认恢复角色【${charName}】(区服${realmId}) 吗？将恢复最近一次删除归档。`)) {
    return;
  }
  setCharMigrateMsg('恢复中...');
  try {
    const data = await api('/admin/characters/restore', 'POST', { charName, realmId });
    setCharMigrateMsg(`恢复成功：${data?.name || charName}（区服${realmId}）`, 'green');
    setTimeout(() => setCharMigrateMsg(''), 3000);
  } catch (err) {
    setCharMigrateMsg(`恢复失败: ${err.message}`, 'red');
  }
}

function applyInviteRewardConfigToForm(config) {
  if (inviteRewardEnabledInput) inviteRewardEnabledInput.checked = config?.enabled !== false;
  if (inviteRewardRateInput) {
    const ratePct = (Number(config?.bonusRate || 0) || 0) * 100;
    inviteRewardRateInput.value = String(Math.max(0, Math.min(100, Math.round(ratePct * 10) / 10)));
  }
}

async function loadInviteRewardSettings() {
  if (!inviteRewardMsg) return;
  setInviteRewardMsg('');
  try {
    const data = await api('/admin/invite-settings', 'GET');
    applyInviteRewardConfigToForm(data?.config || {});
    setInviteRewardMsg('邀请配置加载成功', 'green');
    setTimeout(() => setInviteRewardMsg(''), 1500);
  } catch (err) {
    setInviteRewardMsg(`加载失败: ${err.message}`, 'red');
  }
}

async function saveInviteRewardSettings() {
  if (!inviteRewardMsg) return;
  const ratePct = Math.max(0, Math.min(100, Number(inviteRewardRateInput?.value || 0) || 0));
  const config = {
    enabled: !!inviteRewardEnabledInput?.checked,
    bonusRate: ratePct / 100
  };
  setInviteRewardMsg('');
  try {
    const data = await api('/admin/invite-settings/update', 'POST', { config });
    applyInviteRewardConfigToForm(data?.config || config);
    setInviteRewardMsg('邀请配置保存成功', 'green');
    setTimeout(() => setInviteRewardMsg(''), 1500);
  } catch (err) {
    setInviteRewardMsg(`保存失败: ${err.message}`, 'red');
  }
}

// SMTP邮件配置
function setSmtpMsg(text, color = '') {
  if (!smtpMsg) return;
  smtpMsg.textContent = text || '';
  if (color) smtpMsg.style.color = color;
}

async function loadSmtpSettings() {
  if (!smtpMsg) return;
  setSmtpMsg('');
  try {
    const data = await api('/admin/smtp-settings', 'GET');
    const config = data?.settings || {};
    if (smtpEnabledInput) smtpEnabledInput.checked = config.enabled !== false;
    if (smtpHostInput) smtpHostInput.value = config.host || '';
    if (smtpPortInput) smtpPortInput.value = config.port || '587';
    if (smtpSecureInput) smtpSecureInput.checked = config.secure === true;
    if (smtpUserInput) smtpUserInput.value = config.user || '';
    if (smtpPasswordInput) smtpPasswordInput.value = config.password || '';
    if (smtpFromInput) smtpFromInput.value = config.from || '';
    setSmtpMsg('SMTP配置加载成功', 'green');
    setTimeout(() => setSmtpMsg(''), 1500);
  } catch (err) {
    setSmtpMsg(`加载失败: ${err.message}`, 'red');
  }
}

async function saveSmtpSettings() {
  if (!smtpMsg) return;
  const config = {
    enabled: !!smtpEnabledInput?.checked,
    host: String(smtpHostInput?.value || '').trim(),
    port: Math.max(1, Math.min(65535, Number(smtpPortInput?.value || 587) || 587)),
    secure: !!smtpSecureInput?.checked,
    user: String(smtpUserInput?.value || '').trim(),
    password: String(smtpPasswordInput?.value || '').trim(),
    from: String(smtpFromInput?.value || '').trim()
  };
  if (!config.host) {
    setSmtpMsg('SMTP服务器地址不能为空', 'red');
    return;
  }
  if (!config.user) {
    setSmtpMsg('用户名不能为空', 'red');
    return;
  }
  setSmtpMsg('');
  try {
    const data = await api('/admin/smtp-settings/update', 'POST', { settings: config });
    setSmtpMsg('SMTP配置保存成功', 'green');
    setTimeout(() => setSmtpMsg(''), 1500);
  } catch (err) {
    setSmtpMsg(`保存失败: ${err.message}`, 'red');
  }
}

async function testSmtpConnection() {
  if (!smtpMsg) return;
  setSmtpMsg('正在测试连接...');
  try {
    const config = {
      enabled: !!smtpEnabledInput?.checked,
      host: String(smtpHostInput?.value || '').trim(),
      port: Math.max(1, Math.min(65535, Number(smtpPortInput?.value || 587) || 587)),
      secure: !!smtpSecureInput?.checked,
      user: String(smtpUserInput?.value || '').trim(),
      password: String(smtpPasswordInput?.value || '').trim(),
      from: String(smtpFromInput?.value || '').trim()
    };
    if (!config.host) {
      setSmtpMsg('SMTP服务器地址不能为空', 'red');
      return;
    }
    if (!config.user) {
      setSmtpMsg('用户名不能为空', 'red');
      return;
    }
    if (!config.password) {
      setSmtpMsg('密码不能为空', 'red');
      return;
    }
    const data = await api('/admin/smtp-settings/test', 'POST', { settings: config });
    setSmtpMsg(data.message || '连接测试成功！邮件发送功能正常', 'green');
    setTimeout(() => setSmtpMsg(''), 1500);
  } catch (err) {
    setSmtpMsg(`测试失败: ${err.message}`, 'red');
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function refreshVipSelfClaimStatus() {
  try {
    const data = await api('/admin/vip/self-claim-status', 'GET');
    vipSelfClaimStatus.textContent = data.enabled ? '已开启' : '已关闭';
    vipSelfClaimStatus.style.color = data.enabled ? 'green' : 'red';
    if (vipSelfClaimToggle) vipSelfClaimToggle.checked = data.enabled === true;
  } catch (err) {
    vipSelfClaimStatus.textContent = '加载失败';
  }
}

async function loadSvipSettings() {
  if (!svipPriceMonthInput || !svipPriceQuarterInput || !svipPriceYearInput || !svipPricePermanentInput) return;
  if (svipMsg) svipMsg.textContent = '';
  try {
    const data = await api('/admin/svip-settings', 'GET');
    const prices = data.prices || {};
    if (svipPriceMonthInput) svipPriceMonthInput.value = prices.month ?? 0;
    if (svipPriceQuarterInput) svipPriceQuarterInput.value = prices.quarter ?? 0;
    if (svipPriceYearInput) svipPriceYearInput.value = prices.year ?? 0;
    if (svipPricePermanentInput) svipPricePermanentInput.value = prices.permanent ?? 0;
    if (svipMsg) {
      svipMsg.textContent = '加载成功';
      svipMsg.style.color = 'green';
      setTimeout(() => {
        svipMsg.textContent = '';
      }, 2000);
    }
  } catch (err) {
    if (svipMsg) {
      svipMsg.textContent = `加载失败: ${err.message}`;
      svipMsg.style.color = 'red';
    }
  }
}

async function saveSvipSettings() {
  if (!svipPriceMonthInput || !svipPriceQuarterInput || !svipPriceYearInput || !svipPricePermanentInput || !svipMsg) return;
  svipMsg.textContent = '';
  try {
    const month = Number(svipPriceMonthInput.value || 0);
    const quarter = Number(svipPriceQuarterInput.value || 0);
    const year = Number(svipPriceYearInput.value || 0);
    const permanent = Number(svipPricePermanentInput.value || 0);
    const values = { month, quarter, year, permanent };
    for (const [key, value] of Object.entries(values)) {
      if (Number.isNaN(value) || value < 0) {
        svipMsg.textContent = `SVIP价格(${key})必须为不小于0的数字`;
        svipMsg.style.color = 'red';
        return;
      }
    }
    await api('/admin/svip-settings/update', 'POST', { prices: values });
    svipMsg.textContent = 'SVIP设置已保存';
    svipMsg.style.color = 'green';
  } catch (err) {
    svipMsg.textContent = err.message;
    svipMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function toggleVipSelfClaim(enabled) {
  vipSelfClaimMsg.textContent = '';
  try {
    await api('/admin/vip/self-claim-toggle', 'POST', { enabled });
    vipSelfClaimMsg.textContent = enabled ? 'VIP自助激活已开启' : 'VIP自助激活已关闭';
    await refreshVipSelfClaimStatus();
  } catch (err) {
    vipSelfClaimMsg.textContent = err.message;
  }
}

async function refreshVipClaimLimitStatus() {
  try {
    const data = await api('/admin/vip/claim-limit-status', 'GET');
    vipClaimLimitStatus.textContent = data.enabled ? '已限制（每个角色只能领取一次）' : '未限制（可重复领取）';
    vipClaimLimitStatus.style.color = data.enabled ? 'orange' : 'green';
    if (vipClaimLimitToggle) vipClaimLimitToggle.checked = data.enabled === true;
  } catch (err) {
    vipClaimLimitStatus.textContent = '加载失败';
  }
}

async function toggleVipClaimLimit(enabled) {
  vipClaimLimitMsg.textContent = '';
  try {
    await api('/admin/vip/claim-limit-toggle', 'POST', { enabled });
    vipClaimLimitMsg.textContent = enabled ? '已限制每个角色只能领取一次VIP' : '已取消限制，角色可重复领取VIP';
    vipClaimLimitMsg.style.color = enabled ? 'orange' : 'green';
    await refreshVipClaimLimitStatus();
  } catch (err) {
    vipClaimLimitMsg.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function refreshStateThrottleStatus() {
  if (!stateThrottleStatus) return;
  try {
    const data = await api('/admin/state-throttle-status', 'GET');
    const intervalSec = Number(data.intervalSec || 10);
    stateThrottleStatus.textContent = data.enabled ? `已开启(${intervalSec}秒)` : '已关闭';
    stateThrottleStatus.style.color = data.enabled ? 'green' : 'red';
    if (stateThrottleToggle) stateThrottleToggle.checked = data.enabled === true;
    if (stateThrottleIntervalInput) stateThrottleIntervalInput.value = String(intervalSec);
    if (stateThrottleOverrideAllowedToggle) {
      stateThrottleOverrideAllowedToggle.checked = data.overrideServerAllowed === true;
    }
    if (cacheMonsterHealthToggle) {
      cacheMonsterHealthToggle.checked = data.cacheMonsterHealth !== false;
    }
    if (data.playerSave && typeof data.playerSave === 'object') {
      if (playerSaveDebounceInput) playerSaveDebounceInput.value = data.playerSave.debounceMs ?? '';
      if (playerSaveMinIntervalInput) playerSaveMinIntervalInput.value = data.playerSave.minIntervalMs ?? '';
      if (playerSaveManagedIntervalInput) playerSaveManagedIntervalInput.value = data.playerSave.managedMinIntervalMs ?? '';
      if (playerSaveDetachedIntervalInput) playerSaveDetachedIntervalInput.value = data.playerSave.detachedMinIntervalMs ?? '';
      if (playerSaveForceDeadlineInput) playerSaveForceDeadlineInput.value = data.playerSave.forceDeadlineMs ?? '';
      if (playerSaveMaxWritesInput) playerSaveMaxWritesInput.value = data.playerSave.maxWritesPerFlush ?? '';
    }
  } catch (err) {
    stateThrottleStatus.textContent = '加载失败';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function refreshRoomVariantStatus() {
  if (!roomVariantStatus) return;
  try {
    const data = await api('/admin/room-variant-status', 'GET');
    const count = Number(data.count || 5);
    roomVariantStatus.textContent = `已设置(${count})`;
    roomVariantStatus.style.color = 'green';
    if (roomVariantInput) roomVariantInput.value = String(count);
  } catch (err) {
    roomVariantStatus.textContent = '加载失败';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveRoomVariantCount() {
  if (!roomVariantMsg) return;
  roomVariantMsg.textContent = '';
  try {
    const count = roomVariantInput ? Number(roomVariantInput.value || 5) : 5;
    if (!Number.isFinite(count) || count < 1) {
      throw new Error('请输入有效数量');
    }
    await api('/admin/room-variant-update', 'POST', { count });
    roomVariantMsg.textContent = '房间变种数量已保存';
    await refreshRoomVariantStatus();
  } catch (err) {
    roomVariantMsg.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function toggleStateThrottle(enabled) {
  if (!stateThrottleMsg) return;
  stateThrottleMsg.textContent = '';
  try {
    const intervalSec = stateThrottleIntervalInput ? Number(stateThrottleIntervalInput.value || 10) : undefined;
    const overrideServerAllowed = stateThrottleOverrideAllowedToggle ? stateThrottleOverrideAllowedToggle.checked : undefined;
    const cacheMonsterHealth = cacheMonsterHealthToggle ? cacheMonsterHealthToggle.checked : undefined;
    const playerSave = {
      debounceMs: playerSaveDebounceInput ? Number(playerSaveDebounceInput.value || 0) : undefined,
      minIntervalMs: playerSaveMinIntervalInput ? Number(playerSaveMinIntervalInput.value || 0) : undefined,
      managedMinIntervalMs: playerSaveManagedIntervalInput ? Number(playerSaveManagedIntervalInput.value || 0) : undefined,
      detachedMinIntervalMs: playerSaveDetachedIntervalInput ? Number(playerSaveDetachedIntervalInput.value || 0) : undefined,
      forceDeadlineMs: playerSaveForceDeadlineInput ? Number(playerSaveForceDeadlineInput.value || 0) : undefined,
      maxWritesPerFlush: playerSaveMaxWritesInput ? Number(playerSaveMaxWritesInput.value || 80) : undefined
    };
    await api('/admin/state-throttle-toggle', 'POST', { enabled, intervalSec, overrideServerAllowed, cacheMonsterHealth, playerSave });
    stateThrottleMsg.textContent = enabled ? '状态刷新节流已开启' : '状态刷新节流已关闭';
    await refreshStateThrottleStatus();
  } catch (err) {
    stateThrottleMsg.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveStateThrottleInterval() {
  if (!stateThrottleMsg) return;
  stateThrottleMsg.textContent = '';
  try {
    const intervalSec = stateThrottleIntervalInput ? Number(stateThrottleIntervalInput.value || 10) : 10;
    if (!Number.isFinite(intervalSec) || intervalSec < 1) {
      throw new Error('请输入有效秒数');
    }
    const overrideServerAllowed = stateThrottleOverrideAllowedToggle ? stateThrottleOverrideAllowedToggle.checked : undefined;
    const cacheMonsterHealth = cacheMonsterHealthToggle ? cacheMonsterHealthToggle.checked : undefined;
    const playerSave = {
      debounceMs: playerSaveDebounceInput ? Number(playerSaveDebounceInput.value || 0) : undefined,
      minIntervalMs: playerSaveMinIntervalInput ? Number(playerSaveMinIntervalInput.value || 0) : undefined,
      managedMinIntervalMs: playerSaveManagedIntervalInput ? Number(playerSaveManagedIntervalInput.value || 0) : undefined,
      detachedMinIntervalMs: playerSaveDetachedIntervalInput ? Number(playerSaveDetachedIntervalInput.value || 0) : undefined,
      forceDeadlineMs: playerSaveForceDeadlineInput ? Number(playerSaveForceDeadlineInput.value || 0) : undefined,
      maxWritesPerFlush: playerSaveMaxWritesInput ? Number(playerSaveMaxWritesInput.value || 80) : undefined
    };
    await api('/admin/state-throttle-toggle', 'POST', { enabled: stateThrottleToggle?.checked === true, intervalSec, overrideServerAllowed, cacheMonsterHealth, playerSave });
    stateThrottleMsg.textContent = '节流与保存设置已保存';
    await refreshStateThrottleStatus();
  } catch (err) {
    stateThrottleMsg.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function downloadBackup() {
  backupMsg.textContent = '';
  try {
    const res = await fetch(adminPath('/admin/backup'), {
      headers: {
        Authorization: adminToken ? `Bearer ${adminToken}` : ''
      }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '请求失败');
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : 'text-legend-backup.json';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    backupMsg.textContent = '备份已下载。';
  } catch (err) {
    backupMsg.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function importBackup() {
  backupMsg.textContent = '';
  const file = importFileInput?.files?.[0];
  if (!file) {
    backupMsg.textContent = '请选择备份文件。';
    return;
  }
  const confirmed1 = await customConfirm('确认导入', '导入会覆盖当前全部数据，确定继续吗？');
  if (!confirmed1) return;
  const confirmed2 = await customConfirm('再次确认', '再次确认：导入后无法恢复，是否继续？');
  if (!confirmed2) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const data = await api('/admin/import', 'POST', payload);
    const counts = data.counts || {};
    const summary = Object.entries(counts)
      .map(([name, count]) => `${name}: ${count}`)
      .join(', ');
    backupMsg.textContent = summary ? `导入完成：${summary}` : '导入完成。';
  } catch (err) {
    backupMsg.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 区服管理相关
const realmsList = document.getElementById('realms-list');
const realmsMsg = document.getElementById('realms-msg');
const realmNameInput = document.getElementById('realm-name-input');
const mergeSourceSelect = document.getElementById('merge-source-realm');
const mergeTargetSelect = document.getElementById('merge-target-realm');
const mergeMsg = document.getElementById('merge-msg');
const routeLinesList = document.getElementById('route-lines-list');
const routeLinesMsg = document.getElementById('route-lines-msg');
const routeLinesLoadBtn = document.getElementById('route-lines-load-btn');
const routeLinesAddBtn = document.getElementById('route-lines-add-btn');
const routeLinesSaveBtn = document.getElementById('route-lines-save-btn');
let routeLinesRowsCache = [];

function routeLineEmptyItem() {
  return {
    name: '',
    domain: '',
    priority: 100,
    enabled: true
  };
}

function renderRouteLinesRows() {
  if (!routeLinesList) return;
  routeLinesList.innerHTML = '';
  if (!Array.isArray(routeLinesRowsCache) || routeLinesRowsCache.length <= 0) {
    routeLinesList.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">暂无线路，请点击“+ 添加线路”</td></tr>';
    return;
  }
  routeLinesRowsCache.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(index);

    const tdName = document.createElement('td');
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.dataset.k = 'name';
    inputName.value = String(row.name || '');
    inputName.placeholder = '线路A';
    tdName.appendChild(inputName);
    tr.appendChild(tdName);

    const tdApiBase = document.createElement('td');
    const inputApiBase = document.createElement('input');
    inputApiBase.type = 'text';
    inputApiBase.dataset.k = 'domain';
    inputApiBase.value = String(row.domain || '');
    inputApiBase.placeholder = 'https://a.example.com';
    tdApiBase.appendChild(inputApiBase);
    tr.appendChild(tdApiBase);

    const tdPriority = document.createElement('td');
    const inputPriority = document.createElement('input');
    inputPriority.type = 'number';
    inputPriority.min = '1';
    inputPriority.max = '9999';
    inputPriority.dataset.k = 'priority';
    inputPriority.value = String(Math.max(1, Math.floor(Number(row.priority || 100))));
    tdPriority.appendChild(inputPriority);
    tr.appendChild(tdPriority);

    const tdEnabled = document.createElement('td');
    tdEnabled.style.textAlign = 'center';
    const inputEnabled = document.createElement('input');
    inputEnabled.type = 'checkbox';
    inputEnabled.dataset.k = 'enabled';
    inputEnabled.checked = row.enabled !== false;
    tdEnabled.appendChild(inputEnabled);
    tr.appendChild(tdEnabled);

    const tdAction = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.dataset.act = 'del';
    delBtn.className = 'btn-small';
    delBtn.textContent = '删除';
    tdAction.appendChild(delBtn);
    tr.appendChild(tdAction);

    routeLinesList.appendChild(tr);
  });
}

async function loadRouteLinesConfig() {
  if (!routeLinesMsg) return;
  routeLinesMsg.textContent = '';
  try {
    const data = await api('/admin/route-lines', 'GET');
    routeLinesRowsCache = Array.isArray(data?.lines)
      ? data.lines.map((line) => ({
          name: String(line.name || '').trim(),
          domain: String(line.domain || line.apiBase || line.socketBase || '').trim(),
          priority: Math.max(1, Math.floor(Number(line.priority || 100))),
          enabled: line.enabled !== false
        }))
      : [];
    renderRouteLinesRows();
    routeLinesMsg.textContent = '加载成功';
    routeLinesMsg.style.color = 'green';
    setTimeout(() => {
      if (routeLinesMsg) routeLinesMsg.textContent = '';
    }, 1600);
  } catch (err) {
    routeLinesMsg.textContent = `加载失败: ${err.message}`;
    routeLinesMsg.style.color = 'red';
  }
}

async function saveRouteLinesConfig() {
  if (!routeLinesMsg) return;
  routeLinesMsg.textContent = '';
  try {
    const lines = (Array.isArray(routeLinesRowsCache) ? routeLinesRowsCache : [])
      .map((row, index) => ({
        name: String(row.name || '').trim() || `线路${index + 1}`,
        domain: String(row.domain || '').trim(),
        apiBase: String(row.domain || '').trim(),
        socketBase: String(row.domain || '').trim(),
        priority: Math.max(1, Math.floor(Number(row.priority || 100))),
        enabled: row.enabled !== false
      }));
    await api('/admin/route-lines/update', 'POST', { lines });
    routeLinesMsg.textContent = '保存成功，前台将按延迟自动选线';
    routeLinesMsg.style.color = 'green';
    await loadRouteLinesConfig();
  } catch (err) {
    routeLinesMsg.textContent = `保存失败: ${err.message}`;
    routeLinesMsg.style.color = 'red';
  }
}

async function refreshRealms() {
  if (!realmsList) return;
  try {
    const data = await api('/admin/realms', 'GET');
    const realms = data.realms || [];
    
    // 保存区服数据到缓存
    realmsCache = realms;
    
    realmsList.innerHTML = '';
    if (!realms || realms.length === 0) {
      realmsList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">暂无区服</td></tr>';
      return;
    }
    
    realms.forEach((r) => {
      const tr = document.createElement('tr');
      
      // ID
      const tdId = document.createElement('td');
      tdId.textContent = r.id;
      tr.appendChild(tdId);
      
      // 区名
      const tdName = document.createElement('td');
      tdName.textContent = r.name;
      tr.appendChild(tdName);
      
      // 角色数
      const tdChars = document.createElement('td');
      tdChars.textContent = r.character_count || 0;
      tr.appendChild(tdChars);
      
      // 行会数
      const tdGuilds = document.createElement('td');
      tdGuilds.textContent = r.guild_count || 0;
      tr.appendChild(tdGuilds);
      
      // 创建时间
      const tdTime = document.createElement('td');
      tdTime.textContent = new Date(r.created_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      tr.appendChild(tdTime);
      
      // 操作
      const tdAction = document.createElement('td');
      
      // 编辑区名按钮
      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-small';
      btnEdit.textContent = '改名';
      btnEdit.addEventListener('click', () => editRealmName(r.id, r.name));
      tdAction.appendChild(btnEdit);
      
      tr.appendChild(tdAction);
      realmsList.appendChild(tr);
    });
    
    // 更新合区下拉框和BOSS区服选择框
    updateMergeSelects(realms);
    updateBossRealmSelects(realms);
  } catch (err) {
    realmsList.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #dc3545;">${err.message}</td></tr>`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

function updateMergeSelects(realms) {
  if (!mergeSourceSelect || !mergeTargetSelect) return;

  mergeSourceSelect.innerHTML = '';
  mergeTargetSelect.innerHTML = '';

  realms.forEach((r) => {
    const option1 = document.createElement('option');
    option1.value = r.id;
    option1.textContent = `${r.id} - ${r.name}`;
    mergeSourceSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = r.id;
    option2.textContent = `${r.id} - ${r.name}`;
    mergeTargetSelect.appendChild(option2);
  });
}

function updateBossRealmSelects(realms) {
  // 保存区服数据
  realmsCache = realms;

  // 更新世界BOSS区服选择框
  if (wbKillRealmInput) {
    const currentValue = wbKillRealmInput.value;
    wbKillRealmInput.innerHTML = '';
    const crossOption = document.createElement('option');
    crossOption.value = '0';
    crossOption.textContent = '跨服(0)';
    wbKillRealmInput.appendChild(crossOption);
    realms.forEach((r) => {
      const option = document.createElement('option');
      option.value = r.id;
      option.textContent = r.name;
      wbKillRealmInput.appendChild(option);
    });
    // 恢复选中值
    if (currentValue) {
      wbKillRealmInput.value = currentValue;
    }
  }

  // 更新特殊BOSS区服选择框
  if (sbKillRealmInput) {
    const currentValue = sbKillRealmInput.value;
    sbKillRealmInput.innerHTML = '';
    realms.forEach((r) => {
      const option = document.createElement('option');
      option.value = r.id;
      option.textContent = r.name;
      sbKillRealmInput.appendChild(option);
    });
    if (currentValue) {
      sbKillRealmInput.value = currentValue;
    }
  }

  // 更新修真BOSS区服选择框
  if (cbKillRealmInput) {
    const currentValue = cbKillRealmInput.value;
    cbKillRealmInput.innerHTML = '';
    const crossOption = document.createElement('option');
    crossOption.value = '0';
    crossOption.textContent = '跨服(0)';
    cbKillRealmInput.appendChild(crossOption);
    cbKillRealmInput.value = '0';
  }

  if (gmMailRealmSelect) {
    const currentValue = gmMailRealmSelect.value;
    gmMailRealmSelect.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = '全部区服';
    gmMailRealmSelect.appendChild(allOption);
    realms.forEach((r) => {
      const option = document.createElement('option');
      option.value = r.id;
      option.textContent = `${r.id} - ${r.name}`;
      gmMailRealmSelect.appendChild(option);
    });
    if (currentValue !== '') {
      gmMailRealmSelect.value = currentValue;
    }
  }
}

async function loadCmdRateSettings() {
  if (!cmdRateMsg) return;
  cmdRateMsg.textContent = '';
  try {
    const data = await api('/admin/cmd-rate-settings', 'GET');
    const rate = data.rateLimits || {};
    const cooldowns = data.cooldowns || {};
    if (cmdRateGlobalLimitInput) cmdRateGlobalLimitInput.value = String(rate.global?.limit ?? 12);
    if (cmdRateGlobalWindowInput) cmdRateGlobalWindowInput.value = String(rate.global?.windowMs ?? 10000);
    if (cmdRateBurstLimitInput) cmdRateBurstLimitInput.value = String(rate.burst?.limit ?? 60);
    if (cmdRateBurstWindowInput) cmdRateBurstWindowInput.value = String(rate.burst?.windowMs ?? 10000);
    if (cmdCooldownConsignInput) cmdCooldownConsignInput.value = String(cooldowns.consign ?? 800);
    if (cmdCooldownTradeInput) cmdCooldownTradeInput.value = String(cooldowns.trade ?? 800);
    if (cmdCooldownMailInput) cmdCooldownMailInput.value = String(cooldowns.mail ?? 800);
    cmdRateMsg.textContent = '加载成功';
    cmdRateMsg.style.color = 'green';
    setTimeout(() => { cmdRateMsg.textContent = ''; }, 2000);
  } catch (err) {
    cmdRateMsg.textContent = `加载失败: ${err.message}`;
    cmdRateMsg.style.color = 'red';
  }
}

async function saveCmdRateSettings() {
  if (!cmdRateMsg) return;
  cmdRateMsg.textContent = '';
  try {
    const rateLimits = {
      global: {
        limit: Number(cmdRateGlobalLimitInput?.value || 12),
        windowMs: Number(cmdRateGlobalWindowInput?.value || 10000)
      },
      burst: {
        limit: Number(cmdRateBurstLimitInput?.value || 60),
        windowMs: Number(cmdRateBurstWindowInput?.value || 10000)
      }
    };
    const cooldowns = {
      consign: Number(cmdCooldownConsignInput?.value || 800),
      trade: Number(cmdCooldownTradeInput?.value || 800),
      mail: Number(cmdCooldownMailInput?.value || 800)
    };
    await api('/admin/cmd-rate-settings/update', 'POST', { rateLimits, cooldowns });
    cmdRateMsg.textContent = '保存成功，立即生效';
    cmdRateMsg.style.color = 'green';
    setTimeout(() => { cmdRateMsg.textContent = ''; }, 2000);
  } catch (err) {
    cmdRateMsg.textContent = `保存失败: ${err.message}`;
    cmdRateMsg.style.color = 'red';
  }
}

async function createRealm() {
  if (!realmNameInput || !realmsMsg) return;
  const name = realmNameInput.value.trim();
  if (!name) {
    realmsMsg.textContent = '请输入区服名称';
    return;
  }

  const confirmed = await customConfirm('创建新区', `确定要创建新区 "${name}" 吗？`);
  if (!confirmed) return;

  try {
    await api('/admin/realms/create', 'POST', { name });
    realmsMsg.textContent = '新区创建成功';
    realmNameInput.value = '';
    await refreshRealms();
  } catch (err) {
    realmsMsg.textContent = err.message;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function editRealmName(realmId, currentName) {
  const newName = await customPrompt('修改区名', `修改区名 (当前: ${currentName}):`, currentName);
  if (!newName || newName.trim() === currentName) return;

  try {
    await api('/admin/realms/update', 'POST', { realmId, name: newName.trim() });
    await customAlert('修改成功', '区名修改成功');
    await refreshRealms();
  } catch (err) {
    await customAlert('修改失败', `修改失败: ${err.message}`);
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function mergeRealms() {
  if (!mergeSourceSelect || !mergeTargetSelect || !mergeMsg) return;
  const sourceId = Number(mergeSourceSelect.value);
  const targetId = Number(mergeTargetSelect.value);

  if (!sourceId || !targetId) {
    mergeMsg.textContent = '请选择源区和目标区';
    return;
  }

  if (sourceId === targetId) {
    mergeMsg.textContent = '源区和目标区不能相同';
    return;
  }

  const sourceText = mergeSourceSelect.options[mergeSourceSelect.selectedIndex].text;
  const targetText = mergeTargetSelect.options[mergeTargetSelect.selectedIndex].text;

  const confirmed1 = await customConfirm('合区警告', `⚠️ 警告：合区操作将强制下线所有玩家！\n\n源区: ${sourceText}\n目标区: ${targetText}\n\n系统会自动创建合区前的完整备份，请稍候...`);
  if (!confirmed1) {
    return;
  }

  const confirmed2 = await customConfirm('最终确认', `⚠️ 最终确认：合区后源区将被删除，所有数据（角色、行会、邮件、寄售）将合并到目标区，目标区沙巴克状态将重置为无人占领！\n\n确定要执行合区吗？`);
  if (!confirmed2) {
    return;
  }

  try {
    mergeMsg.textContent = '正在创建备份并执行合区，请稍候...';

    const res = await fetch(adminPath('/admin/realms/merge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: adminToken ? `Bearer ${adminToken}` : ''
      },
      body: JSON.stringify({ sourceId, targetId })
    });

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      throw new Error('服务器返回的数据格式错误，请检查后端日志');
    }

    if (!res.ok) {
      throw new Error(data.error || '请求失败');
    }

    mergeMsg.textContent = `✅ ${data.message}`;
    await refreshRealms();
  } catch (err) {
    mergeMsg.textContent = `❌ 合区失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function fixRealmId() {
  if (!realmsMsg) return;
  const confirmed = await customConfirm('修复数据', '确定要修复旧数据吗？\n\n此操作将所有realm_id为null或0的记录设置为1。\n通常用于升级后修复历史数据。');
  if (!confirmed) return;

  try {
    const data = await api('/admin/fix-realm-id', 'POST');
    const stats = data.stats || {};
    const summary = Object.entries(stats)
      .map(([key, count]) => `${key}: ${count}`)
      .join(', ');
    realmsMsg.textContent = `修复完成！${summary}`;
    await refreshRealms();
  } catch (err) {
    realmsMsg.textContent = `修复失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 赞助管理函数
async function listSponsors() {
  if (!sponsorsList) return;
  sponsorsList.innerHTML = '';

  try {
    const data = await api('/admin/sponsors', 'GET');
    allSponsorsData = data.sponsors || [];
    totalSponsorsPages = Math.ceil(allSponsorsData.length / 5) || 1;

    if (allSponsorsData.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" style="text-align: center; color: #999;">暂无赞助记录</td>';
      sponsorsList.appendChild(tr);
      sponsorsPaginationInfo.textContent = '';
      return;
    }

    // 计算当前页的数据
    const startIndex = (currentSponsorsPage - 1) * 5;
    const endIndex = Math.min(startIndex + 5, allSponsorsData.length);
    const currentPageData = allSponsorsData.slice(startIndex, endIndex);

    // 更新分页信息
    sponsorsPaginationInfo.textContent = `第 ${currentSponsorsPage} / ${totalSponsorsPages} 页 (共 ${allSponsorsData.length} 个赞助者)`;

    // 更新按钮状态
    sponsorsPrevPageBtn.disabled = currentSponsorsPage === 1;
    sponsorsNextPageBtn.disabled = currentSponsorsPage === totalSponsorsPages;

    currentPageData.forEach((s) => {
      const globalIndex = allSponsorsData.indexOf(s);
      const tr = document.createElement('tr');

      // 排名
      const tdRank = document.createElement('td');
      tdRank.textContent = globalIndex + 1;
      tdRank.style.fontWeight = 'bold';
      tr.appendChild(tdRank);

      // 玩家名
      const tdName = document.createElement('td');
      tdName.textContent = s.player_name;
      tr.appendChild(tdName);

      // 金额
      const tdAmount = document.createElement('td');
      tdAmount.textContent = s.amount;
      tdAmount.style.fontWeight = 'bold';
      tdAmount.style.color = '#c56b2a';
      tr.appendChild(tdAmount);

      // 添加时间
      const tdCreatedAt = document.createElement('td');
      if (s.created_at) {
        const date = new Date(s.created_at);
        tdCreatedAt.textContent = date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        tdCreatedAt.textContent = '-';
      }
      tr.appendChild(tdCreatedAt);

      // 操作
      const tdActions = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.textContent = '编辑';
      editBtn.className = 'btn-small';
      editBtn.style.marginRight = '4px';
      editBtn.onclick = () => editSponsor(s.id, s.player_name, s.amount);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '删除';
      deleteBtn.className = 'btn-small';
      deleteBtn.style.background = '#c00';
      deleteBtn.onclick = () => deleteSponsor(s.id, s.player_name);

      tdActions.appendChild(editBtn);
      tdActions.appendChild(deleteBtn);
      tr.appendChild(tdActions);

      sponsorsList.appendChild(tr);
    });
  } catch (err) {
    if (sponsorMsg) sponsorMsg.textContent = `加载失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function addSponsor() {
  if (!sponsorMsg) return;
  const playerName = sponsorNameInput.value.trim();
  const amount = parseInt(sponsorAmountInput.value, 10);

  if (!playerName) {
    sponsorMsg.textContent = '请输入玩家名';
    return;
  }
  if (isNaN(amount) || amount < 0) {
    sponsorMsg.textContent = '请输入有效的金额';
    return;
  }

  try {
    await api('/admin/sponsors', 'POST', { playerName, amount });
    sponsorMsg.textContent = '添加成功';
    sponsorNameInput.value = '';
    sponsorAmountInput.value = '';
    currentSponsorsPage = 1;
    await listSponsors();
    setTimeout(() => {
      sponsorMsg.textContent = '';
    }, 2000);
  } catch (err) {
    sponsorMsg.textContent = `添加失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function editSponsor(id, currentName, currentAmount) {
  const newName = prompt('请输入新的玩家名:', currentName);
  if (newName === null) return;

  const newAmount = prompt('请输入新的金额:', currentAmount);
  if (newAmount === null) return;

  const amount = parseInt(newAmount, 10);
  if (isNaN(amount) || amount < 0) {
    alert('请输入有效的金额');
    return;
  }

  try {
    await api(`/admin/sponsors/${id}`, 'PUT', { playerName: newName.trim(), amount });
    await listSponsors();
  } catch (err) {
    alert(`更新失败: ${err.message}`);
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function deleteSponsor(id, playerName) {
  const confirmed = confirm(`确定要删除玩家 "${playerName}" 的赞助记录吗？`);
  if (!confirmed) return;

  try {
    await api(`/admin/sponsors/${id}`, 'DELETE');
    currentSponsorsPage = 1;
    await listSponsors();
  } catch (err) {
    alert(`删除失败: ${err.message}`);
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 职业升级属性配置
const classBonusFields = {
  hp: 'class-bonus-hp',
  mp: 'class-bonus-mp',
  atk: 'class-bonus-atk',
  def: 'class-bonus-def',
  mag: 'class-bonus-mag',
  spirit: 'class-bonus-spirit',
  mdef: 'class-bonus-mdef',
  dex: 'class-bonus-dex'
};

const defaultClassBonusConfig = {
  warrior: { hpPerLevel: 3, mpPerLevel: 10, atkPerLevel: 0.5, defPerLevel: 3, magPerLevel: 0, spiritPerLevel: 0, mdefPerLevel: 3, dexPerLevel: 0.6 },
  mage: { hpPerLevel: 5, mpPerLevel: 10, atkPerLevel: 0, defPerLevel: 2, magPerLevel: 2, spiritPerLevel: 0, mdefPerLevel: 1, dexPerLevel: 0.6 },
  taoist: { hpPerLevel: 5, mpPerLevel: 10, atkPerLevel: 0, defPerLevel: 2, magPerLevel: 0, spiritPerLevel: 2, mdefPerLevel: 1, dexPerLevel: 0.8 }
};

async function loadClassBonusConfig() {
  const classSelect = document.getElementById('class-select');
  const classId = classSelect?.value;
  if (!classId) return;

  const classBonusMsg = document.getElementById('class-bonus-msg');
  try {
    const res = await api('/admin/class-level-bonus', 'GET');
    if (res.ok && res.configs && res.configs[classId]) {
      const config = res.configs[classId];
      Object.keys(classBonusFields).forEach(field => {
        const input = document.getElementById(classBonusFields[field]);
        if (input) {
          const fieldName = `${field}PerLevel`;
          input.value = config[fieldName] !== undefined ? config[fieldName] : '';
        }
      });
      if (classBonusMsg) classBonusMsg.textContent = '配置已加载';
      setTimeout(() => {
        if (classBonusMsg) classBonusMsg.textContent = '';
      }, 2000);
    } else {
      // 使用默认配置填充
      const defaultConfig = defaultClassBonusConfig[classId] || {};
      Object.keys(classBonusFields).forEach(field => {
        const input = document.getElementById(classBonusFields[field]);
        if (input) {
          const fieldName = `${field}PerLevel`;
          input.value = defaultConfig[fieldName] !== undefined ? defaultConfig[fieldName] : '';
        }
      });
      if (classBonusMsg) classBonusMsg.textContent = '使用默认配置（未设置自定义配置）';
      setTimeout(() => {
        if (classBonusMsg) classBonusMsg.textContent = '';
      }, 2000);
    }
  } catch (err) {
    if (classBonusMsg) classBonusMsg.textContent = `加载失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveClassBonusConfig() {
  const classSelect = document.getElementById('class-select');
  const classId = classSelect?.value;
  if (!classId) return;

  const config = {};
  Object.keys(classBonusFields).forEach(field => {
    const input = document.getElementById(classBonusFields[field]);
    if (input) {
      const value = parseFloat(input.value);
      const fieldName = `${field}PerLevel`;
      config[fieldName] = isNaN(value) ? 0 : value;
    }
  });

  const classBonusMsg = document.getElementById('class-bonus-msg');
  try {
    await api('/admin/class-level-bonus/update', 'POST', { classId, config });
    if (classBonusMsg) classBonusMsg.textContent = '配置已保存，将在重启服务器后完全生效';
    setTimeout(() => {
      if (classBonusMsg) classBonusMsg.textContent = '';
    }, 3000);
  } catch (err) {
    if (classBonusMsg) classBonusMsg.textContent = `保存失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function resetClassBonusConfig() {
  const classSelect = document.getElementById('class-select');
  const classId = classSelect?.value;
  if (!classId) return;

  const confirmed = confirm(`确定要恢复 "${classId}" 的默认配置吗？`);
  if (!confirmed) return;

  const defaultConfig = defaultClassBonusConfig[classId] || {};
  Object.keys(classBonusFields).forEach(field => {
    const input = document.getElementById(classBonusFields[field]);
    if (input) {
      const fieldName = `${field}PerLevel`;
      input.value = defaultConfig[fieldName] !== undefined ? defaultConfig[fieldName] : '';
    }
  });

  const classBonusMsg = document.getElementById('class-bonus-msg');
  try {
    await api('/admin/class-level-bonus/update', 'POST', { classId, config: defaultConfig });
    if (classBonusMsg) classBonusMsg.textContent = '已恢复默认配置，将在重启服务器后完全生效';
    setTimeout(() => {
      if (classBonusMsg) classBonusMsg.textContent = '';
    }, 3000);
  } catch (err) {
    if (classBonusMsg) classBonusMsg.textContent = `恢复失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 修炼果配置
async function loadTrainingFruitSettings() {
  if (!tfCoefficientInput || !tfDropRateInput || !tfMsg) return;
  tfMsg.textContent = '';
  try {
    const data = await api('/admin/training-fruit-settings', 'GET');
    tfCoefficientInput.value = data.coefficient !== undefined ? data.coefficient : '';
    tfDropRateInput.value = data.dropRate !== undefined ? data.dropRate : '';
    if (tfDropEnabledInput) tfDropEnabledInput.checked = data.dropEnabled !== false;
    if (tfPetDropEnabledInput) tfPetDropEnabledInput.checked = data.petDropEnabled !== false;
    tfMsg.textContent = '加载成功';
    tfMsg.style.color = 'green';
    setTimeout(() => {
      tfMsg.textContent = '';
    }, 2000);
  } catch (err) {
    tfMsg.textContent = `加载失败: ${err.message}`;
    tfMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingFruitSettings() {
  if (!tfCoefficientInput || !tfDropRateInput || !tfMsg) return;
  tfMsg.textContent = '';
  try {
    const coefficient = tfCoefficientInput.value ? Number(tfCoefficientInput.value) : undefined;
    const dropRate = tfDropRateInput.value ? Number(tfDropRateInput.value) : undefined;
    const dropEnabled = tfDropEnabledInput ? Boolean(tfDropEnabledInput.checked) : undefined;
    const petDropEnabled = tfPetDropEnabledInput ? Boolean(tfPetDropEnabledInput.checked) : undefined;

    if (coefficient !== undefined && (isNaN(coefficient) || coefficient < 0)) {
      tfMsg.textContent = '系数必须为有效数字且不小于0';
      tfMsg.style.color = 'red';
      return;
    }
    if (dropRate !== undefined && (isNaN(dropRate) || dropRate < 0 || dropRate > 1)) {
      tfMsg.textContent = '爆率必须为有效数字且在0到1之间';
      tfMsg.style.color = 'red';
      return;
    }

    await api('/admin/training-fruit-settings/update', 'POST', { coefficient, dropRate, dropEnabled, petDropEnabled });
    tfMsg.textContent = '保存成功，立即生效';
    tfMsg.style.color = 'green';
    setTimeout(() => {
      tfMsg.textContent = '';
    }, 2000);
  } catch (err) {
    tfMsg.textContent = `保存失败: ${err.message}`;
    tfMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 世界BOSS配置
let worldBossPlayerBonusConfig = [];

async function loadWorldBossSettings() {
  try {
    const data = await api('/admin/worldboss-settings', 'GET');
    document.getElementById('wb-base-hp').value = data.baseHp || '';
    document.getElementById('wb-base-atk').value = data.baseAtk || '';
    document.getElementById('wb-base-def').value = data.baseDef || '';
    document.getElementById('wb-base-mdef').value = data.baseMdef || '';
    if (wbBaseExpInput) wbBaseExpInput.value = data.baseExp ?? '';
    if (wbBaseGoldInput) wbBaseGoldInput.value = data.baseGold ?? '';
    document.getElementById('wb-drop-bonus').value = data.dropBonus || '';
    document.getElementById('wb-respawn-mins').value = data.respawnMinutes || '';
    worldBossPlayerBonusConfig = data.playerBonusConfig || [];
      renderWorldBossPlayerBonusList();
      loadWorldBossKillCount();
  } catch (err) {
    if (wbMsg) wbMsg.textContent = `加载失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

function renderWorldBossPlayerBonusList() {
  if (!wbPlayerBonusList) return;
  wbPlayerBonusList.innerHTML = '';
  if (!worldBossPlayerBonusConfig || worldBossPlayerBonusConfig.length === 0) {
    wbPlayerBonusList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">暂无配置</td></tr>';
    return;
  }

  worldBossPlayerBonusConfig.forEach((config, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" min="1" value="${config.min || 1}" style="width: 60px;" data-field="min" data-index="${index}"></td>
      <td><input type="number" value="${config.hp || 0}" style="width: 60px;" data-field="hp" data-index="${index}"></td>
      <td><input type="number" value="${config.atk || 0}" style="width: 60px;" data-field="atk" data-index="${index}"></td>
      <td><input type="number" value="${config.def || 0}" style="width: 60px;" data-field="def" data-index="${index}"></td>
      <td><input type="number" value="${config.mdef || 0}" style="width: 60px;" data-field="mdef" data-index="${index}"></td>
      <td><button class="btn-small" style="background: #c00;" onclick="deleteWorldBossPlayerBonus(${index})">删除</button></td>
    `;
    wbPlayerBonusList.appendChild(tr);
  });
}

function addPlayerBonusConfig() {
  worldBossPlayerBonusConfig.push({ min: 1, hp: 0, atk: 0, def: 0, mdef: 0 });
  renderWorldBossPlayerBonusList();
}

window.deleteWorldBossPlayerBonus = function(index) {
  worldBossPlayerBonusConfig.splice(index, 1);
  renderWorldBossPlayerBonusList();
};

async function saveWorldBossSettings() {
  if (!wbMsg) return;
  wbMsg.textContent = '';

  // 收集人数加成配置
  const rows = wbPlayerBonusList?.querySelectorAll('tr') || [];
  const playerBonusConfig = [];
  rows.forEach(tr => {
    const minInput = tr.querySelector('[data-field="min"]');
    const hpInput = tr.querySelector('[data-field="hp"]');
    const atkInput = tr.querySelector('[data-field="atk"]');
    const defInput = tr.querySelector('[data-field="def"]');
    const mdefInput = tr.querySelector('[data-field="mdef"]');
    
    if (minInput) {
      playerBonusConfig.push({
        min: parseInt(minInput.value) || 1,
        hp: hpInput ? parseInt(hpInput.value) || 0 : 0,
        atk: atkInput ? parseInt(atkInput.value) || 0 : 0,
        def: defInput ? parseInt(defInput.value) || 0 : 0,
        mdef: mdefInput ? parseInt(mdefInput.value) || 0 : 0
      });
    }
  });

  try {
    await api('/admin/worldboss-settings/update', 'POST', {
      baseHp: document.getElementById('wb-base-hp').value,
      baseAtk: document.getElementById('wb-base-atk').value,
      baseDef: document.getElementById('wb-base-def').value,
      baseMdef: document.getElementById('wb-base-mdef').value,
      baseExp: wbBaseExpInput?.value,
      baseGold: wbBaseGoldInput?.value,
      dropBonus: document.getElementById('wb-drop-bonus').value,
      respawnMinutes: document.getElementById('wb-respawn-mins').value,
      playerBonusConfig
    });
    wbMsg.textContent = '保存成功';
    setTimeout(() => {
      wbMsg.textContent = '';
    }, 2000);
  } catch (err) {
    wbMsg.textContent = `保存失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

// 特殊BOSS配置（魔龙BOSS、暗之系列BOSS、沙巴克BOSS）
let specialBossPlayerBonusConfig = [];

async function loadSpecialBossSettings() {
  try {
    const data = await api('/admin/specialboss-settings', 'GET');
    document.getElementById('sb-base-hp').value = data.baseHp || '';
    document.getElementById('sb-base-atk').value = data.baseAtk || '';
    document.getElementById('sb-base-def').value = data.baseDef || '';
    document.getElementById('sb-base-mdef').value = data.baseMdef || '';
    if (sbBaseExpInput) sbBaseExpInput.value = data.baseExp ?? '';
    if (sbBaseGoldInput) sbBaseGoldInput.value = data.baseGold ?? '';
    document.getElementById('sb-drop-bonus').value = data.dropBonus || '';
    document.getElementById('sb-respawn-mins').value = data.respawnMinutes || '';
    specialBossPlayerBonusConfig = data.playerBonusConfig || [];
      renderSpecialBossPlayerBonusList();
      loadSpecialBossKillCount();
  } catch (err) {
    if (sbMsg) sbMsg.textContent = `加载失败: ${err.message}`;
  }
}

// 修真BOSS配置
let cultivationBossPlayerBonusConfig = [];
async function loadCultivationBossSettings() {
  if (!cbMsg) return;
  cbMsg.textContent = '';
  try {
    const data = await api('/admin/cultivationboss-settings', 'GET');
    if (cbBaseHpInput) cbBaseHpInput.value = data.baseHp ?? '';
    if (cbBaseAtkInput) cbBaseAtkInput.value = data.baseAtk ?? '';
    if (cbBaseDefInput) cbBaseDefInput.value = data.baseDef ?? '';
    if (cbBaseMdefInput) cbBaseMdefInput.value = data.baseMdef ?? '';
    if (cbBaseExpInput) cbBaseExpInput.value = data.baseExp ?? '';
    if (cbBaseGoldInput) cbBaseGoldInput.value = data.baseGold ?? '';
    if (cbDropBonusInput) cbDropBonusInput.value = data.dropBonus ?? '';
    if (cbRespawnMinsInput) cbRespawnMinsInput.value = data.respawnMinutes ?? '';
    cultivationBossPlayerBonusConfig = data.playerBonusConfig || [];
    renderCultivationBossPlayerBonusList();
    loadCultivationBossKillCount();
    cbMsg.textContent = '加载成功';
    cbMsg.style.color = 'green';
    setTimeout(() => {
      cbMsg.textContent = '';
    }, 1500);
  } catch (err) {
    cbMsg.textContent = `加载失败: ${err.message}`;
    cbMsg.style.color = 'red';
  }
}

async function saveCultivationBossSettings() {
  if (!cbMsg) return;
  cbMsg.textContent = '';
  try {
    const rows = cbPlayerBonusList?.querySelectorAll('tr') || [];
    const playerBonusConfig = [];
    rows.forEach(tr => {
      const minInput = tr.querySelector('[data-type="cultivation"][data-field="min"]');
      const hpInput = tr.querySelector('[data-type="cultivation"][data-field="hp"]');
      const atkInput = tr.querySelector('[data-type="cultivation"][data-field="atk"]');
      const defInput = tr.querySelector('[data-type="cultivation"][data-field="def"]');
      const mdefInput = tr.querySelector('[data-type="cultivation"][data-field="mdef"]');

      if (minInput) {
        playerBonusConfig.push({
          min: parseInt(minInput.value) || 1,
          hp: hpInput ? parseInt(hpInput.value) || 0 : 0,
          atk: atkInput ? parseInt(atkInput.value) || 0 : 0,
          def: defInput ? parseInt(defInput.value) || 0 : 0,
          mdef: mdefInput ? parseInt(mdefInput.value) || 0 : 0
        });
      }
    });
    await api('/admin/cultivationboss-settings/update', 'POST', {
      baseHp: cbBaseHpInput?.value,
      baseAtk: cbBaseAtkInput?.value,
      baseDef: cbBaseDefInput?.value,
      baseMdef: cbBaseMdefInput?.value,
      baseExp: cbBaseExpInput?.value,
      baseGold: cbBaseGoldInput?.value,
      dropBonus: cbDropBonusInput?.value,
      respawnMinutes: cbRespawnMinsInput?.value,
      playerBonusConfig
    });
    cbMsg.textContent = '保存成功';
    cbMsg.style.color = 'green';
    setTimeout(() => {
      cbMsg.textContent = '';
    }, 2000);
  } catch (err) {
    cbMsg.textContent = `保存失败: ${err.message}`;
    cbMsg.style.color = 'red';
  }
}

async function loadPersonalBossSettings() {
  if (!pbMsg) return;
  pbMsg.textContent = '';
  try {
    const data = await api('/admin/personalboss-settings', 'GET');
    const vip = data.vip || {};
    const svip = data.svip || {};
    if (pbVipHpInput) pbVipHpInput.value = vip.hp ?? '';
    if (pbVipAtkInput) pbVipAtkInput.value = vip.atk ?? '';
    if (pbVipDefInput) pbVipDefInput.value = vip.def ?? '';
    if (pbVipMdefInput) pbVipMdefInput.value = vip.mdef ?? '';
    if (pbVipExpInput) pbVipExpInput.value = vip.exp ?? '';
    if (pbVipGoldInput) pbVipGoldInput.value = vip.gold ?? '';
    if (pbVipRespawnMinsInput) pbVipRespawnMinsInput.value = vip.respawnMinutes ?? '';
    if (pbVipDropBonusInput) pbVipDropBonusInput.value = vip.dropBonus ?? '';

    if (pbSvipHpInput) pbSvipHpInput.value = svip.hp ?? '';
    if (pbSvipAtkInput) pbSvipAtkInput.value = svip.atk ?? '';
    if (pbSvipDefInput) pbSvipDefInput.value = svip.def ?? '';
    if (pbSvipMdefInput) pbSvipMdefInput.value = svip.mdef ?? '';
    if (pbSvipExpInput) pbSvipExpInput.value = svip.exp ?? '';
    if (pbSvipGoldInput) pbSvipGoldInput.value = svip.gold ?? '';
    if (pbSvipRespawnMinsInput) pbSvipRespawnMinsInput.value = svip.respawnMinutes ?? '';
    if (pbSvipDropBonusInput) pbSvipDropBonusInput.value = svip.dropBonus ?? '';

    pbMsg.textContent = '加载成功';
    pbMsg.style.color = 'green';
    setTimeout(() => {
      pbMsg.textContent = '';
    }, 1500);
  } catch (err) {
    pbMsg.textContent = `加载失败: ${err.message}`;
    pbMsg.style.color = 'red';
  }
}

async function savePersonalBossSettings() {
  if (!pbMsg) return;
  pbMsg.textContent = '';
  try {
    await api('/admin/personalboss-settings/update', 'POST', {
      vip: {
        hp: Number(pbVipHpInput?.value),
        atk: Number(pbVipAtkInput?.value),
        def: Number(pbVipDefInput?.value),
        mdef: Number(pbVipMdefInput?.value),
        exp: Number(pbVipExpInput?.value),
        gold: Number(pbVipGoldInput?.value),
        respawnMinutes: Number(pbVipRespawnMinsInput?.value),
        dropBonus: Number(pbVipDropBonusInput?.value)
      },
      svip: {
        hp: Number(pbSvipHpInput?.value),
        atk: Number(pbSvipAtkInput?.value),
        def: Number(pbSvipDefInput?.value),
        mdef: Number(pbSvipMdefInput?.value),
        exp: Number(pbSvipExpInput?.value),
        gold: Number(pbSvipGoldInput?.value),
        respawnMinutes: Number(pbSvipRespawnMinsInput?.value),
        dropBonus: Number(pbSvipDropBonusInput?.value)
      }
    });
    pbMsg.textContent = '保存成功';
    pbMsg.style.color = 'green';
    setTimeout(() => {
      pbMsg.textContent = '';
    }, 2000);
  } catch (err) {
    pbMsg.textContent = `保存失败: ${err.message}`;
    pbMsg.style.color = 'red';
  }
}

function renderCultivationBossPlayerBonusList() {
  if (!cbPlayerBonusList) return;
  cbPlayerBonusList.innerHTML = '';
  if (!cultivationBossPlayerBonusConfig || cultivationBossPlayerBonusConfig.length === 0) {
    cbPlayerBonusList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">暂无配置</td></tr>';
    return;
  }

  cultivationBossPlayerBonusConfig.forEach((config, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" min="1" value="${config.min || 1}" style="width: 60px;" data-field="min" data-index="${index}" data-type="cultivation"></td>
      <td><input type="number" value="${config.hp || 0}" style="width: 60px;" data-field="hp" data-index="${index}" data-type="cultivation"></td>
      <td><input type="number" value="${config.atk || 0}" style="width: 60px;" data-field="atk" data-index="${index}" data-type="cultivation"></td>
      <td><input type="number" value="${config.def || 0}" style="width: 60px;" data-field="def" data-index="${index}" data-type="cultivation"></td>
      <td><input type="number" value="${config.mdef || 0}" style="width: 60px;" data-field="mdef" data-index="${index}" data-type="cultivation"></td>
      <td><button class="btn-small" style="background: #c00;" onclick="deleteCultivationBossPlayerBonus(${index})">删除</button></td>
    `;
    cbPlayerBonusList.appendChild(tr);
  });
}

function addCultivationBossPlayerBonusConfig() {
  cultivationBossPlayerBonusConfig.push({ min: 1, hp: 0, atk: 0, def: 0, mdef: 0 });
  renderCultivationBossPlayerBonusList();
}

window.deleteCultivationBossPlayerBonus = function(index) {
  cultivationBossPlayerBonusConfig.splice(index, 1);
  renderCultivationBossPlayerBonusList();
};

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

function renderSpecialBossPlayerBonusList() {
  if (!sbPlayerBonusList) return;
  sbPlayerBonusList.innerHTML = '';
  if (!specialBossPlayerBonusConfig || specialBossPlayerBonusConfig.length === 0) {
    sbPlayerBonusList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">暂无配置</td></tr>';
    return;
  }

  specialBossPlayerBonusConfig.forEach((config, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" min="1" value="${config.min || 1}" style="width: 60px;" data-field="min" data-index="${index}" data-type="special"></td>
      <td><input type="number" value="${config.hp || 0}" style="width: 60px;" data-field="hp" data-index="${index}" data-type="special"></td>
      <td><input type="number" value="${config.atk || 0}" style="width: 60px;" data-field="atk" data-index="${index}" data-type="special"></td>
      <td><input type="number" value="${config.def || 0}" style="width: 60px;" data-field="def" data-index="${index}" data-type="special"></td>
      <td><input type="number" value="${config.mdef || 0}" style="width: 60px;" data-field="mdef" data-index="${index}" data-type="special"></td>
      <td><button class="btn-small" style="background: #c00;" onclick="deleteSpecialBossPlayerBonus(${index})">删除</button></td>
    `;
    sbPlayerBonusList.appendChild(tr);
  });
}

function addSpecialBossPlayerBonusConfig() {
  specialBossPlayerBonusConfig.push({ min: 1, hp: 0, atk: 0, def: 0, mdef: 0 });
  renderSpecialBossPlayerBonusList();
}

window.deleteSpecialBossPlayerBonus = function(index) {
  specialBossPlayerBonusConfig.splice(index, 1);
  renderSpecialBossPlayerBonusList();
};

async function saveSpecialBossSettings() {
  if (!sbMsg) return;
  sbMsg.textContent = '';

  // 收集人数加成配置
  const rows = sbPlayerBonusList?.querySelectorAll('tr') || [];
  const playerBonusConfig = [];
  rows.forEach(tr => {
    const minInput = tr.querySelector('[data-type="special"][data-field="min"]');
    const hpInput = tr.querySelector('[data-type="special"][data-field="hp"]');
    const atkInput = tr.querySelector('[data-type="special"][data-field="atk"]');
    const defInput = tr.querySelector('[data-type="special"][data-field="def"]');
    const mdefInput = tr.querySelector('[data-type="special"][data-field="mdef"]');

    if (minInput) {
      playerBonusConfig.push({
        min: parseInt(minInput.value) || 1,
        hp: hpInput ? parseInt(hpInput.value) || 0 : 0,
        atk: atkInput ? parseInt(atkInput.value) || 0 : 0,
        def: defInput ? parseInt(defInput.value) || 0 : 0,
        mdef: mdefInput ? parseInt(mdefInput.value) || 0 : 0
      });
    }
  });

  try {
    await api('/admin/specialboss-settings/update', 'POST', {
      baseHp: document.getElementById('sb-base-hp').value,
      baseAtk: document.getElementById('sb-base-atk').value,
      baseDef: document.getElementById('sb-base-def').value,
      baseMdef: document.getElementById('sb-base-mdef').value,
      baseExp: sbBaseExpInput?.value,
      baseGold: sbBaseGoldInput?.value,
      dropBonus: document.getElementById('sb-drop-bonus').value,
      respawnMinutes: document.getElementById('sb-respawn-mins').value,
      playerBonusConfig
    });
    sbMsg.textContent = '保存成功';
    setTimeout(() => {
      sbMsg.textContent = '';
    }, 2000);
  } catch (err) {
    sbMsg.textContent = `保存失败: ${err.message}`;
  }
}

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function loadTreasureSettings() {
  if (!treasureMsg) return;
  treasureMsg.textContent = '';
  try {
    const data = await api('/admin/treasure-settings', 'GET');
    if (treasureSlotCountInput) treasureSlotCountInput.value = data.slotCount ?? '';
    if (treasureMaxLevelInput) treasureMaxLevelInput.value = data.maxLevel ?? '';
    if (treasureUpgradeConsumeInput) treasureUpgradeConsumeInput.value = data.upgradeConsume ?? '';
    if (treasureAdvanceConsumeInput) treasureAdvanceConsumeInput.value = data.advanceConsume ?? '';
    if (treasureAdvancePerStageInput) treasureAdvancePerStageInput.value = data.advancePerStage ?? '';
    if (treasureAdvanceBonusPerStackInput) treasureAdvanceBonusPerStackInput.value = data.advanceEffectBonusPerStack ?? '';
    if (treasureWorldBossDropMultiplierInput) treasureWorldBossDropMultiplierInput.value = data.worldBossDropMultiplier ?? '';
    if (treasureCrossBossDropMultiplierInput) treasureCrossBossDropMultiplierInput.value = data.crossWorldBossDropMultiplier ?? '';
    if (treasureTowerXuanmingDropChanceInput) treasureTowerXuanmingDropChanceInput.value = data.towerXuanmingDropChance ?? '';
    treasureMsg.textContent = '加载成功';
    treasureMsg.style.color = 'green';
    setTimeout(() => { treasureMsg.textContent = ''; }, 1500);
  } catch (err) {
    treasureMsg.textContent = `加载失败: ${err.message}`;
    treasureMsg.style.color = 'red';
  }
}

async function saveTreasureSettings() {
  if (!treasureMsg) return;
  treasureMsg.textContent = '';
  try {
    const payload = {
      slotCount: Number(treasureSlotCountInput?.value),
      maxLevel: Number(treasureMaxLevelInput?.value),
      upgradeConsume: Number(treasureUpgradeConsumeInput?.value),
      advanceConsume: Number(treasureAdvanceConsumeInput?.value),
      advancePerStage: Number(treasureAdvancePerStageInput?.value),
      advanceEffectBonusPerStack: Number(treasureAdvanceBonusPerStackInput?.value),
      worldBossDropMultiplier: Number(treasureWorldBossDropMultiplierInput?.value),
      crossWorldBossDropMultiplier: Number(treasureCrossBossDropMultiplierInput?.value),
      towerXuanmingDropChance: Number(treasureTowerXuanmingDropChanceInput?.value)
    };
    if (!Number.isFinite(payload.slotCount) || payload.slotCount < 1) throw new Error('法宝槽位必须为正整数');
    if (!Number.isFinite(payload.maxLevel) || payload.maxLevel < 1) throw new Error('法宝等级上限必须为正整数');
    if (!Number.isFinite(payload.upgradeConsume) || payload.upgradeConsume < 1) throw new Error('升级消耗必须为正整数');
    if (!Number.isFinite(payload.advanceConsume) || payload.advanceConsume < 1) throw new Error('升段消耗必须为正整数');
    if (!Number.isFinite(payload.advancePerStage) || payload.advancePerStage < 1) throw new Error('每阶所需段数必须为正整数');
    if (!Number.isFinite(payload.advanceEffectBonusPerStack) || payload.advanceEffectBonusPerStack < 0) throw new Error('每段效果加成必须大于等于0');
    if (!Number.isFinite(payload.worldBossDropMultiplier) || payload.worldBossDropMultiplier < 0) throw new Error('世界BOSS法宝掉率倍率必须大于等于0');
    if (!Number.isFinite(payload.crossWorldBossDropMultiplier) || payload.crossWorldBossDropMultiplier < 0) throw new Error('跨服BOSS法宝掉率倍率必须大于等于0');
    if (!Number.isFinite(payload.towerXuanmingDropChance) || payload.towerXuanmingDropChance < 0 || payload.towerXuanmingDropChance > 1) throw new Error('浮图塔玄冥掉率必须在0到1之间');

    await api('/admin/treasure-settings/update', 'POST', payload);
    treasureMsg.textContent = '保存成功，立即生效';
    treasureMsg.style.color = 'green';
    setTimeout(() => { treasureMsg.textContent = ''; }, 2000);
  } catch (err) {
    treasureMsg.textContent = `保存失败: ${err.message}`;
    treasureMsg.style.color = 'red';
  }
}

async function initDashboard() {
  if (adminToken) {
      showDashboard();
      loadDashboardStats();
      refreshUsers();
      refreshVipSelfClaimStatus();
      refreshVipClaimLimitStatus();
      loadSmtpSettings();
      loadSvipSettings();
      refreshStateThrottleStatus();
    refreshRoomVariantStatus();
      loadCmdRateSettings();
      await refreshRealms();
      loadRouteLinesConfig();
      listSponsors();
    loadWorldBossSettings();
    loadSpecialBossSettings();
    loadCultivationBossSettings();
    loadPersonalBossSettings();
    loadEventTimeSettings();
    loadActivityPointShopConfig();
    loadHarvestSignConfig();
    loadHarvestRewardConfig();
    loadDivineBeastFragmentExchangeConfig();
    loadEquipmentRecycleConfig();
    loadGuildSystemConfig();
    loadGuildBuildingConfig();
    loadFirstRechargeSettings();
    loadInviteRewardSettings();
    loadClassBonusConfig();
    loadTrainingFruitSettings();
    loadTrainingSettings();
    loadRefineSettings();
    loadUltimateGrowthSettings();
    loadTreasureSettings();
    loadEffectResetSettings();
    loadPetSettings();
  }
}

initDashboard();
initCollapsibleBlocks();

document.getElementById('admin-login-btn').addEventListener('click', login);
document.getElementById('refresh-users').addEventListener('click', () => refreshUsers(currentUsersPage));
if (activityPointShopLoadBtn) activityPointShopLoadBtn.addEventListener('click', loadActivityPointShopConfig);
if (activityPointShopAddBtn) {
  activityPointShopAddBtn.addEventListener('click', () => {
    if (!Array.isArray(activityPointShopRowsCache)) activityPointShopRowsCache = [];
    activityPointShopRowsCache.push(activityPointShopEmptyItem());
    renderActivityPointShopRows();
  });
}
if (harvestSignLoadBtn) harvestSignLoadBtn.addEventListener('click', loadHarvestSignConfig);
if (harvestSignAddBtn) {
  harvestSignAddBtn.addEventListener('click', () => {
    if (!Array.isArray(harvestSignRowsCache)) harvestSignRowsCache = [];
    harvestSignRowsCache.push(harvestSignEmptyItem());
    renderHarvestSignRows();
  });
}
if (harvestRewardLoadBtn) harvestRewardLoadBtn.addEventListener('click', loadHarvestRewardConfig);
if (harvestRewardAddBtn) {
  harvestRewardAddBtn.addEventListener('click', () => {
    if (!Array.isArray(harvestRewardRowsCache)) harvestRewardRowsCache = [];
    harvestRewardRowsCache.push(harvestRewardEmptyItem());
    renderHarvestRewardRows();
  });
}
if (equipmentRecycleLoadBtn) equipmentRecycleLoadBtn.addEventListener('click', loadEquipmentRecycleConfig);
if (equipmentRecycleAddBtn) {
  equipmentRecycleAddBtn.addEventListener('click', () => {
    if (!Array.isArray(equipmentRecycleRowsCache)) equipmentRecycleRowsCache = [];
    equipmentRecycleRowsCache.push(equipmentRecycleEmptyItem());
    renderEquipmentRecycleRows();
  });
}
if (guildSystemLoadBtn) guildSystemLoadBtn.addEventListener('click', loadGuildSystemConfig);
if (guildSystemShopAddBtn) {
  guildSystemShopAddBtn.addEventListener('click', () => {
    if (!Array.isArray(guildSystemShopRowsCache)) guildSystemShopRowsCache = [];
    guildSystemShopRowsCache.push(guildSystemEmptyShopItem());
    renderGuildSystemShopRows();
  });
}
if (guildBuildingLoadBtn) guildBuildingLoadBtn.addEventListener('click', loadGuildBuildingConfig);
if (guildBuildingSaveBtn) guildBuildingSaveBtn.addEventListener('click', saveGuildBuildingConfig);
if (guildBuildingDurationStepInput) {
  guildBuildingDurationStepInput.addEventListener('input', () => {
    renderGuildBuildingLevelRows();
  });
}

async function resetPetSkillEffectsToDefault() {
  if (!petSettingsMsg) return;
  const confirmed = await customConfirm('重置宠物技能说明', '仅重置“技能效果/说明”文本为代码默认值，保留其它宠物配置，是否继续？');
  if (!confirmed) return;
  petSettingsMsg.textContent = '';
  try {
    const data = await api('/admin/pet-settings/reset-skill-effects', 'POST');
    if (data?.settings) {
      petSettingsCache = data.settings;
      applyPetSettingsToForm(petSettingsCache);
    } else {
      await loadPetSettings();
    }
    petSettingsMsg.textContent = '宠物技能说明已重置为默认值';
    petSettingsMsg.style.color = 'green';
    setTimeout(() => {
      if (petSettingsMsg) petSettingsMsg.textContent = '';
    }, 1800);
  } catch (err) {
    petSettingsMsg.textContent = `重置失败: ${err.message}`;
    petSettingsMsg.style.color = 'red';
  }
}
if (activityPointShopSaveBtn) activityPointShopSaveBtn.addEventListener('click', saveActivityPointShopConfig);
if (activityPointShopItemSearchInput) {
  activityPointShopItemSearchInput.addEventListener('input', () => {
    activityPointShopItemSearchKeyword = String(activityPointShopItemSearchInput.value || '').trim();
    renderActivityPointShopRows();
  });
}
if (activityPointShopList) {
  activityPointShopList.addEventListener('change', (e) => {
    const select = e.target?.closest?.('select[data-k="itemId"]');
    if (!select) return;
    const tr = select.closest('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(activityPointShopRowsCache) || !activityPointShopRowsCache[index]) return;
    activityPointShopRowsCache[index].itemId = String(select.value || '').trim();
  });
  activityPointShopList.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-act="del"]');
    if (!btn) return;
    const tr = btn.closest('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(activityPointShopRowsCache)) activityPointShopRowsCache = [];
    activityPointShopRowsCache.splice(index, 1);
    renderActivityPointShopRows();
  });
}
if (harvestSignSaveBtn) harvestSignSaveBtn.addEventListener('click', saveHarvestSignConfig);
if (harvestSignItemSearchInput) {
  harvestSignItemSearchInput.addEventListener('input', () => {
    harvestSignItemSearchKeyword = String(harvestSignItemSearchInput.value || '').trim();
    renderHarvestSignRows();
  });
}
if (harvestSignList) {
  harvestSignList.addEventListener('change', (e) => {
    const target = e.target;
    const tr = target?.closest?.('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(harvestSignRowsCache) || !harvestSignRowsCache[index]) return;
    const row = harvestSignRowsCache[index];
    if (target?.matches?.('select[data-k="itemId"]')) {
      row.itemId = String(target.value || '').trim();
      return;
    }
    if (target?.matches?.('input[data-k="qty"]')) {
      row.qty = Math.max(1, Math.floor(Number(target.value || 1)));
    }
  });
  harvestSignList.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-act="del"]');
    if (!btn) return;
    const tr = btn.closest('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(harvestSignRowsCache)) harvestSignRowsCache = [];
    harvestSignRowsCache.splice(index, 1);
    renderHarvestSignRows();
  });
}
if (harvestRewardSaveBtn) harvestRewardSaveBtn.addEventListener('click', saveHarvestRewardConfig);
if (harvestRewardItemSearchInput) {
  harvestRewardItemSearchInput.addEventListener('input', () => {
    harvestRewardItemSearchKeyword = String(harvestRewardItemSearchInput.value || '').trim();
    renderHarvestRewardRows();
  });
}
if (harvestRewardList) {
  harvestRewardList.addEventListener('change', (e) => {
    const target = e.target;
    const tr = target?.closest?.('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(harvestRewardRowsCache) || !harvestRewardRowsCache[index]) return;
    const row = harvestRewardRowsCache[index];
    if (target?.matches?.('select[data-k="itemId"]')) {
      row.itemId = String(target.value || '').trim();
      return;
    }
    if (target?.matches?.('input[data-k="threshold"]')) {
      row.threshold = Math.max(1, Math.floor(Number(target.value || 1)));
      return;
    }
    if (target?.matches?.('input[data-k="title"]')) {
      row.title = String(target.value || '').trim() || '丰收挂机奖励';
      return;
    }
    if (target?.matches?.('input[data-k="gold"]')) {
      row.gold = Math.max(0, Math.floor(Number(target.value || 0)));
      return;
    }
    if (target?.matches?.('input[data-k="itemQty"]')) {
      row.itemQty = Math.max(1, Math.floor(Number(target.value || 1)));
    }
  });
  harvestRewardList.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-act="del"]');
    if (!btn) return;
    const tr = btn.closest('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(harvestRewardRowsCache)) harvestRewardRowsCache = [];
    harvestRewardRowsCache.splice(index, 1);
    renderHarvestRewardRows();
  });
}
if (divineBeastFragmentLoadBtn) divineBeastFragmentLoadBtn.addEventListener('click', loadDivineBeastFragmentExchangeConfig);
if (divineBeastFragmentAddBtn) {
  divineBeastFragmentAddBtn.addEventListener('click', () => {
    if (!Array.isArray(divineBeastFragmentRowsCache)) divineBeastFragmentRowsCache = [];
    divineBeastFragmentRowsCache.push(divineBeastFragmentEmptyItem());
    renderDivineBeastFragmentRows();
  });
}
if (divineBeastFragmentSaveBtn) divineBeastFragmentSaveBtn.addEventListener('click', saveDivineBeastFragmentExchangeConfig);
if (divineBeastFragmentList) {
  divineBeastFragmentList.addEventListener('change', (e) => {
    const target = e.target;
    const tr = target?.closest?.('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(divineBeastFragmentRowsCache) || !divineBeastFragmentRowsCache[index]) return;
    if (target?.matches?.('select[data-k="species"]')) {
      divineBeastFragmentRowsCache[index].species = String(target.value || '').trim();
      return;
    }
    if (target?.matches?.('input[data-k="cost"]')) {
      divineBeastFragmentRowsCache[index].cost = Math.max(1, Math.floor(Number(target.value || 1)));
    }
  });
  divineBeastFragmentList.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-act="del"]');
    if (!btn) return;
    const tr = btn.closest('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(divineBeastFragmentRowsCache)) divineBeastFragmentRowsCache = [];
    divineBeastFragmentRowsCache.splice(index, 1);
    renderDivineBeastFragmentRows();
  });
}
if (equipmentRecycleSaveBtn) equipmentRecycleSaveBtn.addEventListener('click', saveEquipmentRecycleConfig);
if (equipmentRecycleItemSearchInput) {
  equipmentRecycleItemSearchInput.addEventListener('input', () => {
    equipmentRecycleItemSearchKeyword = String(equipmentRecycleItemSearchInput.value || '').trim();
    renderEquipmentRecycleRows();
  });
}
if (equipmentRecycleList) {
  equipmentRecycleList.addEventListener('change', (e) => {
    const target = e.target;
    const tr = target?.closest?.('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(equipmentRecycleRowsCache) || !equipmentRecycleRowsCache[index]) return;
    if (target?.matches?.('select[data-k="rewardId"]')) {
      equipmentRecycleRowsCache[index].rewardId = String(target.value || '').trim();
      return;
    }
    if (target?.matches?.('select[data-k="currency"]')) {
      equipmentRecycleRowsCache[index].currency = ['epic', 'legendary', 'supreme'].includes(String(target.value || 'epic').trim().toLowerCase())
        ? String(target.value || 'epic').trim().toLowerCase()
        : 'epic';
      return;
    }
    if (target?.matches?.('select[data-k="limitType"]')) {
      equipmentRecycleRowsCache[index].limitType = ['none', 'daily', 'weekly', 'lifetime'].includes(String(target.value || 'none'))
        ? String(target.value || 'none')
        : 'none';
      return;
    }
    if (target?.matches?.('input[data-k="rewardQty"]')) {
      equipmentRecycleRowsCache[index].rewardQty = Math.max(1, Math.floor(Number(target.value || 1)));
      return;
    }
    if (target?.matches?.('input[data-k="cost"]')) {
      equipmentRecycleRowsCache[index].cost = Math.max(1, Math.floor(Number(target.value || 1)));
      return;
    }
    if (target?.matches?.('input[data-k="limit"]')) {
      equipmentRecycleRowsCache[index].limit = Math.max(1, Math.floor(Number(target.value || 1)));
    }
  });
  equipmentRecycleList.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-act="del"]');
    if (!btn) return;
    const tr = btn.closest('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(equipmentRecycleRowsCache)) equipmentRecycleRowsCache = [];
    equipmentRecycleRowsCache.splice(index, 1);
    renderEquipmentRecycleRows();
  });
}
if (guildSystemSaveBtn) guildSystemSaveBtn.addEventListener('click', saveGuildSystemConfig);
if (guildSystemItemSearchInput) {
  guildSystemItemSearchInput.addEventListener('input', () => {
    guildSystemItemSearchKeyword = String(guildSystemItemSearchInput.value || '').trim();
    renderGuildSystemShopRows();
  });
}
if (guildSystemShopList) {
  guildSystemShopList.addEventListener('change', (e) => {
    const target = e.target;
    const tr = target?.closest?.('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(guildSystemShopRowsCache) || !guildSystemShopRowsCache[index]) return;
    if (target?.matches?.('select[data-k="id"]')) {
      guildSystemShopRowsCache[index].id = String(target.value || '').trim();
      return;
    }
    if (target?.matches?.('input[data-k="qty"]')) {
      guildSystemShopRowsCache[index].qty = Math.max(1, Math.floor(Number(target.value || 1)));
      return;
    }
    if (target?.matches?.('input[data-k="cost"]')) {
      guildSystemShopRowsCache[index].cost = Math.max(1, Math.floor(Number(target.value || 1)));
    }
  });
  guildSystemShopList.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-act="del"]');
    if (!btn) return;
    const tr = btn.closest('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(guildSystemShopRowsCache)) guildSystemShopRowsCache = [];
    guildSystemShopRowsCache.splice(index, 1);
    renderGuildSystemShopRows();
  });
}
if (usersSearchBtn) {
  usersSearchBtn.addEventListener('click', () => {
    currentUsersSearch = (usersSearchInput?.value || '').trim();
    refreshUsers(1);
  });
}
if (usersSearchInput) {
  usersSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      currentUsersSearch = usersSearchInput.value.trim();
      refreshUsers(1);
    }
  });
}
document.getElementById('users-prev-page').addEventListener('click', () => {
  if (currentUsersPage > 1) {
    refreshUsers(currentUsersPage - 1);
  }
});

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}
document.getElementById('users-next-page').addEventListener('click', () => {
  if (currentUsersPage < totalUsersPages) {
    refreshUsers(currentUsersPage + 1);
  }
});

// 修炼系统配置
async function loadTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const data = await api('/admin/training-settings', 'GET');
    const config = data.config || {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        trainingInputs[key].value = config[key] !== undefined ? config[key] : '';
      }
    });
    trainingMsg.textContent = '加载成功';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `加载失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}

async function saveTrainingSettings() {
  if (!trainingMsg) return;
  trainingMsg.textContent = '';
  try {
    const config = {};
    Object.keys(trainingInputs).forEach(key => {
      if (trainingInputs[key]) {
        const value = trainingInputs[key].value ? Number(trainingInputs[key].value) : undefined;
        if (value !== undefined) {
          if (isNaN(value) || value < 0) {
            trainingMsg.textContent = `${key} 必须为有效数字且不小于0`;
            trainingMsg.style.color = 'red';
            return;
          }
          config[key] = value;
        }
      }
    });
    if (Object.keys(config).length === 0) {
      trainingMsg.textContent = '请至少配置一个属性';
      trainingMsg.style.color = 'red';
      return;
    }
    await api('/admin/training-settings/update', 'POST', { config });
    trainingMsg.textContent = '保存成功，立即生效';
    trainingMsg.style.color = 'green';
    setTimeout(() => {
      trainingMsg.textContent = '';
    }, 2000);
  } catch (err) {
    trainingMsg.textContent = `保存失败: ${err.message}`;
    trainingMsg.style.color = 'red';
  }
}
document.getElementById('wb-save-btn').addEventListener('click', saveWorldBossSettings);
if (document.getElementById('wb-add-bonus-btn')) {
  document.getElementById('wb-add-bonus-btn').addEventListener('click', addPlayerBonusConfig);
}
if (wbKillRealmInput) {
  wbKillRealmInput.addEventListener('change', loadWorldBossKillCount);
}
if (document.getElementById('wb-kill-save-btn')) {
  document.getElementById('wb-kill-save-btn').addEventListener('click', () => saveWorldBossKillCount());
}
if (document.getElementById('wb-kill-reset-btn')) {
  document.getElementById('wb-kill-reset-btn').addEventListener('click', () => saveWorldBossKillCount(0));
}
document.getElementById('vip-create-btn').addEventListener('click', createVipCodes);
document.getElementById('vip-list-btn').addEventListener('click', listVipCodes);
document.getElementById('recharge-create-btn').addEventListener('click', createRechargeCodes);
document.getElementById('recharge-list-btn').addEventListener('click', listRechargeCodes);
if (firstRechargeLoadBtn) firstRechargeLoadBtn.addEventListener('click', loadFirstRechargeSettings);
if (firstRechargeSaveBtn) firstRechargeSaveBtn.addEventListener('click', saveFirstRechargeSettings);
if (firstRechargeReissueBtn) firstRechargeReissueBtn.addEventListener('click', reissueFirstRechargeWelfare);
if (firstRechargeReissueDivineBeastBtn) firstRechargeReissueDivineBeastBtn.addEventListener('click', reissueDivineBeastForCharacter);
if (firstRechargeReissueDivineBeastAllBtn) firstRechargeReissueDivineBeastAllBtn.addEventListener('click', reissueDivineBeastForAllRechargeUsers);
if (firstRechargeReissueAllBtn) firstRechargeReissueAllBtn.addEventListener('click', reissueAllRechargeUsersFirstRechargeWelfare);
if (inviteRewardLoadBtn) inviteRewardLoadBtn.addEventListener('click', loadInviteRewardSettings);
if (inviteRewardSaveBtn) inviteRewardSaveBtn.addEventListener('click', saveInviteRewardSettings);
if (smtpLoadBtn) smtpLoadBtn.addEventListener('click', loadSmtpSettings);
if (smtpSaveBtn) smtpSaveBtn.addEventListener('click', saveSmtpSettings);
if (smtpTestBtn) smtpTestBtn.addEventListener('click', testSmtpConnection);
if (charMigrateBtn) charMigrateBtn.addEventListener('click', migrateCharacterToAnotherAccount);
if (charRestoreBtn) charRestoreBtn.addEventListener('click', restoreDeletedCharacterByAdmin);
if (vipCodesPrev) {
  vipCodesPrev.addEventListener('click', () => {
    vipCodesPageIndex = Math.max(0, vipCodesPageIndex - 1);
    listVipCodes();
  });
}
if (vipCodesNext) {
  vipCodesNext.addEventListener('click', () => {
    vipCodesPageIndex += 1;
    listVipCodes();
  });
}
if (rechargeCodesPrev) {
  rechargeCodesPrev.addEventListener('click', () => {
    rechargeCodesPageIndex = Math.max(0, rechargeCodesPageIndex - 1);
    listRechargeCodes();
  });
}
if (rechargeCodesNext) {
  rechargeCodesNext.addEventListener('click', () => {
    rechargeCodesPageIndex += 1;
    listRechargeCodes();
  });
}
if (vipSelfClaimToggle) {
  vipSelfClaimToggle.addEventListener('change', () => toggleVipSelfClaim(vipSelfClaimToggle.checked));
}
if (vipClaimLimitToggle) {
  vipClaimLimitToggle.addEventListener('change', () => toggleVipClaimLimit(vipClaimLimitToggle.checked));
}
if (svipSaveBtn) {
  svipSaveBtn.addEventListener('click', saveSvipSettings);
}
if (stateThrottleToggle) {
  stateThrottleToggle.addEventListener('change', () => toggleStateThrottle(stateThrottleToggle.checked));
}
if (stateThrottleOverrideAllowedToggle) {
  stateThrottleOverrideAllowedToggle.addEventListener('change', () => {
    toggleStateThrottle(stateThrottleToggle?.checked === true);
  });
}
if (cacheMonsterHealthToggle) {
  cacheMonsterHealthToggle.addEventListener('change', () => {
    toggleStateThrottle(stateThrottleToggle?.checked === true);
  });
}
if (stateThrottleSaveBtn) {
  stateThrottleSaveBtn.addEventListener('click', saveStateThrottleInterval);
}
if (roomVariantSaveBtn) {
  roomVariantSaveBtn.addEventListener('click', saveRoomVariantCount);
}
if (cmdRateSaveBtn) {
  cmdRateSaveBtn.addEventListener('click', saveCmdRateSettings);
}
document.getElementById('backup-download').addEventListener('click', downloadBackup);
document.getElementById('import-btn').addEventListener('click', importBackup);

// 区服管理事件
if (document.getElementById('realm-create-btn')) {
  document.getElementById('realm-create-btn').addEventListener('click', createRealm);
}
if (document.getElementById('realm-refresh-btn')) {
  document.getElementById('realm-refresh-btn').addEventListener('click', refreshRealms);
}
if (routeLinesLoadBtn) {
  routeLinesLoadBtn.addEventListener('click', loadRouteLinesConfig);
}
if (routeLinesAddBtn) {
  routeLinesAddBtn.addEventListener('click', () => {
    if (!Array.isArray(routeLinesRowsCache)) routeLinesRowsCache = [];
    routeLinesRowsCache.push(routeLineEmptyItem());
    renderRouteLinesRows();
  });
}
if (routeLinesSaveBtn) {
  routeLinesSaveBtn.addEventListener('click', saveRouteLinesConfig);
}
if (routeLinesList) {
  routeLinesList.addEventListener('change', (e) => {
    const target = e.target;
    const tr = target?.closest?.('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(routeLinesRowsCache) || !routeLinesRowsCache[index]) return;
    const row = routeLinesRowsCache[index];
    if (target?.matches?.('input[data-k="name"]')) {
      row.name = String(target.value || '').trim();
      return;
    }
    if (target?.matches?.('input[data-k="domain"]')) {
      row.domain = String(target.value || '').trim();
      return;
    }
    if (target?.matches?.('input[data-k="priority"]')) {
      row.priority = Math.max(1, Math.floor(Number(target.value || 100)));
      return;
    }
    if (target?.matches?.('input[data-k="enabled"]')) {
      row.enabled = target.checked === true;
    }
  });
  routeLinesList.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-act="del"]');
    if (!btn) return;
    const tr = btn.closest('tr[data-index]');
    const index = Number(tr?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;
    if (!Array.isArray(routeLinesRowsCache)) routeLinesRowsCache = [];
    routeLinesRowsCache.splice(index, 1);
    renderRouteLinesRows();
  });
}
if (document.getElementById('fix-realm-btn')) {
  document.getElementById('fix-realm-btn').addEventListener('click', fixRealmId);
}
if (document.getElementById('merge-realms-btn')) {
  document.getElementById('merge-realms-btn').addEventListener('click', mergeRealms);
}

// 赞助管理事件
if (sponsorAddBtn) {
  sponsorAddBtn.addEventListener('click', addSponsor);
}
if (sponsorsPrevPageBtn) {
  sponsorsPrevPageBtn.addEventListener('click', async () => {
    if (currentSponsorsPage > 1) {
      currentSponsorsPage--;
      await listSponsors();
    }
  });
}
if (sponsorsNextPageBtn) {
  sponsorsNextPageBtn.addEventListener('click', async () => {
    if (currentSponsorsPage < totalSponsorsPages) {
      currentSponsorsPage++;
      await listSponsors();
    }
  });
}

// 职业升级属性配置事件
if (document.getElementById('class-bonus-save')) {
  document.getElementById('class-bonus-save').addEventListener('click', saveClassBonusConfig);
}
if (document.getElementById('class-bonus-reset')) {
  document.getElementById('class-bonus-reset').addEventListener('click', resetClassBonusConfig);
}
if (document.getElementById('class-select')) {
  document.getElementById('class-select').addEventListener('change', loadClassBonusConfig);
}

// 特殊BOSS配置事件
if (document.getElementById('sb-add-bonus-btn')) {
  document.getElementById('sb-add-bonus-btn').addEventListener('click', addSpecialBossPlayerBonusConfig);
}
if (document.getElementById('sb-save-btn')) {
  document.getElementById('sb-save-btn').addEventListener('click', saveSpecialBossSettings);
}
if (document.getElementById('cb-add-bonus-btn')) {
  document.getElementById('cb-add-bonus-btn').addEventListener('click', addCultivationBossPlayerBonusConfig);
}
if (document.getElementById('cb-save-btn')) {
  document.getElementById('cb-save-btn').addEventListener('click', saveCultivationBossSettings);
}
if (document.getElementById('pb-save-btn')) {
  document.getElementById('pb-save-btn').addEventListener('click', savePersonalBossSettings);
}
if (document.getElementById('event-time-save-btn')) {
  document.getElementById('event-time-save-btn').addEventListener('click', saveEventTimeSettings);
}
if (document.getElementById('daily-lucky-refresh-btn')) {
  document.getElementById('daily-lucky-refresh-btn').addEventListener('click', refreshDailyLucky);
}
if (document.getElementById('daily-lucky-info-btn')) {
  document.getElementById('daily-lucky-info-btn').addEventListener('click', showDailyLuckyInfo);
}
if (sbKillRealmInput) {
  sbKillRealmInput.addEventListener('change', loadSpecialBossKillCount);
}
if (document.getElementById('sb-kill-save-btn')) {
  document.getElementById('sb-kill-save-btn').addEventListener('click', () => saveSpecialBossKillCount());
}
if (document.getElementById('sb-kill-reset-btn')) {
  document.getElementById('sb-kill-reset-btn').addEventListener('click', () => saveSpecialBossKillCount(0));
}
if (cbKillRealmInput) {
  cbKillRealmInput.addEventListener('change', loadCultivationBossKillCount);
}
if (document.getElementById('cb-kill-save-btn')) {
  document.getElementById('cb-kill-save-btn').addEventListener('click', () => saveCultivationBossKillCount());
}
if (document.getElementById('cb-kill-reset-btn')) {
  document.getElementById('cb-kill-reset-btn').addEventListener('click', () => saveCultivationBossKillCount(0));
}

// 修炼果配置事件
if (tfSaveBtn) {
  tfSaveBtn.addEventListener('click', saveTrainingFruitSettings);
}

// 修炼系统配置事件
if (trainingSaveBtn) {
  trainingSaveBtn.addEventListener('click', saveTrainingSettings);
}

// 锻造系统配置事件
if (refineSaveBtn) {
  refineSaveBtn.addEventListener('click', saveRefineSettings);
}

// 装备成长配置事件
if (ultimateGrowthLoadBtn) {
  ultimateGrowthLoadBtn.addEventListener('click', loadUltimateGrowthSettings);
}
if (ultimateGrowthSaveBtn) {
  ultimateGrowthSaveBtn.addEventListener('click', saveUltimateGrowthSettings);
}

// 法宝配置事件
if (treasureSaveBtn) {
  treasureSaveBtn.addEventListener('click', saveTreasureSettings);
}

// 特效重置配置事件
if (effectResetSaveBtn) {
  effectResetSaveBtn.addEventListener('click', saveEffectResetSettings);
}

// 宠物配置事件
if (petSettingsRefreshBtn) {
  petSettingsRefreshBtn.addEventListener('click', loadPetSettings);
}
if (petSettingsSaveBtn) {
  petSettingsSaveBtn.addEventListener('click', savePetSettings);
}
if (petSettingsResetSkillEffectsBtn) {
  petSettingsResetSkillEffectsBtn.addEventListener('click', resetPetSkillEffectsToDefault);
}

if (adminPwCancel) {
  adminPwCancel.addEventListener('click', () => {
    pendingPwUser = null;
    adminPwModal.classList.add('hidden');
  });
}
if (adminPwSubmit) {
  adminPwSubmit.addEventListener('click', async () => {
    if (!pendingPwUser) return;
    const password = adminPwInput.value.trim();
    if (!password) return;
    if (password.length < 4) {
      await customAlert('密码错误', '密码至少4位');
      return;
    }
    try {
      await api('/admin/users/password', 'POST', {
        username: pendingPwUser,
        password
      });
      await customAlert('修改成功', '密码已更新，已清理登录状态。');
      pendingPwUser = null;
      adminPwModal.classList.add('hidden');
    } catch (err) {
      await customAlert('修改失败', `修改失败: ${err.message}`);
    }
  });
}

// ==================== 装备管理 ====================

const itemsList = document.getElementById('items-list');
const itemsPaginationInfo = document.getElementById('items-pagination-info');
const itemsSearchInput = document.getElementById('items-search');
const itemsSearchBtn = document.getElementById('items-search-btn');
const itemsRefreshBtn = document.getElementById('items-refresh-btn');
const itemsCreateBtn = document.getElementById('items-create-btn');
const itemsPrevPageBtn = document.getElementById('items-prev-page');
const itemsNextPageBtn = document.getElementById('items-next-page');
const itemsPageInput = document.getElementById('items-page-input');
const itemsGoPageBtn = document.getElementById('items-go-page');
const itemsImportBtn = document.getElementById('items-import-btn');
const itemsExportBtn = document.getElementById('items-export-btn');
const itemsImportJsonBtn = document.getElementById('items-import-json-btn');
const itemsImportJsonFile = document.getElementById('items-import-json-file');

const itemsImportModal = document.getElementById('items-import-modal');
const importItemsList = document.getElementById('import-items-list');
const importItemsInfo = document.getElementById('import-items-info');
const importSelectAll = document.getElementById('import-select-all');
const importItemsCancelBtn = document.getElementById('import-items-cancel');
const importItemsConfirmBtn = document.getElementById('import-items-confirm');

let itemTemplates = [];
let importedItemIds = new Set();

const itemEditModal = document.getElementById('item-edit-modal');
const itemEditTitle = document.getElementById('item-edit-title');
const itemEditSaveBtn = document.getElementById('item-edit-save');
const itemEditCancelBtn = document.getElementById('item-edit-cancel');
const itemDropAddBtn = document.getElementById('item-drop-add-btn');
const itemDropMobSelect = document.getElementById('item-drop-mob-select');
const itemDropChance = document.getElementById('item-drop-chance');
const itemDropsList = document.getElementById('item-drops-list');

let itemsCurrentPage = 1;
let itemsCurrentKeyword = '';
let itemsCurrentItemId = null;
let mobsList = [];
let itemDropsCache = [];

// 自动加载装备列表
if (itemsList) {
  if (itemsList.children.length <= 1 || itemsList.children[0]?.textContent === '加载中...') {
    loadItems(1, '');
  }
}

async function loadItems(page = 1, keyword = '') {
  itemsCurrentPage = page;
  itemsCurrentKeyword = keyword;

  const url = keyword
    ? `/admin/items/search?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=20`
    : `/admin/items?page=${page}&limit=20`;

  const res = await api(url, 'GET');
  if (!res.ok) return;

  itemsList.innerHTML = '';
  res.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size: 12px;">${item.id}</td>
      <td style="font-size: 13px;">${item.name}</td>
      <td style="font-size: 12px;">${getTypeName(item.type, item.slot)}</td>
      <td style="font-size: 12px;">${getRarityName(item.rarity)}</td>
      <td style="font-size: 12px;">${item.atk}</td>
      <td style="font-size: 12px;">${item.mag}</td>
      <td style="font-size: 12px;">${item.spirit}</td>
      <td style="font-size: 12px;">${item.def}</td>
      <td style="font-size: 12px;">${item.mdef}</td>
      <td style="font-size: 12px;">${item.dex}</td>
      <td>
        <button class="btn-small" onclick="editItem(${item.id})">编辑</button>
        <button class="btn-small" style="background: #c00;" onclick="deleteItem(${item.id})">删除</button>
      </td>
    `;
    itemsList.appendChild(tr);
  });

  const totalPages = Math.ceil(res.total / res.limit);
  itemsPaginationInfo.textContent = `第 ${page} 页，共 ${totalPages} 页，总计 ${res.total} 条`;
  itemsPageInput.value = page;
  itemsPageInput.max = totalPages;
}

async function loadMobs() {
  const res = await api('/admin/mobs', 'GET');
  if (!res.ok) return;

  mobsList = res.mobs;
  itemDropMobSelect.innerHTML = '<option value="">选择怪物</option>';
  mobsList.forEach(mob => {
    const option = document.createElement('option');
    option.value = mob.id;
    option.textContent = `${mob.name} (Lv.${mob.level})${mob.specialBoss ? ' [特殊]' : ''}${mob.worldBoss ? ' [世界]' : ''}`;
    itemDropMobSelect.appendChild(option);
  });
}

async function loadItemDrops(itemId) {
  const res = await api(`/admin/items/${itemId}`, 'GET');
  if (!res.ok) {
    console.error('Failed to load item drops:', res);
    return;
  }

  console.log('Item drops response:', res.drops);
  itemDropsCache = res.drops;
  renderItemDrops();
}

function renderItemDrops() {
  itemDropsList.innerHTML = '';
  console.log('Rendering drops, cache length:', itemDropsCache.length);
  if (itemDropsCache.length === 0) {
    itemDropsList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">暂无掉落配置</td></tr>';
    return;
  }

  itemDropsCache.forEach(drop => {
    const mob = mobsList.find(m => m.id === drop.mob_id);
    const mobName = mob ? mob.name : drop.mob_id;
    console.log('Drop:', drop, 'Mob:', mobName);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${mobName}</td>
      <td>${(drop.drop_chance * 100).toFixed(2)}%</td>
      <td>
        <button class="btn-small" style="background: #c00;" onclick="deleteItemDrop(${drop.id})">删除</button>
      </td>
    `;
    itemDropsList.appendChild(tr);
  });
}

function getTypeName(type, slot) {
  const typeNames = {
    weapon: '武器',
    armor: '防具',
    accessory: '饰品',
    consumable: '消耗品',
    book: '技能书',
    material: '材料',
    currency: '货币'
  };
  
  // 对于防具和饰品，根据 slot 显示更具体的类型
  if (type === 'armor' && slot) {
    const slotNames = {
      chest: '胸甲',
      head: '头盔',
      feet: '鞋子',
      waist: '腰带'
    };
    return slotNames[slot] || '防具';
  }
  
  if (type === 'accessory' && slot) {
    const slotNames = {
      neck: '项链',
      ring: '戒指',
      bracelet: '手镯'
    };
    return slotNames[slot] || '饰品';
  }
  
  return typeNames[type] || type;
}

function getRarityName(rarity) {
  const rarityNames = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
    supreme: '至尊',
    ultimate: '终极'
  };
  return rarityNames[rarity] || rarity;
}

async function loadItemTemplates() {
  const res = await api('/admin/items/templates', 'GET');
  if (!res.ok) return;

  itemTemplates = res.templates;
  importedItemIds = new Set(res.imported || []);

  renderImportItems();
}

function renderImportItems(keyword = '') {
  importItemsList.innerHTML = '';
  const filteredTemplates = keyword
    ? itemTemplates.filter(t =>
      t.name.toLowerCase().includes(keyword.toLowerCase()) ||
      t.item_id.toLowerCase().includes(keyword.toLowerCase())
    )
    : itemTemplates;

  filteredTemplates.forEach(template => {
    const isImported = importedItemIds.has(template.item_id);
    const tr = document.createElement('tr');

    const mainStats = [];
    if (template.atk > 0) mainStats.push(`攻击${template.atk}`);
    if (template.mag > 0) mainStats.push(`魔法${template.mag}`);
    if (template.spirit > 0) mainStats.push(`道术${template.spirit}`);
    if (template.def > 0) mainStats.push(`防御${template.def}`);
    if (template.mdef > 0) mainStats.push(`魔御${template.mdef}`);
    if (template.hp > 0) mainStats.push(`生命${template.hp}`);
    if (template.mp > 0) mainStats.push(`魔法值${template.mp}`);
    if (template.dex > 0) mainStats.push(`敏捷${template.dex}`);

    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="import-item-checkbox" data-id="${template.item_id}">
      </td>
      <td style="font-size: 13px;">${template.name}</td>
      <td style="font-size: 12px;">${getTypeName(template.type, template.slot)}</td>
      <td style="font-size: 12px;">${getRarityName(template.rarity)}</td>
      <td style="font-size: 12px;">${mainStats.join(', ') || '-'}</td>
      <td style="font-size: 12px;">${template.price || '-'}</td>
      <td style="font-size: 12px;">${isImported ? '<span style="color: #2196F3;">已导入（可更新）</span>' : '<span style="color: #4CAF50;">可导入</span>'}</td>
    `;
    importItemsList.appendChild(tr);
  });

  importItemsInfo.textContent = `共 ${filteredTemplates.length} 个装备模板，已导入 ${importedItemIds.size} 个`;
}

function openImportModal() {
  itemsImportModal.classList.remove('hidden');
  if (itemTemplates.length === 0) {
    loadItemTemplates();
  } else {
    renderImportItems();
  }
}

async function importSelectedItems() {
  console.log('=== importSelectedItems called ===');

  const checkboxes = document.querySelectorAll('.import-item-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.id);

  console.log('Selected IDs:', selectedIds);

  if (selectedIds.length === 0) {
    await customAlert('提示', '请选择要导入的装备');
    return;
  }

  const confirmed = await customConfirm('确认导入', `确定要导入 ${selectedIds.length} 个装备吗？`);
  if (!confirmed) return;

  console.log('Sending import request to /admin/items/import');
  const res = await api('/admin/items/import', 'POST', { itemIds: selectedIds });
  console.log('Import response:', res);

  if (!res.ok) {
    await customAlert('导入失败', res.error || '导入装备失败');
    return;
  }

  const { results } = res;

  // 计算总掉落数
  const totalDrops = results.success.reduce((sum, item) => sum + (item.dropsCount || 0), 0) +
                    results.updated.reduce((sum, item) => sum + (item.dropsCount || 0), 0);

  let message = `新增: ${results.success.length} 个\n更新: ${results.updated.length} 个\n失败: ${results.failed.length} 个`;
  if (totalDrops > 0) {
    message += `\n\n共处理 ${totalDrops} 条掉落配置`;
  }

  await customAlert('导入完成', message);

  // 更新已导入的装备ID集合
  results.success.forEach(item => {
    importedItemIds.add(item.itemId);
  });
  results.updated.forEach(item => {
    importedItemIds.add(item.itemId);
  });

  renderImportItems();
  loadItems(itemsCurrentPage, itemsCurrentKeyword);
}

async function exportAllItems() {
  try {
    const res = await fetch(adminPath('/admin/items/export'), {
      method: 'GET',
      headers: {
        Authorization: adminToken ? `Bearer ${adminToken}` : ''
      }
    });
    if (!res.ok) {
      let detail = '导出装备失败';
      try {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        detail = data?.error || detail;
      } catch {}
      await customAlert('导出失败', detail);
      return;
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
    const filename = match?.[1] || `items-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    await customAlert('导出失败', err.message || '导出装备失败');
  }
}

async function importAllItemsFromJsonFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    if (!items.length) {
      await customAlert('导入失败', '文件中未找到 items 列表。');
      return;
    }
    const confirmed = await customConfirm('确认导入', `将导入 ${items.length} 个装备（同 item_id 会更新），是否继续？`);
    if (!confirmed) return;

    const res = await api('/admin/items/import-all', 'POST', { items });
    if (!res?.ok) {
      await customAlert('导入失败', res?.error || '导入装备失败');
      return;
    }
    const r = res.result || {};
    const failedCount = Array.isArray(r.failed) ? r.failed.length : 0;
    await customAlert(
      '导入完成',
      `新增: ${r.created || 0}\n更新: ${r.updated || 0}\n掉落更新: ${r.dropsUpdated || 0}\n失败: ${failedCount}`
    );
    await loadItems(itemsCurrentPage, itemsCurrentKeyword);
  } catch (err) {
    await customAlert('导入失败', err.message || '读取JSON文件失败');
  } finally {
    if (itemsImportJsonFile) itemsImportJsonFile.value = '';
  }
}

function openItemEditModal(item = null) {
  // 确保怪物列表已加载
  if (mobsList.length === 0) {
    loadMobs();
  }

  if (item) {
    itemEditTitle.textContent = '编辑装备';
    document.getElementById('item-edit-id').value = item.id;
    document.getElementById('item-edit-item-id').value = item.item_id;
    document.getElementById('item-edit-name').value = item.name;

    // 设置 type select，根据 slot 来选择正确的 option
    const typeSelect = document.getElementById('item-edit-type');
    typeSelect.value = item.type;
    // 如果是 armor 或 accessory，根据 slot 找到匹配的 option
    if (item.type === 'armor' || item.type === 'accessory') {
      const options = typeSelect.querySelectorAll('option');
      for (const opt of options) {
        if (opt.value === item.type) {
          if (!opt.dataset.type || opt.dataset.type === item.slot) {
            typeSelect.value = opt.value;
            break;
          }
        }
      }
    }

    document.getElementById('item-edit-slot').value = item.slot || '';
    document.getElementById('item-edit-rarity').value = item.rarity;
    document.getElementById('item-edit-price').value = item.price;
    document.getElementById('item-edit-atk').value = item.atk;
    document.getElementById('item-edit-mag').value = item.mag;
    document.getElementById('item-edit-spirit').value = item.spirit;
    document.getElementById('item-edit-hp').value = item.hp;
    document.getElementById('item-edit-mp').value = item.mp;
    document.getElementById('item-edit-def').value = item.def;
    document.getElementById('item-edit-mdef').value = item.mdef;
    document.getElementById('item-edit-dex').value = item.dex;
    document.getElementById('item-edit-untradable').checked = item.untradable;
    document.getElementById('item-edit-unconsignable').checked = item.unconsignable;
    document.getElementById('item-edit-boss-only').checked = item.boss_only;
    document.getElementById('item-edit-world-boss-only').checked = item.world_boss_only;
    document.getElementById('item-edit-cross-world-boss-only').checked = item.cross_world_boss_only;
    itemsCurrentItemId = item.id;
    loadItemDrops(item.id);
  } else {
    itemEditTitle.textContent = '新增装备';
    document.getElementById('item-edit-id').value = '';
    document.getElementById('item-edit-item-id').value = '';
    document.getElementById('item-edit-name').value = '';
    document.getElementById('item-edit-type').value = 'weapon';
    document.getElementById('item-edit-slot').value = 'weapon';
    document.getElementById('item-edit-rarity').value = 'common';
    document.getElementById('item-edit-price').value = '0';
    document.getElementById('item-edit-atk').value = '0';
    document.getElementById('item-edit-mag').value = '0';
    document.getElementById('item-edit-spirit').value = '0';
    document.getElementById('item-edit-hp').value = '0';
    document.getElementById('item-edit-mp').value = '0';
    document.getElementById('item-edit-def').value = '0';
    document.getElementById('item-edit-mdef').value = '0';
    document.getElementById('item-edit-dex').value = '0';
    document.getElementById('item-edit-untradable').checked = false;
    document.getElementById('item-edit-unconsignable').checked = false;
    document.getElementById('item-edit-boss-only').checked = false;
    document.getElementById('item-edit-world-boss-only').checked = false;
    document.getElementById('item-edit-cross-world-boss-only').checked = false;
    itemsCurrentItemId = null;
    itemDropsCache = [];
    renderItemDrops();
  }

  itemEditModal.classList.remove('hidden');
}

window.editItem = async function(id) {
  const res = await api(`/admin/items/${id}`, 'GET');
  if (!res.ok) {
    await customAlert('错误', '获取装备信息失败');
    return;
  }
  openItemEditModal(res.item);
};

window.deleteItem = async function(id) {
  const confirmed = await customConfirm('确认删除', '确定要删除该装备吗？此操作不可恢复！');
  if (!confirmed) return;

  const res = await api(`/admin/items/${id}`, 'DELETE');
  if (!res.ok) {
    await customAlert('删除失败', res.error || '删除装备失败');
    return;
  }

  await customAlert('删除成功', '装备已删除');
  loadItems(itemsCurrentPage, itemsCurrentKeyword);
};

window.deleteItemDrop = async function(dropId) {
  const confirmed = await customConfirm('确认删除', '确定要删除该掉落配置吗？');
  if (!confirmed) return;

  const res = await api(`/admin/items/${itemsCurrentItemId}/drops/${dropId}`, 'DELETE');
  if (!res.ok) {
    await customAlert('删除失败', res.error || '删除掉落配置失败');
    return;
  }

  itemDropsCache = itemDropsCache.filter(d => d.id !== dropId);
  renderItemDrops();
};

// 中英文映射
const TYPE_CN_TO_EN = {
  '武器': 'weapon',
  '胸甲': 'armor',
  '头盔': 'armor',
  '鞋子': 'armor',
  '腰带': 'armor',
  '项链': 'accessory',
  '戒指': 'accessory',
  '手镯': 'accessory',
  '消耗品': 'consumable',
  '技能书': 'book',
  '材料': 'material'
};

const RARITY_CN_TO_EN = {
  '普通': 'common',
  '优秀': 'uncommon',
  '稀有': 'rare',
  '史诗': 'epic',
  '传说': 'legendary',
  '至尊': 'supreme',
  '终极': 'ultimate'
};

async function saveItem() {
  const itemId = document.getElementById('item-edit-item-id').value.trim();
  const name = document.getElementById('item-edit-name').value.trim();
  const typeSelect = document.getElementById('item-edit-type');
  const slotSelect = document.getElementById('item-edit-slot');
  const raritySelect = document.getElementById('item-edit-rarity');

  // 获取选中的 option
  const selectedTypeOption = typeSelect.options[typeSelect.selectedIndex];
  const type = selectedTypeOption.value;

  // 根据选中的 type 和 slot 自动确定正确的值
  let finalType = type;
  let finalSlot = slotSelect.value;

  // 如果是 armor 或 accessory，根据 data-type 或 slot 来设置
  if (type === 'armor' || type === 'accessory') {
    const dataType = selectedTypeOption.dataset.type;
    if (!finalSlot) {
      if (dataType) {
        finalSlot = dataType;
      } else {
        // 根据 option 的文本推断 slot
        const typeText = selectedTypeOption.textContent;
        if (typeText.includes('头盔')) finalSlot = 'head';
        else if (typeText.includes('鞋子')) finalSlot = 'feet';
        else if (typeText.includes('腰带')) finalSlot = 'waist';
        else if (typeText.includes('胸甲')) finalSlot = 'chest';
        else if (typeText.includes('项链')) finalSlot = 'neck';
        else if (typeText.includes('戒指')) finalSlot = 'ring';
        else if (typeText.includes('手镯')) finalSlot = 'bracelet';
      }
    }
  }

  // 中英文映射转换（兼容旧数据）
  if (TYPE_CN_TO_EN[finalType]) {
    finalType = TYPE_CN_TO_EN[finalType];
  }
  if (RARITY_CN_TO_EN[raritySelect.value]) {
    rarity = RARITY_CN_TO_EN[raritySelect.value];
  } else {
    rarity = raritySelect.value;
  }
  const price = parseInt(document.getElementById('item-edit-price').value) || 0;
  const atk = parseInt(document.getElementById('item-edit-atk').value) || 0;
  const mag = parseInt(document.getElementById('item-edit-mag').value) || 0;
  const spirit = parseInt(document.getElementById('item-edit-spirit').value) || 0;
  const hp = parseInt(document.getElementById('item-edit-hp').value) || 0;
  const mp = parseInt(document.getElementById('item-edit-mp').value) || 0;
  const def = parseInt(document.getElementById('item-edit-def').value) || 0;
  const mdef = parseInt(document.getElementById('item-edit-mdef').value) || 0;
  const dex = parseInt(document.getElementById('item-edit-dex').value) || 0;
  const untradable = document.getElementById('item-edit-untradable').checked;
  const unconsignable = document.getElementById('item-edit-unconsignable').checked;
  const boss_only = document.getElementById('item-edit-boss-only').checked;
  const world_boss_only = document.getElementById('item-edit-world-boss-only').checked;
  const cross_world_boss_only = document.getElementById('item-edit-cross-world-boss-only').checked;

  if (!itemId || !name) {
    await customAlert('错误', '装备ID和名称不能为空');
    return;
  }

  const data = {
    item_id: itemId,
    name,
    type: finalType,
    slot: finalSlot,
    rarity,
    atk,
    mag,
    spirit,
    hp,
    mp,
    def,
    mdef,
    dex,
    untradable,
    unconsignable,
    boss_only,
    world_boss_only,
    cross_world_boss_only
  };

  let res;
  if (itemsCurrentItemId) {
    res = await api(`/admin/items/${itemsCurrentItemId}`, 'PUT', data);
  } else {
    res = await api('/admin/items', 'POST', data);
  }

  if (!res.ok) {
    await customAlert('保存失败', res.error || '保存装备失败');
    return;
  }

  const newItem = res.item;
  itemsCurrentItemId = newItem.id;

  // 先关闭装备编辑模态框
  itemEditModal.classList.add('hidden');
  // 再显示成功提示
  await customAlert('保存成功', '装备已保存');
  loadItems(itemsCurrentPage, itemsCurrentKeyword);
}

async function addItemDrop() {
  const mobId = itemDropMobSelect.value;
  const chance = parseFloat(itemDropChance.value);

  if (!mobId) {
    await customAlert('错误', '请选择怪物');
    return;
  }

  if (isNaN(chance) || chance < 0 || chance > 1) {
    await customAlert('错误', '掉落概率必须在0-1之间');
    return;
  }

  const res = await api(`/admin/items/${itemsCurrentItemId}/drops`, 'POST', {
    mobId,
    dropChance: chance
  });

  if (!res.ok) {
    await customAlert('添加失败', res.error || '添加掉落配置失败');
    return;
  }

  itemDropsCache.push(res.drop);
  renderItemDrops();
  itemDropMobSelect.value = '';
  itemDropChance.value = '';
}

// 装备管理事件
if (itemsRefreshBtn) {
  itemsRefreshBtn.addEventListener('click', () => loadItems(itemsCurrentPage, itemsCurrentKeyword));
}

if (itemsSearchBtn) {
  itemsSearchBtn.addEventListener('click', () => loadItems(1, itemsSearchInput.value.trim()));
}

if (itemsSearchInput) {
  itemsSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadItems(1, itemsSearchInput.value.trim());
  });
}

if (itemsCreateBtn) {
  itemsCreateBtn.addEventListener('click', () => {
    if (mobsList.length === 0) loadMobs();
    openItemEditModal(null);
  });
}

if (itemsPrevPageBtn) {
  itemsPrevPageBtn.addEventListener('click', () => {
    if (itemsCurrentPage > 1) loadItems(itemsCurrentPage - 1, itemsCurrentKeyword);
  });
}

if (itemsNextPageBtn) {
  itemsNextPageBtn.addEventListener('click', () => {
    loadItems(itemsCurrentPage + 1, itemsCurrentKeyword);
  });
}

if (itemsPageInput) {
  itemsPageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(itemsPageInput.value);
      if (page >= 1) {
        loadItems(page, itemsCurrentKeyword);
      }
    }
  });
}

if (itemsGoPageBtn) {
  itemsGoPageBtn.addEventListener('click', () => {
    const page = parseInt(itemsPageInput.value);
    if (page >= 1) {
      loadItems(page, itemsCurrentKeyword);
    }
  });
}

if (itemEditCancelBtn) {
  itemEditCancelBtn.addEventListener('click', () => {
    itemEditModal.classList.add('hidden');
  });
}

if (itemEditSaveBtn) {
  itemEditSaveBtn.addEventListener('click', saveItem);
}

if (itemDropAddBtn) {
  itemDropAddBtn.addEventListener('click', addItemDrop);
}

// 装备类型变化时自动设置槽位
const itemTypeSelect = document.getElementById('item-edit-type');
if (itemTypeSelect) {
  itemTypeSelect.addEventListener('change', () => {
    const slotSelect = document.getElementById('item-edit-slot');
    const selectedOption = itemTypeSelect.options[itemTypeSelect.selectedIndex];
    const type = selectedOption.value;
    const dataType = selectedOption.dataset.type;

    // 材料、技能书、消耗品 → 槽位自动选择"无"
    if (type === 'book' || type === 'consumable' || type === 'material' || type === 'currency') {
      slotSelect.value = '';
    } else if (type === 'weapon') {
      // 武器 → 槽位为 weapon
      slotSelect.value = 'weapon';
    } else if (type === 'armor') {
      // 根据选项文本设置槽位
      const typeText = selectedOption.textContent;
      if (typeText.includes('头盔')) slotSelect.value = 'head';
      else if (typeText.includes('鞋子')) slotSelect.value = 'feet';
      else if (typeText.includes('腰带')) slotSelect.value = 'waist';
      else slotSelect.value = 'chest';
    } else if (type === 'accessory') {
      // 根据选项文本设置槽位
      const typeText = selectedOption.textContent;
      if (typeText.includes('项链')) slotSelect.value = 'neck';
      else if (typeText.includes('戒指')) slotSelect.value = 'ring';
      else if (typeText.includes('手镯')) slotSelect.value = 'bracelet';
    }
  });
}

// 导入装备事件
if (itemsImportBtn) {
  itemsImportBtn.addEventListener('click', openImportModal);
}

if (itemsExportBtn) {
  itemsExportBtn.addEventListener('click', exportAllItems);
}

if (itemsImportJsonBtn && itemsImportJsonFile) {
  itemsImportJsonBtn.addEventListener('click', () => itemsImportJsonFile.click());
  itemsImportJsonFile.addEventListener('change', async (e) => {
    const file = e.target?.files?.[0];
    await importAllItemsFromJsonFile(file);
  });
}

if (importItemsCancelBtn) {
  importItemsCancelBtn.addEventListener('click', () => {
    itemsImportModal.classList.add('hidden');
  });
}

if (importItemsConfirmBtn) {
  importItemsConfirmBtn.addEventListener('click', importSelectedItems);
}

if (importSelectAll) {
  importSelectAll.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.import-item-checkbox:not(:disabled)');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
  });
}

// ==================== 怪物/地图管理（热更新） ====================

const mobOverrideSearchInput = document.getElementById('mob-override-search');
const mobOverrideRefreshBtn = document.getElementById('mob-override-refresh');
const mobOverrideCreateBtn = document.getElementById('mob-override-create');
const mobOverridesList = document.getElementById('mob-overrides-list');
const mobOverrideMsg = document.getElementById('mob-override-msg');

const mobEditModal = document.getElementById('mob-edit-modal');
const mobEditTitle = document.getElementById('mob-edit-title');
const mobEditIdInput = document.getElementById('mob-edit-id');
const mobEditNameInput = document.getElementById('mob-edit-name');
const mobEditLevelInput = document.getElementById('mob-edit-level');
const mobEditHpInput = document.getElementById('mob-edit-hp');
const mobEditAtkInput = document.getElementById('mob-edit-atk');
const mobEditDefInput = document.getElementById('mob-edit-def');
const mobEditMdefInput = document.getElementById('mob-edit-mdef');
const mobEditExpInput = document.getElementById('mob-edit-exp');
const mobEditDexInput = document.getElementById('mob-edit-dex');
const mobEditRespawnInput = document.getElementById('mob-edit-respawn');
const mobEditGoldMinInput = document.getElementById('mob-edit-gold-min');
const mobEditGoldMaxInput = document.getElementById('mob-edit-gold-max');
const mobEditWorldBossInput = document.getElementById('mob-edit-worldboss');
const mobEditSpecialBossInput = document.getElementById('mob-edit-specialboss');
const mobEditSabakBossInput = document.getElementById('mob-edit-sabakboss');
const mobEditSummonedInput = document.getElementById('mob-edit-summoned');
const mobDropsList = document.getElementById('mob-drops-list');
const mobDropItemInput = document.getElementById('mob-drop-item-id');
const mobDropChanceInput = document.getElementById('mob-drop-chance');
const mobDropAddBtn = document.getElementById('mob-drop-add');
const mobEditCancelBtn = document.getElementById('mob-edit-cancel');
const mobEditSaveBtn = document.getElementById('mob-edit-save');

const worldZonesList = document.getElementById('world-zones-list');
const worldZonesRefreshBtn = document.getElementById('world-zones-refresh');
const worldZoneCreateBtn = document.getElementById('world-zone-create');
const worldZoneMsg = document.getElementById('world-zone-msg');
const worldZoneSelect = document.getElementById('world-zone-select');
const worldRoomsList = document.getElementById('world-rooms-list');
const worldRoomsRefreshBtn = document.getElementById('world-rooms-refresh');
const worldRoomCheckBtn = document.getElementById('world-room-check');
const worldRoomCreateBtn = document.getElementById('world-room-create');
const worldRoomMsg = document.getElementById('world-room-msg');

const worldZoneEditModal = document.getElementById('world-zone-edit-modal');
const worldZoneEditTitle = document.getElementById('world-zone-edit-title');
const worldZoneEditIdInput = document.getElementById('world-zone-edit-id');
const worldZoneEditNameInput = document.getElementById('world-zone-edit-name');
const worldZoneEditDescInput = document.getElementById('world-zone-edit-desc');
const worldZoneEditSafeInput = document.getElementById('world-zone-edit-safe');
const worldZoneEditLevelLimitInput = document.getElementById('world-zone-edit-level-limit');
const worldZoneEditCultivationOnlyInput = document.getElementById('world-zone-edit-cultivation-only');
const worldZoneEditCancelBtn = document.getElementById('world-zone-edit-cancel');
const worldZoneEditSaveBtn = document.getElementById('world-zone-edit-save');

const worldRoomEditModal = document.getElementById('world-room-edit-modal');
const worldRoomEditTitle = document.getElementById('world-room-edit-title');
const worldRoomEditZoneInput = document.getElementById('world-room-edit-zone');
const worldRoomEditIdInput = document.getElementById('world-room-edit-id');
const worldRoomEditNameInput = document.getElementById('world-room-edit-name');
const worldRoomEditDescInput = document.getElementById('world-room-edit-desc');
const worldRoomEditCultivationInput = document.getElementById('world-room-edit-cultivation');
const worldRoomEditTowerFloorInput = document.getElementById('world-room-edit-tower-floor');
const worldRoomEditPersonalTierInput = document.getElementById('world-room-edit-personal-tier');
const worldRoomEditNpcInput = document.getElementById('world-room-edit-npc-input');
const worldRoomEditNpcAddBtn = document.getElementById('world-room-edit-npc-add');
const worldRoomEditSabakInput = document.getElementById('world-room-edit-sabak');
const worldRoomEditPersonalOnlyInput = document.getElementById('world-room-edit-personal-only');
const worldRoomEditCrossRealmInput = document.getElementById('world-room-edit-cross-realm');
const worldRoomSpawnsList = document.getElementById('world-room-spawns-list');
const worldRoomSpawnInput = document.getElementById('world-room-spawn-input');
const worldRoomSpawnAddBtn = document.getElementById('world-room-spawn-add');
const worldRoomExitsList = document.getElementById('world-room-exits-list');
const worldRoomExitDirInput = document.getElementById('world-room-exit-dir');
const worldRoomExitZoneSelect = document.getElementById('world-room-exit-zone');
const worldRoomExitRoomSelect = document.getElementById('world-room-exit-room');
const worldRoomExitTargetInput = document.getElementById('world-room-exit-target');
const worldRoomExitAddBtn = document.getElementById('world-room-exit-add');
const worldRoomNpcsList = document.getElementById('world-room-npcs-list');
const worldRoomEditCancelBtn = document.getElementById('world-room-edit-cancel');
const worldRoomEditSaveBtn = document.getElementById('world-room-edit-save');

const DEFAULT_MOB_TEMPLATE = {
  name: '新怪物',
  level: 1,
  hp: 100,
  atk: 10,
  def: 5,
  mdef: 0,
  exp: 10,
  gold: [0, 0],
  drops: []
};

const DEFAULT_ZONE_TEMPLATE = {
  name: '新区域',
  desc: '',
  rooms: {}
};

const DEFAULT_ROOM_TEMPLATE = {
  name: '新房间',
  desc: '',
  exits: {},
  spawns: []
};

let mobOverridesCache = [];
let mobBaseCache = [];
let mobItemOptionsCache = [];
let worldZonesCache = [];
let worldZoneOverridesCache = new Map();
let worldRoomsCache = [];
const worldRoomOverrideStatus = new Map();
let mobDropsCache = [];
let worldRoomSpawnsCache = [];
let worldRoomExitsCache = [];
let worldRoomNpcsCache = [];
let worldAllRoomsCache = [];

function formatAdminTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

const dashboardNumberFormatter = new Intl.NumberFormat('zh-CN');

function formatNumber(value) {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return dashboardNumberFormatter.format(num);
}

function formatBytes(bytes) {
  const num = Number(bytes);
  if (!Number.isFinite(num)) return '-';
  if (num < 1024) return `${num} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = num / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDuration(seconds) {
  const num = Number(seconds);
  if (!Number.isFinite(num)) return '-';
  const total = Math.max(0, Math.floor(num));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const parts = [];
  if (days) parts.push(`${days}天`);
  if (hours || days) parts.push(`${hours}小时`);
  if (mins || hours || days) parts.push(`${mins}分`);
  parts.push(`${secs}秒`);
  return parts.join(' ');
}

function renderStatList(target, items) {
  if (!target) return;
  target.innerHTML = items.map(({ label, value }) => {
    return `<div class="stat-item"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`;
  }).join('');
}

function renderRecentLogins(target, items) {
  if (!target) return;
  if (!Array.isArray(items) || items.length === 0) {
    target.innerHTML = '<div class="dashboard-list-item"><span>暂无最近登录记录</span></div>';
    return;
  }
  target.innerHTML = items.map((row) => {
    const name = String(row.username || '未知用户');
    const lastSeen = formatAdminTime(row.lastSeen || row.last_seen);
    return `<div class="dashboard-list-item"><span>${name}</span><span class="dashboard-list-meta">${lastSeen}</span></div>`;
  }).join('');
}


function formatIdWithName(name, id) {
  const safeName = String(name || '').trim();
  const safeId = String(id || '').trim();
  if (!safeName) return safeId || '-';
  return `${safeName}<div class="muted" style="font-size: 11px;">${safeId}</div>`;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return num;
}

function getMobNameById(mobId) {
  const found = Array.isArray(mobsList) ? mobsList.find((mob) => String(mob.id) === String(mobId)) : null;
  return found?.name || mobId;
}

function renderWorldRoomSpawnOptions() {
  if (!worldRoomSpawnInput) return;
  worldRoomSpawnInput.innerHTML = '<option value="">选择怪物</option>';
  const list = Array.isArray(mobsList) ? mobsList : [];
  list.forEach((mob) => {
    const option = document.createElement('option');
    option.value = mob.id;
    option.textContent = `${mob.name} (${mob.id})`;
    worldRoomSpawnInput.appendChild(option);
  });
}

function syncPersonalBossToggle() {
  if (!worldRoomEditPersonalOnlyInput) return;
  const tier = String(worldRoomEditPersonalTierInput?.value || '').trim();
  if (tier) {
    worldRoomEditPersonalOnlyInput.checked = true;
    worldRoomEditPersonalOnlyInput.disabled = true;
  } else {
    worldRoomEditPersonalOnlyInput.disabled = false;
  }
}

function getWorldZoneById(zoneId) {
  return Array.isArray(worldAllRoomsCache)
    ? worldAllRoomsCache.find((z) => String(z.id) === String(zoneId))
    : null;
}

function getWorldRoomById(zoneId, roomId) {
  const zone = getWorldZoneById(zoneId);
  if (!zone || !Array.isArray(zone.rooms)) return null;
  return zone.rooms.find((r) => String(r.id) === String(roomId));
}

async function loadWorldAllRooms() {
  if (worldAllRoomsCache.length) return;
  try {
    const res = await api('/admin/world/all-rooms', 'GET');
    worldAllRoomsCache = Array.isArray(res.zones) ? res.zones : [];
  } catch {
    worldAllRoomsCache = [];
  }
}

function renderWorldExitZoneOptions() {
  if (!worldRoomExitZoneSelect) return;
  worldRoomExitZoneSelect.innerHTML = '<option value="">目标区域</option>';
  const zones = Array.isArray(worldAllRoomsCache) ? worldAllRoomsCache : [];
  zones.forEach((zone) => {
    const option = document.createElement('option');
    option.value = zone.id;
    option.textContent = `${zone.name || zone.id} (${zone.id})`;
    worldRoomExitZoneSelect.appendChild(option);
  });
}

function renderWorldExitRoomOptions(zoneId) {
  if (!worldRoomExitRoomSelect) return;
  worldRoomExitRoomSelect.innerHTML = '<option value="">目标房间</option>';
  const zone = getWorldZoneById(zoneId);
  if (!zone || !Array.isArray(zone.rooms)) return;
  zone.rooms.forEach((room) => {
    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = `${room.name || room.id} (${room.id})`;
    worldRoomExitRoomSelect.appendChild(option);
  });
}

function parseExitTarget(target, fallbackZoneId = '') {
  const text = String(target || '').trim();
  if (!text) return { zoneId: fallbackZoneId, roomId: '' };
  if (text.includes(':')) {
    const [zoneId, roomId] = text.split(':');
    return { zoneId: zoneId || fallbackZoneId, roomId: roomId || '' };
  }
  return { zoneId: fallbackZoneId, roomId: text };
}

function getMobDisplayValue(mobId, override) {
  const base = mobsList.find(m => m.id === mobId);
  const data = override?.data || {};
  const name = data.name || base?.name || '-';
  const level = data.level ?? base?.level ?? '-';
  const exp = data.exp ?? base?.exp ?? '-';
  const gold = data.gold ?? base?.gold;
  const goldText = Array.isArray(gold) ? `${gold[0]}-${gold[1]}` : '-';
  return { name, level, exp, goldText, fields: Object.keys(data).length };
}

function renderMobOverrides() {
  if (!mobOverridesList) return;
  mobOverridesList.innerHTML = '';
  const keyword = String(mobOverrideSearchInput?.value || '').trim().toLowerCase();
  const overrideMap = new Map(mobOverridesCache.map((item) => [item.templateId, item]));
  const merged = mobBaseCache.length
    ? mobBaseCache.map((mob) => ({
        templateId: mob.id,
        base: mob,
        override: overrideMap.get(mob.id) || null
      }))
    : Array.from(overrideMap.values()).map((item) => ({
        templateId: item.templateId,
        base: null,
        override: item
      }));

  const list = merged.filter((entry) => {
    if (!keyword) return true;
    const id = String(entry.templateId || '').toLowerCase();
    const display = getMobDisplayValue(entry.templateId, entry.override || {});
    const name = String(display.name || '').toLowerCase();
    return id.includes(keyword) || name.includes(keyword);
  });

  if (list.length === 0) {
    mobOverridesList.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">暂无覆盖配置</td></tr>';
    return;
  }

  list.forEach((entry) => {
    const override = entry.override;
    const { name, level, exp, goldText, fields } = getMobDisplayValue(entry.templateId, override || {});
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size: 12px;">${entry.templateId}</td>
      <td style="font-size: 13px;">${name}</td>
      <td style="font-size: 12px;">${level}</td>
      <td style="font-size: 12px;">${exp}</td>
      <td style="font-size: 12px;">${goldText}</td>
      <td style="font-size: 12px;">${override ? fields : 0}</td>
      <td style="font-size: 12px;">${override ? formatAdminTime(override.updatedAt) : '-'}</td>
      <td>
        <button class="btn-small" onclick="editMobOverride('${entry.templateId}')">编辑</button>
        <button class="btn-small" style="background: #c00;" onclick="deleteMobOverride('${entry.templateId}')">删除覆盖</button>
      </td>
    `;
    mobOverridesList.appendChild(tr);
  });
}

async function loadMobOverrides() {
  if (!mobOverridesList) return;
  mobOverrideMsg.textContent = '';
  try {
    const [mobRes, overrideRes] = await Promise.all([
      api('/admin/mobs', 'GET'),
      api('/admin/mobs/overrides', 'GET')
    ]);
    mobsList = Array.isArray(mobRes.mobs) ? mobRes.mobs : [];
    mobBaseCache = mobsList.slice();
    mobOverridesCache = Array.isArray(overrideRes.overrides) ? overrideRes.overrides : [];
    renderMobOverrides();
  } catch (err) {
    mobOverrideMsg.textContent = `加载失败: ${err.message}`;
    mobOverrideMsg.style.color = 'red';
  }
}

async function openMobOverrideModal(templateId, allowEditId = false) {
  if (!mobEditModal) return;
  const id = String(templateId || '').trim();
  if (!id) return;
  const res = await api(`/admin/mobs/${encodeURIComponent(id)}`, 'GET');
  const base = res.template || null;
  const override = res.override || null;
  mobItemOptionsCache = Array.isArray(res.itemOptions) ? res.itemOptions : [];
  const effective = {
    ...(base || {}),
    ...(override || {})
  };
  const editable = Object.keys(effective).length ? effective : DEFAULT_MOB_TEMPLATE;
  mobEditTitle.textContent = override ? '编辑怪物覆盖' : '新增怪物覆盖';
  mobEditIdInput.value = id;
  mobEditIdInput.disabled = !allowEditId;
  mobEditNameInput.value = editable.name || '';
  mobEditLevelInput.value = editable.level ?? '';
  mobEditHpInput.value = editable.hp ?? '';
  mobEditAtkInput.value = editable.atk ?? '';
  mobEditDefInput.value = editable.def ?? '';
  mobEditMdefInput.value = editable.mdef ?? '';
  mobEditExpInput.value = editable.exp ?? '';
  mobEditDexInput.value = editable.dex ?? '';
  mobEditRespawnInput.value = editable.respawnMs ?? '';
  if (Array.isArray(editable.gold)) {
    mobEditGoldMinInput.value = editable.gold[0] ?? '';
    mobEditGoldMaxInput.value = editable.gold[1] ?? '';
  } else {
    mobEditGoldMinInput.value = '';
    mobEditGoldMaxInput.value = '';
  }
  mobEditWorldBossInput.checked = Boolean(editable.worldBoss);
  mobEditSpecialBossInput.checked = Boolean(editable.specialBoss);
  mobEditSabakBossInput.checked = Boolean(editable.sabakBoss);
  mobEditSummonedInput.checked = Boolean(editable.summoned);
  mobDropsCache = Array.isArray(editable.drops) ? editable.drops.map(drop => ({ id: drop.id, chance: drop.chance })) : [];
  renderMobDropOptions();
  renderMobDrops();
  mobEditModal.classList.remove('hidden');
}

function renderMobDropOptions() {
  if (!mobDropItemInput) return;
  const options = Array.isArray(mobItemOptionsCache) ? mobItemOptionsCache : [];
  mobDropItemInput.innerHTML = '<option value="">选择物品</option>';
  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt.id;
    option.textContent = opt.name ? `${opt.name} (${opt.id})` : opt.id;
    mobDropItemInput.appendChild(option);
  });
}

function renderMobDrops() {
  if (!mobDropsList) return;
  mobDropsList.innerHTML = '';
  if (!mobDropsCache.length) {
    mobDropsList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">暂无掉落配置</td></tr>';
    return;
  }
  mobDropsCache.forEach((drop, index) => {
    const tr = document.createElement('tr');
    const display = Array.isArray(mobItemOptionsCache)
      ? mobItemOptionsCache.find((opt) => String(opt.id) === String(drop.id))
      : null;
    const nameLabel = display?.name ? `${display.name} (${drop.id})` : drop.id;
    tr.innerHTML = `
      <td>${nameLabel}</td>
      <td>${Number(drop.chance).toFixed(4)}</td>
      <td><button class="btn-small" style="background: #c00;" onclick="removeMobDrop(${index})">删除</button></td>
    `;
    mobDropsList.appendChild(tr);
  });
}

function removeMobDrop(index) {
  mobDropsCache.splice(index, 1);
  renderMobDrops();
}

function addMobDrop() {
  const itemId = String(mobDropItemInput?.value || '').trim();
  const chance = Number(mobDropChanceInput?.value || 0);
  if (!itemId) {
    customAlert('错误', '道具ID不能为空');
    return;
  }
  if (Number.isNaN(chance) || chance < 0 || chance > 1) {
    customAlert('错误', '概率必须在0-1之间');
    return;
  }
  mobDropsCache.push({ id: itemId, chance });
  mobDropItemInput.value = '';
  mobDropChanceInput.value = '';
  renderMobDrops();
}

async function saveMobOverride() {
  const templateId = String(mobEditIdInput?.value || '').trim();
  if (!templateId) {
    await customAlert('错误', '怪物ID不能为空');
    return;
  }
  const name = String(mobEditNameInput?.value || '').trim();
  const level = toNumber(mobEditLevelInput?.value, 0);
  const hp = toNumber(mobEditHpInput?.value, 0);
  const goldMin = toNumber(mobEditGoldMinInput?.value, 0);
  const goldMax = toNumber(mobEditGoldMaxInput?.value, goldMin);

  if (!name) {
    await customAlert('错误', '怪物名称不能为空');
    return;
  }
  if (level <= 0 || hp <= 0) {
    await customAlert('错误', '等级与生命必须大于0');
    return;
  }
  const payload = {
    name,
    level,
    hp,
    atk: toNumber(mobEditAtkInput?.value, 0),
    def: toNumber(mobEditDefInput?.value, 0),
    mdef: toNumber(mobEditMdefInput?.value, 0),
    exp: toNumber(mobEditExpInput?.value, 0),
    dex: toNumber(mobEditDexInput?.value, 0),
    respawnMs: toNumber(mobEditRespawnInput?.value, 0),
    worldBoss: mobEditWorldBossInput?.checked || false,
    specialBoss: mobEditSpecialBossInput?.checked || false,
    sabakBoss: mobEditSabakBossInput?.checked || false,
    summoned: mobEditSummonedInput?.checked || false,
    gold: [Math.max(0, Math.floor(goldMin)), Math.max(Math.floor(goldMin), Math.floor(goldMax))],
    drops: mobDropsCache.map(drop => ({ id: drop.id, chance: drop.chance }))
  };

  const res = await api('/admin/mobs', 'POST', { templateId, data: payload });
  if (!res.ok) {
    await customAlert('保存失败', res.error || '保存怪物失败');
    return;
  }
  mobEditModal.classList.add('hidden');
  await loadMobOverrides();
  await loadMobs();
  await customAlert('保存成功', '怪物覆盖已保存并热更新。');
}

async function deleteMobOverride(templateId) {
  const confirmed = await customConfirm('确认删除', `确定要删除怪物 ${templateId} 的覆盖配置吗？`);
  if (!confirmed) return;
  const res = await api(`/admin/mobs/${encodeURIComponent(templateId)}`, 'DELETE');
  if (!res.ok) {
    await customAlert('删除失败', res.error || '删除怪物覆盖失败');
    return;
  }
  await loadMobOverrides();
  await loadMobs();
  await customAlert('删除成功', '怪物覆盖已删除，已恢复默认。');
}

function mergeZoneList(zones, overrides) {
  const map = new Map();
  zones.forEach(zone => {
    map.set(zone.id, { ...zone });
  });
  overrides.forEach((item) => {
    if (!map.has(item.zoneId)) {
      map.set(item.zoneId, { id: item.zoneId, name: item.data?.name || item.zoneId, roomCount: 0 });
    }
  });
  return Array.from(map.values()).sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function renderWorldZones() {
  if (!worldZonesList) return;
  worldZonesList.innerHTML = '';
  const overrides = Array.from(worldZoneOverridesCache.values());
  const merged = mergeZoneList(worldZonesCache, overrides);

  if (merged.length === 0) {
    worldZonesList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">暂无区域数据</td></tr>';
    return;
  }

  merged.forEach(zone => {
    const override = worldZoneOverridesCache.get(zone.id) || null;
    const name = override?.data?.name || zone.name || zone.id;
    const roomCount = zone.roomCount ?? (override?.data?.rooms ? Object.keys(override.data.rooms).length : 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size: 12px;">${formatIdWithName(name, zone.id)}</td>
      <td style="font-size: 13px;">${name}</td>
      <td style="font-size: 12px;">${roomCount}</td>
      <td style="font-size: 12px;">${override ? '是' : '否'}</td>
      <td style="font-size: 12px;">${override ? formatAdminTime(override.updatedAt) : '-'}</td>
      <td>
        <button class="btn-small" onclick="editWorldZoneOverride('${zone.id}')">编辑</button>
        <button class="btn-small" style="background: #c00;" onclick="deleteWorldZoneOverride('${zone.id}')">删除覆盖</button>
      </td>
    `;
    worldZonesList.appendChild(tr);
  });
}

function updateWorldZoneSelect() {
  if (!worldZoneSelect) return;
  const current = worldZoneSelect.value;
  const overrides = Array.from(worldZoneOverridesCache.values());
  const merged = mergeZoneList(worldZonesCache, overrides);
  worldZoneSelect.innerHTML = '';
  merged.forEach(zone => {
    const option = document.createElement('option');
    option.value = zone.id;
    option.textContent = `${zone.id} ${zone.name ? `- ${zone.name}` : ''}`.trim();
    worldZoneSelect.appendChild(option);
  });
  if (current && merged.some(z => z.id === current)) {
    worldZoneSelect.value = current;
  }
}

async function loadWorldZones() {
  if (!worldZonesList) return;
  worldZoneMsg.textContent = '';
  try {
    const res = await api('/admin/world/zones', 'GET');
    worldZonesCache = Array.isArray(res.zones) ? res.zones : [];
    worldZoneOverridesCache = new Map(
      (Array.isArray(res.overrides) ? res.overrides : []).map(item => [item.zoneId, item])
    );
    renderWorldZones();
    updateWorldZoneSelect();
  } catch (err) {
    worldZoneMsg.textContent = `加载失败: ${err.message}`;
    worldZoneMsg.style.color = 'red';
  }
}

async function openWorldZoneOverrideModal(zoneId, allowEditId = false) {
  if (!worldZoneEditModal) return;
  const id = String(zoneId || '').trim();
  if (!id) return;
  const res = await api(`/admin/world/zones/${encodeURIComponent(id)}`, 'GET');
  const base = res.zone || null;
  const override = res.override || null;
  const effective = {
    ...(base || {}),
    ...(override || {})
  };
  const editable = Object.keys(effective).length ? effective : DEFAULT_ZONE_TEMPLATE;
  worldZoneEditTitle.textContent = override ? '编辑区域覆盖' : '新增区域覆盖';
  worldZoneEditIdInput.value = id;
  worldZoneEditIdInput.disabled = !allowEditId;
  worldZoneEditNameInput.value = editable.name || '';
  worldZoneEditDescInput.value = editable.desc || '';
  worldZoneEditSafeInput.checked = Boolean(editable.safe);
  worldZoneEditLevelLimitInput.value = editable.levelLimit ?? '';
  worldZoneEditCultivationOnlyInput.checked = Boolean(editable.cultivationOnly);
  worldZoneEditModal.classList.remove('hidden');
}

async function saveWorldZoneOverride() {
  const zoneId = String(worldZoneEditIdInput?.value || '').trim();
  if (!zoneId) {
    await customAlert('错误', '区域ID不能为空');
    return;
  }
  const payload = {
    name: String(worldZoneEditNameInput?.value || '').trim(),
    desc: String(worldZoneEditDescInput?.value || '').trim(),
    safe: Boolean(worldZoneEditSafeInput?.checked),
    cultivationOnly: Boolean(worldZoneEditCultivationOnlyInput?.checked)
  };
  const levelLimitRaw = String(worldZoneEditLevelLimitInput?.value ?? '').trim();
  if (levelLimitRaw !== '') {
    payload.levelLimit = toNumber(levelLimitRaw, 0);
  }
  if (!payload.name) {
    await customAlert('错误', '区域名称不能为空');
    return;
  }
  const res = await api('/admin/world/zones', 'POST', { zoneId, data: payload });
  if (!res.ok) {
    await customAlert('保存失败', res.error || '保存区域失败');
    return;
  }
  worldZoneEditModal.classList.add('hidden');
  await loadWorldZones();
  await customAlert('保存成功', '区域覆盖已保存并热更新。');
}

async function deleteWorldZoneOverride(zoneId) {
  const confirmed = await customConfirm('确认删除', `确定要删除区域 ${zoneId} 的覆盖配置吗？`);
  if (!confirmed) return;
  const res = await api(`/admin/world/zones/${encodeURIComponent(zoneId)}`, 'DELETE');
  if (!res.ok) {
    await customAlert('删除失败', res.error || '删除区域覆盖失败');
    return;
  }
  await loadWorldZones();
  await customAlert('删除成功', '区域覆盖已删除，已恢复默认。');
}

function worldRoomKey(zoneId, roomId) {
  return `${zoneId}::${roomId}`;
}

function renderWorldRooms() {
  if (!worldRoomsList) return;
  worldRoomsList.innerHTML = '';
  if (!worldRoomsCache.length) {
    worldRoomsList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">暂无房间数据</td></tr>';
    return;
  }
  const zoneId = String(worldZoneSelect?.value || '').trim();
  worldRoomsCache.forEach(room => {
    const key = worldRoomKey(zoneId, room.id);
    const overrideStatus = worldRoomOverrideStatus.get(key);
    const overrideText = overrideStatus === true ? '是' : overrideStatus === false ? '否' : '未知';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size: 12px;">${formatIdWithName(room.name, room.id)}</td>
      <td style="font-size: 13px;">${room.name}</td>
      <td style="font-size: 12px;">${room.hasSpawns ? '有' : '无'}</td>
      <td style="font-size: 12px;">${overrideText}</td>
      <td>
        <button class="btn-small" onclick="editWorldRoomOverride('${zoneId}', '${room.id}')">编辑</button>
        <button class="btn-small" style="background: #c00;" onclick="deleteWorldRoomOverride('${zoneId}', '${room.id}')">删除覆盖</button>
      </td>
    `;
    worldRoomsList.appendChild(tr);
  });
}

async function loadWorldRooms() {
  if (!worldRoomsList || !worldZoneSelect) return;
  const zoneId = String(worldZoneSelect.value || '').trim();
  if (!zoneId) {
    worldRoomMsg.textContent = '请先选择区域';
    worldRoomMsg.style.color = 'red';
    return;
  }
  worldRoomMsg.textContent = '';
  try {
    const res = await api(`/admin/world/rooms?zoneId=${encodeURIComponent(zoneId)}`, 'GET');
    worldRoomsCache = Array.isArray(res.rooms) ? res.rooms : [];
    renderWorldRooms();
  } catch (err) {
    worldRoomMsg.textContent = `加载失败: ${err.message}`;
    worldRoomMsg.style.color = 'red';
  }
}

async function refreshWorldRoomOverrideStatus() {
  if (!worldRoomsCache.length || !worldZoneSelect) return;
  const zoneId = String(worldZoneSelect.value || '').trim();
  if (!zoneId) return;
  worldRoomMsg.textContent = '正在刷新覆盖状态...';
  worldRoomMsg.style.color = '#8d3f12';
  for (const room of worldRoomsCache) {
    try {
      const res = await api(`/admin/world/rooms/${encodeURIComponent(zoneId)}/${encodeURIComponent(room.id)}`, 'GET');
      const hasOverride = res.override && Object.keys(res.override).length > 0;
      worldRoomOverrideStatus.set(worldRoomKey(zoneId, room.id), Boolean(hasOverride));
    } catch (err) {
      worldRoomOverrideStatus.set(worldRoomKey(zoneId, room.id), undefined);
    }
  }
  renderWorldRooms();
  worldRoomMsg.textContent = '覆盖状态已更新';
  worldRoomMsg.style.color = 'green';
}

async function openWorldRoomOverrideModal(zoneId, roomId, allowEditId = false) {
  if (!worldRoomEditModal) return;
  const zid = String(zoneId || '').trim();
  const rid = String(roomId || '').trim();
  if (!zid || !rid) return;
  if (mobsList.length === 0) {
    try {
      await loadMobs();
    } catch {
      // ignore
    }
  }
  await loadWorldAllRooms();
  const res = await api(`/admin/world/rooms/${encodeURIComponent(zid)}/${encodeURIComponent(rid)}`, 'GET');
  const base = res.room || null;
  const override = res.override || null;
  const effective = {
    ...(base || {}),
    ...(override || {})
  };
  const editable = Object.keys(effective).length ? effective : DEFAULT_ROOM_TEMPLATE;
  worldRoomEditTitle.textContent = override ? '编辑房间覆盖' : '新增房间覆盖';
  worldRoomEditZoneInput.value = zid;
  worldRoomEditIdInput.value = rid;
  worldRoomEditIdInput.disabled = !allowEditId;
  worldRoomEditNameInput.value = editable.name || '';
  worldRoomEditDescInput.value = editable.desc || '';
  worldRoomEditCultivationInput.value = editable.minCultivationLevel ?? '';
  worldRoomEditTowerFloorInput.value = editable.towerFloor ?? '';
  worldRoomEditPersonalTierInput.value = editable.personalBossTier || '';
  worldRoomEditSabakInput.checked = Boolean(editable.sabakOnly);
  worldRoomEditPersonalOnlyInput.checked = Boolean(editable.personalBossOnly);
  worldRoomEditCrossRealmInput.checked = Boolean(editable.crossRealmOnly);
  worldRoomSpawnsCache = Array.isArray(editable.spawns) ? editable.spawns.map(item => String(item)) : [];
  worldRoomNpcsCache = Array.isArray(editable.npcs) ? editable.npcs.map(item => String(item)) : [];
  worldRoomExitsCache = editable.exits && typeof editable.exits === 'object' ? Object.entries(editable.exits) : [];
  syncPersonalBossToggle();
  renderWorldRoomSpawnOptions();
  renderWorldExitZoneOptions();
  if (worldRoomExitZoneSelect) {
    worldRoomExitZoneSelect.value = zid;
    renderWorldExitRoomOptions(zid);
  }
  renderWorldRoomSpawns();
  renderWorldRoomExits();
  renderWorldRoomNpcs();
  worldRoomEditModal.classList.remove('hidden');
}

function renderWorldRoomSpawns() {
  if (!worldRoomSpawnsList) return;
  worldRoomSpawnsList.innerHTML = '';
  if (!worldRoomSpawnsCache.length) {
    worldRoomSpawnsList.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #999;">暂无怪物</td></tr>';
    return;
  }
  worldRoomSpawnsCache.forEach((spawn, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${getMobNameById(spawn)}<div class="muted" style="font-size: 11px;">${spawn}</div></td>
      <td><button class="btn-small" style="background: #c00;" onclick="removeWorldRoomSpawn(${index})">删除</button></td>
    `;
    worldRoomSpawnsList.appendChild(tr);
  });
}

function addWorldRoomSpawn() {
  const spawnId = String(worldRoomSpawnInput?.value || '').trim();
  if (!spawnId) {
    customAlert('错误', '请选择怪物');
    return;
  }
  worldRoomSpawnsCache.push(spawnId);
  worldRoomSpawnInput.value = '';
  renderWorldRoomSpawns();
}

function removeWorldRoomSpawn(index) {
  worldRoomSpawnsCache.splice(index, 1);
  renderWorldRoomSpawns();
}

function renderWorldRoomExits() {
  if (!worldRoomExitsList) return;
  worldRoomExitsList.innerHTML = '';
  if (!worldRoomExitsCache.length) {
    worldRoomExitsList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">暂无出口</td></tr>';
    return;
  }
  worldRoomExitsCache.forEach(([dir, target], index) => {
    const tr = document.createElement('tr');
    const parsed = parseExitTarget(target, String(worldRoomEditZoneInput?.value || '').trim());
    const zone = getWorldZoneById(parsed.zoneId);
    const room = getWorldRoomById(parsed.zoneId, parsed.roomId);
    const zoneName = zone?.name || parsed.zoneId || '';
    const roomName = room?.name || parsed.roomId || '';
    const display = zoneName || roomName
      ? `${zoneName}${roomName ? ` / ${roomName}` : ''}<div class="muted" style="font-size: 11px;">${target}</div>`
      : target;
    tr.innerHTML = `
      <td>${dir}</td>
      <td>${display}</td>
      <td><button class="btn-small" style="background: #c00;" onclick="removeWorldRoomExit(${index})">删除</button></td>
    `;
    worldRoomExitsList.appendChild(tr);
  });
}

function addWorldRoomExit() {
  const dir = String(worldRoomExitDirInput?.value || '').trim();
  const customTarget = String(worldRoomExitTargetInput?.value || '').trim();
  const zoneId = String(worldRoomExitZoneSelect?.value || '').trim();
  const roomId = String(worldRoomExitRoomSelect?.value || '').trim();
  const target = customTarget || (zoneId && roomId ? `${zoneId}:${roomId}` : '');
  if (!dir || !target) {
    customAlert('错误', '方向与目标不能为空');
    return;
  }
  worldRoomExitsCache.push([dir, target]);
  worldRoomExitDirInput.value = '';
  if (worldRoomExitZoneSelect) worldRoomExitZoneSelect.value = '';
  if (worldRoomExitRoomSelect) worldRoomExitRoomSelect.innerHTML = '<option value="">目标房间</option>';
  worldRoomExitTargetInput.value = '';
  renderWorldRoomExits();
}

function removeWorldRoomExit(index) {
  worldRoomExitsCache.splice(index, 1);
  renderWorldRoomExits();
}

function renderWorldRoomNpcs() {
  if (!worldRoomNpcsList) return;
  worldRoomNpcsList.innerHTML = '';
  if (!worldRoomNpcsCache.length) {
    worldRoomNpcsList.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #999;">暂无NPC</td></tr>';
    return;
  }
  worldRoomNpcsCache.forEach((npc, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${npc}</td>
      <td><button class="btn-small" style="background: #c00;" onclick="removeWorldRoomNpc(${index})">删除</button></td>
    `;
    worldRoomNpcsList.appendChild(tr);
  });
}

function addWorldRoomNpc() {
  const npcId = String(worldRoomEditNpcInput?.value || '').trim();
  if (!npcId) {
    customAlert('错误', 'NPC ID不能为空');
    return;
  }
  worldRoomNpcsCache.push(npcId);
  worldRoomEditNpcInput.value = '';
  renderWorldRoomNpcs();
}

function removeWorldRoomNpc(index) {
  worldRoomNpcsCache.splice(index, 1);
  renderWorldRoomNpcs();
}

async function saveWorldRoomOverride() {
  const zoneId = String(worldRoomEditZoneInput?.value || '').trim();
  const roomId = String(worldRoomEditIdInput?.value || '').trim();
  if (!zoneId || !roomId) {
    await customAlert('错误', '区域ID与房间ID不能为空');
    return;
  }
  const name = String(worldRoomEditNameInput?.value || '').trim();
  if (!name) {
    await customAlert('错误', '房间名称不能为空');
    return;
  }
  const exits = {};
  worldRoomExitsCache.forEach(([dir, target]) => {
    if (!dir || !target) return;
    exits[dir] = target;
  });
  const payload = {
    name,
    desc: String(worldRoomEditDescInput?.value || '').trim(),
    personalBossTier: String(worldRoomEditPersonalTierInput?.value || '').trim(),
    sabakOnly: Boolean(worldRoomEditSabakInput?.checked),
    personalBossOnly: Boolean(worldRoomEditPersonalOnlyInput?.checked),
    crossRealmOnly: Boolean(worldRoomEditCrossRealmInput?.checked),
    spawns: worldRoomSpawnsCache.map(item => String(item)),
    npcs: worldRoomNpcsCache.map(item => String(item)),
    exits
  };
  const cultivationRaw = String(worldRoomEditCultivationInput?.value ?? '').trim();
  if (cultivationRaw !== '') {
    payload.minCultivationLevel = toNumber(cultivationRaw, 0);
  }
  const towerRaw = String(worldRoomEditTowerFloorInput?.value ?? '').trim();
  if (towerRaw !== '') {
    payload.towerFloor = toNumber(towerRaw, 0);
  }

  const res = await api('/admin/world/rooms', 'POST', { zoneId, roomId, data: payload });
  if (!res.ok) {
    await customAlert('保存失败', res.error || '保存房间失败');
    return;
  }
  worldRoomEditModal.classList.add('hidden');
  worldRoomOverrideStatus.set(worldRoomKey(zoneId, roomId), true);
  await loadWorldRooms();
  await customAlert('保存成功', '房间覆盖已保存并热更新。');
}

async function deleteWorldRoomOverride(zoneId, roomId) {
  const confirmed = await customConfirm('确认删除', `确定要删除房间 ${roomId} 的覆盖配置吗？`);
  if (!confirmed) return;
  const res = await api(`/admin/world/rooms/${encodeURIComponent(zoneId)}/${encodeURIComponent(roomId)}`, 'DELETE');
  if (!res.ok) {
    await customAlert('删除失败', res.error || '删除房间覆盖失败');
    return;
  }
  worldRoomOverrideStatus.set(worldRoomKey(zoneId, roomId), false);
  await loadWorldRooms();
  await customAlert('删除成功', '房间覆盖已删除，已恢复默认。');
}

async function editMobOverride(templateId) {
  await openMobOverrideModal(templateId, false);
}

async function editWorldZoneOverride(zoneId) {
  await openWorldZoneOverrideModal(zoneId, false);
}

async function editWorldRoomOverride(zoneId, roomId) {
  await openWorldRoomOverrideModal(zoneId, roomId, false);
}

if (mobOverridesList) {
  loadMobOverrides();
}

if (worldZonesList) {
  loadWorldZones();
}

if (mobOverrideRefreshBtn) {
  mobOverrideRefreshBtn.addEventListener('click', loadMobOverrides);
}

if (mobOverrideCreateBtn) {
  mobOverrideCreateBtn.addEventListener('click', async () => {
    const templateId = await customPrompt('新增怪物', '请输入怪物ID：');
    const id = String(templateId || '').trim();
    if (!id) return;
    await openMobOverrideModal(id, true);
  });
}

if (mobOverrideSearchInput) {
  mobOverrideSearchInput.addEventListener('input', renderMobOverrides);
}

if (mobEditCancelBtn) {
  mobEditCancelBtn.addEventListener('click', () => {
    mobEditModal.classList.add('hidden');
  });
}

if (mobEditSaveBtn) {
  mobEditSaveBtn.addEventListener('click', saveMobOverride);
}

if (mobDropAddBtn) {
  mobDropAddBtn.addEventListener('click', addMobDrop);
}

if (worldZonesRefreshBtn) {
  worldZonesRefreshBtn.addEventListener('click', loadWorldZones);
}

if (worldZoneCreateBtn) {
  worldZoneCreateBtn.addEventListener('click', async () => {
    const zoneId = await customPrompt('新增区域', '请输入区域ID：');
    const id = String(zoneId || '').trim();
    if (!id) return;
    await openWorldZoneOverrideModal(id, true);
  });
}

if (worldZoneEditCancelBtn) {
  worldZoneEditCancelBtn.addEventListener('click', () => {
    worldZoneEditModal.classList.add('hidden');
  });
}

if (worldZoneEditSaveBtn) {
  worldZoneEditSaveBtn.addEventListener('click', saveWorldZoneOverride);
}

if (worldZoneSelect) {
  worldZoneSelect.addEventListener('change', loadWorldRooms);
}

if (worldRoomsRefreshBtn) {
  worldRoomsRefreshBtn.addEventListener('click', loadWorldRooms);
}

if (worldRoomCheckBtn) {
  worldRoomCheckBtn.addEventListener('click', refreshWorldRoomOverrideStatus);
}

if (worldRoomCreateBtn) {
  worldRoomCreateBtn.addEventListener('click', async () => {
    const zoneId = String(worldZoneSelect?.value || '').trim();
    if (!zoneId) {
      await customAlert('提示', '请先选择区域');
      return;
    }
    const roomId = await customPrompt('新增房间', '请输入房间ID：');
    const id = String(roomId || '').trim();
    if (!id) return;
    await openWorldRoomOverrideModal(zoneId, id, true);
  });
}

if (worldRoomEditCancelBtn) {
  worldRoomEditCancelBtn.addEventListener('click', () => {
    worldRoomEditModal.classList.add('hidden');
  });
}

if (worldRoomEditSaveBtn) {
  worldRoomEditSaveBtn.addEventListener('click', saveWorldRoomOverride);
}

if (worldRoomEditPersonalTierInput) {
  worldRoomEditPersonalTierInput.addEventListener('change', syncPersonalBossToggle);
}

if (worldRoomSpawnAddBtn) {
  worldRoomSpawnAddBtn.addEventListener('click', addWorldRoomSpawn);
}

if (worldRoomExitAddBtn) {
  worldRoomExitAddBtn.addEventListener('click', addWorldRoomExit);
}

if (worldRoomExitZoneSelect) {
  worldRoomExitZoneSelect.addEventListener('change', () => {
    const zoneId = String(worldRoomExitZoneSelect.value || '').trim();
    renderWorldExitRoomOptions(zoneId);
  });
}

if (worldRoomEditNpcAddBtn) {
  worldRoomEditNpcAddBtn.addEventListener('click', addWorldRoomNpc);
}

if (dashboardRefreshBtn) {
  dashboardRefreshBtn.addEventListener('click', loadDashboardStats);
}

let gmMailAttachments = [];

function renderGmMailAttachments() {
  if (!gmMailItemList) return;
  if (!gmMailAttachments.length) {
    gmMailItemList.textContent = '暂无附件';
    return;
  }
  gmMailItemList.innerHTML = '';
  gmMailAttachments.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.justifyContent = 'space-between';
    row.style.gap = '8px';
    row.innerHTML = `
      <span>${item.id} x${item.qty}</span>
      <button class="btn-small" data-index="${index}" style="background:#6c757d;">移除</button>
    `;
    const btn = row.querySelector('button');
    if (btn) {
      btn.addEventListener('click', () => {
        gmMailAttachments.splice(index, 1);
        renderGmMailAttachments();
      });
    }
    gmMailItemList.appendChild(row);
  });
}

if (gmMailItemAddBtn) {
  gmMailItemAddBtn.addEventListener('click', () => {
    const id = String(gmMailItemIdInput?.value || '').trim();
    const qty = Math.max(1, Math.floor(Number(gmMailItemQtyInput?.value || 1) || 1));
    if (!id) {
      if (gmMailMsg) {
        gmMailMsg.textContent = '请输入物品ID';
        gmMailMsg.style.color = 'red';
      }
      return;
    }
    gmMailAttachments.push({ id, qty });
    if (gmMailItemIdInput) gmMailItemIdInput.value = '';
    if (gmMailItemQtyInput) gmMailItemQtyInput.value = '';
    renderGmMailAttachments();
  });
}

if (gmMailScopeSelect) {
  gmMailScopeSelect.addEventListener('change', () => {
    const scope = String(gmMailScopeSelect.value || 'user');
    if (gmMailUserRow) {
      gmMailUserRow.style.display = scope === 'user' ? '' : 'none';
    }
  });
}

if (gmMailSendBtn) {
  gmMailSendBtn.addEventListener('click', async () => {
    if (!gmMailMsg) return;
    gmMailMsg.textContent = '';
    const scope = String(gmMailScopeSelect?.value || 'user');
    const realmRaw = String(gmMailRealmSelect?.value || '').trim();
    const realmId = realmRaw === '' ? null : Math.max(1, Math.floor(Number(realmRaw) || 1));
    const username = String(gmMailUsernameInput?.value || '').trim();
    const characterName = String(gmMailCharacterInput?.value || '').trim();
    const title = String(gmMailTitleInput?.value || '').trim();
    const body = String(gmMailBodyInput?.value || '').trim();
    const gold = Math.max(0, Math.floor(Number(gmMailGoldInput?.value || 0) || 0));
    const yuanbao = Math.max(0, Math.floor(Number(gmMailYuanbaoInput?.value || 0) || 0));
    const items = gmMailAttachments.map((item) => ({ id: String(item.id), qty: Math.max(1, Math.floor(Number(item.qty) || 1)) }));
    if (!title || !body) {
      gmMailMsg.textContent = '标题和内容不能为空';
      gmMailMsg.style.color = 'red';
      return;
    }
    if (scope === 'user' && !username && !characterName) {
      gmMailMsg.textContent = '请输入玩家账号或角色名';
      gmMailMsg.style.color = 'red';
      return;
    }
    try {
      let res = null;
      if (scope === 'user') {
        res = await api('/admin/mail/send', 'POST', {
          username,
          characterName,
          title,
          body,
          realmId: realmId ?? undefined,
          items,
          gold,
          yuanbao
        });
      } else if (scope === 'online') {
        res = await api('/admin/mail/send-online', 'POST', {
          title,
          body,
          realmId: realmId ?? undefined,
          items,
          gold,
          yuanbao
        });
      } else {
        res = await api('/admin/mail/send-all', 'POST', {
          title,
          body,
          realmId: realmId ?? undefined,
          items,
          gold,
          yuanbao
        });
      }
      gmMailMsg.textContent = res?.message || '发送成功';
      gmMailMsg.style.color = 'green';
    } catch (err) {
      gmMailMsg.textContent = `发送失败: ${err.message}`;
      gmMailMsg.style.color = 'red';
    }
  });
}

renderGmMailAttachments();

function slugifySectionTitle(title) {
  const cleaned = String(title || '')
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return cleaned || 'section';
}

function initSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  const searchInput = document.getElementById('sidebar-search');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  const tabsBar = document.getElementById('tabs-bar');
  if (!nav) return;

  const usedIds = new Set();
  const sections = [];
  const blocks = Array.from(dashboardSection?.querySelectorAll('.block') || []);
  const blockIdSet = new Set();
  const blockLabels = new Map();

  for (const block of blocks) {
    const titleEl = block.querySelector('h2');
    const label = String(titleEl?.textContent || '').trim();
    if (!label) continue;
    const baseId = `section-${slugifySectionTitle(label)}`;
    let nextId = baseId;
    let i = 2;
    while (usedIds.has(nextId)) {
      nextId = `${baseId}-${i}`;
      i += 1;
    }
    block.id = block.id || nextId;
    usedIds.add(block.id);
    sections.push({ id: block.id, label });
    blockIdSet.add(block.id);
    blockLabels.set(block.id, label);
  }

  if (!sections.length) {
    nav.innerHTML = '<div class="sidebar-empty">暂无可导航模块</div>';
    return;
  }

  const defaultBlockId = document.getElementById('dashboard-overview')?.id || blocks[0]?.id || '';

  const showSection = (id) => {
    if (!dashboardSection) return;
    const showAll = id === 'all' || !id;
    if (showAll) {
      blocks.forEach((block) => {
        block.style.display = '';
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    blocks.forEach((block) => {
      block.style.display = block.id === id ? '' : 'none';
    });
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const setActiveTab = (id) => {
    if (!tabsBar) return;
    tabsBar.querySelectorAll('.tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === id);
    });
  };

  const closeTab = (id) => {
    if (!tabsBar) return;
    const tab = tabsBar.querySelector(`.tab[data-tab="${id}"]`);
    if (!tab) return;
    const wasActive = tab.classList.contains('active');
    tab.remove();
    if (wasActive) {
      const remaining = Array.from(tabsBar.querySelectorAll('.tab'));
      const next = remaining[remaining.length - 1];
      if (next) {
        const nextId = next.dataset.tab;
        setActiveTab(nextId);
        showSection(nextId);
        setActive(nextId);
      } else if (defaultBlockId) {
        openTab(defaultBlockId);
      }
    }
  };

  const openTab = (id, labelOverride) => {
    if (!blockIdSet.has(id)) return;
    const label = labelOverride || blockLabels.get(id) || id;
    if (!tabsBar) {
      showSection(id);
      setActive(id);
      return;
    }
    let tab = tabsBar.querySelector(`.tab[data-tab="${id}"]`);
    if (!tab) {
      tab = document.createElement('div');
      tab.className = 'tab';
      tab.dataset.tab = id;
      const text = document.createElement('span');
      text.textContent = label;
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.type = 'button';
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        closeTab(id);
      });
      tab.appendChild(text);
      tab.appendChild(closeBtn);
      tab.addEventListener('click', () => {
        setActiveTab(id);
        showSection(id);
        setActive(id);
      });
      tabsBar.appendChild(tab);
    }
    setActiveTab(id);
    showSection(id);
    setActive(id);
  };

  const normalizeLabel = (label) => String(label || '').replace(/^[^\w\u4e00-\u9fa5]+/g, '').trim();
  const getGroup = (label) => {
    const text = normalizeLabel(label);
    if (/服务器概览/.test(text)) return '概览';
    if (/(管理员登录|用户与权限|赞助名单)/.test(text)) return '账号与权限';
    if (/(区服|线路|合区|房间变种)/.test(text)) return '区服与线路';
    if (/BOSS/.test(text)) return 'BOSS与战斗';
    if (/(活动|丰收季|神兽碎片|积分商城|每日幸运玩家|VIP)/.test(text)) return '活动与运营';
    if (/(修炼|锻造|装备成长|法宝|特效重置|宠物|职业升级属性)/.test(text)) return '养成系统';
    if (/(装备管理|怪物管理|地图管理|装备回收|行会)/.test(text)) return '内容与世界';
    if (/(状态刷新|命令限频|SMTP|数据备份)/.test(text)) return '系统与工具';
    return '其他';
  };

  const groupOrder = [
    '概览',
    '账号与权限',
    '区服与线路',
    'BOSS与战斗',
    '活动与运营',
    '养成系统',
    '内容与世界',
    '系统与工具',
    '其他'
  ];

  const grouped = new Map();
  for (const item of sections) {
    const group = getGroup(item.label);
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group).push(item);
  }

  nav.innerHTML = '';
  for (const groupName of groupOrder) {
    const items = grouped.get(groupName);
    if (!items || !items.length) continue;
    const groupEl = document.createElement('div');
    groupEl.className = 'sidebar-group';
    const titleEl = document.createElement('div');
    titleEl.className = 'sidebar-group-title';
    titleEl.textContent = groupName;
    groupEl.appendChild(titleEl);
    for (const item of items) {
      const link = document.createElement('a');
      link.href = `#${item.id}`;
      link.dataset.section = item.id;
      link.textContent = item.label;
      link.addEventListener('click', (event) => {
        if (!document.getElementById(item.id)) {
          event.preventDefault();
        } else if (blockIdSet.has(item.id)) {
          event.preventDefault();
          openTab(item.id, item.label);
        }
        if (document.body.classList.contains('sidebar-open')) {
          document.body.classList.remove('sidebar-open');
        }
      });
      groupEl.appendChild(link);
    }
    nav.appendChild(groupEl);
  }

  const setActive = (id) => {
    nav.querySelectorAll('a').forEach((link) => {
      link.classList.toggle('active', link.dataset.section === id);
    });
  };

  if (defaultBlockId) {
    setActive(defaultBlockId);
    openTab(defaultBlockId);
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const keyword = String(searchInput.value || '').trim().toLowerCase();
      nav.querySelectorAll('.sidebar-group').forEach((group) => {
        let visibleCount = 0;
        group.querySelectorAll('a').forEach((link) => {
          const match = link.textContent.toLowerCase().includes(keyword);
          link.style.display = match ? '' : 'none';
          if (match) visibleCount += 1;
        });
        group.style.display = visibleCount > 0 ? '' : 'none';
      });
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }

  const hash = String(window.location.hash || '').replace('#', '');
  if (hash && blockIdSet.has(hash)) {
    openTab(hash);
  } else {
    const fallbackId = defaultBlockId || '';
    if (fallbackId) openTab(fallbackId);
  }
}

initSidebarNav();



