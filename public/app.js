let token = null;
let socket = null;
let activeChar = null;
const classNames = { warrior: '战士', mage: '法师', taoist: '道士' };
let selectedMob = null;
let selectedSummonId = null;
let mailCache = [];
let selectedMailId = null;
let mailAttachments = [];
let lastState = null;
let serverTimeBase = null;
let serverTimeLocal = null;
let serverTimeTimer = null;
let vipSelfClaimEnabled = true;
let stateThrottleEnabled = false;
let pendingState = null;
let stateThrottleTimer = null;
let lastStateRenderAt = 0;
let stateThrottleIntervalMs = 10000;
let stateThrottleOverride = localStorage.getItem('stateThrottleOverride') === 'true';
let stateThrottleOverrideServerAllowed = true;
let refineMaterialCount = 20; // 默认值
let bossRespawnTimer = null;
let bossRespawnTarget = null;
let bossRespawnTimerEl = null;
let crossRankTimer = null;
let crossRankTimerTarget = null;
let crossRankTimerEl = null;
let crossRankTimerLabel = null;
const tradeInviteCooldown = new Map();
let trainingConfig = null; // 修炼配置
let deviceId = null;
let deviceFingerprint = null;
const localHpCache = {
  players: new Map(),
  mobs: new Map()
};

function getOrCreateDeviceId() {
  if (deviceId) return deviceId;
  const storageKey = 'deviceId';
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      deviceId = saved;
      return deviceId;
    }
  } catch {
    // ignore storage errors
  }
  let raw = '';
  try {
    const buf = new Uint8Array(16);
    if (crypto && crypto.getRandomValues) {
      crypto.getRandomValues(buf);
      raw = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // ignore crypto errors
  }
  if (!raw) {
    raw = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
  deviceId = raw;
  try {
    localStorage.setItem(storageKey, deviceId);
  } catch {
    // ignore storage errors
  }
  return deviceId;
}

function hashString(input) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '16px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 200, 60);
    ctx.fillStyle = '#069';
    ctx.fillText('fingerprint', 10, 10);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('fingerprint', 12, 12);
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

function getWebglFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const version = gl.getParameter(gl.VERSION);
    const shading = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    return [vendor, renderer, version, shading].join('|');
  } catch {
    return '';
  }
}

function getAudioFingerprint() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return '';
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const compressor = ctx.createDynamicsCompressor();
    const analyser = ctx.createAnalyser();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;
    oscillator.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(ctx.destination);
    oscillator.start(0);
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    oscillator.stop();
    ctx.close();
    let hash = 0;
    for (let i = 0; i < data.length; i += 1) {
      hash = ((hash << 5) - hash) + Math.floor(data[i] * 1000);
      hash |= 0;
    }
    return String(hash);
  } catch {
    return '';
  }
}

function computeDeviceFingerprint() {
  if (deviceFingerprint) return deviceFingerprint;
  const parts = [
    navigator.userAgent || '',
    navigator.platform || '',
    navigator.language || '',
    Array.isArray(navigator.languages) ? navigator.languages.join(',') : '',
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen.width || 0,
    screen.height || 0,
    screen.colorDepth || 0,
    window.devicePixelRatio || 1,
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
    getCanvasFingerprint(),
    getWebglFingerprint(),
    getAudioFingerprint()
  ];
  deviceFingerprint = hashString(parts.join('|'));
  return deviceFingerprint;
}

async function loadTrainingConfig() {
  try {
    const res = await fetch('/api/training-config');
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.config) {
        trainingConfig = data.config;
      }
    }
  } catch (e) {
    console.error('加载修炼配置失败:', e);
  }
}

function getTrainingPerLevel(attr) {
  if (trainingConfig && trainingConfig[attr] !== undefined) {
    return trainingConfig[attr];
  }
  // 默认值
  const defaults = { hp: 1, mp: 1, atk: 0.1, def: 0.1, mag: 0.1, mdef: 0.1, spirit: 0.1, dex: 0.1 };
  return defaults[attr] || 0.1;
}

// 屏蔽F12开发者工具
(function() {
  'use strict';

  // 屏蔽F12
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // 屏蔽Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.altKey && e.key === 'I')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // 屏蔽右键菜单
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  // 禁用常见的调试快捷键
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
  });

  // 禁用拖拽
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });

  // 禁用选择文本
  document.addEventListener('selectstart', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  });
})();

// 主题和日志折叠
let isLogCollapsed = localStorage.getItem('logCollapsed') === 'true';
let isBattleCollapsed = localStorage.getItem('battleCollapsed') === 'true';
let showDamage = localStorage.getItem('showDamage') !== 'false';
let showExpGold = localStorage.getItem('showExpGold') !== 'false';
const directionLabels = {
  north: '北',
  south: '南',
  east: '东',
  west: '西',
  northeast: '东北',
  northwest: '西北',
  southeast: '东南',
  southwest: '西南',
  up: '上',
  down: '下'
};
const ui = {
  realm: document.getElementById('ui-realm'),
  name: document.getElementById('ui-name'),
  classLevel: document.getElementById('ui-class'),
  guild: document.getElementById('ui-guild'),
  pk: document.getElementById('ui-pk'),
  vip: document.getElementById('ui-vip'),
  bonusLine: document.getElementById('ui-bonus-line'),
  online: document.getElementById('ui-online'),
  serverTime: document.getElementById('ui-server-time'),
  party: document.getElementById('ui-party'),
  gold: document.getElementById('ui-gold'),
  cultivation: document.getElementById('ui-cultivation'),
  cultivationUpgrade: document.getElementById('ui-cultivation-upgrade'),
  hpValue: document.getElementById('ui-hp'),
  mpValue: document.getElementById('ui-mp'),
  expValue: document.getElementById('ui-exp'),
  atk: document.getElementById('ui-atk'),
  def: document.getElementById('ui-def'),
  mag: document.getElementById('ui-mag'),
  spirit: document.getElementById('ui-spirit'),
  mdef: document.getElementById('ui-mdef'),
  dodge: document.getElementById('ui-dodge'),
  hp: document.getElementById('bar-hp'),
  mp: document.getElementById('bar-mp'),
  exp: document.getElementById('bar-exp'),
  exits: document.getElementById('exits-list'),
  mobs: document.getElementById('mobs-list'),
  players: document.getElementById('players-list'),
  skills: document.getElementById('skills-list'),
  summon: document.getElementById('summon-panel'),
  summonDetails: document.getElementById('summon-details'),
  items: document.getElementById('items-list'),
  worldBossRank: document.getElementById('worldboss-rank'),
  worldBossRankTitle: document.getElementById('worldboss-rank-title'),
  training: document.getElementById('training-list'),
  actions: document.getElementById('actions-list'),
  changePasswordButtons: Array.from(document.querySelectorAll('[data-action="change-password"]'))
};
const battleUi = {
  players: document.getElementById('battle-players'),
  skills: document.getElementById('battle-skills'),
  mobs: document.getElementById('battle-mobs'),
  damageLayer: document.getElementById('battle-damage-layer')
};

const SKILL_NAME_OVERRIDES = {
  earth_spike: '彻地钉',
  thunderstorm: '雷霆万钧'
};

const CULTIVATION_RANKS = [
  '灵虚',
  '和合',
  '元婴',
  '空冥',
  '履霜',
  '渡劫',
  '寂灭',
  '大乘',
  '上仙',
  '真仙',
  '天仙'
];

function getCultivationInfo(levelValue) {
  const level = Math.floor(Number(levelValue ?? -1));
  if (Number.isNaN(level) || level < 0) return { name: '无', bonus: 0 };
  const idx = Math.min(CULTIVATION_RANKS.length - 1, level);
  const name = CULTIVATION_RANKS[idx] || CULTIVATION_RANKS[0];
  const bonus = (idx + 1) * 50;
  return { name, bonus };
}

function getSkillDisplayName(skill) {
  if (!skill) return '';
  return SKILL_NAME_OVERRIDES[skill.id] || skill.name || '';
}
const dropsUi = {
  modal: document.getElementById('drops-modal'),
  tabs: document.querySelectorAll('.drops-tab'),
  content: document.getElementById('drops-content'),
  closeBtn: document.getElementById('drops-close')
};
const chat = {
  log: document.getElementById('chat-log'),
  input: document.getElementById('chat-input'),
  sendBtn: document.getElementById('chat-send'),
  partyInviteBtn: document.getElementById('chat-party-invite'),
  guildInviteBtn: document.getElementById('chat-guild-invite'),
  guildCreateBtn: document.getElementById('chat-guild-create'),
  guildListBtn: document.getElementById('chat-guild-list'),
  partyToggleBtn: document.getElementById('chat-party-toggle'),
  sabakRegisterBtn: document.getElementById('chat-sabak-register'),
  locationBtn: document.getElementById('chat-send-location'),
  emojiToggle: document.getElementById('chat-emoji-toggle'),
  emojiPanel: document.getElementById('chat-emoji-panel'),
  clearBtn: document.getElementById('chat-clear'),
  setSponsorTitleBtn: document.getElementById('chat-set-sponsor-title')
};
const EMOJI_LIST = ['😀', '😁', '😂', '🤣', '😅', '😊', '😍', '😘', '😎', '🤔', '😴', '😡', '😭', '😇', '🤝', '👍', '👎', '🔥', '💯', '🎉'];
const tradeUi = {
  requestBtn: document.getElementById('chat-trade-request'),
  itemSelect: document.getElementById('trade-item'),
  qtyInput: document.getElementById('trade-qty'),
  goldInput: document.getElementById('trade-gold'),
  addItemBtn: document.getElementById('trade-add-item'),
  addGoldBtn: document.getElementById('trade-add-gold'),
  lockBtn: document.getElementById('trade-lock'),
  confirmBtn: document.getElementById('trade-confirm'),
  cancelBtn: document.getElementById('trade-cancel'),
  status: document.getElementById('trade-status'),
  partnerStatus: document.getElementById('trade-partner-status'),
  myItems: document.getElementById('trade-my-items'),
  partnerItems: document.getElementById('trade-partner-items'),
  myGold: document.getElementById('trade-my-gold'),
  partnerGold: document.getElementById('trade-partner-gold'),
  partnerTitle: document.getElementById('trade-partner-title'),
  panel: document.getElementById('trade-panel'),
  modal: document.getElementById('trade-modal')
};
const guildUi = {
  modal: document.getElementById('guild-modal'),
  title: document.getElementById('guild-title'),
  list: document.getElementById('guild-list'),
  page: document.getElementById('guild-page'),
  prev: document.getElementById('guild-prev'),
  next: document.getElementById('guild-next'),
  invite: document.getElementById('guild-invite'),
  applications: document.getElementById('guild-applications'),
  leave: document.getElementById('guild-leave'),
  close: document.getElementById('guild-close')
};
const guildListUi = {
  modal: document.getElementById('guild-list-modal'),
  list: document.getElementById('guild-list-content'),
  close: document.getElementById('guild-list-close')
};
const guildApplicationsUi = {
  modal: document.getElementById('guild-applications-modal'),
  list: document.getElementById('guild-applications-list'),
  close: document.getElementById('guild-applications-close')
};
const sabakUi = {
  modal: document.getElementById('sabak-modal'),
  title: document.getElementById('sabak-modal-title'),
  info: document.getElementById('sabak-info'),
  guildList: document.getElementById('sabak-guild-list'),
  confirm: document.getElementById('sabak-confirm'),
  close: document.getElementById('sabak-close'),
  msg: document.getElementById('sabak-register-msg')
};
const sabakPalaceStatsUi = {
  title: document.getElementById('sabak-palace-stats-title'),
  list: document.getElementById('sabak-palace-stats')
};
const partyUi = {
  modal: document.getElementById('party-modal'),
  title: document.getElementById('party-title'),
  list: document.getElementById('party-list'),
  inviteAllFollow: document.getElementById('party-invite-all-follow'),
  followLeader: document.getElementById('party-follow-leader'),
  leave: document.getElementById('party-leave'),
  close: document.getElementById('party-close')
};
const promptUi = {
  modal: document.getElementById('prompt-modal'),
  title: document.getElementById('prompt-title'),
  text: document.getElementById('prompt-text'),
  label: document.getElementById('prompt-label'),
  input: document.getElementById('prompt-input'),
  secondaryRow: document.getElementById('prompt-secondary-row'),
  labelSecondary: document.getElementById('prompt-label-secondary'),
  inputSecondary: document.getElementById('prompt-input-secondary'),
  ok: document.getElementById('prompt-ok'),
  cancel: document.getElementById('prompt-cancel'),
  extra: document.getElementById('prompt-extra')
};
const shopUi = {
  modal: document.getElementById('shop-modal'),
  list: document.getElementById('shop-list'),
  subtitle: document.getElementById('shop-subtitle'),
  sellList: document.getElementById('shop-sell-list'),
  close: document.getElementById('shop-close'),
  sellBulk: document.getElementById('shop-sell-bulk')
};
const mailUi = {
  modal: document.getElementById('mail-modal'),
  tabInbox: document.getElementById('mail-tab-inbox'),
  tabSent: document.getElementById('mail-tab-sent'),
  list: document.getElementById('mail-list'),
  detailTitle: document.getElementById('mail-detail-title'),
  detailMeta: document.getElementById('mail-detail-meta'),
  detailBody: document.getElementById('mail-detail-body'),
  detailItems: document.getElementById('mail-detail-items'),
  claim: document.getElementById('mail-claim'),
  delete: document.getElementById('mail-delete'),
  refresh: document.getElementById('mail-refresh'),
  close: document.getElementById('mail-close'),
  to: document.getElementById('mail-to'),
  subject: document.getElementById('mail-subject'),
  body: document.getElementById('mail-body'),
  item: document.getElementById('mail-item'),
  qty: document.getElementById('mail-qty'),
  addItem: document.getElementById('mail-add-item'),
  attachList: document.getElementById('mail-attach-list'),
  gold: document.getElementById('mail-gold'),
  send: document.getElementById('mail-send')
};

let currentMailFolder = 'inbox'; // 'inbox' 或 'sent'
const repairUi = {
  modal: document.getElementById('repair-modal'),
  list: document.getElementById('repair-list'),
  all: document.getElementById('repair-all'),
  close: document.getElementById('repair-close')
};
const changeClassUi = {
  modal: document.getElementById('changeclass-modal'),
  options: Array.from(document.querySelectorAll('.changeclass-option')),
  confirm: document.getElementById('changeclass-confirm'),
  close: document.getElementById('changeclass-close')
};
const forgeUi = {
  modal: document.getElementById('forge-modal'),
  list: document.getElementById('forge-main-list'),
  secondaryList: document.getElementById('forge-secondary-list'),
  main: document.getElementById('forge-main-selected'),
  secondary: document.getElementById('forge-secondary-selected'),
  confirm: document.getElementById('forge-confirm'),
  close: document.getElementById('forge-close')
};
const refineUi = {
  modal: document.getElementById('refine-modal'),
  list: document.getElementById('refine-main-list'),
  main: document.getElementById('refine-main-selected'),
  secondaryCount: document.getElementById('refine-secondary-count'),
  secondaryList: document.getElementById('refine-secondary-list'),
  level: document.getElementById('refine-level'),
  successRate: document.getElementById('refine-success-rate'),
  protection: document.getElementById('refine-protection'),
  confirm: document.getElementById('refine-confirm'),
  batch: document.getElementById('refine-batch'),
  close: document.getElementById('refine-close')
};
const effectUi = {
  modal: document.getElementById('effect-modal'),
  list: document.getElementById('effect-main-list'),
  main: document.getElementById('effect-main-selected'),
  secondary: document.getElementById('effect-secondary-selected'),
  successRate: document.getElementById('effect-success-rate'),
  doubleRate: document.getElementById('effect-double-rate'),
  tripleRate: document.getElementById('effect-triple-rate'),
  quadrupleRate: document.getElementById('effect-quadruple-rate'),
  quintupleRate: document.getElementById('effect-quintuple-rate'),
  confirm: document.getElementById('effect-confirm'),
  batch: document.getElementById('effect-batch'),
  close: document.getElementById('effect-close')
};
let effectSelection = null;
let changeClassSelection = null;
const consignUi = {
  modal: document.getElementById('consign-modal'),
  tabs: Array.from(document.querySelectorAll('.consign-tab')),
  panels: Array.from(document.querySelectorAll('.consign-panel')),
  filters: Array.from(document.querySelectorAll('.consign-filter')),
  marketList: document.getElementById('consign-market-list'),
  marketPrev: document.getElementById('consign-market-prev'),
  marketNext: document.getElementById('consign-market-next'),
  marketPage: document.getElementById('consign-market-page'),
  myList: document.getElementById('consign-my-list'),
  myPrev: document.getElementById('consign-my-prev'),
  myNext: document.getElementById('consign-my-next'),
  myPage: document.getElementById('consign-my-page'),
  inventoryList: document.getElementById('consign-inventory-list'),
  inventoryPrev: document.getElementById('consign-inventory-prev'),
  inventoryNext: document.getElementById('consign-inventory-next'),
  inventoryPage: document.getElementById('consign-inventory-page'),
  historyList: document.getElementById('consign-history-list'),
  historyPrev: document.getElementById('consign-history-prev'),
  historyNext: document.getElementById('consign-history-next'),
  historyPage: document.getElementById('consign-history-page'),
  close: document.getElementById('consign-close')
};
  const bagUi = {
    modal: document.getElementById('bag-modal'),
    list: document.getElementById('bag-list'),
    page: document.getElementById('bag-page'),
    prev: document.getElementById('bag-prev'),
    next: document.getElementById('bag-next'),
    tabs: Array.from(document.querySelectorAll('.bag-tab')),
    close: document.getElementById('bag-close')
  };
  const trainingBatchUi = {
    modal: document.getElementById('training-batch-modal'),
    list: document.getElementById('training-batch-list'),
    countInput: document.getElementById('training-batch-count'),
    costDisplay: document.getElementById('training-batch-cost'),
    confirm: document.getElementById('training-batch-confirm'),
    close: document.getElementById('training-batch-close')
  };
  const statsUi = {
    modal: document.getElementById('stats-modal'),
    summary: document.getElementById('stats-summary'),
    equipment: document.getElementById('stats-equipment'),
    inventory: document.getElementById('stats-inventory'),
    close: document.getElementById('stats-close')
  };
const afkUi = {
  modal: document.getElementById('afk-modal'),
  list: document.getElementById('afk-skill-list'),
  start: document.getElementById('afk-start'),
  auto: document.getElementById('afk-auto'),
  close: document.getElementById('afk-close')
};
const playerUi = {
  modal: document.getElementById('player-modal'),
  info: document.getElementById('player-info'),
  observe: document.getElementById('player-observe'),
  attack: document.getElementById('player-attack'),
  trade: document.getElementById('player-trade'),
  party: document.getElementById('player-party'),
  guild: document.getElementById('player-guild'),
  mail: document.getElementById('player-mail'),
  close: document.getElementById('player-close')
};
const observeUi = {
  modal: document.getElementById('observe-modal'),
  title: document.getElementById('observe-title'),
  content: document.getElementById('observe-content'),
  close: document.getElementById('observe-close')
};
const sponsorUi = {
  modal: document.getElementById('sponsor-modal'),
  content: document.getElementById('sponsor-content'),
  close: document.getElementById('sponsor-close')
};

const sponsorTitleUi = {
  modal: document.getElementById('sponsor-title-modal'),
  input: document.getElementById('title-input'),
  cancelBtn: document.getElementById('title-cancel'),
  saveBtn: document.getElementById('title-save'),
  msg: document.getElementById('title-msg')
};
console.log('sponsorTitleUi:', sponsorTitleUi);
const itemTooltip = document.getElementById('item-tooltip');
let lastShopItems = [];
let consignMarketItems = [];
let consignMyItems = [];
let consignInventoryItems = [];
let consignHistoryItems = [];
let consignMarketPage = 0;
let consignMyPage = 0;
let consignInventoryPage = 0;
let consignHistoryPage = 0;
let consignMarketFilter = 'all';

// 交易数据
let tradeData = {
  myItems: [],
  myGold: 0,
  partnerItems: [],
  partnerGold: 0,
  partnerName: ''
};
let guildMembers = [];
let lastGuildApplyId = null;
const guildApplyButtons = new Map();
const guildApplyPending = new Set();
const CONSIGN_PAGE_SIZE = 9;
let bagItems = [];
let bagPage = 0;
let bagFilter = 'all';
const BAG_PAGE_SIZE = 20;
let guildPage = 0;
const GUILD_PAGE_SIZE = 5;

const authSection = document.getElementById('auth');
const characterSection = document.getElementById('character');
const gameSection = document.getElementById('game');
const log = document.getElementById('log');

const authMsg = document.getElementById('auth-msg');
const authToast = document.getElementById('auth-toast');
const charMsg = document.getElementById('char-msg');
const characterList = document.getElementById('character-list');
const realmSelect = document.getElementById('realm-select');
const loginUserInput = document.getElementById('login-username');
const captchaUi = {
  loginInput: document.getElementById('login-captcha'),
  loginImg: document.getElementById('login-captcha-img'),
  loginRefresh: document.getElementById('login-captcha-refresh'),
  registerInput: document.getElementById('register-captcha'),
  registerImg: document.getElementById('register-captcha-img'),
  registerRefresh: document.getElementById('register-captcha-refresh')
};
let lastSavedLevel = null;
const CHAT_CACHE_LIMIT = 200;
let realmList = [];
let currentRealmId = 1;
let realmInitPromise = null;
let sponsorNames = new Set(); // 存储赞助玩家名称
let sponsorCustomTitles = new Map(); // 存储赞助玩家自定义称号

function showToast(message, duration = 1600) {
  authToast.textContent = message;
  authToast.classList.remove('hidden');
  authToast.classList.add('show');
  setTimeout(() => {
    authToast.classList.remove('show');
  }, duration);
}

async function refreshCaptcha(target) {
  const img = target === 'login' ? captchaUi.loginImg : captchaUi.registerImg;
  const input = target === 'login' ? captchaUi.loginInput : captchaUi.registerInput;
  if (!img || !input) return;
  try {
    const res = await fetch('/api/captcha');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'captcha');
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(data.svg)}`;
    img.dataset.token = data.token || '';
    input.value = '';
  } catch {
    // ignore captcha failures
  }
}

function show(section) {
  authSection.classList.add('hidden');
  characterSection.classList.add('hidden');
  gameSection.classList.add('hidden');
  section.classList.remove('hidden');
  hideItemTooltip();
}

function exitGame() {
  if (serverTimeTimer) {
    clearInterval(serverTimeTimer);
    serverTimeTimer = null;
  }
  serverTimeBase = null;
  serverTimeLocal = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeChar = null;
  lastState = null;
  const username = localStorage.getItem('rememberedUser');
  if (username) {
    localStorage.removeItem(getUserStorageKey('savedToken', username));
  }
  show(authSection);
}

async function switchCharacter() {
  if (serverTimeTimer) {
    clearInterval(serverTimeTimer);
    serverTimeTimer = null;
  }
  serverTimeBase = null;
  serverTimeLocal = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeChar = null;
  lastState = null;
  const username = localStorage.getItem('rememberedUser');
  const charsKey = getUserStorageKey('savedCharacters', username, currentRealmId);
  let savedChars = [];
  try {
    const data = await apiGet(`/api/characters?realmId=${currentRealmId}`, true);
    savedChars = Array.isArray(data.characters) ? data.characters : [];
    localStorage.setItem(charsKey, JSON.stringify(savedChars));
  } catch {
    try {
      savedChars = JSON.parse(localStorage.getItem(charsKey) || '[]');
    } catch {
      savedChars = [];
    }
  }
  renderCharacters(savedChars);
  show(characterSection);
}

function getUserStorageKey(key, username, realmId) {
  const user = username || localStorage.getItem('rememberedUser');
  const realmSuffix = realmId ? `_r${realmId}` : '';
  return user ? `${key}_${user}${realmSuffix}` : key;
}

function normalizeRealmId(value, count) {
  const parsed = Math.max(1, Math.floor(Number(value) || 1));
  if (!count || count < 1) return 1;
  return Math.min(parsed, count);
}

function getStoredRealmId(username) {
  const key = getUserStorageKey('lastRealm', username);
  return Number(localStorage.getItem(key) || 1);
}

function setCurrentRealmId(realmId, username) {
  currentRealmId = realmId;
  console.log(`setCurrentRealmId: realmId=${realmId}, username=${username}, realmList=${JSON.stringify(realmList.map(r => ({id: r.id, name: r.name})))}`);
  if (realmSelect) {
    const stringValue = String(realmId);
    // 检查选择框中是否存在该选项，如果不存在则不设置（避免无效值）
    const hasOption = Array.from(realmSelect.options).some(opt => opt.value === stringValue);
    console.log(`setCurrentRealmId: hasOption=${hasOption}, options=${Array.from(realmSelect.options).map(o => o.value)}`);
    if (hasOption) {
      realmSelect.value = stringValue;
    } else {
      console.warn(`realmId ${realmId} not found in select options`);
    }
  }
  if (username) {
    const key = getUserStorageKey('lastRealm', username);
    localStorage.setItem(key, String(realmId));
  }
}

async function loadRealms() {
  try {
    const data = await apiGet('/api/realms');
    realmList = Array.isArray(data.realms) ? data.realms : [];
  } catch {
    realmList = [];
  }
  // 如果服务器列表为空,显示提示信息
  if (!Array.isArray(realmList) || realmList.length === 0) {
    realmList = [{ id: 1, name: '无服务器' }];
  }
  if (realmSelect) {
    realmSelect.innerHTML = '';
    realmList.forEach((realm) => {
      const option = document.createElement('option');
      option.value = String(realm.id);
      option.textContent = realm.name || `新区${realm.id}`;
      realmSelect.appendChild(option);
    });
  }
  const username = localStorage.getItem('rememberedUser');
  const count = realmList.length;
  const stored = getStoredRealmId(username);
  // 确保设置的realmId在当前服务器列表中存在
  const storedRealm = realmList.find(r => r.id === stored);
  const validRealmId = storedRealm ? storedRealm.id : Math.max(1, realmList[0]?.id || 1);
  console.log(`loadRealms: username=${username}, stored=${stored}, storedRealm=${storedRealm?.id}, validRealmId=${validRealmId}, realmList=${JSON.stringify(realmList.map(r => r.id))}`);
  setCurrentRealmId(normalizeRealmId(validRealmId, count), username);
}

function ensureRealmsLoaded() {
  if (!realmInitPromise) {
    realmInitPromise = loadRealms();
  }
  return realmInitPromise;
}

async function refreshCharactersForRealm() {
  const username = localStorage.getItem('rememberedUser');
  const charsKey = getUserStorageKey('savedCharacters', username, currentRealmId);
  if (!token) {
    renderCharacters([]);
    return;
  }
  try {
    const data = await apiGet(`/api/characters?realmId=${currentRealmId}`, true);
    const list = Array.isArray(data.characters) ? data.characters : [];
    localStorage.setItem(charsKey, JSON.stringify(list));
    renderCharacters(list);
  } catch (err) {
    let cached = [];
    try {
      cached = JSON.parse(localStorage.getItem(charsKey) || '[]');
    } catch {
      cached = [];
    }
    renderCharacters(Array.isArray(cached) ? cached : []);
    // 如果是"新区不存在"错误,清除旧的realmId
    if (err.message && err.message.includes('新区不存在') && username) {
      const key = getUserStorageKey('lastRealm', username);
      localStorage.removeItem(key);
      showToast('服务器已合并,请刷新页面重新选择服务器');
    }
  }
}

function updateSavedCharacters(player) {
  if (!player || !player.name) return;
  const username = localStorage.getItem('rememberedUser');
  const storageKey = getUserStorageKey('savedCharacters', username, currentRealmId);
  let chars = [];
  try {
    chars = JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    chars = [];
  }
  if (!Array.isArray(chars) || !chars.length) return;
  const idx = chars.findIndex((c) => c.name === player.name);
  if (idx === -1) return;
  if (chars[idx].level === player.level && chars[idx].class === player.classId) return;
  chars[idx] = { ...chars[idx], level: player.level, class: player.classId };
  localStorage.setItem(storageKey, JSON.stringify(chars));
  if (!characterSection.classList.contains('hidden')) {
    renderCharacters(chars);
  }
}

function normalizePayload(payload) {
  if (payload && typeof payload === 'object') return payload;
  return { text: String(payload || '') };
}

function isRedName(name) {
  if (!name) return false;
  const raw = String(name);
  if (lastState?.player?.name === raw) {
    return (lastState?.stats?.pk || 0) >= 100;
  }
  const other = (lastState?.players || []).find((p) => p.name === raw);
  return (other?.pk || 0) >= 100;
}

function buildLine(payload) {
  const data = normalizePayload(payload);
  const p = document.createElement('p');
  p.classList.add('log-line');
  if (data.color) p.classList.add(`line-${data.color}`);
  if (data.prefix === '公告' || data.prefixColor === 'announce') {
    p.classList.add('announce-line');
  }
  if (data.prefix) {
    const prefix = document.createElement('span');
    prefix.classList.add('line-prefix');
    if (data.prefixColor) prefix.classList.add(`prefix-${data.prefixColor}`);
    prefix.textContent = data.prefix;
    p.appendChild(prefix);
  }
  const textValue = data.text || '';
  const guildMatch = textValue.match(/^\[(行会)\]\[([^\]]+)\]\s*(.*)$/);
  // 修复：使用更严格的正则，避免匹配系统消息
  const normalMatch = textValue.match(/^\[([^\[\]]{1,20})\]\s*(.*)$/);
  if (guildMatch) {
    const tag = document.createElement('span');
    tag.className = 'chat-tag';
    tag.textContent = `[${guildMatch[1]}]`;
    p.appendChild(tag);
    const nameBtn = document.createElement('button');
    nameBtn.className = 'chat-name-btn';
    nameBtn.textContent = `[${guildMatch[2]}]`;
    nameBtn.addEventListener('click', () => openPlayerActions(guildMatch[2]));
    if (isRedName(guildMatch[2])) {
      nameBtn.classList.add('player-red-name');
    }
    p.appendChild(nameBtn);
    const text = document.createElement('span');
    text.classList.add('line-text');
    text.textContent = ` ${guildMatch[3] || ''}`.trimStart();
    p.appendChild(text);
    // 为玩家添加称号（赞助称号或排行榜称号）
    addPlayerTitle(p, guildMatch[2], data.rankTitle);
  } else if (normalMatch) {
    const nameBtn = document.createElement('button');
    nameBtn.className = 'chat-name-btn';
    nameBtn.textContent = `[${normalMatch[1]}]`;
    nameBtn.addEventListener('click', () => openPlayerActions(normalMatch[1]));
    if (isRedName(normalMatch[1])) {
      nameBtn.classList.add('player-red-name');
    }
    p.appendChild(nameBtn);
    const text = document.createElement('span');
    text.classList.add('line-text');
    text.textContent = ` ${normalMatch[2] || ''}`.trimStart();
    p.appendChild(text);
    // 为玩家添加称号（赞助称号或排行榜称号）
    addPlayerTitle(p, normalMatch[1], data.rankTitle);
  } else {
    const text = document.createElement('span');
    text.classList.add('line-text');
    text.textContent = textValue;
    p.appendChild(text);
  }
  return p;
}

function addPlayerTitle(line, playerName, rankTitleFromServer = null) {
  // 查找玩家名按钮并添加称号
  const nameBtns = line.querySelectorAll('.chat-name-btn');
  nameBtns.forEach((btn) => {
    if (btn.textContent === `[${playerName}]`) {
      // 检查是否是赞助玩家
      const isSponsor = sponsorNames.has(playerName);

      if (isSponsor) {
        btn.classList.add('sponsor-player-name');
      }

      // 优先显示赞助称号，然后是排行榜称号
      let customTitle = null;

      // 1. 优先检查是否有赞助称号
      if (sponsorCustomTitles.has(playerName)) {
        customTitle = sponsorCustomTitles.get(playerName);
      }
      // 2. 如果没有赞助称号，检查服务器传递的排行榜称号
      else if (rankTitleFromServer) {
        customTitle = rankTitleFromServer;
      }
      // 3. 最后尝试从当前玩家状态中查找排行榜称号
      else if (lastState && lastState.player && lastState.player.name === playerName && lastState.player.rankTitle) {
        customTitle = lastState.player.rankTitle;
      }

      // 只有当有称号时才显示
      if (customTitle) {
        const badge = document.createElement('span');
        badge.className = 'sponsor-badge';
        badge.textContent = customTitle;
        line.insertBefore(badge, btn);
      }
    }
  });
}

function applyAnnounceMarquee(line) {
  if (!line || !line.classList.contains('announce-line')) return;
  const text = line.querySelector('.line-text');
  if (!text || line.dataset.marqueeApplied) return;
  requestAnimationFrame(() => {
    const totalWidth = line.clientWidth;
    const children = Array.from(line.children).filter((el) => el !== text);
    const otherWidth = children.reduce((sum, el) => sum + el.offsetWidth, 0);
    const gap = 6 * Math.max(0, line.children.length - 1);
    const available = Math.max(0, totalWidth - otherWidth - gap);
    if (text.scrollWidth <= available) return;
    const shift = available - text.scrollWidth;
    text.style.setProperty('--marquee-shift', `${shift}px`);
    text.style.animationDuration = '10s';
    text.style.animationTimingFunction = 'ease-in-out';
    text.style.animationIterationCount = '2';
    text.style.animationDirection = 'alternate';
    text.style.animationFillMode = 'both';
    text.style.animationName = 'announce-bounce';
    line.dataset.marqueeApplied = 'true';
  });
}

const LOCATION_LOOKUP = {
  '盟重省 - 盟重入口': { zoneId: 'mg_plains', roomId: 'gate' },
  '土城集市': { zoneId: 'mg_town', roomId: 'mg_market' },
  '沃玛寺庙 - 寺庙入口': { zoneId: 'wms', roomId: 'entrance' },
  '祖玛寺庙 - 祖玛大厅': { zoneId: 'zm', roomId: 'hall' },
  '赤月峡谷 - 赤月入口': { zoneId: 'cr', roomId: 'valley' },
  '世界BOSS领域 - 炎龙巢穴': { zoneId: 'wb', roomId: 'lair' },
  '魔龙城 - 魔龙深处': { zoneId: 'molong', roomId: 'deep' },
  '沙巴克宫殿 - 皇宫大门': { zoneId: 'sabak', roomId: 'palace' },
  '沙巴克宫殿 - 皇宫大厅': { zoneId: 'sabak', roomId: 'hall' },
  '沙巴克宫殿 - 皇宫内殿': { zoneId: 'sabak', roomId: 'throne' }
};

function parseLocationMessage(text) {
  if (!text) return null;
  const match = text.match(/^\[([^\]]+)\]\s+我在\s+(.+?)\s+-\s+(.+)$/);
  if (!match) return null;
  return { player: match[1], location: `${match[2]} - ${match[3]}` };
}

function parseStaticLocationLink(text) {
  if (!text) return null;
  const normalized = text.trim();
  const entry = LOCATION_LOOKUP[normalized];
  if (!entry) return null;
  return { label: normalized, ...entry };
}

function appendLine(payload) {
  // 兼容字符串和对象两种参数
  const text = typeof payload === 'string' ? payload : payload.text;
  if (!text) return;
  const normalizedPayload = typeof payload === 'string' ? { text: payload } : payload;

  // 过滤聊天信息，不显示在实时日志中
  if (isChatLine(text)) {
    return;
  }
  // 公告只在聊天区显示
  if (isAnnouncement(normalizedPayload)) {
    return;
  }

  // 过滤伤害和战斗信息
  const isSkillHintLine = /释放了.*[!！]|施放.*召唤了/.test(text);
  const isDamageLine = /你释放了|对.*造成.*点伤害|受到.*点伤害|闪避了.*的攻击|躲过了.*的攻击|溅射到|造成.*点伤害|中了毒|中毒伤害|毒特效|恢复.*点生命|施放.*恢复|暴击|连击触发|破防攻击|破防效果|无敌状态|无敌效果|减伤效果|禁疗影响|禁疗效果|免疫了所有伤害|处于无敌|施放.*护盾|震退了怪物|施放.*，震退|施放.*，造成范围伤害|攻击落空|被麻痹戒指定身|被麻痹|无法行动|施毒成功|施毒失败/.test(text);
  if (isDamageLine) {
    const selfName = activeChar || lastState?.player?.name || '你';
    const dmgMatch = text.match(/(\d+)\s*点伤害/);
    const healMatch = text.match(/(\d+)\s*点生命/);
    const targetMatch = text.match(/对\s*([^\s]+)\s*(造成|施放|释放|附加)/);
    const directTargetMatch = text.match(/^([^\s]+)\s*(恢复|受到|中毒|暴击|施放|触发)/);
    const splashMatch = text.match(/溅射到\s*([^\s]+)/);
    const mentionsSelf = text.startsWith('你') || text.includes('对你') || text.includes('你受到') || text.includes('你恢复');
    const rawTarget = targetMatch?.[1] || splashMatch?.[1] || directTargetMatch?.[1] || (mentionsSelf ? '你' : null);
    const targetName = rawTarget === '你' ? selfName : rawTarget;
    const targetIsPlayer = rawTarget === '你' || (!rawTarget && mentionsSelf);

    let kind = targetIsPlayer ? 'player' : 'mob';
    let label = null;
    let amount = dmgMatch?.[1] || null;

    const isHealLine = /恢复.*点生命|施放.*恢复|恢复了.*生命/.test(text);
    const isPoisonLine = /中毒伤害|中了毒|中毒/.test(text);
    const isShieldLine = /护盾/.test(text);
    const isCritLine = /暴击/.test(text);

    const skipPoisonFloat = isPoisonLine;
    if (isHealLine) {
      kind = 'heal';
      amount = healMatch?.[1] || null;
      label = amount ? `+${amount}` : '恢复';
    } else if (isShieldLine) {
      kind = 'shield';
      const shieldMatch = text.match(/(\d+)\s*点/);
      amount = shieldMatch?.[1] || null;
      label = amount ? `护盾 ${amount}` : '护盾';
    } else if (isCritLine) {
      kind = 'crit';
      label = amount ? `暴击! ${amount}` : '暴击!';
    } else if (amount) {
      label = `-${amount}`;
    }

    if (!skipPoisonFloat && amount && targetName && !isSummonName(targetName)) {
      const applyFn = isHealLine ? applyLocalHeal : applyLocalDamage;
      if (targetIsPlayer) {
        const updated = applyFn('players', targetName, Number(amount));
        if (updated) {
          const card = pickPlayerCardByName(targetName);
          updateBattleCardHp(card, updated.hp, updated.maxHp, false);
        }
      } else if (targetName !== selfName) {
        const updated = applyFn('mobs', targetName, Number(amount));
        if (updated) {
          const card = pickMobCardByName(targetName);
          updateBattleCardHp(card, updated.hp, updated.maxHp, true);
          if (card) {
            card.dataset.mobHp = String(updated.hp);
          }
        }
      }
    }
    if (isPoisonLine && !targetName) {
      return;
    }
    if (!skipPoisonFloat && targetName) {
      if (isSummonName(targetName)) {
        return;
      }
      const selectedMobId = selectedMob && targetName === selectedMob.name ? selectedMob.id : null;
      if (targetIsPlayer) {
        spawnDamageFloatOnPlayer(targetName, amount, kind, label);
      } else if (targetName === selfName) {
        // 不要飘召唤物或其他玩家的血
      } else {
        spawnDamageFloatOnMob(targetName, amount, kind, label, selectedMobId);
      }
    }
  }
  if (!showDamage && (isDamageLine || isSkillHintLine)) {
    return;
  }
  // 过滤经验和金币信息
  const isExpGoldLine = /获得.*点经验|获得.*金币/.test(text);
  if (!showExpGold && isExpGoldLine) {
    return;
  }

  // 过滤排行榜信息，不显示在实时日志中
  if (parseRankLine(text)) {
    return;
  }

  const p = buildLine(normalizedPayload);
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
  applyAnnounceMarquee(p);
}

function formatServerTime(ms) {
  if (!ms) return '-';
  return new Date(ms).toLocaleString('zh-CN', { hour12: false });
}

function getServerNow() {
  if (serverTimeBase == null || serverTimeLocal == null) return Date.now();
  const delta = Date.now() - serverTimeLocal;
  return serverTimeBase + delta;
}

function updateServerTimeDisplay() {
  if (!ui.serverTime || serverTimeBase == null || serverTimeLocal == null) return;
  const delta = Date.now() - serverTimeLocal;
  ui.serverTime.textContent = formatServerTime(serverTimeBase + delta);
}

function appendChatLine(payload) {
  if (!chat.log) return;
  console.log('appendChatLine called with payload:', payload);
  const p = buildLine(payload);
  const loc = parseLocationMessage(normalizePayload(payload).text);
  const data = normalizePayload(payload);
  const staticLoc = parseStaticLocationLink(data.text);
  console.log('Parsed - loc:', loc, 'data.location:', data.location, 'staticLoc:', staticLoc);
  if (data.location && socket) {
    console.log('Location data:', data.location);
    // 修改位置文字，只保留"我在"部分
    const textSpan = p.querySelector('.line-text');
    if (textSpan) {
      const locationText = textSpan.textContent;
      const locationMatch = locationText.match(/^(.*?)我在\s+(.+?)\s+-\s+(.+?)$/);
      if (locationMatch) {
        textSpan.textContent = locationMatch[1] + '我在 ';
      }
    }

    // 添加位置标签按钮（可点击跳转）
    const labelBtn = document.createElement('button');
    labelBtn.className = 'chat-link-tag';
    labelBtn.textContent = data.location.label || '世界BOSS领域 - 炎龙巢穴';
    labelBtn.addEventListener('click', () => {
      const cmd = `goto_room ${data.location.zoneId}:${data.location.roomId}`;
      console.log('Sending command:', cmd);
      socket.emit('cmd', { text: cmd });
    });
    p.appendChild(labelBtn);
  }
  if (staticLoc && socket && !data.location) {
    console.log('Static location found:', staticLoc);
    const btn = document.createElement('button');
    btn.className = 'chat-link-tag';
    btn.textContent = staticLoc.label;
    btn.addEventListener('click', () => {
      const cmd = `goto_room ${staticLoc.zoneId}:${staticLoc.roomId}`;
      console.log('Sending command:', cmd);
      socket.emit('cmd', { text: cmd });
    });
    p.appendChild(btn);
  }
  chat.log.appendChild(p);
  chat.log.scrollTop = chat.log.scrollHeight;
  if (activeChar) cacheChatLine(activeChar, payload);
  applyAnnounceMarquee(p);
}

function parseTradeRequest(text) {
  if (!text) return null;
  const match = text.match(/^(.+?) 请求交易/);
  if (!match) return null;
  return match[1];
}

function handleTradeInvite(from) {
  if (!from || !socket) return;
  const now = Date.now();
  const lastAt = tradeInviteCooldown.get(from) || 0;
  if (now - lastAt < 1500) return;
  tradeInviteCooldown.set(from, now);
  promptModal({
    title: '交易请求',
    text: `${from} 请求交易，是否接受？`,
    placeholder: '',
    extra: { text: '拒绝' },
    allowEmpty: true
  }).then((res) => {
    if (res === '__extra__') {
      socket.emit('cmd', { text: `trade cancel` });
      return;
    }
    if (res === null) return;
    const targetName = res || from;
    socket.emit('cmd', { text: `trade accept ${targetName}` });
  });
}


function parseFollowInvite(text) {
  if (!text) return null;
  const match = text.match(/^(.+?) 邀请你跟随/);
  if (match) {
    return match[1];
  }
  return null;
}


function chatCacheKey(name) {
  return `chat_cache_${name}`;
}

function cacheChatLine(name, payload) {
  try {
    const key = chatCacheKey(name);
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    list.push(normalizePayload(payload));
    if (list.length > CHAT_CACHE_LIMIT) {
      list.splice(0, list.length - CHAT_CACHE_LIMIT);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Ignore cache failures.
  }
}

function loadChatCache(name) {
  if (!chat.log) return;
  chat.log.innerHTML = '';
  try {
    const key = chatCacheKey(name);
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) {
      list.forEach((entry) => {
        const p = buildLine(entry);
        const loc = parseLocationMessage(normalizePayload(entry).text);
        const data = normalizePayload(entry);
        const staticLoc = parseStaticLocationLink(data.text);
        // 重新绑定位置跳转按钮事件
        if (data.location && socket) {
          console.log('Location data in history:', data.location);
          // 修改位置文字，只保留"我在"部分
          const textSpan = p.querySelector('.line-text');
          if (textSpan) {
            const locationText = textSpan.textContent;
            const locationMatch = locationText.match(/^(.*?)我在\s+(.+?)\s+-\s+(.+?)$/);
            if (locationMatch) {
              textSpan.textContent = locationMatch[1] + '我在 ';
            }
          }
          const labelBtn = document.createElement('button');
          labelBtn.className = 'chat-link-tag';
          labelBtn.textContent = data.location.label || '世界BOSS领域 - 炎龙巢穴';
          labelBtn.addEventListener('click', () => {
            socket.emit('cmd', { text: `goto_room ${data.location.zoneId}:${data.location.roomId}` });
          });
          p.appendChild(labelBtn);
        }
        if (staticLoc && socket) {
          const btn = document.createElement('button');
          btn.className = 'chat-link-tag';
          btn.textContent = staticLoc.label;
          btn.addEventListener('click', () => {
            socket.emit('cmd', { text: `goto_room ${staticLoc.zoneId}:${staticLoc.roomId}` });
          });
          p.appendChild(btn);
        }
        chat.log.appendChild(p);
        applyAnnounceMarquee(p);
      });
      chat.log.scrollTop = chat.log.scrollHeight;
    }
  } catch {
    // Ignore cache failures.
  }
}

function setTradeStatus(text) {
  if (!tradeUi.status) return;
  tradeUi.status.textContent = text;
  if (!tradeUi.modal) return;
  if (!text) return;
  if (text.includes('交易建立')) {
    tradeUi.modal.classList.remove('hidden');
    if (lastState) {
      refreshTradeItemOptions(buildItemTotals(lastState.items || []));
    }
  } else if (
    text.includes('交易完成') ||
    text.includes('交易已取消') ||
    text.includes('交易失败') ||
    text.includes('未在交易中')
  ) {
    tradeUi.modal.classList.add('hidden');
  }
}

function setTradePartnerStatus(text) {
  if (!tradeUi.partnerStatus) return;
  tradeUi.partnerStatus.textContent = text;
}

function buildItemTotals(items) {
  const totals = {};
  (items || []).forEach((i) => {
    const key = i.key || i.id;
    if (!totals[key]) {
      totals[key] = { ...i, qty: 0, key };
    }
    totals[key].qty += i.qty;
  });
  return Object.values(totals);
}

function refreshTradeItemOptions(items) {
  if (!tradeUi.itemSelect) return;
  const list = Array.isArray(items) ? items : [];
  const savedValue = tradeUi.itemSelect.value;
  tradeUi.itemSelect.innerHTML = '';
  if (!list.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '无可用物品';
    tradeUi.itemSelect.appendChild(opt);
  } else {
    list.forEach((entry) => {
      const opt = document.createElement('option');
      opt.value = entry.key || entry.id;
      opt.textContent = `${formatItemName(entry)} x${entry.qty}`;
      tradeUi.itemSelect.appendChild(opt);
    });
  }
  if (savedValue && list.some(e => (e.key || e.id) === savedValue)) {
    tradeUi.itemSelect.value = savedValue;
  }
}

function updateTradeDisplay() {
  if (!tradeUi.myItems || !tradeUi.partnerItems) return;

  // 更新我方物品
  tradeUi.myItems.innerHTML = '';
  if (tradeData.myItems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'trade-empty';
    empty.textContent = '暂无物品';
    tradeUi.myItems.appendChild(empty);
  } else {
    tradeData.myItems.forEach((item) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'trade-item';
      const itemTemplate = findItemByDisplayName(item.name);
      applyRarityClass(itemDiv, itemTemplate);
      itemDiv.textContent = `${item.name} x${item.qty}`;
      tradeUi.myItems.appendChild(itemDiv);
    });
  }

  // 更新对方物品
  tradeUi.partnerItems.innerHTML = '';
  if (tradeData.partnerItems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'trade-empty';
    empty.textContent = '暂无物品';
    tradeUi.partnerItems.appendChild(empty);
  } else {
    tradeData.partnerItems.forEach((item) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'trade-item';
      const itemTemplate = findItemByDisplayName(item.name);
      applyRarityClass(itemDiv, itemTemplate);
      itemDiv.textContent = `${item.name} x${item.qty}`;
      tradeUi.partnerItems.appendChild(itemDiv);
    });
  }

  // 更新金币
  if (tradeUi.myGold) tradeUi.myGold.textContent = `金币: ${tradeData.myGold}`;
  if (tradeUi.partnerGold) tradeUi.partnerGold.textContent = `金币: ${tradeData.partnerGold}`;
}

function updateTradePartnerStatus(text) {
  // 解析交易消息并更新对方锁定/确认状态
  if (!activeChar) return;

  if (text.includes('已锁定交易')) {
    // 提取玩家名
    const match = text.match(/^(.+?) 已锁定交易/);
    if (match && match[1] !== activeChar) {
      // 对方锁定了
      setTradePartnerStatus(`对方（${match[1]}）已锁定交易`);
    } else if (match && match[1] === activeChar) {
      // 自己锁定了，确保物品显示仍然可见
      updateTradeDisplay();
    }
  } else if (text.includes('已确认交易')) {
    const match = text.match(/^(.+?) 已确认交易/);
    if (match && match[1] !== activeChar) {
      // 对方确认了
      setTradePartnerStatus(`对方（${match[1]}）已确认交易`);
    }
  } else if (text.includes('双方已锁定')) {
    setTradePartnerStatus('双方已锁定');
    updateTradeDisplay();
  } else if (text.includes('交易建立')) {
    // 重置交易数据
    tradeData = {
      myItems: [],
      myGold: 0,
      partnerItems: [],
      partnerGold: 0,
      partnerName: ''
    };
    updateTradeDisplay();
    setTradePartnerStatus('');
  } else if (text.includes('交易完成') || text.includes('交易已取消') || text.includes('交易失败')) {
    // 重置交易数据
    tradeData = {
      myItems: [],
      myGold: 0,
      partnerItems: [],
      partnerGold: 0,
      partnerName: ''
    };
    updateTradeDisplay();
    setTradePartnerStatus('');
  }
}

function parseTradeItems(text) {
  // 解析交易消息，更新物品和金币显示
  if (!activeChar) return;

  // 解析"你放入: 物品名 x数量"
  const myItemMatch = text.match(/^你放入: (.+) x(\d+)$/);
  if (myItemMatch) {
    const name = myItemMatch[1];
    const qty = parseInt(myItemMatch[2], 10);
    const existing = tradeData.myItems.find((item) => item.name === name);
    if (existing) {
      existing.qty += qty;
    } else {
      tradeData.myItems.push({ name, qty });
    }
    updateTradeDisplay();
  }

  // 解析"你放入金币: 数量 (总计 总数量)"
  const myGoldMatch = text.match(/^你放入金币: (\d+)/);
  if (myGoldMatch) {
    tradeData.myGold = parseInt(myGoldMatch[1], 10);
    updateTradeDisplay();
  }

  // 解析对方放入的物品
  const partnerMatch = text.match(/^(.+?) 放入: (.+) x(\d+)$/);
  if (partnerMatch) {
    const playerName = partnerMatch[1];
    const name = partnerMatch[2];
    const qty = parseInt(partnerMatch[3], 10);
    tradeData.partnerName = playerName;
    const existing = tradeData.partnerItems.find((item) => item.name === name);
    if (existing) {
      existing.qty += qty;
    } else {
      tradeData.partnerItems.push({ name, qty });
    }
    updateTradeDisplay();
  }

  // 解析对方放入的金币
  const partnerGoldMatch = text.match(/^(.+?) 放入金币: (\d+)/);
  if (partnerGoldMatch) {
    const playerName = partnerGoldMatch[1];
    tradeData.partnerName = playerName;
    tradeData.partnerGold = parseInt(partnerGoldMatch[2], 10);
    updateTradeDisplay();
  }
}

function promptModal({ title, text, placeholder, value, extra, allowEmpty, type }) {
  if (!promptUi.modal || !promptUi.input) return Promise.resolve(null);
  return new Promise((resolve) => {
    const prevType = promptUi.input.type;
    const onCancel = () => {
      cleanup();
      resolve(null);
    };
    const onOk = () => {
      const result = promptUi.input.value.trim();
      cleanup();
      if (result) return resolve(result);
      resolve(allowEmpty ? '' : null);
    };
    const onExtra = () => {
      cleanup();
      resolve('__extra__');
    };
    const onKey = (e) => {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };
    const onBackdrop = (e) => {
      if (e.target === promptUi.modal) onCancel();
    };
    const cleanup = () => {
      promptUi.ok.removeEventListener('click', onOk);
      promptUi.cancel.removeEventListener('click', onCancel);
      promptUi.input.removeEventListener('keydown', onKey);
      promptUi.modal.removeEventListener('click', onBackdrop);
      promptUi.modal.classList.add('hidden');
      promptUi.input.type = prevType || 'text';
      if (promptUi.label) {
        promptUi.label.classList.add('hidden');
        promptUi.label.textContent = '';
      }
      if (promptUi.secondaryRow) {
        promptUi.secondaryRow.classList.add('hidden');
      }
      if (promptUi.inputSecondary) {
        promptUi.inputSecondary.value = '';
        promptUi.inputSecondary.placeholder = '';
      }
      if (promptUi.extra) {
        promptUi.extra.removeEventListener('click', onExtra);
        promptUi.extra.classList.add('hidden');
      }
    };

    promptUi.title.textContent = title || '输入';
    promptUi.text.textContent = text || '';
    if (promptUi.label) {
      promptUi.label.classList.add('hidden');
      promptUi.label.textContent = '';
    }
    if (promptUi.secondaryRow) {
      promptUi.secondaryRow.classList.add('hidden');
    }
    if (promptUi.inputSecondary) {
      promptUi.inputSecondary.value = '';
      promptUi.inputSecondary.placeholder = '';
    }
    promptUi.input.classList.remove('hidden');
    promptUi.input.placeholder = placeholder || '';
    promptUi.input.value = value || '';
    promptUi.input.type = type || 'text';
    if (promptUi.extra) {
      if (extra && extra.text) {
        promptUi.extra.textContent = extra.text;
        promptUi.extra.classList.remove('hidden');
        promptUi.extra.addEventListener('click', onExtra);
      } else {
        promptUi.extra.classList.add('hidden');
        promptUi.extra.textContent = '';
      }
    }
    promptUi.ok.addEventListener('click', onOk);
    promptUi.cancel.addEventListener('click', onCancel);
    promptUi.input.addEventListener('keydown', onKey);
    promptUi.modal.addEventListener('click', onBackdrop);
    promptUi.modal.classList.remove('hidden');
    setTimeout(() => promptUi.input.focus(), 0);
  });
}

function promptDualModal({
  title,
  text,
  labelMain,
  labelSecondary,
  placeholderMain,
  placeholderSecondary,
  valueMain,
  valueSecondary,
  typeMain,
  typeSecondary,
  allowEmpty
}) {
  if (!promptUi.modal || !promptUi.input || !promptUi.inputSecondary) return Promise.resolve(null);
  return new Promise((resolve) => {
    const prevType = promptUi.input.type;
    const prevSecondaryType = promptUi.inputSecondary.type;
    const onCancel = () => {
      cleanup();
      resolve(null);
    };
    const onOk = () => {
      const main = promptUi.input.value.trim();
      const secondary = promptUi.inputSecondary.value.trim();
      cleanup();
      if (main && secondary) return resolve({ main, secondary });
      resolve(allowEmpty ? { main, secondary } : null);
    };
    const onKey = (e) => {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };
    const cleanup = () => {
      promptUi.ok.removeEventListener('click', onOk);
      promptUi.cancel.removeEventListener('click', onCancel);
      promptUi.input.removeEventListener('keydown', onKey);
      promptUi.inputSecondary.removeEventListener('keydown', onKey);
      promptUi.modal.classList.add('hidden');
      promptUi.input.type = prevType || 'text';
      promptUi.inputSecondary.type = prevSecondaryType || 'text';
      if (promptUi.label) {
        promptUi.label.classList.add('hidden');
        promptUi.label.textContent = '';
      }
      if (promptUi.secondaryRow) {
        promptUi.secondaryRow.classList.add('hidden');
      }
      if (promptUi.labelSecondary) {
        promptUi.labelSecondary.textContent = '';
      }
      if (promptUi.inputSecondary) {
        promptUi.inputSecondary.value = '';
        promptUi.inputSecondary.placeholder = '';
      }
      if (promptUi.extra) {
        promptUi.extra.classList.add('hidden');
        promptUi.extra.textContent = '';
      }
    };

    promptUi.title.textContent = title || '输入';
    promptUi.text.textContent = text || '';
    if (promptUi.label) {
      promptUi.label.textContent = labelMain || '主件';
      promptUi.label.classList.remove('hidden');
    }
    if (promptUi.secondaryRow) {
      promptUi.secondaryRow.classList.remove('hidden');
    }
    if (promptUi.labelSecondary) {
      promptUi.labelSecondary.textContent = labelSecondary || '副件';
    }
    if (promptUi.extra) {
      promptUi.extra.classList.add('hidden');
      promptUi.extra.textContent = '';
    }
    promptUi.input.classList.remove('hidden');
    promptUi.input.placeholder = placeholderMain || '';
    promptUi.input.value = valueMain || '';
    promptUi.input.type = typeMain || 'text';
    promptUi.inputSecondary.placeholder = placeholderSecondary || '';
    promptUi.inputSecondary.value = valueSecondary || '';
    promptUi.inputSecondary.type = typeSecondary || 'text';
    promptUi.ok.addEventListener('click', onOk);
    promptUi.cancel.addEventListener('click', onCancel);
    promptUi.input.addEventListener('keydown', onKey);
    promptUi.inputSecondary.addEventListener('keydown', onKey);
    promptUi.modal.classList.remove('hidden');
    setTimeout(() => promptUi.input.focus(), 0);
  });
}

function confirmModal({ title, text }) {
  if (!promptUi.modal || !promptUi.ok || !promptUi.cancel) return Promise.resolve(false);
  return new Promise((resolve) => {
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    const onOk = () => {
      cleanup();
      resolve(true);
    };
    const onKey = (e) => {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };
    const onBackdrop = (e) => {
      if (e.target === promptUi.modal) onCancel();
    };
    const cleanup = () => {
      promptUi.ok.removeEventListener('click', onOk);
      promptUi.cancel.removeEventListener('click', onCancel);
      promptUi.modal.removeEventListener('keydown', onKey);
      promptUi.modal.removeEventListener('click', onBackdrop);
      promptUi.modal.classList.add('hidden');
      promptUi.input.classList.remove('hidden');
      if (promptUi.label) {
        promptUi.label.classList.add('hidden');
        promptUi.label.textContent = '';
      }
      if (promptUi.secondaryRow) {
        promptUi.secondaryRow.classList.add('hidden');
      }
      if (promptUi.inputSecondary) {
        promptUi.inputSecondary.value = '';
        promptUi.inputSecondary.placeholder = '';
      }
      if (promptUi.extra) {
        promptUi.extra.classList.add('hidden');
        promptUi.extra.textContent = '';
      }
    };

    promptUi.title.textContent = title || '确认';
    promptUi.text.textContent = text || '';
    promptUi.input.classList.add('hidden');
    if (promptUi.label) {
      promptUi.label.classList.add('hidden');
      promptUi.label.textContent = '';
    }
    if (promptUi.secondaryRow) {
      promptUi.secondaryRow.classList.add('hidden');
    }
    if (promptUi.extra) {
      promptUi.extra.classList.add('hidden');
      promptUi.extra.textContent = '';
    }
    promptUi.ok.addEventListener('click', onOk);
    promptUi.cancel.addEventListener('click', onCancel);
    promptUi.modal.addEventListener('keydown', onKey);
    promptUi.modal.addEventListener('click', onBackdrop);
    promptUi.modal.classList.remove('hidden');
  });
}

function showShopModal(items) {
  if (!shopUi.modal || !shopUi.list) return;
  hideItemTooltip();
  shopUi.list.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u5546\u5E97\u65E0\u5546\u54C1';
    shopUi.list.appendChild(empty);
  } else {
      items.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'shop-item';
        const displayPrice = shopDisplayPrice(item);
        card.textContent = `${item.name} (${displayPrice}\u91D1)`;
        card.addEventListener('click', async () => {
          const qtyText = await promptModal({
            title: '\u6279\u91cf\u8d2d\u4e70',
            text: `\u8bf7\u8f93\u5165\u8d2d\u4e70\u6570\u91cf: ${item.name}`,
          placeholder: '1',
          value: '1'
        });
        if (!qtyText) return;
        const qty = Math.max(1, Number(qtyText || 1));
        if (Number.isNaN(qty) || qty <= 0) return;
        if (socket) socket.emit('cmd', { text: `buy ${item.name} ${qty}` });
      });
      shopUi.list.appendChild(card);
    });
  }
  renderShopSellList(lastState ? lastState.items : []);
  shopUi.modal.classList.remove('hidden');
}

function filterConsignItems(items, filter) {
  if (!filter || filter === 'all') return items;
  if (filter === 'accessory') {
    return items.filter((entry) => entry && entry.item &&
      ['ring', 'ring_left', 'ring_right', 'bracelet', 'bracelet_left', 'bracelet_right', 'neck', 'accessory'].includes(entry.item.type) ||
      ['ring', 'ring_left', 'ring_right', 'bracelet', 'bracelet_left', 'bracelet_right', 'neck'].includes(entry.item.slot));
  }
  return items.filter((entry) => entry && entry.item && entry.item.type === filter);
}

function paginateItems(items, page) {
  const totalPages = Math.max(1, Math.ceil(items.length / CONSIGN_PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * CONSIGN_PAGE_SIZE;
  return { totalPages, page: safePage, slice: items.slice(start, start + CONSIGN_PAGE_SIZE) };
}

function renderConsignMarket(items) {
  if (!consignUi.marketList) return;
  consignUi.marketList.innerHTML = '';
  const filtered = filterConsignItems(items, consignMarketFilter).slice()
    .sort((a, b) => sortByRarityDesc(a.item, b.item));
  const { totalPages, page, slice } = paginateItems(filtered, consignMarketPage);
  consignMarketPage = page;
  if (!slice.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u5BC4\u552E\u5E02\u573A\u6682\u65E0\u5546\u54C1';
    consignUi.marketList.appendChild(empty);
  } else {
    slice.forEach((entry) => {
    const btn = document.createElement('div');
    btn.className = 'consign-item';
    applyRarityClass(btn, entry.item);
      btn.innerHTML = `${formatItemName(entry.item)} x${entry.qty} (${entry.price}\u91D1)<small>${entry.seller}</small>`;
    const tooltip = formatItemTooltip(entry.item);
    if (tooltip) {
      btn.addEventListener('mouseenter', (evt) => showItemTooltip(tooltip, evt));
      btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      btn.addEventListener('mouseleave', hideItemTooltip);
    }
    btn.addEventListener('click', async () => {
      if (!socket) return;
      let qty = 1;
      if (entry.qty > 1) {
          const qtyText = await promptModal({
            title: '\u8D2D\u4E70\u5BC4\u552E',
            text: `\u8BF7\u8F93\u5165\u8D2D\u4E70\u6570\u91CF: ${formatItemName(entry.item)}`,
            placeholder: '1',
            value: '1'
          });
        if (!qtyText) return;
        qty = Math.max(1, Number(qtyText || 1));
        if (Number.isNaN(qty) || qty <= 0) return;
      }
      const confirmed = await confirmModal({
        title: '\u786E\u8BA4\u8D2D\u4E70',
        text: `\u786E\u8BA4\u8D2D\u4E70 ${formatItemName(entry.item)} x${qty}\uFF1F\n\u4EF7\u683C: ${entry.price * qty}\u91D1`
      });
      if (!confirmed) return;
      socket.emit('cmd', { text: `consign buy ${entry.id} ${qty}` });
      socket.emit('cmd', { text: 'consign list' });
    });
    consignUi.marketList.appendChild(btn);
    });
  }
  if (consignUi.marketPage) {
    consignUi.marketPage.textContent = `\u7B2C ${consignMarketPage + 1}/${totalPages} \u9875`;
  }
  if (consignUi.marketPrev) consignUi.marketPrev.disabled = consignMarketPage <= 0;
  if (consignUi.marketNext) consignUi.marketNext.disabled = consignMarketPage >= totalPages - 1;
}

function renderConsignMine(items) {
  if (!consignUi.myList) return;
  consignUi.myList.innerHTML = '';
  const sorted = (items || []).slice().sort((a, b) => sortByRarityDesc(a.item, b.item));
  const { totalPages, page, slice } = paginateItems(sorted, consignMyPage);
  consignMyPage = page;
  if (!slice.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u6682\u65E0\u5BC4\u552E';
    consignUi.myList.appendChild(empty);
    return;
  }
  slice.forEach((entry) => {
    const btn = document.createElement('div');
    btn.className = 'consign-item';
    applyRarityClass(btn, entry.item);
      btn.innerHTML = `${formatItemName(entry.item)} x${entry.qty} (${entry.price}\u91D1)<small>\u7F16\u53F7 ${entry.id}</small>`;
    const tooltip = formatItemTooltip(entry.item);
    if (tooltip) {
      btn.addEventListener('mouseenter', (evt) => showItemTooltip(tooltip, evt));
      btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      btn.addEventListener('mouseleave', hideItemTooltip);
    }
    btn.addEventListener('click', () => {
      if (!socket) return;
      socket.emit('cmd', { text: `consign cancel ${entry.id}` });
      socket.emit('cmd', { text: 'consign my' });
    });
    consignUi.myList.appendChild(btn);
  });
  if (consignUi.myPage) {
    consignUi.myPage.textContent = `\u7B2C ${consignMyPage + 1}/${totalPages} \u9875`;
  }
  if (consignUi.myPrev) consignUi.myPrev.disabled = consignMyPage <= 0;
  if (consignUi.myNext) consignUi.myNext.disabled = consignMyPage >= totalPages - 1;
}

function renderConsignInventory(items) {
  if (!consignUi.inventoryList) return;
  consignUi.inventoryList.innerHTML = '';
  const equipItems = (items || []).filter((item) =>
    item && ['weapon', 'armor', 'accessory', 'book'].includes(item.type)
  );
  const sortedItems = equipItems.slice().sort(sortByRarityDesc);
  consignInventoryItems = sortedItems;
  const { totalPages, page, slice } = paginateItems(sortedItems, consignInventoryPage);
  consignInventoryPage = page;
  if (!slice.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u6CA1\u6709\u53EF\u5BC4\u552E\u7684\u88C5\u5907';
    consignUi.inventoryList.appendChild(empty);
    return;
  }
  slice.forEach((item) => {
    const btn = document.createElement('div');
    btn.className = 'consign-item';
    applyRarityClass(btn, item);
      btn.textContent = `${formatItemName(item)} x${item.qty}`;
    const tooltip = formatItemTooltip(item);
    if (tooltip) {
      btn.addEventListener('mouseenter', (evt) => showItemTooltip(tooltip, evt));
      btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      btn.addEventListener('mouseleave', hideItemTooltip);
    }
    btn.addEventListener('click', async () => {
      if (!socket) return;
      let qty = 1;
      if (item.qty > 1) {
          const qtyText = await promptModal({
            title: '\u5BC4\u552E\u6570\u91CF',
            text: `\u8BF7\u8F93\u5165\u5BC4\u552E\u6570\u91CF: ${formatItemName(item)}`,
            placeholder: '1',
            value: '1'
          });
        if (!qtyText) return;
        qty = Math.max(1, Number(qtyText || 1));
        if (Number.isNaN(qty) || qty <= 0) return;
      }
        const priceText = await promptModal({
          title: '\u5BC4\u552E\u4EF7\u683C',
          text: `\u8BF7\u8F93\u5165\u5355\u4EF7: ${formatItemName(item)}`,
          placeholder: '1000',
          value: '1000'
        });
      if (!priceText) return;
      const price = Math.max(1, Number(priceText || 0));
      if (Number.isNaN(price) || price <= 0) return;
        const key = item.key || item.id;
        socket.emit('cmd', { text: `consign sell ${key} ${qty} ${price}` });
      socket.emit('cmd', { text: 'consign my' });
      socket.emit('cmd', { text: 'consign list' });
    });
    consignUi.inventoryList.appendChild(btn);
  });
  if (consignUi.inventoryPage) {
    consignUi.inventoryPage.textContent = `\u7B2C ${consignInventoryPage + 1}/${totalPages} \u9875`;
  }
  if (consignUi.inventoryPrev) consignUi.inventoryPrev.disabled = consignInventoryPage <= 0;
  if (consignUi.inventoryNext) consignUi.inventoryNext.disabled = consignInventoryPage >= totalPages - 1;
}

function renderConsignHistory(items) {
  if (!consignUi.historyList) return;
  consignUi.historyList.innerHTML = '';
  consignHistoryItems = items || [];
  const { totalPages, page, slice } = paginateItems(consignHistoryItems, consignHistoryPage);
  consignHistoryPage = page;
  if (!slice.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u6682\u65E0\u5BC4\u552E\u8BB0\u5F55';
    consignUi.historyList.appendChild(empty);
    return;
  }
  slice.forEach((entry) => {
    const div = document.createElement('div');
    div.className = 'consign-history-item';
    applyRarityClass(div, entry.item);
    const date = new Date(entry.soldAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    div.innerHTML = `
      <div class="consign-history-item-header">
        <span class="consign-history-item-item">${formatItemName(entry.item)} x${entry.qty}</span>
        <span>${entry.total}\u91D1</span>
      </div>
      <div class="consignment-history-meta">
        <span>\u4E70\u5BB6: ${entry.buyer}</span>
        <span>\u5355\u4EF7: ${entry.price}\u91D1</span>
        <span>${dateStr}</span>
      </div>
    `;
    const itemSpan = div.querySelector('.consign-history-item-item');
    applyRarityClass(itemSpan, entry.item);
    const tooltip = formatItemTooltip(entry.item);
    if (tooltip) {
      div.addEventListener('mouseenter', (evt) => showItemTooltip(tooltip, evt));
      div.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      div.addEventListener('mouseleave', hideItemTooltip);
    }
    consignUi.historyList.appendChild(div);
  });
  if (consignUi.historyPage) {
    consignUi.historyPage.textContent = `\u7B2C ${consignHistoryPage + 1}/${totalPages} \u9875`;
  }
  if (consignUi.historyPrev) consignUi.historyPrev.disabled = consignHistoryPage <= 0;
  if (consignUi.historyNext) consignUi.historyNext.disabled = consignHistoryPage >= totalPages - 1;
}

function showConsignModal() {
  if (!consignUi.modal) return;
  hideItemTooltip();
  consignMarketPage = 0;
  consignMyPage = 0;
  consignInventoryPage = 0;
  consignHistoryPage = 0;
  consignMarketFilter = 'all';
  if (consignUi.filters && consignUi.filters.length) {
    consignUi.filters.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
  }
  if (consignUi.tabs && consignUi.tabs.length) {
    consignUi.tabs.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === 'market');
    });
  }
  if (consignUi.panels && consignUi.panels.length) {
    consignUi.panels.forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset.panel !== 'market');
    });
  }
  if (socket) {
    socket.emit('cmd', { text: 'consign list' });
    socket.emit('cmd', { text: 'consign my' });
    socket.emit('cmd', { text: 'consign history' });
  }
  renderConsignInventory(lastState ? lastState.items : []);
  consignUi.modal.classList.remove('hidden');
}

function renderRepairList(equipment) {
  if (!repairUi.list) return;
  repairUi.list.innerHTML = '';
  if (!equipment || !equipment.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u6CA1\u6709\u88C5\u5907';
    repairUi.list.appendChild(empty);
    return;
  }
  const entries = equipment.filter((entry) => entry && entry.item);
  const needRepair = entries.filter((entry) =>
    entry.max_durability && entry.durability != null && entry.durability < entry.max_durability
  );
  if (!needRepair.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u65E0\u9700\u4FEE\u7406';
    repairUi.list.appendChild(empty);
    return;
  }
  needRepair.forEach((entry) => {
    const missing = entry.max_durability - entry.durability;
    const cost = calcRepairCost(entry.item, missing);
    const btn = document.createElement('div');
    btn.className = 'repair-item';
    applyRarityClass(btn, entry.item);
    btn.innerHTML = `${formatItemName(entry.item)}<br>${entry.durability}/${entry.max_durability} (${cost}\u91D1)`;
    const tooltip = formatItemTooltip(entry.item);
    if (tooltip) {
      btn.addEventListener('mouseenter', (evt) => showItemTooltip(tooltip, evt));
      btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      btn.addEventListener('mouseleave', hideItemTooltip);
    }
    repairUi.list.appendChild(btn);
  });
}

function showRepairModal() {
  if (!repairUi.modal) return;
  hideItemTooltip();
  renderRepairList(lastState ? lastState.equipment : []);
  repairUi.modal.classList.remove('hidden');
}

function showChangeClassModal(currentClassId) {
  if (!changeClassUi.modal) return;
  changeClassSelection = null;
  if (changeClassUi.confirm) {
    changeClassUi.confirm.disabled = true;
  }
  changeClassUi.options.forEach((btn) => {
    if (!btn.dataset.label) {
      btn.dataset.label = btn.textContent.trim();
    }
    btn.classList.remove('active');
    btn.classList.remove('selected');
    btn.disabled = false;
    btn.textContent = btn.dataset.label;
    if (currentClassId && btn.dataset.class === currentClassId) {
      btn.classList.add('active');
      btn.disabled = true;
      btn.textContent = `${btn.dataset.label}（当前职业）`;
    }
  });
  changeClassUi.modal.classList.remove('hidden');
}

let forgeSelection = null;
let refineSelection = null;

function listForgeSecondaries(itemId, items) {
  return (items || []).filter((item) =>
    item.id === itemId &&
    ['legendary', 'supreme', 'ultimate'].includes(item.rarity) &&
    (item.qty || 0) > 0 &&
    !(item.effects && item.effects.elementAtk) // 排除带元素属性的物品
  );
}

function renderForgeSecondaryList(itemId) {
  if (!forgeUi.secondaryList || !forgeUi.secondary || !forgeUi.confirm) return;
  forgeUi.secondaryList.innerHTML = '';
  forgeSelection = forgeSelection ? { ...forgeSelection, secondary: null, secondaryKey: null } : null;
  forgeUi.secondary.textContent = '副件: 请选择';
  forgeUi.confirm.disabled = true;
  if (!itemId) {
    const empty = document.createElement('div');
    empty.textContent = '请先选择主件';
    forgeUi.secondaryList.appendChild(empty);
    return;
  }
  const candidates = listForgeSecondaries(itemId, lastState?.items || []);
  if (!candidates.length) {
    const empty = document.createElement('div');
    empty.textContent = '背包没有符合条件的副件（传说及以上、不带元素属性）';
    forgeUi.secondaryList.appendChild(empty);
    return;
  }
  candidates.forEach((item) => {
    const btn = document.createElement('div');
    btn.className = 'forge-item';
    applyRarityClass(btn, item);
    btn.innerHTML = `
      <div>${formatItemName(item)}</div>
      <div class="item-detail">数量: x${item.qty || 1}</div>
    `;
    btn.addEventListener('click', () => {
      Array.from(forgeUi.secondaryList.querySelectorAll('.forge-item')).forEach((node) =>
        node.classList.remove('selected')
      );
      btn.classList.add('selected');
      if (!forgeSelection) return;
      forgeSelection.secondary = item;
      forgeSelection.secondaryKey = item.key;
      forgeUi.secondary.textContent = `副件: ${formatItemName(item)}`;
      forgeUi.confirm.disabled = !forgeSelection.main || !forgeSelection.secondary;
    });
    forgeUi.secondaryList.appendChild(btn);
  });

  // 自动选择第一个副件
  if (candidates.length > 0 && forgeSelection?.main) {
    const firstItem = candidates[0];
    const firstBtn = forgeUi.secondaryList.querySelector('.forge-item');
    if (firstBtn) {
      firstBtn.classList.add('selected');
      forgeSelection.secondary = firstItem;
      forgeSelection.secondaryKey = firstItem.key;
      forgeUi.secondary.textContent = `副件: ${formatItemName(firstItem)}`;
      forgeUi.confirm.disabled = false;
    }
  }
}

function formatForgeMeta(item) {
  if (!item) return '';
  const tags = [];
  if (item.effects && item.effects.combo) tags.push('连击');
  if (item.effects && item.effects.fury) tags.push('狂攻');
  if (item.effects && item.effects.unbreakable) tags.push('不磨');
  if (item.effects && item.effects.defense) tags.push('守护');
  if (item.effects && item.effects.dodge) tags.push('闪避');
  if (item.effects && item.effects.poison) tags.push('毒');
  if (item.effects && item.effects.healblock) tags.push('禁疗');
  if (item.effects && item.effects.elementAtk) tags.push(`元素攻击+${Math.floor(item.effects.elementAtk)}`);
  if (!tags.length) return '特效: 无';
  return `特效: ${tags.join(' / ')}`;
}

function hasSpecialEffects(effects) {
  return effects && Object.keys(effects).length > 0;
}

function renderForgeModal() {
  if (!forgeUi.list || !forgeUi.secondaryList || !forgeUi.main || !forgeUi.secondary || !forgeUi.confirm) return;
  const equipped = (lastState?.equipment || [])
    .filter((entry) => entry.item && ['legendary', 'supreme', 'ultimate'].includes(entry.item.rarity));
  forgeUi.list.innerHTML = '';
  forgeUi.secondaryList.innerHTML = '';
  forgeSelection = null;
  forgeUi.main.textContent = '主件: 未选择';
  forgeUi.secondary.textContent = '副件: 等待选择';
  forgeUi.confirm.disabled = true;
  if (!equipped.length) {
    const empty = document.createElement('div');
    empty.textContent = '暂无已穿戴的传说及以上装备';
    forgeUi.list.appendChild(empty);
    const subEmpty = document.createElement('div');
    subEmpty.textContent = '请先选择主件';
    forgeUi.secondaryList.appendChild(subEmpty);
    return;
  }
  equipped.forEach((entry) => {
    const item = entry.item;
    const btn = document.createElement('div');
    btn.className = 'forge-item';
    applyRarityClass(btn, item);
    btn.innerHTML = `
      <div>${formatItemName(item)}</div>
    `;
    btn.addEventListener('click', () => {
      Array.from(forgeUi.list.querySelectorAll('.forge-item')).forEach((node) =>
        node.classList.remove('selected')
      );
      btn.classList.add('selected');
      forgeSelection = {
        main: item,
        mainSlot: entry.slot,
        secondary: null,
        secondaryKey: null
      };
      forgeUi.main.textContent = `主件: ${formatItemName(item)}`;
      renderForgeSecondaryList(item.id);
    });
    forgeUi.list.appendChild(btn);
  });
}

function showForgeModal() {
  if (!forgeUi.modal) return;
  hideItemTooltip();
  renderForgeModal();
  forgeUi.modal.classList.remove('hidden');
}

function renderRefineModal() {
  if (!refineUi.list || !refineUi.main || !refineUi.level || !refineUi.successRate) return;

  const allEquipment = [];
  // 只获取已装备的装备
  if (lastState?.equipment) {
    lastState.equipment.forEach((equipped) => {
      if (equipped && equipped.item && ['weapon', 'armor', 'accessory'].includes(equipped.item.type)) {
        allEquipment.push({ ...equipped, slotName: equipped.slot, fromEquip: true });
      }
    });
  }

  refineUi.list.innerHTML = '';
  refineSelection = null;
  refineUi.main.textContent = '主件: 未选择';
  refineUi.level.textContent = '当前锻造等级: +0';
  refineUi.successRate.textContent = '成功率: 100%';

  if (!allEquipment.length) {
    const empty = document.createElement('div');
    empty.textContent = '身上暂无装备';
    refineUi.list.appendChild(empty);
    refineUi.confirm.disabled = true;
    return;
  }

  allEquipment.forEach((entry) => {
    const item = entry.item;
    const btn = document.createElement('div');
    btn.className = 'forge-item';
    applyRarityClass(btn, item);
    const refineLevel = entry.refine_level || 0;
    btn.innerHTML = `
      <div>${formatItemName(item)}</div>
      <div class="item-detail">锻造等级: +${refineLevel}</div>
    `;
    btn.addEventListener('click', () => {
      refineSelection = { slot: entry.slotName || entry.key, item, refineLevel, fromEquip: entry.fromEquip };
      refineUi.main.textContent = `主件: ${formatItemName(item)}`;
      refineUi.level.textContent = `当前锻造等级: +${refineLevel}`;
      const nextLevel = refineLevel + 1;
      const successRate = calculateRefineSuccessRate(nextLevel);
      refineUi.successRate.textContent = `成功率: ${successRate}%`;

      // 更新副件装备列表
      renderRefineSecondaryList();

      // 计算可用材料数量
      const materials = countRefineMaterials();
      refineUi.secondaryCount.textContent = `副件: 需要${refineMaterialCount}件史诗（不含）以下装备 (可用: ${materials}件)`;
      refineUi.confirm.disabled = materials < refineMaterialCount;
      refineUi.batch.disabled = materials < refineMaterialCount;
    });
    refineUi.list.appendChild(btn);
  });
  refineUi.confirm.disabled = true;

  // 初始显示副件装备列表
  renderRefineSecondaryList();
}

function calculateRefineSuccessRate(level) {
  if (level === 1) return 100;

  // 使用服务器传递的配置，如果没有则使用默认值
  const baseSuccessRate = lastState?.refine_config?.base_success_rate || 50;
  const decayRate = lastState?.refine_config?.decay_rate || 3;

  // 计算成功率：基础成功率 - 阶数 * 衰减率
  const tier = Math.floor((level - 2) / 10);
  const successRate = baseSuccessRate - tier * decayRate;
  return Math.max(1, Math.round(successRate));
}

function countRefineMaterials() {
  if (!lastState?.items) return 0;
  const materials = lastState.items.filter((slot) => {
    if (!slot) return false;
    if (!['weapon', 'armor', 'accessory'].includes(slot.type)) return false;
    if (slot.is_shop_item) return false; // 排除商店装备
    const rarity = slot.rarity || (slot.price >= 30000 ? 'epic' :
                   slot.price >= 10000 ? 'rare' :
                   slot.price >= 2000 ? 'uncommon' : 'common');
    // 只能史诗（不含）以下的无特效装备
    return ['common', 'uncommon', 'rare'].includes(rarity) && !hasSpecialEffects(slot.effects);
  });
  // 计算所有符合条件的装备的总数量
  return materials.reduce((total, slot) => total + (slot.qty || 1), 0);
}

function renderRefineSecondaryList() {
  if (!refineUi.secondaryList) return;

  refineUi.secondaryList.innerHTML = '';

  // 只显示可用的装备
  const materials = lastState?.items?.filter((slot) => {
    if (!slot) return false;
    if (!['weapon', 'armor', 'accessory'].includes(slot.type)) return false;
    if (slot.is_shop_item) return false; // 排除商店装备
    const rarity = slot.rarity || (slot.price >= 30000 ? 'epic' :
                   slot.price >= 10000 ? 'rare' :
                   slot.price >= 2000 ? 'uncommon' : 'common');
    // 只能史诗（不含）以下的无特效装备
    return ['common', 'uncommon', 'rare'].includes(rarity) && !hasSpecialEffects(slot.effects);
  }) || [];

  if (materials.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = '暂无可用材料';
    empty.style.padding = '8px';
    empty.style.color = '#888';
    refineUi.secondaryList.appendChild(empty);
    return;
  }

  materials.slice(0, 20).forEach((slot) => {
    const btn = document.createElement('div');
    btn.className = 'forge-item';
    btn.style.fontSize = '12px';
    btn.style.padding = '6px 8px';
    applyRarityClass(btn, slot);
    const qty = slot.qty || 1;
    btn.innerHTML = `
      <div>${formatItemName(slot)} x${qty}</div>
    `;
    refineUi.secondaryList.appendChild(btn);
  });

  if (materials.length > 20) {
    const more = document.createElement('div');
    more.textContent = `...还有 ${materials.length - 20} 件`;
    more.style.padding = '4px 8px';
    more.style.color = '#888';
    more.style.fontSize = '11px';
    refineUi.secondaryList.appendChild(more);
  }
}

function showRefineModal() {
  if (!refineUi.modal) return;
  hideItemTooltip();
  renderRefineModal();
  refineUi.modal.classList.remove('hidden');
}

function renderEffectModal() {
  if (!effectUi.list) return;

  // 从后台读取并显示特效重置概率
  const config = lastState?.effect_reset_config || {};
  const successRate = config.success_rate ?? 0.1;
  const doubleRate = config.double_rate ?? 0.01;
  const tripleRate = config.triple_rate ?? 0.001;
  const quadrupleRate = config.quadruple_rate ?? 0.0001;
  const quintupleRate = config.quintuple_rate ?? 0.00001;

  effectUi.successRate.textContent = `成功率：${successRate}% （失败副件消耗）`;
  effectUi.doubleRate.textContent = `双特效概率：${doubleRate}%`;
  effectUi.tripleRate.textContent = `3特效概率：${tripleRate}%`;
  effectUi.quadrupleRate.textContent = `4特效概率：${quadrupleRate}%`;
  effectUi.quintupleRate.textContent = `5特效概率：${quintupleRate}%`;

  // 主件列表：只显示已穿戴的装备（必须有特效）
  const equippedWithEffect = (lastState?.equipment || []).filter(entry => {
    if (!entry.item || !entry.item.effects) return false;
    return Object.keys(entry.item.effects).length > 0;
  });

  effectUi.list.innerHTML = '';
  equippedWithEffect.forEach(e => {
    const btn = document.createElement('div');
    btn.className = 'forge-item';
    applyRarityClass(btn, e.item);
    btn.innerHTML = `
      <div>${formatItemName(e.item)}</div>
    `;
    btn.addEventListener('click', () => {
      effectSelection = { ...e, equipped: true, raw: { id: e.item.id, slot: e.slot } };
      updateEffectSelection(effectSelection);
    });
    effectUi.list.appendChild(btn);
  });

  // 重置选择状态
  effectUi.main.textContent = '主件: 未选择';
  effectUi.secondary.textContent = '副件: 等待匹配';
  effectUi.confirm.disabled = true;
}

function updateEffectSelection(selected) {
  if (!selected) {
    effectUi.main.textContent = '主件: 未选择';
    effectUi.secondary.textContent = '副件: 等待匹配';
    effectUi.confirm.disabled = true;
    return;
  }

  effectUi.main.textContent = `主件: ${formatItemName(selected.item)}`;

  // 自动选择副件（背包中带有特效的装备）
  const inventoryWithEffect = (lastState?.items || []).filter(slot => {
    if (!slot) return false;
    if (!slot.effects) return false;
    return Object.keys(slot.effects).length > 0;
  });

  if (inventoryWithEffect.length > 0) {
    const secondary = inventoryWithEffect[0];
    effectUi.secondary.textContent = `副件: ${formatItemName(secondary)}`;
    effectUi.confirm.disabled = false;
    effectUi.batch.disabled = inventoryWithEffect.length < 1;

    effectUi.confirm.onclick = () => {
      const command = `effect equip:${selected.slot} ${secondary.key}`;
      socket.emit('cmd', { text: command });
      // 不自动关闭窗口
    };

    // 一键重置
    effectUi.batch.onclick = () => {
      if (!socket || !selected) return;
      // 自动消耗所有有特效的装备作为副件
      for (let i = 0; i < inventoryWithEffect.length; i++) {
        setTimeout(() => {
          const secondary = inventoryWithEffect[i];
          const command = `effect equip:${selected.slot} ${secondary.key}`;
          socket.emit('cmd', { text: command });
        }, i * 100); // 每次间隔100ms
      }
    };
  } else {
    effectUi.secondary.textContent = '副件: 无可用';
    effectUi.confirm.disabled = true;
    effectUi.batch.disabled = true;
  }
}

function showEffectModal() {
  if (!effectUi.modal) return;
  hideItemTooltip();
  renderEffectModal();
  effectUi.modal.classList.remove('hidden');
}

let selectedTrainingType = null;

function openTrainingBatchModal(trainingId) {
  console.log('[openTrainingBatchModal] called with trainingId:', trainingId);
  console.log('[openTrainingBatchModal] lastState:', lastState);
  if (!trainingBatchUi.modal) return;
  hideItemTooltip();
  selectedTrainingType = trainingId;

  const training = lastState?.training || { hp: 0, mp: 0, atk: 0, mag: 0, spirit: 0, dex: 0 };
  const opt = TRAINING_OPTIONS.find(o => o.id === trainingId);
  if (!opt) return;

  const currentLevel = training[trainingId] || 0;
  const cost = trainingCost(currentLevel);
  const perLevel = getTrainingPerLevel(trainingId);
  const totalBonus = currentLevel * perLevel;

  // 显示修炼属性信息
  trainingBatchUi.modal.querySelector('.modal-title').textContent = opt.label;
  trainingBatchUi.modal.querySelector('#training-batch-text').innerHTML =
    `当前等级：Lv${currentLevel}<br>属性加成：+${totalBonus.toFixed(2)}<br>单次消耗：${cost} 金币`;

  // 重置输入
  trainingBatchUi.countInput.value = 1;
  updateTrainingBatchCost();

  // 显示模态框
  trainingBatchUi.modal.classList.remove('hidden');

  // 强制检查按钮状态（确保按钮被正确启用）
  setTimeout(() => {
    console.log('[openTrainingBatchModal] setTimeout check - confirm.disabled:', trainingBatchUi.confirm.disabled);
    if (!lastState) {
      console.warn('[openTrainingBatchModal] lastState is still null after delay');
    } else {
      console.log('[openTrainingBatchModal] setTimeout check - lastState.stats.gold:', lastState.stats?.gold);
    }
  }, 100);
}

function updateTrainingBatchCost() {
  console.log('[updateTrainingBatchCost] called');
  console.log('[updateTrainingBatchCost] trainingBatchUi.costDisplay:', trainingBatchUi.costDisplay);
  console.log('[updateTrainingBatchCost] selectedTrainingType:', selectedTrainingType);
  console.log('[updateTrainingBatchCost] lastState:', lastState);

  if (!trainingBatchUi.costDisplay || !selectedTrainingType) {
    console.log('[updateTrainingBatchCost] Early return: missing required elements');
    return;
  }

  const count = parseInt(trainingBatchUi.countInput.value) || 1;
  const training = lastState?.training || { hp: 0, mp: 0, atk: 0, mag: 0, spirit: 0, dex: 0 };
  const currentLevel = training[selectedTrainingType] || 0;
  const opt = TRAINING_OPTIONS.find(o => o.id === selectedTrainingType);
  if (!opt) return;

  const perLevel = getTrainingPerLevel(selectedTrainingType);

  // 计算总费用
  let totalCost = 0;
  for (let i = 0; i < count; i++) {
    totalCost += trainingCost(currentLevel + i);
  }

  const targetLevel = currentLevel + count;
  const targetBonus = targetLevel * perLevel;

  if (count === 1) {
    trainingBatchUi.costDisplay.innerHTML = `
      <div class="training-batch-total-cost">消耗：${totalCost} 金币</div>
    `;
  } else {
    const currentBonus = currentLevel * perLevel;
    const bonusIncrease = targetBonus - currentBonus;

    trainingBatchUi.costDisplay.innerHTML = `
      <div>修炼 ${count} 次：Lv${currentLevel} → Lv${targetLevel}</div>
      <div>属性增加：+${bonusIncrease.toFixed(2)}</div>
      <div class="training-batch-total-cost">总花费：${totalCost} 金币</div>
    `;
  }

  // 检查金币是否足够
  const playerGold = lastState?.stats?.gold || 0;
  console.log('[updateTrainingBatchCost] playerGold:', playerGold, 'totalCost:', totalCost);
  trainingBatchUi.confirm.disabled = playerGold < totalCost;
  console.log('[updateTrainingBatchCost] confirm.disabled:', trainingBatchUi.confirm.disabled);
}

function executeBatchTraining() {
  console.log('[DEBUG] executeBatchTraining called');
  console.log('[DEBUG] selectedTrainingType:', selectedTrainingType);
  console.log('[DEBUG] trainingBatchUi.countInput:', trainingBatchUi.countInput);
  console.log('[DEBUG] trainingBatchUi.confirm.disabled:', trainingBatchUi.confirm.disabled);

  if (!selectedTrainingType || !trainingBatchUi.countInput) {
    console.log('[DEBUG] Early return: missing selectedTrainingType or countInput');
    return;
  }

  const count = parseInt(trainingBatchUi.countInput.value) || 1;
  console.log('[DEBUG] count:', count);

  if (count < 1 || count > 100) {
    alert('修炼次数必须在1-100之间');
    return;
  }

  // 检查按钮是否被禁用
  if (trainingBatchUi.confirm.disabled) {
    alert('金币不足，无法修炼');
    console.log('[DEBUG] Button is disabled, returning');
    return;
  }

  console.log('[DEBUG] Sending command: train ' + selectedTrainingType + ' ' + count);

  // 发送批量修炼命令
  socket.emit('cmd', { text: `train ${selectedTrainingType} ${count}` });

  // 关闭模态框
  trainingBatchUi.modal.classList.add('hidden');
  selectedTrainingType = null;
}

function showAfkModal(skills, activeIds) {
  if (!afkUi.modal || !afkUi.list) return;
  hideItemTooltip();
  afkUi.selected = new Set();
  if (Array.isArray(activeIds)) {
    activeIds.forEach((id) => afkUi.selected.add(id));
  } else if (typeof activeIds === 'string' && activeIds) {
    afkUi.selected.add(activeIds);
  }
  afkUi.list.innerHTML = '';
  if (!skills.length) {
    const empty = document.createElement('div');
    empty.textContent = '暂无可用技能';
    afkUi.list.appendChild(empty);
  } else {
    skills.forEach((skill) => {
      const btn = document.createElement('div');
      btn.className = 'afk-skill-item';
      btn.textContent = skill.name;
      if (afkUi.selected.has(skill.id)) {
        btn.classList.add('selected');
      }
      btn.addEventListener('click', () => {
        if (afkUi.selected.has(skill.id)) {
          afkUi.selected.delete(skill.id);
          btn.classList.remove('selected');
        } else {
          afkUi.selected.add(skill.id);
          btn.classList.add('selected');
        }
      });
      afkUi.list.appendChild(btn);
    });
  }
  afkUi.modal.classList.remove('hidden');
}

function showPlayerModal(player) {
  if (!playerUi.modal || !playerUi.info) return;
  const lines = [
    `姓名: ${player.name}`,
    `行会: ${player.guild || '无'}`
  ];
  playerUi.info.textContent = lines.join('\n');
  playerUi.selected = player;
  playerUi.modal.classList.remove('hidden');
}

function openPlayerActions(name) {
  if (!name) return;
  const player =
    (lastState?.players || []).find((p) => p.name === name) ||
    { name };
  showPlayerModal(player);
}

function renderShopSellList(items) {
  if (!shopUi.sellList) return;
  shopUi.sellList.innerHTML = '';
  if (!items || !items.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u80cc\u5305\u7a7a\u7a7a';
    shopUi.sellList.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    if (item.type === 'currency') return;
    const btn = document.createElement('div');
    btn.className = 'shop-sell-item';
    applyRarityClass(btn, item);
    btn.textContent = `${formatItemName(item)} x${item.qty}`;
      btn.addEventListener('click', async () => {
        const qtyText = await promptModal({
          title: '\u51fa\u552e\u7269\u54c1',
          text: `\u8bf7\u8f93\u5165\u51fa\u552e\u6570\u91cf: ${formatItemName(item)}`,
          placeholder: '1',
          value: String(item.qty)
        });
        if (!qtyText) return;
        const qty = Math.max(1, Number(qtyText || 1));
        if (Number.isNaN(qty) || qty <= 0) return;
        if (!socket) return;
        const key = item.key || item.id;
        socket.emit('cmd', { text: `sell ${key} ${qty}` });
      });
    shopUi.sellList.appendChild(btn);
  });
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) {
    const num = Number(text);
    const ms = num < 1e12 ? num * 1000 : num;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(text);
  let normalized = text;
  if (!hasTz && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(text)) {
    normalized = text.replace(' ', 'T') + 'Z';
  }
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMailDate(value) {
  const date = parseDateValue(value);
  if (!date) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

function formatVipExpiry(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function formatVipDisplay(stats) {
  if (!stats || !stats.vip) return '否';
  const expiresAt = Number(stats.vip_expires_at || 0);
  if (!expiresAt) return '永久';
  return formatVipExpiry(expiresAt) || '是';
}

function renderMailDetail(mail) {
  if (!mailUi.detailTitle || !mailUi.detailBody || !mailUi.detailMeta || !mailUi.detailItems) return;
  if (!mail) {
    mailUi.detailTitle.textContent = '\u8BF7\u9009\u62E9\u90AE\u4EF6';
    mailUi.detailMeta.textContent = '';
    mailUi.detailBody.textContent = '';
    mailUi.detailItems.textContent = '';
    if (mailUi.claim) mailUi.claim.classList.add('hidden');
    if (mailUi.delete) mailUi.delete.classList.add('hidden');
    return;
  }
  renderTextWithItemHighlights(mailUi.detailTitle, mail.title || '\u65E0\u6807\u9898', mail.items || []);
  const dateText = formatMailDate(mail.created_at);
  if (currentMailFolder === 'inbox') {
    mailUi.detailMeta.textContent = `${mail.from_name || '\u7CFB\u7EDF'}${dateText ? ` | ${dateText}` : ''}`;
  } else {
    mailUi.detailMeta.textContent = `\u81F3: ${mail.to_name || '\u65E0'}${dateText ? ` | ${dateText}` : ''}`;
  }
  renderTextWithItemHighlights(mailUi.detailBody, mail.body || '', mail.items || []);
  mailUi.detailItems.innerHTML = '';
  if (mail.gold && mail.gold > 0) {
    const goldLine = document.createElement('div');
    goldLine.textContent = `\u91D1\u5E01: ${mail.gold}`;
    mailUi.detailItems.appendChild(goldLine);
  }
  if (mail.items && mail.items.length) {
    const itemsLine = document.createElement('div');
    itemsLine.append('\u9644\u4EF6: ');
    mail.items.forEach((item, idx) => {
      const span = document.createElement('span');
      span.textContent = `${formatItemName(item)} x${item.qty || 1}`;
      applyRarityClass(span, item);
      itemsLine.appendChild(span);
      if (idx < mail.items.length - 1) {
        itemsLine.append(', ');
      }
    });
    mailUi.detailItems.appendChild(itemsLine);
  }
  // 只有收件箱中的邮件显示领取附件按钮
  if (mailUi.claim) {
    if (currentMailFolder === 'inbox' && ((mail.items && mail.items.length) || (mail.gold && mail.gold > 0))) {
      if (mail.claimed_at) {
        mailUi.claim.classList.add('hidden');
      } else {
        mailUi.claim.classList.remove('hidden');
      }
    } else {
      mailUi.claim.classList.add('hidden');
    }
  }
  if (mailUi.delete) {
    mailUi.delete.classList.remove('hidden');
  }
}

function renderMailList(mails) {
  if (!mailUi.list) return;
  mailCache = Array.isArray(mails) ? mails : [];
  mailUi.list.innerHTML = '';
  if (!mailCache.length) {
    const empty = document.createElement('div');
    empty.textContent = currentMailFolder === 'inbox' ? '\u6682\u65E0\u90AE\u4EF6' : '\u6682\u65E0\u5DF2\u53D1\u90AE\u4EF6';
    mailUi.list.appendChild(empty);
    renderMailDetail(null);
    return;
  }
  mailCache.forEach((mail) => {
    const row = document.createElement('div');
    const unread = !mail.read_at;
    const claimed = mail.claimed_at;
    row.className = `mail-item${unread ? ' unread' : ''}${mail.id === selectedMailId ? ' active' : ''}`;
    const flags = [];
    if (unread && currentMailFolder === 'inbox') flags.push('\u672A\u8BFB');
    if (claimed && currentMailFolder === 'inbox') flags.push('\u5DF2\u9886');
    if (currentMailFolder === 'inbox') {
      row.textContent = `${mail.title || '\u65E0\u6807\u9898'} - ${mail.from_name || '\u7CFB\u7EDF'}${flags.length ? ` (${flags.join('/')})` : ''}`;
    } else {
      row.textContent = `${mail.title || '\u65E0\u6807\u9898'} -> ${mail.to_name || '\u65E0'}${flags.length ? ` (${flags.join('/')})` : ''}`;
    }
    row.addEventListener('click', () => {
      selectedMailId = mail.id;
      renderMailList(mailCache);
      renderMailDetail(mail);
      if (currentMailFolder === 'inbox' && socket) socket.emit('mail_read', { mailId: mail.id });
    });
    mailUi.list.appendChild(row);
  });
  const active = mailCache.find((m) => m.id === selectedMailId) || mailCache[0];
  selectedMailId = active?.id || null;
  renderMailDetail(active);
}

function refreshMailItemOptions() {
  if (!mailUi.item) return;
  const currentValue = mailUi.item.value;
  mailUi.item.innerHTML = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = '\u4E0D\u8D60\u9001\u9644\u4EF6';
  mailUi.item.appendChild(empty);
  const items = (lastState?.items || []).filter((item) => item.type !== 'currency');
  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.key || item.id;
    opt.textContent = `${formatItemName(item)} x${item.qty}`;
    mailUi.item.appendChild(opt);
  });
  // 恢复之前选中的值（如果它仍然存在于新选项中）
  if (currentValue && Array.from(mailUi.item.options).some(opt => opt.value === currentValue)) {
    mailUi.item.value = currentValue;
  }
  updateMailQtyLimit();
}

function updateMailTabs() {
  if (mailUi.tabInbox) {
    mailUi.tabInbox.classList.toggle('active', currentMailFolder === 'inbox');
  }
  if (mailUi.tabSent) {
    mailUi.tabSent.classList.toggle('active', currentMailFolder === 'sent');
  }
}

function switchMailFolder(folder) {
  currentMailFolder = folder;
  updateMailTabs();
  selectedMailId = null;
  if (socket) {
    if (folder === 'inbox') {
      socket.emit('mail_list');
    } else {
      socket.emit('mail_list_sent');
    }
  }
  renderMailDetail(null);
}

function openMailModal() {
  if (!mailUi.modal) return;
  currentMailFolder = 'inbox';
  updateMailTabs();
  mailAttachments = [];
  renderMailAttachmentList();
  if (mailUi.to) mailUi.to.value = '';
  if (mailUi.subject) mailUi.subject.value = '';
  if (mailUi.body) mailUi.body.value = '';
  if (mailUi.item) mailUi.item.value = '';
  if (mailUi.qty) mailUi.qty.value = '';
  if (mailUi.gold) mailUi.gold.value = '';
  refreshMailItemOptions();
  mailUi.modal.classList.remove('hidden');
  if (socket) socket.emit('mail_list');
}

function renderMailAttachmentList() {
  if (!mailUi.attachList) return;
  mailUi.attachList.innerHTML = '';
  if (!mailAttachments.length) {
    const empty = document.createElement('div');
    empty.textContent = '\u6682\u65E0\u9644\u4EF6';
    mailUi.attachList.appendChild(empty);
    return;
  }
  mailAttachments.forEach((entry, index) => {
    const btn = document.createElement('div');
    btn.className = 'mail-attach-item';
    applyRarityClass(btn, entry.item);
    btn.textContent = `${formatItemName(entry.item)} x${entry.qty}`;
    btn.title = '\u70B9\u51FB\u5220\u9664';
    btn.addEventListener('click', () => {
      mailAttachments.splice(index, 1);
      renderMailAttachmentList();
    });
    mailUi.attachList.appendChild(btn);
  });
  updateMailQtyLimit();
}

function getMailRemainingQty(key) {
  if (!key) return 0;
  const item = (lastState?.items || []).find((i) => (i.key || i.id) === key);
  if (!item) return 0;
  const ownedQty = Math.max(0, Number(item.qty || 0));
  const usedQty = mailAttachments
    .filter((entry) => entry.key === key)
    .reduce((sum, entry) => sum + Number(entry.qty || 0), 0);
  return Math.max(0, ownedQty - usedQty);
}

function updateMailQtyLimit() {
  if (!mailUi.qty || !mailUi.item) return;
  const key = mailUi.item.value;
  if (!key) {
    mailUi.qty.removeAttribute('max');
    return;
  }
  const remainingQty = getMailRemainingQty(key);
  mailUi.qty.max = String(remainingQty);
  const current = Number(mailUi.qty.value || 0);
  if (!Number.isNaN(current) && current > remainingQty) {
    mailUi.qty.value = remainingQty > 0 ? String(remainingQty) : '';
  }
}

function parseShopLine(text) {
  if (!text.startsWith('\u5546\u5E97\u5546\u54C1:')) return null;
  const list = [];
  const cleaned = text.replace('商店商品:', '').trim();
  const regex = /([^,]+)\((\d+)\u91D1\)/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    list.push({ name: match[1].trim(), price: Number(match[2]) });
  }
  return list;
}

function parseRankLine(text) {
  // 格式: 战士排行榜: 1.玩家名(攻击值) 2.玩家名(攻击值) ...
  if (!text.includes('排行榜')) return null;
  const match = text.match(/^(.+?)排行榜:\s*(.+)$/);
  if (!match) return null;

  const classType = match[1].trim();
  let attrType = '攻击';
  if (classType.includes('法师')) attrType = '魔法';
  if (classType.includes('道士')) attrType = '道术';

  const players = [];
  const regex = /(\d+)\.([^(]+)\(([\d.]+)\)/g;
  let playerMatch;
  while ((playerMatch = regex.exec(match[2])) !== null) {
    players.push({
      rank: Number(playerMatch[1]),
      name: playerMatch[2].trim(),
      value: Number(playerMatch[3]),
      attr: attrType
    });
  }

  return players;
}


function isChatLine(text) {
  const match = text.match(/^\[([^\]]+)\]/);
  if (!match) return false;
  const head = match[1];
  // 允许纯数字玩家名(检查后面是否有空格和消息内容)
  if (/^\d+$/.test(head)) {
    return /^\[\d+\]\s+\S/.test(text);
  }
  return true;
}

function isAnnouncement(payload) {
  if (!payload || typeof payload !== 'object') return false;
  return payload.prefix === '公告' || payload.prefixColor === 'announce' || payload.color === 'announce';
}

function sendChatMessage() {
  if (!socket || !chat.input) return;
  const msg = chat.input.value.trim();
  if (!msg) return;
  socket.emit('cmd', { text: `say ${msg}` });
  chat.input.value = '';
}

function renderEmojiPanel() {
  if (!chat.emojiPanel) return;
  chat.emojiPanel.innerHTML = '';
  EMOJI_LIST.forEach((emoji) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', () => {
      if (!chat.input) return;
      chat.input.value = `${chat.input.value}${emoji}`;
      chat.input.focus();
    });
    chat.emojiPanel.appendChild(btn);
  });
}

function setBar(el, current, max) {
  if (!max) {
    el.style.width = '0%';
    return;
  }
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  el.style.width = `${pct}%`;
}

function parseStats(line) {
  if (!line) return;
  if (line.includes('\n')) {
    line.split(/\r?\n/).forEach((entry) => parseStats(entry));
    return;
  }
  const text = line.trim();
  if (!text) return;
  if (text.startsWith('职业:')) {
    ui.classLevel.textContent = text.replace('职业:', '').trim();
  }
  if (text.startsWith('等级:')) {
    const levelText = text.replace('等级:', '').replace(/\([^)]*EXP\)/i, '').trim();
    ui.classLevel.textContent = `${ui.classLevel.textContent} | Lv ${levelText}`;
    const match = text.match(/\((\d+)\/(\d+)\s+EXP\)/);
    if (match) {
      setBar(ui.exp, Number(match[1]), Number(match[2]));
    }
  }
  if (text.startsWith('生命:')) {
    const nums = text.replace('生命:', '').trim().split('/');
    setBar(ui.hp, Number(nums[0]), Number(nums[1]));
  }
  if (text.startsWith('魔法:')) {
    const nums = text.replace('魔法:', '').trim().split('/');
    setBar(ui.mp, Number(nums[0]), Number(nums[1]));
  }
  if (text.startsWith('金币:')) {
    ui.gold.textContent = text.replace('金币:', '').trim();
  }
  if (text.startsWith('行会:')) {
    ui.guild.textContent = text.replace('行会:', '').trim();
  }
  if (text.startsWith('PK值:')) {
    ui.pk.textContent = text.replace('PK值:', '').trim();
  }
  if (text.startsWith('VIP:')) {
    ui.vip.textContent = text.replace('VIP:', '').trim();
  }
}

function positionTooltip(x, y) {
  if (!itemTooltip) return;
  const padding = 10;
  const rect = itemTooltip.getBoundingClientRect();
  let left = x + 16;
  let top = y + 16;
  if (left + rect.width > window.innerWidth - padding) {
    left = window.innerWidth - rect.width - padding;
  }
  if (top + rect.height > window.innerHeight - padding) {
    top = window.innerHeight - rect.height - padding;
  }
  itemTooltip.style.left = `${Math.max(padding, left)}px`;
  itemTooltip.style.top = `${Math.max(padding, top)}px`;
}

function showItemTooltip(text, evt) {
  if (!itemTooltip) return;
  itemTooltip.textContent = text || '';
  itemTooltip.classList.remove('hidden');
  requestAnimationFrame(() => {
    itemTooltip.classList.add('show');
    if (evt) positionTooltip(evt.clientX, evt.clientY);
  });
}

function hideItemTooltip() {
  if (!itemTooltip) return;
  itemTooltip.classList.remove('show');
  itemTooltip.classList.add('hidden');
}

function handleItemAction(item) {
  if (!item || !socket) return;
  const itemKey = item.key || item.id;
  if (item.type === 'consumable' || item.type === 'book') {
    socket.emit('cmd', { text: `use ${itemKey}` });
  } else if (item.slot) {
    socket.emit('cmd', { text: `equip ${itemKey}` });
  }
}

function renderChips(container, items, onClick, activeId) {
  container.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('div');
    btn.className = `chip${activeId && activeId === item.id ? ' active' : ''}`;
    if (item.dataAttrs) {
      Object.entries(item.dataAttrs).forEach(([key, value]) => {
        if (value == null) return;
        btn.dataset[key] = String(value);
      });
    }
    if (item.className) {
      item.className.split(' ').filter(Boolean).forEach((name) => btn.classList.add(name));
    }
    if (item.highlight) {
      btn.classList.add('highlight-marquee');
    }
    btn.textContent = item.label;
    if (item.badgeLabel) {
      const badge = document.createElement('span');
      badge.className = item.badgeClass || 'cross-realm-badge';
      badge.textContent = item.badgeLabel;
      btn.appendChild(badge);
    }
    if (item.tooltip) {
      btn.addEventListener('mouseenter', (evt) => showItemTooltip(item.tooltip, evt));
      btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      btn.addEventListener('mouseleave', hideItemTooltip);
    }
    btn.addEventListener('click', () => onClick(item));
    container.appendChild(btn);

    // 技能进度条（满级不显示）
    if (container === ui.skills && item.exp !== undefined && item.level < 3) {
      const progressContainer = document.createElement('div');
      progressContainer.className = 'skill-progress';
      const progressBar = document.createElement('div');
      progressBar.className = 'skill-progress-bar';
      const percent = Math.min(100, (item.exp / item.expNext) * 100);
      progressBar.style.width = `${percent}%`;
      progressContainer.appendChild(progressBar);
      container.appendChild(progressContainer);
    }
  });
    if (container === ui.items) {
      container.onclick = (evt) => {
        if (!evt.target || evt.target !== container) return;
        if (bagItems.length > BAG_PAGE_SIZE) {
          showBagModal();
        }
      };
    }
  }

  function filterBagItems(items, filter) {
    if (!filter || filter === 'all') return items;
    if (filter === 'consumable') {
      return items.filter((i) => i.type === 'consumable' && (i.hp || i.mp));
    }
    return items.filter((i) => i.type === filter);
  }

function showBagModal() {
    hideItemTooltip();
    if (socket && isStateThrottleActive()) {
      socket.emit('state_request', { reason: 'bag' });
    }
    bagFilter = 'all';
    bagPage = 0;
    if (bagUi.tabs && bagUi.tabs.length) {
      bagUi.tabs.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.filter === bagFilter);
      });
    }
    renderBagModal();
  }

function renderBagModal() {
  if (!bagUi.modal || !bagUi.list) return;
  bagUi.list.innerHTML = '';
  const filtered = filterBagItems(bagItems, bagFilter).slice().sort(sortByRarityDesc);
  const totalPages = Math.max(1, Math.ceil(filtered.length / BAG_PAGE_SIZE));
    bagPage = Math.min(Math.max(0, bagPage), totalPages - 1);
    const start = bagPage * BAG_PAGE_SIZE;
    const pageItems = filtered.slice(start, start + BAG_PAGE_SIZE);
    pageItems.forEach((item) => {
      const btn = document.createElement('div');
      btn.className = 'bag-item';
      applyRarityClass(btn, item);
      btn.textContent = `${formatItemName(item)} x${item.qty}`;
    if (item.tooltip) {
      btn.addEventListener('mouseenter', (evt) => showItemTooltip(item.tooltip, evt));
      btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      btn.addEventListener('mouseleave', hideItemTooltip);
    }
    btn.addEventListener('click', () => handleItemAction(item));
    bagUi.list.appendChild(btn);
  });
    if (bagUi.page) bagUi.page.textContent = `第 ${bagPage + 1}/${totalPages} 页`;
    if (bagUi.prev) bagUi.prev.disabled = bagPage === 0;
    if (bagUi.next) bagUi.next.disabled = bagPage >= totalPages - 1;
    bagUi.modal.classList.remove('hidden');
  }

  function renderStatsModal() {
    if (!statsUi.modal || !lastState) return;
    const stats = lastState.stats || {};
    const summaryLines = [
      `${lastState.player?.name || ''} Lv${lastState.player?.level || 0}`,
      `生命: ${stats.hp || 0}/${stats.max_hp || 0}  魔法: ${stats.mp || 0}/${stats.max_mp || 0}`,
      `攻击: ${stats.atk || 0}  防御: ${stats.def || 0}  魔法: ${stats.mag || 0}`,
      `道术: ${stats.spirit || 0}  魔御: ${stats.mdef || 0}  金币: ${stats.gold || 0}`,
      `PK值: ${stats.pk || 0}  VIP: ${formatVipDisplay(stats)}  沙巴克加成: ${stats.sabak_bonus ? '已生效' : '无'}  套装加成: ${stats.set_bonus ? '已激活' : '无'}`
    ];
    if (statsUi.summary) statsUi.summary.textContent = summaryLines.join('\n');

    if (statsUi.equipment) {
      statsUi.equipment.innerHTML = '';
      const slotLabels = {
        weapon: '武器',
        chest: '衣服',
        head: '头盔',
        waist: '腰带',
        feet: '靴子',
        ring_left: '戒指(左)',
        ring_right: '戒指(右)',
        bracelet_left: '手镯(左)',
        bracelet_right: '手镯(右)',
        neck: '项链'
      };
      const equipment = (lastState.equipment || []).slice();
      if (!equipment.length) {
        const empty = document.createElement('div');
        empty.textContent = '暂无装备';
        statsUi.equipment.appendChild(empty);
      } else {
        equipment.forEach((entry) => {
          const btn = document.createElement('div');
          btn.className = 'bag-item';
          applyRarityClass(btn, entry.item);
          const slotLabel = slotLabels[entry.slot] || entry.slot;
          btn.textContent = `${slotLabel}: ${formatItemName(entry.item)}`;
          // 合并耐久度信息到item对象用于tooltip显示
          const itemWithDurability = { 
            ...entry.item, 
            durability: entry.durability, 
            max_durability: entry.max_durability 
          };
          const tooltip = formatItemTooltip(itemWithDurability);
          if (tooltip) {
            btn.addEventListener('mouseenter', (evt) => showItemTooltip(tooltip, evt));
            btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
            btn.addEventListener('mouseleave', hideItemTooltip);
          }
          btn.addEventListener('click', () => {
            if (!socket) return;
            socket.emit('cmd', { text: `unequip ${entry.slot}` });
          });
          statsUi.equipment.appendChild(btn);
        });
      }
    }

    if (statsUi.inventory) {
      statsUi.inventory.innerHTML = '';
      const equipables = (bagItems || []).filter((item) => item && item.slot);
      if (!equipables.length) {
        const empty = document.createElement('div');
        empty.textContent = '背包暂无可装备物品';
        statsUi.inventory.appendChild(empty);
      } else {
        equipables.forEach((item) => {
          const btn = document.createElement('div');
          btn.className = 'bag-item';
          applyRarityClass(btn, item);
          btn.textContent = `${formatItemName(item)} x${item.qty}`;
          const tooltip = formatItemTooltip(item);
          if (tooltip) {
            btn.addEventListener('mouseenter', (evt) => showItemTooltip(tooltip, evt));
            btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
            btn.addEventListener('mouseleave', hideItemTooltip);
          }
          btn.addEventListener('click', () => {
            if (!socket) return;
            const key = item.key || item.id;
            socket.emit('cmd', { text: `equip ${key}` });
          });
          statsUi.inventory.appendChild(btn);
        });
      }
    }

    statsUi.modal.classList.remove('hidden');
  }

  function showStatsModal() {
    hideItemTooltip();
    renderStatsModal();
  }

  function showRankModal() {
    hideItemTooltip();
    renderRankModal('warrior');
  }

  function renderRankModal(classType) {
    const rankModal = document.getElementById('rank-modal');
    const rankList = document.getElementById('rank-list');
    const tabs = document.querySelectorAll('.rank-tab');

    // Update active tab
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(`rank-tab-${classType}`).classList.add('active');

    // Clear and show loading
    rankList.innerHTML = '<div class="modal-text">加载中...</div>';
    rankModal.classList.remove('hidden');

    // Request rank data from server (use 'ui' source to avoid logging)
    socket.emit('cmd', { text: `rank ${classType}`, source: 'ui' });
  }

  function renderRankList(players) {
    const rankList = document.getElementById('rank-list');
    if (!rankList) return;

    if (!players || players.length === 0) {
      rankList.innerHTML = '<div class="modal-text">暂无数据</div>';
      return;
    }

    rankList.innerHTML = '';
    players.forEach((player, index) => {
      const item = document.createElement('div');
      item.className = 'rank-item';

      const pos = document.createElement('span');
      pos.className = 'rank-pos';
      pos.textContent = `${player.rank}.`;

      const name = document.createElement('span');
      name.textContent = player.name;

      const value = document.createElement('span');
      value.textContent = `${player.attr}: ${player.value}`;

      item.appendChild(pos);
      item.appendChild(name);
      item.appendChild(value);

      rankList.appendChild(item);
    });
  }

  function renderSummonDetails(summon, levelMax) {
    if (!ui.summonDetails) return;
    ui.summonDetails.classList.remove('hidden');
    ui.summonDetails.innerHTML = '';

    const container = document.createElement('div');

    const nameDiv = document.createElement('div');
    nameDiv.className = 'summon-name';
    nameDiv.textContent = summon.name;
    container.appendChild(nameDiv);

    const levelDiv = document.createElement('div');
    levelDiv.className = 'summon-level';
    levelDiv.textContent = `等级: ${summon.level}/${levelMax}`;
    container.appendChild(levelDiv);

    const hpPct = summon.max_hp > 0 ? (summon.hp / summon.max_hp) * 100 : 0;
    const expPct = summon.exp && summon.exp_next ? (summon.exp / summon.exp_next) * 100 : 0;

    const hpRow = document.createElement('div');
    hpRow.className = 'summon-bar-row';
    hpRow.innerHTML = `
      <span class="summon-bar-label">生命</span>
      <div class="summon-bar">
        <div class="summon-bar-fill hp" style="width: ${hpPct}%"></div>
      </div>
    `;
    container.appendChild(hpRow);

    const expRow = document.createElement('div');
    expRow.className = 'summon-bar-row';
    expRow.innerHTML = `
      <span class="summon-bar-label">经验</span>
      <div class="summon-bar">
        <div class="summon-bar-fill exp" style="width: ${expPct}%"></div>
      </div>
    `;
    container.appendChild(expRow);

    const statsDiv = document.createElement('div');
    statsDiv.className = 'summon-stats';
    statsDiv.innerHTML = `
      <div class="summon-stat">
        <span class="summon-stat-label">攻击</span>
        <span class="summon-stat-value">${summon.atk || 0}</span>
      </div>
      <div class="summon-stat">
        <span class="summon-stat-label">防御</span>
        <span class="summon-stat-value">${summon.def || 0}</span>
      </div>
      <div class="summon-stat">
        <span class="summon-stat-label">魔御</span>
        <span class="summon-stat-value">${summon.mdef || 0}</span>
      </div>
    `;
    container.appendChild(statsDiv);

    ui.summonDetails.appendChild(container);
  }

// 套装掉落数据
const SET_DROPS = {
  shengzhan: {
    name: '圣战套装',
    items: [
      { id: 'armor_taishan', name: '圣战宝甲', drops: [{ mob: '赤月恶魔', chance: '6%' }, { mob: '魔龙教主', chance: '6%' }, { mob: '世界BOSS', chance: '6%' }, { mob: '跨服BOSS', chance: '6%' }, { mob: '沙巴克BOSS', chance: '8%' }] },
      { id: 'helm_holy', name: '圣战头盔(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'boots_holy', name: '圣战靴(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'belt_holy', name: '圣战腰带(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'ring_holy', name: '圣战戒指(套)', drops: [{ mob: '黄泉教主', chance: '4%' }, { mob: '赤月恶魔', chance: '6%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] },
      { id: 'necklace_soldier', name: '圣战项链(套)', drops: [{ mob: '赤月恶魔', chance: '8%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] },
      { id: 'bracelet_soldier', name: '圣战手镯(套)', drops: [{ mob: '赤月恶魔', chance: '4%' }, { mob: '魔龙教主', chance: '4%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] }
    ]
  },
  fashen: {
    name: '法神套装',
    items: [
      { id: 'armor_mage', name: '法神披风', drops: [{ mob: '赤月恶魔', chance: '6%' }, { mob: '双头金刚', chance: '8%' }, { mob: '魔龙教主', chance: '6%' }, { mob: '世界BOSS', chance: '6%' }, { mob: '跨服BOSS', chance: '6%' }, { mob: '沙巴克BOSS', chance: '8%' }] },
      { id: 'helm_mage', name: '法神头盔(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'boots_mage', name: '法神靴(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'belt_mage', name: '法神腰带(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'ring_fashen', name: '法神戒指(套)', drops: [{ mob: '黄泉教主', chance: '4%' }, { mob: '赤月恶魔', chance: '6%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] },
      { id: 'necklace_fashen', name: '法神项链(套)', drops: [{ mob: '赤月恶魔', chance: '8%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] },
      { id: 'bracelet_fashen', name: '法神手镯(套)', drops: [{ mob: '赤月恶魔', chance: '4%' }, { mob: '魔龙教主', chance: '4%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] }
    ]
  },
  tianzun: {
    name: '天尊套装',
    items: [
      { id: 'armor_tao', name: '天尊道袍', drops: [{ mob: '赤月恶魔', chance: '6%' }, { mob: '双头金刚', chance: '8%' }, { mob: '魔龙教主', chance: '6%' }, { mob: '世界BOSS', chance: '6%' }, { mob: '跨服BOSS', chance: '6%' }, { mob: '沙巴克BOSS', chance: '8%' }] },
      { id: 'helm_tao', name: '天尊头盔(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'boots_tao', name: '天尊靴(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'belt_tao', name: '天尊腰带(套)', drops: [{ mob: '赤月恶魔', chance: '2%' }, { mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '2%' }, { mob: '跨服BOSS', chance: '2%' }, { mob: '沙巴克BOSS', chance: '3%' }] },
      { id: 'ring_tianzun', name: '天尊戒指(套)', drops: [{ mob: '虹魔教主', chance: '6%' }, { mob: '赤月恶魔', chance: '6%' }, { mob: '双头血魔', chance: '6%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] },
      { id: 'necklace_tianzun', name: '天尊项链(套)', drops: [{ mob: '赤月恶魔', chance: '8%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] },
      { id: 'bracelet_tianzun', name: '天尊手镯(套)', drops: [{ mob: '赤月恶魔', chance: '4%' }, { mob: '魔龙教主', chance: '4%' }, { mob: '世界BOSS', chance: '4%' }, { mob: '跨服BOSS', chance: '4%' }, { mob: '沙巴克BOSS', chance: '6%' }] }
    ]
  },
  zhanshen: {
    name: '战神套装',
    items: [
      { id: 'armor_thunder', name: '雷霆战甲', drops: [{ mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'helm_wargod', name: '战神头盔(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'boots_wargod', name: '战神靴子(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'belt_wargod', name: '战神腰带(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'ring_wargod', name: '战神戒指(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] },
      { id: 'necklace_wargod', name: '战神项链(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] },
      { id: 'bracelet_wargod', name: '战神手镯(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] }
    ]
  },
  shengmo: {
    name: '圣魔套装',
    items: [
      { id: 'armor_flame', name: '烈焰魔衣', drops: [{ mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'helm_sacred', name: '圣魔头盔(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'boots_sacred', name: '圣魔靴子(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'belt_sacred', name: '圣魔腰带(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'ring_sacred', name: '圣魔戒指(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] },
      { id: 'necklace_sacred', name: '圣魔项链(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] },
      { id: 'bracelet_sacred', name: '圣魔手镯(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] }
    ]
  },
  zhenhun: {
    name: '真魂套装',
    items: [
      { id: 'armor_glow', name: '光芒道袍', drops: [{ mob: '魔龙教主', chance: '2%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'helm_true', name: '真魂头盔(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'boots_true', name: '真魂靴子(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'belt_true', name: '真魂腰带(套)', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1%' }] },
      { id: 'ring_true', name: '真魂戒指(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] },
      { id: 'necklace_true', name: '真魂项链(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] },
      { id: 'bracelet_true', name: '真魂手镯(套)', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }, { mob: '沙巴克BOSS', chance: '0.6%' }] }
    ]
  },
  luoqi: {
    name: '洛奇套装',
    items: [
      { id: 'sword_rochie', name: '洛奇王者之刃', drops: [{ mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }] },
      { id: 'staff_rochie', name: '洛奇王者权杖', drops: [{ mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }] },
      { id: 'sword_rochie_tao', name: '洛奇王者之剑', drops: [{ mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }] },
      { id: 'armor_rochie_war', name: '洛奇战甲', drops: [{ mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }] },
      { id: 'armor_rochie_mage', name: '洛奇法袍', drops: [{ mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }] },
      { id: 'armor_rochie_tao', name: '洛奇道袍', drops: [{ mob: '世界BOSS', chance: '0.5%' }, { mob: '跨服BOSS', chance: '0.5%' }] },
      { id: 'helm_rochie_war', name: '洛奇头盔(战士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'helm_rochie_mage', name: '洛奇头盔(法师)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'helm_rochie_tao', name: '洛奇头盔(道士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'boots_rochie_war', name: '洛奇靴子(战士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'boots_rochie_mage', name: '洛奇靴子(法师)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'boots_rochie_tao', name: '洛奇靴子(道士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'belt_rochie_war', name: '洛奇腰带(战士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'belt_rochie_mage', name: '洛奇腰带(法师)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'belt_rochie_tao', name: '洛奇腰带(道士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'ring_rochie_war', name: '洛奇戒指(战士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'ring_rochie_mage', name: '洛奇戒指(法师)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'ring_rochie_tao', name: '洛奇戒指(道士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'bracelet_rochie_war', name: '洛奇手镯(战士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'bracelet_rochie_mage', name: '洛奇手镯(法师)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'bracelet_rochie_tao', name: '洛奇手镯(道士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'necklace_rochie_war', name: '洛奇项链(战士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'necklace_rochie_mage', name: '洛奇项链(法师)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'necklace_rochie_tao', name: '洛奇项链(道士)', drops: [{ mob: '世界BOSS', chance: '0.3%' }, { mob: '跨服BOSS', chance: '0.3%' }] }
    ]
  },
  caiya: {
    name: '菜芽套装',
    items: [
      { id: 'sword_caiya', name: '菜芽霸者之刃', drops: [{ mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'staff_caiya', name: '菜芽霸者权杖', drops: [{ mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'sword_caiya_tao', name: '菜芽霸者之剑', drops: [{ mob: '跨服BOSS', chance: '0.3%' }] },
      { id: 'armor_caiya_war', name: '菜芽战甲', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'armor_caiya_mage', name: '菜芽法袍', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'armor_caiya_tao', name: '菜芽道袍', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'helm_caiya_war', name: '菜芽头盔(战士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'helm_caiya_mage', name: '菜芽头盔(法师)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'helm_caiya_tao', name: '菜芽头盔(道士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'boots_caiya_war', name: '菜芽靴子(战士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'boots_caiya_mage', name: '菜芽靴子(法师)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'boots_caiya_tao', name: '菜芽靴子(道士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'belt_caiya_war', name: '菜芽腰带(战士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'belt_caiya_mage', name: '菜芽腰带(法师)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'belt_caiya_tao', name: '菜芽腰带(道士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'ring_caiya_war', name: '菜芽戒指(战士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'ring_caiya_mage', name: '菜芽戒指(法师)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'ring_caiya_tao', name: '菜芽戒指(道士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'bracelet_caiya_war', name: '菜芽手镯(战士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'bracelet_caiya_mage', name: '菜芽手镯(法师)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'bracelet_caiya_tao', name: '菜芽手镯(道士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'necklace_caiya_war', name: '菜芽项链(战士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'necklace_caiya_mage', name: '菜芽项链(法师)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] },
      { id: 'necklace_caiya_tao', name: '菜芽项链(道士)', drops: [{ mob: '跨服BOSS', chance: '0.2%' }] }
    ]
  },
  skillbook: {
    name: '技能书',
    items: [
      { id: 'book_war_basic', name: '技能书: 基本剑术', drops: [{ mob: '鸡', chance: '2%' }, { mob: '鹿', chance: '2%' }, { mob: '稻草人', chance: '1%' }] },
      { id: 'book_war_attack', name: '技能书: 攻杀剑术', drops: [{ mob: '邪恶钳虫', chance: '2%' }, { mob: '多钩猫', chance: '1%' }] },
      { id: 'book_war_assassinate', name: '技能书: 刺杀剑术', drops: [{ mob: '触龙神', chance: '3%' }, { mob: '白野猪', chance: '2%' }] },
      { id: 'book_war_halfmoon', name: '技能书: 半月弯刀', drops: [{ mob: '沃玛教主', chance: '4%' }, { mob: '祖玛教主', chance: '4%' }] },
      { id: 'book_war_fire', name: '技能书: 烈火剑法', drops: [{ mob: '祖玛教主', chance: '4%' }, { mob: '赤月恶魔', chance: '4%' }] },
      { id: 'book_war_savage', name: '技能书: 野蛮冲撞', drops: [{ mob: '赤月恶魔', chance: '3%' }, { mob: '黄泉教主', chance: '3%' }] },
      { id: 'book_war_earth_spike', name: '技能书: 彻地钉', drops: [{ mob: '世界BOSS', chance: '3%' }, { mob: '跨服BOSS', chance: '3%' }] },
      { id: 'book_mage_fireball', name: '技能书: 小火球', drops: [{ mob: '稻草人', chance: '2%' }, { mob: '鸡', chance: '2%' }] },
      { id: 'book_mage_resist', name: '技能书: 抗拒火环', drops: [{ mob: '邪恶钳虫', chance: '2%' }, { mob: '多钩猫', chance: '1%' }] },
      { id: 'book_mage_inferno', name: '技能书: 地狱火', drops: [{ mob: '触龙神', chance: '3%' }, { mob: '白野猪', chance: '2%' }] },
      { id: 'book_mage_explode', name: '技能书: 爆裂火球', drops: [{ mob: '沃玛教主', chance: '4%' }, { mob: '祖玛教主', chance: '4%' }] },
      { id: 'book_mage_lightning', name: '技能书: 雷电术', drops: [{ mob: '祖玛教主', chance: '4%' }, { mob: '牛魔王', chance: '3%' }] },
      { id: 'book_mage_flash', name: '技能书: 疾光电影', drops: [{ mob: '赤月恶魔', chance: '3%' }, { mob: '黄泉教主', chance: '3%' }] },
      { id: 'book_mage_thunder', name: '技能书: 地狱雷光', drops: [{ mob: '牛魔王', chance: '3%' }, { mob: '魔龙教主', chance: '3%' }] },
      { id: 'book_mage_thunderstorm', name: '技能书: 雷霆万钧', drops: [{ mob: '世界BOSS', chance: '3%' }, { mob: '跨服BOSS', chance: '3%' }] },
      { id: 'book_mage_shield', name: '技能书: 魔法盾', drops: [{ mob: '魔龙教主', chance: '4%' }, { mob: '沙巴克BOSS', chance: '4%' }] },
      { id: 'book_mage_ice', name: '技能书: 冰咆哮', drops: [{ mob: '沙巴克BOSS', chance: '5%' }] },
      { id: 'book_tao_heal', name: '技能书: 治愈术', drops: [{ mob: '鸡', chance: '2%' }, { mob: '鹿', chance: '2%' }] },
      { id: 'book_tao_group_heal', name: '技能书: 群体治疗术', drops: [{ mob: '赤月恶魔', chance: '3%' }] },
      { id: 'book_tao_poison', name: '技能书: 施毒术', drops: [{ mob: '邪恶钳虫', chance: '2%' }, { mob: '多钩猫', chance: '1%' }] },
      { id: 'book_tao_soul', name: '技能书: 灵魂火符', drops: [{ mob: '触龙神', chance: '3%' }, { mob: '白野猪', chance: '2%' }] },
      { id: 'book_tao_invis', name: '技能书: 隐身术', drops: [{ mob: '沃玛教主', chance: '4%' }, { mob: '祖玛教主', chance: '4%' }] },
      { id: 'book_tao_group_invis', name: '技能书: 群体隐身', drops: [{ mob: '赤月恶魔', chance: '3%' }, { mob: '黄泉教主', chance: '3%' }] },
      { id: 'book_tao_armor', name: '技能书: 防御术', drops: [{ mob: '祖玛教主', chance: '4%' }, { mob: '赤月恶魔', chance: '4%' }] },
      { id: 'book_tao_shield', name: '技能书: 神圣战甲术', drops: [{ mob: '黄泉教主', chance: '3%' }, { mob: '魔龙教主', chance: '3%' }] },
      { id: 'book_tao_skeleton', name: '技能书: 召唤骷髅', drops: [{ mob: '牛魔王', chance: '3%' }, { mob: '魔龙教主', chance: '3%' }] },
      { id: 'book_tao_summon', name: '技能书: 召唤神兽', drops: [{ mob: '魔龙教主', chance: '4%' }, { mob: '沙巴克BOSS', chance: '4%' }] },
      { id: 'book_tao_white_tiger', name: '技能书: 召唤白虎', drops: [{ mob: '世界BOSS', chance: '3%' }, { mob: '跨服BOSS', chance: '3%' }] }
    ]
  },
  special: {
    name: '特殊戒指',
    items: [
      { id: 'ring_dodge', name: '躲避戒指', drops: [{ mob: '牛魔王', chance: '0.8%' }, { mob: '魔龙教主', chance: '0.5%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_def', name: '防御戒指', drops: [{ mob: '祖玛教主', chance: '0.8%' }, { mob: '魔龙教主', chance: '0.5%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_fire', name: '吸血戒指', drops: [{ mob: '祖玛教主', chance: '0.8%' }, { mob: '魔龙教主', chance: '0.5%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_heal', name: '治愈戒指', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_magic', name: '麻痹戒指', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '牛魔王', chance: '0.5%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_teleport', name: '弱化戒指', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '牛魔王', chance: '0.6%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_protect', name: '护身戒指', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_revival', name: '复活戒指', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_break', name: '破防戒指', drops: [{ mob: '魔龙教主', chance: '0.5%' }, { mob: '暗之沃玛教主', chance: '0.5%' }, { mob: '暗之祖玛教主', chance: '0.5%' }, { mob: '暗之赤月恶魔', chance: '0.5%' }, { mob: '暗之虹魔教主', chance: '0.5%' }, { mob: '暗之骷髅精灵', chance: '0.5%' }, { mob: '世界BOSS', chance: '1.5%' }, { mob: '跨服BOSS', chance: '1.5%' }, { mob: '沙巴克BOSS', chance: '2%' }] },
      { id: 'ring_recall', name: '记忆戒指', drops: [{ mob: '魔龙教主', chance: '0.3%' }, { mob: '暗之沃玛教主', chance: '0.3%' }, { mob: '暗之祖玛教主', chance: '0.3%' }, { mob: '暗之赤月恶魔', chance: '0.3%' }, { mob: '暗之虹魔教主', chance: '0.3%' }, { mob: '暗之骷髅精灵', chance: '0.3%' }, { mob: '世界BOSS', chance: '0.8%' }, { mob: '跨服BOSS', chance: '0.8%' }, { mob: '沙巴克BOSS', chance: '1.5%' }] }
    ]
  }
};

function showDropsModal() {
  if (!dropsUi.modal || !dropsUi.content) return;
  hideItemTooltip();
  renderDropsContent('shengzhan');
  dropsUi.modal.classList.remove('hidden');
  
  // 绑定tab点击事件
  dropsUi.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      dropsUi.tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const setId = tab.dataset.set;
      renderDropsContent(setId);
    });
  });
  
  // 绑定关闭按钮
  dropsUi.closeBtn.addEventListener('click', () => {
    dropsUi.modal.classList.add('hidden');
  });
}

async function showSponsorModal() {
  if (!sponsorUi.modal || !sponsorUi.content) return;
  hideItemTooltip();
  await renderSponsorContent();
  sponsorUi.modal.classList.remove('hidden');

  // 绑定关闭按钮
  sponsorUi.close.addEventListener('click', () => {
    sponsorUi.modal.classList.add('hidden');
  });
if (sponsorUi.modal) {
  sponsorUi.modal.addEventListener('click', (e) => {
    if (e.target === sponsorUi.modal) {
      sponsorUi.modal.classList.add('hidden');
    }
  });
}
}

function parseMarkdown(markdown) {
  if (!markdown) return '';

  // 简单的Markdown解析器
  let html = markdown;

  // 解析粗体文本 **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 解析表格
  html = html.replace(/\|([^|]+)\|([^|]+)\|/g, (_match, col1, col2) => {
    // 表头行
    if (col1.trim() === '---' && col2.trim() === '---') {
      return '</tr></thead><tbody><tr>';
    }
    // 表格行
    return `<tr><td>${col1.trim()}</td><td>${col2.trim()}</td></tr>`;
  });

  // 添加表格标签
  if (html.includes('<tr>')) {
    html = html.replace(/^[\s\S]*?(<tr>)/, '<table>$1');
    html = html.replace(/(<\/table>)/, '$1');
  }

  // 处理表格外的换行 - 只在表格之外的文本中处理
  html = html.split('<table>').map((part, idx) => {
    if (idx === 0) {
      // 表格前的文本
      return part.replace(/\n/g, '<br>');
    }
    const [table, ...rest] = part.split('</table>');
    // 表格后的文本
    const afterTable = rest.join('</table>').replace(/\n/g, '<br>');
    return `<table>${table}</table>${afterTable}`;
  }).join('<table>');

  return html;
}

async function loadSponsors() {
  try {
    const res = await fetch('/api/sponsors');
    const data = await res.json();
    if (data.ok && Array.isArray(data.sponsors)) {
      sponsorNames = new Set(data.sponsors.map(s => s.player_name));
      // 保存自定义称号
      sponsorCustomTitles = new Map();
      data.sponsors.forEach(s => {
        if (s.custom_title && s.custom_title !== '赞助玩家') {
          sponsorCustomTitles.set(s.player_name, s.custom_title);
        }
      });
    }
  } catch (err) {
    console.error('获取赞助名单失败:', err);
  }
}

async function renderSponsorContent() {
  if (!sponsorUi.content) return;

  // 赞助内容,支持Markdown格式
  const sponsorMarkdown = `
| 支付宝 | 微信 |
| --- | --- |
| <img src="/img/zfb.png" alt="alipay" width="260"> | <img src="/img/wx.png" alt="wechat" width="260"> |

⚠️ **重要提示：** 赞助时请务必在备注中填写您的**游戏角色名**，以便添加到赞助名单中！
  `;

  // 从API获取赞助名单（如果还没有加载）
  let sponsorList = [];
  if (sponsorNames.size === 0) {
    await loadSponsors();
  }
  try {
    const res = await fetch('/api/sponsors');
    const data = await res.json();
    if (data.ok && Array.isArray(data.sponsors)) {
      sponsorList = data.sponsors.map(s => ({
        name: s.player_name,
        amount: s.amount,
        customTitle: s.custom_title
      }));
      // 按金额从高到低排序
      sponsorList.sort((a, b) => b.amount - a.amount);
    }
  } catch (err) {
    console.error('获取赞助名单失败:', err);
    // 失败时使用空列表
  }

  // 只显示前5位,超过5位支持滚动显示
  const displayList = sponsorList.slice(0, 5);
  const hasMoreSponsors = sponsorList.length > 5;

  const htmlContent = parseMarkdown(sponsorMarkdown);

  sponsorUi.content.innerHTML = `
    <div class="sponsor-markdown">${htmlContent}</div>
    <div class="sponsor-list-title">赞助名单</div>
    <div class="sponsor-list-container">
      <div class="sponsor-list-scroll">
        ${displayList.length > 0 ? sponsorList.map((item, index) => `
          <div class="sponsor-item">
            <span class="sponsor-rank">${index + 1}</span>
            <span class="sponsor-name">${item.name}${item.customTitle && item.customTitle !== '赞助玩家' ? ` (${item.customTitle})` : ''}</span>
            <span class="sponsor-amount">${item.amount}元</span>
          </div>
        `).join('') : '<div style="text-align: center; color: #999; padding: 20px;">暂无赞助名单</div>'}
      </div>
    </div>
  `;

  // 超过5位时启动自动滚动
  if (hasMoreSponsors) {
    const scrollContainer = sponsorUi.content.querySelector('.sponsor-list-scroll');
    if (scrollContainer && sponsorList.length > 5) {
      let scrollDirection = 1;
      let autoScrollInterval = setInterval(() => {
        const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const currentScroll = scrollContainer.scrollTop;

        if (scrollDirection === 1 && currentScroll >= maxScroll) {
          scrollDirection = -1;
        } else if (scrollDirection === -1 && currentScroll <= 0) {
          scrollDirection = 1;
        }

        scrollContainer.scrollTop += scrollDirection * 1;
      }, 50);

      // 鼠标悬停时暂停滚动
      scrollContainer.addEventListener('mouseenter', () => {
        clearInterval(autoScrollInterval);
      });

      // 鼠标离开时恢复滚动
      scrollContainer.addEventListener('mouseleave', () => {
        autoScrollInterval = setInterval(() => {
          const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          const currentScroll = scrollContainer.scrollTop;

          if (scrollDirection === 1 && currentScroll >= maxScroll) {
            scrollDirection = -1;
          } else if (scrollDirection === -1 && currentScroll <= 0) {
            scrollDirection = 1;
          }

          scrollContainer.scrollTop += scrollDirection * 1;
        }, 50);
      });
    }
  }
}

function renderDropsContent(setId) {
  if (!dropsUi.content) return;
  const setData = SET_DROPS[setId];
  if (!setData) return;

  dropsUi.content.innerHTML = `
    <div class="drops-header">${setData.name}</div>
  `;

  setData.items.forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'drops-item';
    itemDiv.innerHTML = `
      <div class="drops-item-name">${item.name}</div>
      <div class="drops-item-mobs">
        ${item.drops.map((drop) => `<span class="drops-drop">${drop.mob}: ${drop.chance}</span>`).join('')}
      </div>
    `;
    dropsUi.content.appendChild(itemDiv);
  });
}

async function showSponsorTitleModal() {
  console.log('showSponsorTitleModal 被调用');
  console.log('sponsorTitleUi.modal:', sponsorTitleUi.modal);
  if (!sponsorTitleUi.modal) {
    console.warn('sponsorTitleUi.modal 不存在');
    return;
  }
  hideItemTooltip();

  const currentPlayerName = lastState?.player?.name;
  if (!currentPlayerName) {
    showToast('请先登录游戏');
    console.warn('玩家未登录,无法设置称号');
    return;
  }

  // 获取当前称号（如果有）
  const currentTitle = sponsorCustomTitles.get(currentPlayerName) || '';
  sponsorTitleUi.input.value = currentTitle;
  sponsorTitleUi.msg.textContent = '';
  sponsorTitleUi.modal.classList.remove('hidden');

  // 绑定取消按钮
  sponsorTitleUi.cancelBtn.onclick = () => {
    sponsorTitleUi.modal.classList.add('hidden');
  };

  // 绑定保存按钮
  sponsorTitleUi.saveBtn.onclick = async () => {
    const customTitle = sponsorTitleUi.input.value.trim();
    if (customTitle.length > 10) {
      sponsorTitleUi.msg.textContent = '称号长度不能超过10个字！';
      sponsorTitleUi.msg.style.color = '#e74c3c';
      return;
    }
    // 过滤特殊字符
    const invalidChars = /[<>"'&\\/]/;
    if (invalidChars.test(customTitle)) {
      sponsorTitleUi.msg.textContent = '称号包含非法字符！';
      sponsorTitleUi.msg.style.color = '#e74c3c';
      return;
    }
    try {
      sponsorTitleUi.msg.textContent = '保存中...';
      sponsorTitleUi.msg.style.color = '#999';
      const res = await fetch('/api/sponsors/custom-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, customTitle, characterName: currentPlayerName })
      });
      const data = await res.json();
      if (data.ok) {
        sponsorTitleUi.msg.textContent = '保存成功！';
        sponsorTitleUi.msg.style.color = '#27ae60';
        // 重新加载赞助名单以更新显示
        await loadSponsors();
        // 延迟关闭模态框
        setTimeout(() => {
          sponsorTitleUi.modal.classList.add('hidden');
        }, 500);
      } else {
        sponsorTitleUi.msg.textContent = data.error || '保存失败！';
        sponsorTitleUi.msg.style.color = '#e74c3c';
      }
    } catch (err) {
      console.error('保存称号失败:', err);
      sponsorTitleUi.msg.textContent = '保存失败，请重试！';
      sponsorTitleUi.msg.style.color = '#e74c3c';
    }
  };
}

const ITEM_TYPE_LABELS = {
  consumable: '\u6d88\u8017\u54c1',
  weapon: '\u6b66\u5668',
  armor: '\u9632\u5177',
  accessory: '\u9970\u54c1',
  book: '\u6280\u80fd\u4e66',
  material: '\u6750\u6599',
  currency: '\u8d27\u5e01',
  unknown: '\u672a\u77e5'
};
const RARITY_LABELS = {
  ultimate: '\u7ec8\u6781',
  supreme: '\u81f3\u5c0a',
  legendary: '\u4f20\u8bf4',
  epic: '\u53f2\u8bd7',
  rare: '\u7a00\u6709',
  uncommon: '\u9ad8\u7ea7',
  common: '\u666e\u901a'
};

const RARITY_ORDER = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  supreme: 5,
  ultimate: 6
};

function rarityRank(item) {
  if (!item || !item.rarity) return 0;
  const key = typeof item.rarity === 'string' ? item.rarity.toLowerCase() : item.rarity;
  return RARITY_ORDER[key] ?? 0;
}

function sortByRarityDesc(a, b) {
  const diff = rarityRank(b) - rarityRank(a);
  if (diff !== 0) return diff;
  const nameA = a?.name || '';
  const nameB = b?.name || '';
  return nameA.localeCompare(nameB, 'zh-Hans-CN');
}

  function repairMultiplier(rarity) {
    switch (rarity) {
      case 'ultimate':
        return 7.0;
      case 'supreme':
        return 6.0;
      case 'legendary':
        return 5.0;
      case 'epic':
        return 4.2;
      case 'rare':
        return 3.4;
      case 'uncommon':
        return 2.6;
      default:
        return 2.0;
    }
  }
  
  function repairBase(type) {
    if (type === 'weapon') return 200;
    if (type === 'armor') return 180;
    return 160;
  }
  
  function calcRepairCost(item, missing) {
    if (!item || missing <= 0) return 0;
    let cost = Math.max(1, Math.floor(repairBase(item.type) * repairMultiplier(item.rarity) * missing));
    cost = Math.min(50000, cost);
    if (lastState && lastState.stats && lastState.stats.sabak_bonus) {
      cost = Math.max(1, Math.floor(cost * 0.8));
    }
    if (lastState && lastState.stats && lastState.stats.vip) {
      cost = Math.max(1, Math.floor(cost * 0.5));
    }
    return cost;
  }
const ITEM_SLOT_LABELS = {
  weapon: '\u6b66\u5668',
  chest: '\u8863\u670d',
  head: '\u5934\u76d4',
  waist: '\u8170\u5e26',
  feet: '\u9774\u5b50',
  ring: '\u6212\u6307',
  bracelet: '\u624b\u9556',
  neck: '\u9879\u94fe'
};
const TRAINING_OPTIONS = [
  { id: 'hp', label: '\u751f\u547d', inc: 1, perLevel: 0.1 },
  { id: 'mp', label: '\u9b54\u6cd5\u503c', inc: 1, perLevel: 0.1 },
  { id: 'atk', label: '\u653b\u51fb', inc: 1, perLevel: 0.01 },
  { id: 'def', label: '\u9632\u5fa1', inc: 1, perLevel: 0.01 },
  { id: 'mag', label: '\u9b54\u6cd5', inc: 1, perLevel: 0.01 },
  { id: 'mdef', label: '\u9b54\u5fa1', inc: 1, perLevel: 0.01 },
  { id: 'spirit', label: '\u9053\u672f', inc: 1, perLevel: 0.01 },
  { id: 'dex', label: '\u654f\u6377', inc: 1, perLevel: 0.01 }
];

function trainingCost(currentLevel) {
  const base = 10000;
  return Math.max(1, Math.floor(base + currentLevel * (base * 0.2)));
}

function formatItemTooltip(item) {
  if (!item) return '';
  const lines = [];
  lines.push(item.name || '');
  if (item.is_set) lines.push('\u5957\u88c5');
  if (item.rarity) {
    const rarityKey = typeof item.rarity === 'string' ? item.rarity.toLowerCase() : item.rarity;
    lines.push(`\u7a00\u6709\u5ea6: ${RARITY_LABELS[rarityKey] || item.rarity}`);
  }
  if (item.effects && item.effects.combo) {
    lines.push('\u7279\u6548: \u8fde\u51fb(10%\u53cc\u51fb)');
  }
  if (item.effects && item.effects.fury) {
    lines.push('\u7279\u6548: \u7834\u8840\u72C2\u653B(\u653b\u51fb/\u9b54\u6cd5/\u9053\u672f+25%)');
  }
  if (item.effects && item.effects.unbreakable) {
    lines.push('\u7279\u6548: \u6c38\u4e0d\u78e8\u635f(\u8010\u4e45\u4e0d\u4f1a\u964d\u4f4e)');
  }
  if (item.effects && item.effects.defense) {
    lines.push('\u7279\u6548: \u5b88\u62a4(\u9632\u5fa1/\u9b54\u5fa1+50%)');
  }
  if (item.effects && item.effects.dodge) {
    lines.push('\u7279\u6548: \u95ea\u907f(20%\u51e0\u7387\u8eb2\u95ea\u653b\u51fb)');
  }
  if (item.effects && item.effects.poison) {
    lines.push('\u7279\u6548: \u6bd2(10%\u6982\u7387\u65bd\u6bd2\uff0c10\u79d2\u5185\u6389\u8840\uff0c\u9632\u5fa1/\u9b54\u5fa1-5%)');
  }
  if (item.effects && item.effects.healblock) {
    lines.push('\u7279\u6548: \u7981\u7597(20%\u6982\u7387\u51cf\u5c11\u76ee\u6807\u56de\u884090%\uff0c\u6301\u7eed5\u79d2)');
  }
  if (item.effects && item.effects.elementAtk) {
    lines.push(`\u7279\u6548: \u5143\u7d20\u653b\u51fb+${Math.floor(item.effects.elementAtk)}(\u65e0\u89c6\u9632\u5fa1/\u9b54\u5fa1)`);
  }
  const typeLabel = ITEM_TYPE_LABELS[item.type] || ITEM_TYPE_LABELS.unknown;
  lines.push(`\u7c7b\u578b: ${typeLabel}`);
  if (item.slot) {
    const slotLabel = ITEM_SLOT_LABELS[item.slot] || item.slot;
    lines.push(`\u90e8\u4f4d: ${slotLabel}`);
  }
  // 显示耐久度信息
  if (item.slot && (item.durability != null || item.max_durability != null)) {
    const maxDur = item.max_durability || 100;
    const curDur = item.durability != null ? item.durability : maxDur;
    lines.push(`\u8010\u4e45\u5ea6: ${curDur}/${maxDur}`);
  }
  const stats = [];
  if (item.atk) stats.push(`\u653b\u51fb+${item.atk}`);
  if (item.def) stats.push(`\u9632\u5fa1+${item.def}`);
  if (item.mdef) stats.push(`\u9b54\u5fa1+${item.mdef}`);
  if (item.mag) stats.push(`\u9b54\u6cd5+${item.mag}`);
  if (item.spirit) stats.push(`\u9053\u672f+${item.spirit}`);
  if (item.dex) stats.push(`\u654f\u6377+${item.dex}`);
  if (item.hp) stats.push(`\u751f\u547d+${item.hp}`);
  if (item.mp) stats.push(`\u9b54\u6cd5\u503c+${item.mp}`);
  if (stats.length) {
    lines.push(stats.join(' '));
  }
  if (item.price) {
    lines.push(`\u4ef7\u683c: ${item.price}\u91d1`);
  }
  return lines.filter(Boolean).join('\n');
}

function renderGuildModal() {
  if (!guildUi.modal || !guildUi.list) return;
  guildUi.list.innerHTML = '';
  const roleLabel = lastState?.guild_role === 'leader' ? '会长' : (lastState?.guild_role === 'vice_leader' ? '副会长' : '成员');
  if (guildUi.title) {
    const guildName = lastState?.guild || '无';
    guildUi.title.textContent = `行会: ${guildName} (${roleLabel})`;
  }
  if (guildUi.invite) {
    const isLeaderOrVice = lastState?.guild_role === 'leader' || lastState?.guild_role === 'vice_leader';
    guildUi.invite.classList.toggle('hidden', !isLeaderOrVice);
  }
  if (guildUi.applications) {
    const isLeaderOrVice = lastState?.guild_role === 'leader' || lastState?.guild_role === 'vice_leader';
    guildUi.applications.classList.toggle('hidden', !isLeaderOrVice);
  }
  if (guildUi.leave) {
    guildUi.leave.classList.remove('hidden');
  }

  // 计算分页
  const totalPages = Math.max(1, Math.ceil(guildMembers.length / GUILD_PAGE_SIZE));
  guildPage = Math.min(Math.max(0, guildPage), totalPages - 1);
  const start = guildPage * GUILD_PAGE_SIZE;
  const pageMembers = guildMembers.slice(start, start + GUILD_PAGE_SIZE);

  if (!guildMembers.length) {
    const empty = document.createElement('div');
    empty.textContent = '暂无成员信息。';
    guildUi.list.appendChild(empty);
  } else {
    pageMembers.forEach((member) => {
      const row = document.createElement('div');
      row.className = 'guild-member';
      const name = document.createElement('div');
      const online = member.online ? '在线' : '离线';
      name.textContent = `${member.name} (${online})`;
      row.appendChild(name);
      const roleLabel = member.role === 'leader' ? '会长' : (member.role === 'vice_leader' ? '副会长' : '成员');
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = roleLabel;
      row.appendChild(tag);
      // 会长和副会长的权限控制
      const isLeader = lastState?.guild_role === 'leader';
      const isVice = lastState?.guild_role === 'vice_leader';
      const isLeaderOrVice = isLeader || isVice;

      if (isLeader) {
        if (member.role !== 'leader') {
          const viceBtn = document.createElement('button');
          viceBtn.textContent = member.role === 'vice_leader' ? '取消副会长' : '设为副会长';
          viceBtn.addEventListener('click', () => {
            if (socket) socket.emit('cmd', { text: `guild vice ${member.name}` });
          });
          row.appendChild(viceBtn);
        }
        if (member.role !== 'leader' && member.role !== 'vice_leader') {
          const transferBtn = document.createElement('button');
          transferBtn.textContent = '转移会长';
          transferBtn.addEventListener('click', () => {
            if (socket) socket.emit('cmd', { text: `guild transfer ${member.name}` });
          });
          row.appendChild(transferBtn);
        }
      }

      // 会长和副会长都可以踢出普通成员
      if (isLeaderOrVice && member.role === 'member') {
        const kickBtn = document.createElement('button');
        kickBtn.textContent = '踢出';
        kickBtn.addEventListener('click', () => {
          if (socket) socket.emit('cmd', { text: `guild kick ${member.name}` });
        });
        row.appendChild(kickBtn);
      }
      guildUi.list.appendChild(row);
    });
  }

  // 更新分页信息
  if (guildUi.page) guildUi.page.textContent = `第 ${guildPage + 1}/${totalPages} 页`;
  if (guildUi.prev) guildUi.prev.disabled = guildPage === 0;
  if (guildUi.next) guildUi.next.disabled = guildPage >= totalPages - 1;

  guildUi.modal.classList.remove('hidden');
}

function renderGuildListModal(guilds) {
  if (!guildListUi.modal || !guildListUi.list) return;
  guildListUi.list.innerHTML = '';
  guildApplyButtons.clear();
  guildApplyPending.clear();

  if (!guilds || guilds.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sabak-empty';
    empty.textContent = '暂无行会';
    guildListUi.list.appendChild(empty);
  } else {
    guilds.forEach((guild) => {
      const row = document.createElement('div');
      row.className = 'guild-member';
      row.innerHTML = `<div class="guild-info">${guild.name} (会长: ${guild.leader_char_name})</div>`;
      const applyBtn = document.createElement('button');
      applyBtn.textContent = '申请加入';
      applyBtn.addEventListener('click', () => {
        if (!socket) {
          showToast('未连接服务器');
          return;
        }
        if (guildApplyPending.has(guild.id)) return;
        lastGuildApplyId = guild.id;
        guildApplyPending.add(guild.id);
        applyBtn.disabled = true;
        applyBtn.textContent = '申请中...';
        socket.emit('guild_apply', { guildId: guild.id });
        setTimeout(() => {
          if (!guildApplyPending.has(guild.id)) return;
          guildApplyPending.delete(guild.id);
          applyBtn.disabled = false;
          applyBtn.textContent = '申请加入';
          showToast('申请超时，请重试');
        }, 5000);
      });
      row.appendChild(applyBtn);
      guildApplyButtons.set(guild.id, applyBtn);
      guildListUi.list.appendChild(row);
    });
  }

  guildListUi.modal.classList.remove('hidden');
}

function renderGuildApplicationsModal(applications) {
  if (!guildApplicationsUi.modal || !guildApplicationsUi.list) return;
  guildApplicationsUi.list.innerHTML = '';

  if (!applications || applications.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sabak-empty';
    empty.textContent = '暂无待处理申请';
    guildApplicationsUi.list.appendChild(empty);
  } else {
    applications.forEach((app) => {
      const row = document.createElement('div');
      row.className = 'guild-member';
      const time = new Date(app.applied_at).toLocaleString('zh-CN', { hour12: false });
      row.innerHTML = `<div class="app-info">${app.char_name} (${time})</div>`;

      const approveBtn = document.createElement('button');
      approveBtn.textContent = '批准';
      approveBtn.addEventListener('click', () => {
        if (socket) socket.emit('guild_approve', { charName: app.char_name });
      });
      row.appendChild(approveBtn);

      const rejectBtn = document.createElement('button');
      rejectBtn.textContent = '拒绝';
      rejectBtn.addEventListener('click', () => {
        if (socket) socket.emit('guild_reject', { charName: app.char_name });
      });
      row.appendChild(rejectBtn);

      guildApplicationsUi.list.appendChild(row);
    });
  }

  guildApplicationsUi.modal.classList.remove('hidden');
}

function renderSabakModal(payload) {
  if (!sabakUi.modal) return;
  const { windowInfo, ownerGuildName, registrations, canRegister, isOwner } = payload;
  if (sabakUi.info) {
    const registrationWindow = payload?.registrationWindowInfo || '0:00-19:50';
    sabakUi.info.innerHTML = `
      <div class="sabak-info-section">
        <div class="sabak-info-title">攻城时间</div>
        <div class="sabak-info-content">${windowInfo || '每日 20:00-20:10'}</div>
      </div>
      <div class="sabak-info-section">
        <div class="sabak-info-title">当前城主</div>
        <div class="sabak-info-content ${ownerGuildName ? 'sabak-owner' : ''}">${ownerGuildName || '暂无'}</div>
      </div>
      <div class="sabak-info-section">
        <div class="sabak-info-title">报名</div>
        <div class="sabak-info-content">${registrationWindow} · ${isOwner ? '守城免费' : '100万金币'}</div>
      </div>
    `;
  }
  if (sabakUi.title) {
    const titleWindow = windowInfo || '每日 20:00-20:10';
    sabakUi.title.textContent = `沙巴克攻城报名（${titleWindow}）`;
  }
  if (sabakUi.msg) {
    sabakUi.msg.textContent = '';
  }
  if (sabakUi.guildList) {
    sabakUi.guildList.innerHTML = '';
    if (!registrations || registrations.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'sabak-empty';
      empty.textContent = '暂无报名行会';
      sabakUi.guildList.appendChild(empty);
    } else {
      registrations.forEach((reg) => {
        const row = document.createElement('div');
        row.className = 'guild-member';
        const guildName = reg.guild_name || reg.guildName || `行会#${reg.guild_id || reg.guildId || '未知'}`;
        if (reg.isDefender) {
          row.innerHTML = `<span class="defender-badge">守城</span>${guildName}`;
          row.classList.add('defender-row');
        } else {
          row.innerHTML = `<span class="attacker-badge">攻城</span>${guildName}`;
          row.classList.add('attacker-row');
        }
        sabakUi.guildList.appendChild(row);
      });
    }
  }
  if (sabakUi.confirm) {
    sabakUi.confirm.classList.toggle('hidden', !canRegister);
    sabakUi.confirm.textContent = isOwner ? '守城行会无需报名' : '确认报名（100万金币）';
  }
  sabakUi.modal.classList.remove('hidden');
}

function renderPartyModal() {
  if (!partyUi.modal || !partyUi.list) return;
  partyUi.list.innerHTML = '';
  const party = lastState?.party;
  const myName = lastState?.player?.name;
  const isLeader = party?.leader === myName;

  if (partyUi.title) {
    const leaderName = party?.leader || '无';
    partyUi.title.textContent = `队伍 (${party?.members?.length || 0}/5) - 队长: ${leaderName}`;
  }

  // 为队长显示"一键邀请跟随"按钮，为队员显示"跟随队长"按钮
  if (partyUi.inviteAllFollow) {
    const onlineMemberCount = party?.members?.filter(m => m.name !== party.leader && m.online).length || 0;
    partyUi.inviteAllFollow.classList.toggle('hidden', !isLeader || onlineMemberCount === 0);
  }
  if (partyUi.followLeader) {
    const leaderOnline = party?.members?.some(m => m.name === party.leader && m.online);
    partyUi.followLeader.classList.toggle('hidden', isLeader || !leaderOnline);
  }

  if (!party || !party.members || !party.members.length) {
    const empty = document.createElement('div');
    empty.textContent = '你不在队伍中。';
    partyUi.list.appendChild(empty);
  } else {
    party.members.forEach((member) => {
      const row = document.createElement('div');
      row.className = 'guild-member';
      const name = document.createElement('div');
      const online = member.online ? '在线' : '离线';
      const isLeaderName = member.name === party.leader;
      const role = isLeaderName ? '队长' : '队员';
      name.textContent = `${member.name} (${role}/${online})`;
      row.appendChild(name);

      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = role;
      row.appendChild(tag);

      // 队长可以邀请在线队员跟随
      if (isLeader && !isLeaderName && member.online) {
        const followBtn = document.createElement('button');
        followBtn.textContent = '邀请跟随';
        followBtn.addEventListener('click', () => {
          if (socket) socket.emit('cmd', { text: `party follow ${member.name}` });
        });
        row.appendChild(followBtn);
      }

      // 队长可以踢出队员
      if (isLeader && !isLeaderName) {
        const transferBtn = document.createElement('button');
        transferBtn.textContent = '转移队长';
        transferBtn.addEventListener('click', () => {
          if (socket) socket.emit('cmd', { text: `party transfer ${member.name}` });
        });
        row.appendChild(transferBtn);
        const kickBtn = document.createElement('button');
        kickBtn.textContent = '踢出';
        kickBtn.addEventListener('click', () => {
          if (socket) socket.emit('cmd', { text: `party kick ${member.name}` });
        });
        row.appendChild(kickBtn);
      }

      partyUi.list.appendChild(row);
    });
  }
  partyUi.modal.classList.remove('hidden');
}

function showGuildModal() {
  hideItemTooltip();
  guildPage = 0;
  if (socket) socket.emit('guild_members');
  renderGuildModal();
}

function formatItemName(item) {
  if (!item) return '';
  const tags = [];
  if (item.effects && item.effects.combo) tags.push('\u8fde\u51fb');
  if (item.effects && item.effects.fury) tags.push('\u72C2\u653B');
  if (item.effects && item.effects.unbreakable) tags.push('\u4e0d\u78e8');
  if (item.effects && item.effects.defense) tags.push('\u5b88\u62a4');
  if (item.effects && item.effects.dodge) tags.push('\u95ea\u907f');
  if (item.effects && item.effects.poison) tags.push('\u6bd2');
  if (item.effects && item.effects.healblock) tags.push('\u7981\u7597');
  if (item.effects && item.effects.elementAtk) tags.push(`\u5143\u7d20+${Math.floor(item.effects.elementAtk)}`);
  if (item.refine_level && item.refine_level > 0) tags.push(`锻造+${item.refine_level}`);
  return tags.length ? `${item.name}\u00b7${tags.join('\u00b7')}` : item.name;
}

function applyRarityClass(el, item) {
  if (!el || !item || !item.rarity) return;
  const rarityKey = typeof item.rarity === 'string' ? item.rarity.toLowerCase() : item.rarity;
  el.classList.add(`rarity-${rarityKey}`);
  if (rarityKey === 'ultimate') {
    el.classList.add('highlight-marquee', 'ultimate-text');
  }
}

function findItemByDisplayName(name, extraItems = null) {
  if (!name) return null;
  if (Array.isArray(extraItems)) {
    const hit = extraItems.find((item) =>
      formatItemName(item) === name || item.name === name
    );
    if (hit) return hit;
  }
  if (!lastState || !Array.isArray(lastState.items)) return null;
  return lastState.items.find((item) =>
    formatItemName(item) === name || item.name === name
  ) || null;
}

function renderTextWithItemHighlights(container, text, extraItems = null) {
  if (!container) return;
  container.innerHTML = '';
  if (!text) return;
  const names = new Set();
  const addName = (name) => {
    if (name && typeof name === 'string') names.add(name);
  };
  if (Array.isArray(extraItems)) {
    extraItems.forEach((item) => {
      if (!item) return;
      addName(item.name);
      addName(formatItemName(item));
    });
  }
  if (lastState && Array.isArray(lastState.items)) {
    lastState.items.forEach((item) => {
      if (!item) return;
      addName(item.name);
      addName(formatItemName(item));
    });
  }
  if (!names.size) {
    container.textContent = text;
    return;
  }
  const escaped = Array.from(names)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) {
    container.textContent = text;
    return;
  }
  const regex = new RegExp(escaped.join('|'), 'g');
  const frag = document.createDocumentFragment();
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const span = document.createElement('span');
    span.textContent = match[0];
    applyRarityClass(span, findItemByDisplayName(match[0], extraItems));
    frag.appendChild(span);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
  container.appendChild(frag);
}

function isPotionName(name) {
  if (!name) return false;
  return /药|雪霜|太阳水/.test(name);
}

function shopDisplayPrice(item) {
  let price = item.price || 0;
  if (lastState?.stats?.sabak_bonus && isPotionName(item.name)) {
    price = Math.max(1, Math.floor(price * 0.8));
  }
  return price;
}

async function promptChangePassword() {
  if (!token) {
    alert('请先登录后修改密码');
    return;
  }
  const oldPassword = await promptModal({
    title: '修改密码',
    text: '请输入旧密码',
    placeholder: '旧密码',
    type: 'password'
  });
  if (!oldPassword) return;
  const newPasswordInputs = await promptDualModal({
    title: '修改密码',
    text: '请输入并确认新密码（至少4位）',
    labelMain: '新密码',
    labelSecondary: '确认新密码',
    placeholderMain: '新密码',
    placeholderSecondary: '确认新密码',
    typeMain: 'password',
    typeSecondary: 'password'
  });
  if (!newPasswordInputs || !newPasswordInputs.main || !newPasswordInputs.secondary) return;
  if (newPasswordInputs.main !== newPasswordInputs.secondary) {
    showToast('两次密码不一致');
    return;
  }
  try {
    await apiPost('/api/password', {
      token,
      oldPassword,
      newPassword: newPasswordInputs.main
    });
    showToast('密码已更新，请重新登录');
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      localStorage.removeItem(getUserStorageKey('savedToken', rememberedUser));
    }
    exitGame();
  } catch (err) {
    showToast(err.message || '修改失败');
  }
}

function handleIncomingState(payload) {
  if (!payload) return;
  if (payload.state_throttle_enabled !== undefined) {
    stateThrottleEnabled = payload.state_throttle_enabled === true;
    syncStateThrottleToggle();
  }
  if (payload.state_throttle_override_server_allowed !== undefined) {
    stateThrottleOverrideServerAllowed = payload.state_throttle_override_server_allowed === true;
  }
  if (payload.state_throttle_interval_sec !== undefined) {
    const intervalSec = Math.max(1, Number(payload.state_throttle_interval_sec) || 10);
    stateThrottleIntervalMs = intervalSec * 1000;
  }
  if (payload.refine_material_count !== undefined) {
    refineMaterialCount = Math.max(1, Number(payload.refine_material_count) || 20);
  }
  const roomChanged = payload.room && (!lastState || !lastState.room ||
    payload.room.zoneId !== lastState.room.zoneId || payload.room.roomId !== lastState.room.roomId);
  const inBossRoom = isBossRoomState(payload) || isBossRoomState(lastState);
  const effectiveThrottleEnabled = stateThrottleEnabled && !stateThrottleOverride && !inBossRoom && !roomChanged;
  if (!effectiveThrottleEnabled) {
    if (stateThrottleTimer) {
      clearTimeout(stateThrottleTimer);
      stateThrottleTimer = null;
    }
    pendingState = null;
    renderState(payload);
    lastStateRenderAt = Date.now();
    return;
  }
  pendingState = payload;
  const now = Date.now();
  const elapsed = now - lastStateRenderAt;
  if (elapsed >= stateThrottleIntervalMs) {
    renderState(pendingState);
    pendingState = null;
    lastStateRenderAt = now;
    return;
  }
  if (!stateThrottleTimer) {
    stateThrottleTimer = setTimeout(() => {
      stateThrottleTimer = null;
      if (!pendingState) return;
      renderState(pendingState);
      pendingState = null;
      lastStateRenderAt = Date.now();
    }, Math.max(0, stateThrottleIntervalMs - elapsed));
  }
}

function isStateThrottleActive() {
  return stateThrottleEnabled && !stateThrottleOverride && !isBossRoomState(lastState);
}

function isBossRoomState(state) {
  if (!state || !state.room) return false;
  const { zoneId, roomId } = state.room;
  if (!zoneId || !roomId) return false;
  if (zoneId === 'wb' && roomId === 'lair') return true;
  if (zoneId === 'molong' && roomId === 'deep') return true;
  if (zoneId === 'sb_guild' && roomId === 'sanctum') return true;
  if (zoneId === 'dark_bosses' && roomId === 'dark_woma_lair') return true;
  if (zoneId === 'dark_bosses' && roomId === 'dark_zuma_lair') return true;
  if (zoneId === 'dark_bosses' && roomId === 'dark_hongmo_lair') return true;
  if (zoneId === 'dark_bosses' && roomId === 'dark_huangquan_lair') return true;
  if (zoneId === 'dark_bosses' && roomId === 'dark_doublehead_lair') return true;
  if (zoneId === 'dark_bosses' && roomId === 'dark_skeleton_lair') return true;
  return false;
}

function renderState(state) {
  const prevState = lastState;
  lastState = state;
  // 更新VIP自助领取开关状态
  if (state.vip_self_claim_enabled !== undefined) {
    vipSelfClaimEnabled = state.vip_self_claim_enabled;
  }
  if (state.player) {
    // 如果当前 realmId 不在列表中，使用第一个可用服务器
    const realm = realmList.find(r => r.id === currentRealmId) || realmList[0];
    const realmName = realm?.name || `新区${currentRealmId}`;
    // 自动更新 currentRealmId 为有效的服务器ID
    if (realm && realm.id !== currentRealmId) {
      currentRealmId = realm.id;
      const username = localStorage.getItem('rememberedUser');
      if (username) {
        const key = getUserStorageKey('lastRealm', username);
        localStorage.setItem(key, String(realm.id));
      }
    }
    console.log(`renderState: currentRealmId=${currentRealmId}, realmList=${JSON.stringify(realmList.map(r => ({id: r.id, name: r.name})))}, realmName=${realmName}`);
    if (ui.realm) ui.realm.textContent = realmName;
    ui.name.textContent = state.player.name || '-';
    const classLabel = classNames[state.player.classId] || state.player.classId || '-';
    ui.classLevel.textContent = `${classLabel} | Lv ${state.player.level}`;
    if (activeChar && state.player.name === activeChar) {
      if (lastSavedLevel !== state.player.level) {
        lastSavedLevel = state.player.level;
        updateSavedCharacters(state.player);
      }
    }
  }
  if (state.stats) {
    setBar(ui.hp, state.stats.hp, state.stats.max_hp);
    setBar(ui.mp, state.stats.mp, state.stats.max_mp);

    // 不限制最大等级，始终显示经验条
    if (state.stats.exp_next && state.stats.exp_next > 0) {
      ui.exp.style.display = '';
      setBar(ui.exp, state.stats.exp, state.stats.exp_next);
    } else {
      ui.exp.style.display = 'none';
    }

    ui.gold.textContent = state.stats.gold;
    if (ui.cultivation) {
      const levelValue = state.stats?.cultivation_level ?? state.player?.cultivation_level ?? -1;
      const info = getCultivationInfo(levelValue);
      ui.cultivation.textContent = info.bonus > 0 ? `${info.name} +${info.bonus}` : info.name;
    }
    if (ui.cultivationUpgrade) {
      const cultivationLevel = Math.floor(Number(state.stats?.cultivation_level ?? -1));
      const canUpgrade = (state.player?.level || 0) > 200 && cultivationLevel < CULTIVATION_RANKS.length - 1;
      ui.cultivationUpgrade.classList.toggle('hidden', !canUpgrade);
      if (canUpgrade) {
        ui.cultivationUpgrade.title = `消耗 200 级，当前等级 ${state.player?.level || 0}`;
      }
    }
    if (ui.hpValue) ui.hpValue.textContent = `${Math.round(state.stats.hp)}/${Math.round(state.stats.max_hp)}`;
    if (ui.mpValue) ui.mpValue.textContent = `${Math.round(state.stats.mp)}/${Math.round(state.stats.max_mp)}`;
    if (ui.expValue) {
      ui.expValue.textContent = state.stats.exp_next && state.stats.exp_next > 0
        ? `${state.stats.exp}/${state.stats.exp_next}`
        : `${state.stats.exp}`;
    }
    if (ui.atk) ui.atk.textContent = state.stats.atk ?? '-';
    if (ui.def) ui.def.textContent = state.stats.def ?? '-';
    if (ui.mag) ui.mag.textContent = state.stats.mag ?? '-';
    if (ui.spirit) ui.spirit.textContent = state.stats.spirit ?? '-';
    if (ui.mdef) ui.mdef.textContent = state.stats.mdef ?? '-';
    if (ui.dodge) {
      const dodgeValue = state.stats.dodge;
      ui.dodge.textContent = dodgeValue != null ? `${dodgeValue}%` : '-';
    }
    ui.pk.textContent = `${state.stats.pk} (${state.stats.pk >= 100 ? '红名' : '正常'})`;
    ui.vip.textContent = formatVipDisplay(state.stats);
    if (ui.bonusLine) {
      const sabakText = state.stats.sabak_bonus ? '已生效' : '无';
      const setText = state.stats.set_bonus ? '已激活' : '无';
      ui.bonusLine.textContent = `沙巴克加成：${sabakText} | 套装加成：${setText}`;
    }
    if (ui.online) {
      ui.online.textContent = state.online ? String(state.online.count || 0) : '0';
    }
    if (state.server_time) {
      serverTimeBase = state.server_time;
      serverTimeLocal = Date.now();
      updateServerTimeDisplay();
      if (!serverTimeTimer) {
        serverTimeTimer = setInterval(updateServerTimeDisplay, 1000);
      }
    }
    if (ui.party) {
      if (state.party && Array.isArray(state.party.members) && state.party.members.length) {
        const names = state.party.members.map((m) => m.online ? m.name : `${m.name}(离线)`);
        ui.party.textContent = names.join('、');
        ui.party.style.cursor = 'pointer';
        ui.party.style.color = '#4a90e2';
        ui.party.style.textDecoration = 'underline';
      } else {
        ui.party.textContent = '无';
        ui.party.style.cursor = 'default';
        ui.party.style.color = '';
        ui.party.style.textDecoration = '';
      }
    }

    // 更新交易状态
    if (state.trade && tradeUi.modal && !tradeUi.modal.classList.contains('hidden')) {
      // 更新对方名称
      if (tradeUi.partnerTitle) {
        tradeUi.partnerTitle.textContent = state.trade.partnerName || '对方';
      }

      // 更新我方物品
      tradeUi.myItems.innerHTML = '';
      if (state.trade.myItems.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'trade-empty';
        empty.textContent = '暂无物品';
        tradeUi.myItems.appendChild(empty);
      } else {
        state.trade.myItems.forEach((item) => {
          const itemTemplate = lastState?.items?.find(i => i.id === item.id);
          if (!itemTemplate) return;
          const itemDiv = document.createElement('div');
          itemDiv.className = 'trade-item';
          applyRarityClass(itemDiv, itemTemplate);
          const name = formatItemName({ ...itemTemplate, effects: item.effects });
          itemDiv.textContent = `${name} x${item.qty}`;
          tradeUi.myItems.appendChild(itemDiv);
        });
      }

      // 更新对方物品
      tradeUi.partnerItems.innerHTML = '';
      if (state.trade.partnerItems.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'trade-empty';
        empty.textContent = '暂无物品';
        tradeUi.partnerItems.appendChild(empty);
      } else {
        state.trade.partnerItems.forEach((item) => {
          const itemTemplate = lastState?.items?.find(i => i.id === item.id);
          if (!itemTemplate) return;
          const itemDiv = document.createElement('div');
          itemDiv.className = 'trade-item';
          applyRarityClass(itemDiv, itemTemplate);
          const name = formatItemName({ ...itemTemplate, effects: item.effects });
          itemDiv.textContent = `${name} x${item.qty}`;
          tradeUi.partnerItems.appendChild(itemDiv);
        });
      }

      // 更新金币
      if (tradeUi.myGold) tradeUi.myGold.textContent = `金币: ${state.trade.myGold}`;
      if (tradeUi.partnerGold) tradeUi.partnerGold.textContent = `金币: ${state.trade.partnerGold}`;

      // 更新锁定/确认状态
      if (tradeUi.status) {
        const myName = lastState?.player?.name || '';
        const partnerName = state.trade.partnerName;
        const iLocked = state.trade.locked[myName];
        const partnerLocked = state.trade.locked[partnerName];
        const iConfirmed = state.trade.confirmed[myName];
        const partnerConfirmed = state.trade.confirmed[partnerName];

        let statusText = '';
        if (partnerLocked) {
          statusText = `对方已锁定`;
        }
        if (partnerConfirmed) {
          statusText = `对方已确认`;
        }
        tradeUi.status.textContent = statusText || '交易中';
      }
    }
    ui.guild.textContent = state.guild || '无';
    if (chat.sabakRegisterBtn) {
      const hasGuild = Boolean(state.guild);
      chat.sabakRegisterBtn.classList.toggle('hidden', !hasGuild);
    }
    if (chat.guildCreateBtn) {
      const hasGuild = Boolean(state.guild);
      chat.guildCreateBtn.classList.toggle('hidden', hasGuild);
    }
    if (chat.guildInviteBtn) {
      const hasGuild = Boolean(state.guild);
      const isLeaderOrVice = state.guild_role === 'leader' || state.guild_role === 'vice_leader';
      chat.guildInviteBtn.classList.toggle('hidden', !hasGuild || !isLeaderOrVice);
    }
    if (chat.guildListBtn) {
      const hasGuild = Boolean(state.guild);
      chat.guildListBtn.classList.toggle('hidden', hasGuild);
    }
  }
  if (state.stats) {
    const hasSabakBonus = Boolean(state.stats.sabak_bonus);
    const prevSabakBonus = Boolean(prevState && prevState.stats && prevState.stats.sabak_bonus);
    if (hasSabakBonus && !prevSabakBonus) {
      appendLine('沙巴克加成已生效。');
    } else if (!hasSabakBonus && prevSabakBonus) {
      appendLine('沙巴克加成已结束。');
    }
  }
  if (chat.partyToggleBtn) {
    const inParty = Boolean(state.party && state.party.size > 0);
    chat.partyToggleBtn.textContent = inParty ? '退出组队' : '组队';
    chat.partyToggleBtn.classList.toggle('hidden', true);
    if (chat.partyInviteBtn) {
      chat.partyInviteBtn.textContent = inParty ? '队伍邀请' : '组队';
    }
  }

  if (selectedMob && !(state.mobs || []).some((m) => m.id === selectedMob.id)) {
    selectedMob = null;
  }
  // 后端已经过滤掉带数字后缀的方向，直接使用
  const exits = (state.exits || []).map((e) => ({ id: e.dir, label: e.label }));
  renderChips(ui.exits, exits, (e) => {
    if (socket) {
      socket.emit('cmd', { text: `go ${e.id}` });
    }
  });

  const inCrossRealmRoom = state.room
    && (state.room.zoneId === 'crb' || state.room.zoneId === 'crr')
    && state.room.roomId === 'arena';
  const localRealmId = state.player ? state.player.realmId : null;
  const players = (state.players || [])
    .filter((p) => p.name && (!state.player || p.name !== state.player.name))
    .map((p) => {
      let className = '';
      let badgeLabel = '';
      // 红名玩家显示深红色
      if (p.pk >= 100) {
        className = 'player-red-name';
      } else if (inCrossRealmRoom && localRealmId && p.realmId) {
        className = p.realmId === localRealmId ? 'player-friendly' : 'player-red-name';
        badgeLabel = p.realmId === localRealmId ? '' : '跨服';
      } else if (state.sabak && state.sabak.inZone) {
        className = (state.player && state.player.guildId && p.guildId === state.player.guildId
          ? 'player-friendly'
          : 'player-enemy');
      }
      return {
        id: p.name,
        label: `${p.name} Lv${p.level} ${classNames[p.classId] || p.classId}`,
        raw: p,
        className: className,
        badgeLabel
      };
    });
  renderChips(ui.players, players, (p) => showPlayerModal(p.raw));

  const battlePlayers = [];
  if (state.player && state.stats) {
    battlePlayers.push({
      type: 'player',
      name: state.player.name,
      meta: `Lv${state.player.level} ${classNames[state.player.classId] || state.player.classId}`,
      hp: state.stats.hp,
      maxHp: state.stats.max_hp,
      className: ''
    });
    setLocalHpCache('players', state.player.name, state.stats.hp, state.stats.max_hp);
  }
  (state.players || [])
    .filter((p) => p.name && (!state.player || p.name !== state.player.name))
    .forEach((p) => {
      const isCrossEnemy = inCrossRealmRoom && localRealmId && p.realmId && p.realmId !== localRealmId;
      const isCrossAlly = inCrossRealmRoom && localRealmId && p.realmId && p.realmId === localRealmId;
      battlePlayers.push({
        type: 'player',
        name: p.name,
        meta: `Lv${p.level} ${classNames[p.classId] || p.classId}`,
        hp: p.hp || 0,
        maxHp: p.max_hp || 0,
        className: isCrossEnemy ? 'player-red-name' : (isCrossAlly ? 'player-friendly' : ''),
        badgeLabel: isCrossEnemy ? '跨服' : ''
      });
      setLocalHpCache('players', p.name, p.hp || 0, p.max_hp || 0);
    });
  renderBattleList(battleUi.players, battlePlayers, (p) => {
    if (!p || !p.name) return;
    const target = (state.players || []).find((other) => other.name === p.name) ||
      (state.player && state.player.name === p.name ? state.player : null);
    if (target) {
      showPlayerModal(target);
    }
  });

  const mobs = (state.mobs || []).map((m) => ({ id: m.id, label: `${m.name}(${m.hp})`, raw: m }));
  renderChips(ui.mobs, mobs, (m) => {
    selectedMob = m.raw;
    socket.emit('cmd', { text: `attack ${m.raw.name}` });
  }, selectedMob ? selectedMob.id : null);

  const battleMobs = (state.mobs || []).map((m) => ({
    type: 'mob',
    id: m.id,
    name: m.name,
    meta: `HP ${Math.max(0, Math.floor(m.hp))}/${Math.max(0, Math.floor(m.max_hp || 0))}`,
    hp: m.hp || 0,
    maxHp: m.max_hp || 0
  }));
  (state.mobs || []).forEach((m) => {
    setLocalHpCache('mobs', m.name, m.hp || 0, m.max_hp || 0);
  });
  renderBattleList(battleUi.mobs, battleMobs, (m) => {
    if (!m || !m.name) return;
    const mob = (state.mobs || []).find((entry) => entry.name === m.name && entry.id === m.id) ||
      (state.mobs || []).find((entry) => entry.name === m.name);
    if (mob && socket) {
      selectedMob = mob;
      socket.emit('cmd', { text: `attack ${mob.name}` });
    }
  });

  const skills = (state.skills || []).map((s) => ({
    id: s.id,
    label: s.level ? `${getSkillDisplayName(s)} Lv${s.level}` : getSkillDisplayName(s),
    raw: s,
    exp: s.exp || 0,
    expNext: s.expNext || 100
  }));
  const handleSkillClick = (s) => {
    if (s.raw.type === 'heal') {
      socket.emit('cmd', { text: `cast ${s.raw.id}` });
      return;
    }
    if (s.raw.type === 'summon') {
      socket.emit('cmd', { text: `cast ${s.raw.id}` });
      return;
    }
    if (!selectedMob) return;
    socket.emit('cmd', { text: `cast ${s.raw.id} ${selectedMob.name}` });
  };
  renderChips(ui.skills, skills, handleSkillClick);
  if (battleUi.skills) {
    renderChips(battleUi.skills, skills, handleSkillClick);
  }

  if (ui.summon) {
    const summonBlock = ui.summon.closest('.action-group');
    if (state.player && state.player.classId === 'warrior') {
      if (summonBlock) summonBlock.classList.add('hidden');
    } else {
      if (summonBlock) summonBlock.classList.remove('hidden');
      const summons = Array.isArray(state.summons) && state.summons.length
        ? state.summons
        : (state.summon ? [state.summon] : []);
      if (summons.length) {
        const summonEntries = summons.map((summon, index) => ({
          id: summon.id || `summon-${index}`,
          label: `${summon.name} Lv${summon.level}/${summon.levelMax || 8}`,
          raw: summon
        }));
        const activeId = selectedSummonId && summonEntries.some((entry) => entry.id === selectedSummonId)
          ? selectedSummonId
          : summonEntries[0].id;
        const active = summonEntries.find((entry) => entry.id === activeId) || summonEntries[0];
        renderChips(ui.summon, summonEntries, (entry) => {
          selectedSummonId = entry.id;
          renderSummonDetails(entry.raw, entry.raw.levelMax || 8);
        }, activeId);
        renderSummonDetails(active.raw, active.raw.levelMax || 8);
      } else {
        ui.summon.textContent = '\u65e0';
        if (ui.summonDetails) {
          ui.summonDetails.classList.add('hidden');
          ui.summonDetails.innerHTML = '';
        }
      }
    }
  }

  if (ui.worldBossRank) {
    const inWorldBossRoom = state.room && state.room.zoneId === 'wb' && state.room.roomId === 'lair';
    const inCrossBossRoom = state.room && state.room.zoneId === 'crb' && state.room.roomId === 'arena';
    const inCrossRankRoom = state.room && state.room.zoneId === 'crr' && state.room.roomId === 'arena';
    const inMolongRoom = state.room && state.room.zoneId === 'molong' && state.room.roomId === 'deep';
    const inSabakBossRoom = state.room && state.room.zoneId === 'sb_guild' && state.room.roomId === 'sanctum';
    const inDarkWomaRoom = state.room && state.room.zoneId === 'dark_bosses' && state.room.roomId === 'dark_woma_lair';
    const inDarkZumaRoom = state.room && state.room.zoneId === 'dark_bosses' && state.room.roomId === 'dark_zuma_lair';
    const inDarkHongmoRoom = state.room && state.room.zoneId === 'dark_bosses' && state.room.roomId === 'dark_hongmo_lair';
    const inDarkHuangquanRoom = state.room && state.room.zoneId === 'dark_bosses' && state.room.roomId === 'dark_huangquan_lair';
    const inDarkDoubleheadRoom = state.room && state.room.zoneId === 'dark_bosses' && state.room.roomId === 'dark_doublehead_lair';
    const inDarkSkeletonRoom = state.room && state.room.zoneId === 'dark_bosses' && state.room.roomId === 'dark_skeleton_lair';
    const inSpecialBossRoom = inWorldBossRoom || inCrossBossRoom || inMolongRoom || inSabakBossRoom || inDarkWomaRoom || inDarkZumaRoom || inDarkHongmoRoom || inDarkHuangquanRoom || inDarkDoubleheadRoom || inDarkSkeletonRoom;
    const inRankRoom = inSpecialBossRoom || inCrossRankRoom;
    const rankBlock = ui.worldBossRank.closest('.action-group');

    // 根据所在的BOSS房间设置不同的标题
    if (ui.worldBossRankTitle) {
      if (inWorldBossRoom) {
        ui.worldBossRankTitle.textContent = '世界BOSS·炎龙伤害排行';
      } else if (inCrossBossRoom) {
        ui.worldBossRankTitle.textContent = '跨服BOSS·白虎伤害排行';
      } else if (inMolongRoom) {
        ui.worldBossRankTitle.textContent = '魔龙教主伤害排行';
      } else if (inSabakBossRoom) {
        ui.worldBossRankTitle.textContent = '沙巴克守护·玄武伤害排行';
      } else if (inDarkWomaRoom) {
        ui.worldBossRankTitle.textContent = '暗之沃玛教主伤害排行';
      } else if (inDarkZumaRoom) {
        ui.worldBossRankTitle.textContent = '暗之祖玛教主伤害排行';
      } else if (inDarkHongmoRoom) {
        ui.worldBossRankTitle.textContent = '暗之虹魔教主伤害排行';
      } else if (inDarkHuangquanRoom) {
        ui.worldBossRankTitle.textContent = '暗之黄泉教主伤害排行';
      } else if (inDarkDoubleheadRoom) {
        ui.worldBossRankTitle.textContent = '暗之双头血魔伤害排行';
      } else if (inDarkSkeletonRoom) {
        ui.worldBossRankTitle.textContent = '暗之骷髅精灵伤害排行';
      } else if (inCrossRankRoom) {
        ui.worldBossRankTitle.textContent = '跨服排位赛击杀排行';
      }
    }

    const currentRoomKey = state.room ? `${state.room.zoneId}:${state.room.roomId}` : null;
    const resetBossRespawn = () => {
      if (bossRespawnTimer) {
        clearInterval(bossRespawnTimer);
      }
      bossRespawnTimer = null;
      bossRespawnTarget = null;
      bossRespawnTimerEl = null;
      if (ui.worldBossRank) {
        ui.worldBossRank.querySelectorAll('.boss-respawn-time').forEach((node) => node.remove());
      }
    };
    const resetCrossRankTimer = () => {
      if (crossRankTimer) {
        clearInterval(crossRankTimer);
      }
      crossRankTimer = null;
      crossRankTimerTarget = null;
      crossRankTimerEl = null;
      crossRankTimerLabel = null;
      if (ui.worldBossRank) {
        ui.worldBossRank.querySelectorAll('.cross-rank-time, .boss-respawn-time').forEach((node) => node.remove());
      }
    };
    const prevRoomKey = ui.worldBossRank.dataset.roomKey || null;
    const roomChanged = prevRoomKey !== currentRoomKey;
    if (roomChanged) {
      resetBossRespawn();
      if (ui.worldBossRank) {
        ui.worldBossRank.innerHTML = '';
        ui.worldBossRank.dataset.roomKey = currentRoomKey || '';
      }
    }
    if (!inRankRoom) {
      if (rankBlock) rankBlock.classList.add('hidden');
      resetBossRespawn();
      resetCrossRankTimer();
      if (ui.worldBossRank) ui.worldBossRank.innerHTML = '';
      if (ui.worldBossRank) {
        ui.worldBossRank.removeAttribute('data-room-key');
      }
    } else {
      if (rankBlock) rankBlock.classList.remove('hidden');
      if (!inCrossRankRoom) {
        resetCrossRankTimer();
      }
      const ranks = state.worldBossRank || [];
      const classRanks = state.worldBossClassRank || null;
      const hasClassRanks = classRanks && Object.values(classRanks).some((list) => Array.isArray(list) && list.length);
      const nextRespawn = state.worldBossNextRespawn;
      const crossRank = state.crossRank || null;
      const isCrossRankActive = Boolean(crossRank && crossRank.active);
      if (ui.worldBossRank) {
        const respawnNodes = ui.worldBossRank.querySelectorAll('.boss-respawn-time');
        if (respawnNodes.length > 1) {
          respawnNodes.forEach((node, idx) => {
            if (idx > 0) node.remove();
          });
        }
        if (!bossRespawnTimerEl) {
          const existingTimer = ui.worldBossRank.querySelector('#boss-respawn-timer');
          if (existingTimer) {
            bossRespawnTimerEl = existingTimer;
          }
        }
      }

      // 如果有下次刷新时间，显示刷新倒计时
        if (inCrossRankRoom) {
          resetBossRespawn();
          if (ui.worldBossRank) ui.worldBossRank.innerHTML = '';
          const ensureCrossRankTimer = (label, target) => {
            if (!target || target <= getServerNow()) {
              resetCrossRankTimer();
              return;
            }
            if (crossRankTimerEl && !crossRankTimerEl.isConnected) {
              crossRankTimerEl = null;
            }
            const updateTimer = () => {
              if (!crossRankTimerTarget || !crossRankTimerEl) return;
              const remaining = Math.max(0, crossRankTimerTarget - getServerNow());
              const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            crossRankTimerEl.textContent = `${minutes}分${seconds}秒`;
          };
          if (crossRankTimerTarget !== target || crossRankTimerLabel !== label || !crossRankTimerEl) {
            crossRankTimerTarget = target;
            crossRankTimerLabel = label;
            const timeDiv = document.createElement('div');
            timeDiv.className = 'boss-respawn-time cross-rank-time';
            const timerSpan = document.createElement('span');
            timerSpan.textContent = '计算中...';
            timeDiv.appendChild(document.createTextNode(label === 'start' ? '距离开始: ' : '距离结束: '));
            timeDiv.appendChild(timerSpan);
            ui.worldBossRank.appendChild(timeDiv);
            crossRankTimerEl = timerSpan;
            updateTimer();
            if (crossRankTimer) clearInterval(crossRankTimer);
            crossRankTimer = setInterval(updateTimer, 1000);
          } else {
            updateTimer();
          }
        };
        if (!crossRank) {
          resetCrossRankTimer();
          const empty = document.createElement('div');
          empty.textContent = '暂无排行';
          ui.worldBossRank.appendChild(empty);
        } else if (!isCrossRankActive) {
          ensureCrossRankTimer('start', crossRank.startsAt || null);
          const empty = document.createElement('div');
          empty.textContent = '排位赛尚未开始';
          ui.worldBossRank.appendChild(empty);
        } else {
          ensureCrossRankTimer('end', crossRank.endsAt || null);
          if (!crossRank.entries.length) {
            const empty = document.createElement('div');
            empty.textContent = '暂无排行';
            ui.worldBossRank.appendChild(empty);
            return;
          }
          crossRank.entries.forEach((entry, idx) => {
            const row = document.createElement('div');
            row.className = 'rank-item';
            const name = document.createElement('span');
            name.textContent = `${entry.name}`;
            const kills = document.createElement('span');
            kills.textContent = `${entry.kills}`;
            const pos = document.createElement('span');
            pos.className = 'rank-pos';
            pos.textContent = `#${idx + 1}`;
            row.appendChild(pos);
            row.appendChild(name);
            row.appendChild(kills);
            ui.worldBossRank.appendChild(row);
          });
        }
      } else if (nextRespawn && nextRespawn > Date.now()) {
        if (bossRespawnTimerEl && !bossRespawnTimerEl.isConnected) {
          bossRespawnTimerEl = null;
        }

        const updateTimer = () => {
          if (!bossRespawnTarget || !bossRespawnTimerEl) return;
          const remaining = Math.max(0, bossRespawnTarget - Date.now());
          if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            bossRespawnTimerEl.textContent = `${minutes}分${seconds}秒`;
          } else {
            bossRespawnTimerEl.textContent = '即将刷新';
            if (bossRespawnTimer) {
              clearInterval(bossRespawnTimer);
              bossRespawnTimer = null;
            }
          }
        };

        if (bossRespawnTarget !== nextRespawn || !bossRespawnTimerEl) {
          bossRespawnTarget = nextRespawn;
          const respawnDiv = document.createElement('div');
          respawnDiv.className = 'boss-respawn-time';
          const timerSpan = document.createElement('span');
          timerSpan.id = 'boss-respawn-timer';
          timerSpan.textContent = '计算中...';
          respawnDiv.appendChild(document.createTextNode('下次刷新: '));
          respawnDiv.appendChild(timerSpan);
          if (ui.worldBossRank) ui.worldBossRank.innerHTML = '';
          ui.worldBossRank.appendChild(respawnDiv);
          bossRespawnTimerEl = timerSpan;
          updateTimer();
          if (bossRespawnTimer) {
            clearInterval(bossRespawnTimer);
          }
          bossRespawnTimer = setInterval(updateTimer, 1000);
        } else {
          updateTimer();
        }
      } else if (hasClassRanks) {
        resetBossRespawn();
        if (ui.worldBossRank) ui.worldBossRank.innerHTML = '';
        const classLabels = [
          { id: 'warrior', name: '战士' },
          { id: 'mage', name: '法师' },
          { id: 'taoist', name: '道士' }
        ];
        classLabels.forEach((cls) => {
          const list = classRanks[cls.id] || [];
          const title = document.createElement('div');
          title.className = 'rank-subtitle';
          title.textContent = `${cls.name}伤害排行`;
          ui.worldBossRank.appendChild(title);
          if (!list.length) {
            const empty = document.createElement('div');
            empty.className = 'rank-empty';
            empty.textContent = '暂无排行';
            ui.worldBossRank.appendChild(empty);
            return;
          }
          list.forEach((entry, idx) => {
            const row = document.createElement('div');
            row.className = 'rank-item';
            const name = document.createElement('span');
            name.textContent = `${entry.name}`;
            const dmg = document.createElement('span');
            dmg.textContent = `${entry.damage}`;
            const pos = document.createElement('span');
            pos.className = 'rank-pos';
            pos.textContent = `#${idx + 1}`;
            row.appendChild(pos);
            row.appendChild(name);
            row.appendChild(dmg);
            ui.worldBossRank.appendChild(row);
          });
        });
      } else if (!ranks.length) {
        resetBossRespawn();
        const empty = document.createElement('div');
        empty.textContent = '暂无排行';
        if (ui.worldBossRank) ui.worldBossRank.innerHTML = '';
        ui.worldBossRank.appendChild(empty);
      } else {
        resetBossRespawn();
        if (ui.worldBossRank) ui.worldBossRank.innerHTML = '';
        ranks.forEach((entry, idx) => {
          const row = document.createElement('div');
          row.className = 'rank-item';
          const name = document.createElement('span');
          name.textContent = `${entry.name}`;
          const dmg = document.createElement('span');
          dmg.textContent = `${entry.damage}`;
          const pos = document.createElement('span');
          pos.className = 'rank-pos';
          pos.textContent = `#${idx + 1}`;
          row.appendChild(pos);
          row.appendChild(name);
          row.appendChild(dmg);
          ui.worldBossRank.appendChild(row);
        });
      }
    }
  }

  // 沙城皇宫击杀统计（仅在沙城皇宫房间显示）
  if (sabakPalaceStatsUi.title && sabakPalaceStatsUi.list) {
    const inSabakPalace = state.room && state.room.zoneId === 'sb_town' && state.room.roomId === 'palace';
    const palaceStatsBlock = sabakPalaceStatsUi.title.closest('.action-group');

    if (!inSabakPalace) {
      if (palaceStatsBlock) palaceStatsBlock.classList.add('hidden');
    } else {
      if (palaceStatsBlock) palaceStatsBlock.classList.remove('hidden');
      sabakPalaceStatsUi.list.innerHTML = '';

      // 添加攻城战状态信息
      if (state.sabak && state.sabak.active) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'sabak-status';
        statusDiv.style.padding = '8px';
        statusDiv.style.marginBottom = '8px';
        statusDiv.style.background = 'rgba(255, 215, 0, 0.1)';
        statusDiv.style.borderRadius = '4px';
        statusDiv.style.border = '1px solid #ffd700';

        // 如果有倒计时，显示倒计时
        if (state.sabak.siegeEndsAt && state.sabak.siegeEndsAt > Date.now()) {
          const remaining = Math.max(0, state.sabak.siegeEndsAt - Date.now());
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          statusDiv.innerHTML = `<div style="color: #ffd700; font-weight: bold; text-align: center;">
            ⚔️ 攻城战进行中
            <div style="font-size: 1.2em; margin-top: 4px;">${minutes}分${seconds}秒</div>
          </div>`;

          // 更新倒计时
          const timerInterval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, state.sabak.siegeEndsAt - now);
            const timerEl = sabakPalaceStatsUi.list.querySelector('.sabak-status');
            if (timerEl && remaining > 0 && state.sabak.siegeEndsAt === state.sabak.siegeEndsAt) {
              const mins = Math.floor(remaining / 60000);
              const secs = Math.floor((remaining % 60000) / 1000);
              const content = timerEl.querySelector('div');
              if (content) {
                content.innerHTML = `<div style="color: #ffd700; font-weight: bold; text-align: center;">
                  ⚔️ 攻城战进行中
                  <div style="font-size: 1.2em; margin-top: 4px;">${mins}分${secs}秒</div>
                </div>`;
              }
            } else {
              clearInterval(timerInterval);
            }
          }, 1000);
        } else {
          statusDiv.innerHTML = `<div style="color: #ffd700; font-weight: bold; text-align: center;">
            ⚔️ 攻城战进行中
          </div>`;
        }
        sabakPalaceStatsUi.list.appendChild(statusDiv);
      } else if (state.sabak?.ownerGuildName) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'sabak-status';
        statusDiv.style.padding = '8px';
        statusDiv.style.marginBottom = '8px';
        statusDiv.style.background = 'rgba(100, 149, 237, 0.1)';
        statusDiv.style.borderRadius = '4px';
        statusDiv.style.border = '1px solid #6495ed';
        statusDiv.innerHTML = `<div style="color: #6495ed; font-weight: bold; text-align: center;">
          🏰 城主: ${state.sabak.ownerGuildName}
        </div>`;
        sabakPalaceStatsUi.list.appendChild(statusDiv);
      }

      // 显示击杀统计或无数据提示
      if (state.sabak?.palaceKillStats && state.sabak.palaceKillStats.length > 0) {
        state.sabak.palaceKillStats.forEach((entry, idx) => {
          const row = document.createElement('div');
          row.className = 'rank-item';
          const name = document.createElement('span');
          name.textContent = entry.guild_name;
          const kills = document.createElement('span');
          kills.textContent = `${entry.kills}击杀`;
          const pos = document.createElement('span');
          pos.className = 'rank-pos';
          pos.textContent = `#${idx + 1}`;
          if (entry.is_defender) {
            name.style.color = '#ffd700';
            name.style.fontWeight = 'bold';
          }
          row.appendChild(pos);
          row.appendChild(name);
          row.appendChild(kills);
          sabakPalaceStatsUi.list.appendChild(row);
        });
      } else {
        const empty = document.createElement('div');
        empty.style.padding = '8px';
        empty.style.textAlign = 'center';
        empty.style.color = '#999';
        empty.textContent = state.sabak?.active ? '暂无击杀数据' : '攻城战未开始';
        sabakPalaceStatsUi.list.appendChild(empty);
      }
    }
  }

    const allItems = buildItemTotals(state.items || []);
    const displayItems = allItems.filter((i) => i.type === 'consumable' && (i.hp || i.mp));
    const displayChips = displayItems.map((i) => ({
      id: i.key || i.id,
      label: `${formatItemName(i)} x${i.qty}`,
      raw: i,
      tooltip: formatItemTooltip(i),
      className: `${i.rarity ? `rarity-${i.rarity}` : ''}${i.is_set ? ' item-set' : ''}`.trim()
    }));
  bagItems = allItems
    .map((i) => ({ ...i, tooltip: formatItemTooltip(i) }))
    .sort(sortByRarityDesc);
  const inlineItems = displayChips.length > BAG_PAGE_SIZE
    ? displayChips.slice(0, BAG_PAGE_SIZE).concat([{ id: 'bag-more', label: '更多...', raw: null }])
    : displayChips;
  renderChips(ui.items, inlineItems, (i) => {
    if (i.id === 'bag-more') {
      renderBagModal();
      return;
    }
    handleItemAction(i.raw);
  });
  if (shopUi.modal && !shopUi.modal.classList.contains('hidden')) {
    renderShopSellList(state.items || []);
  }
  if (mailUi.modal && !mailUi.modal.classList.contains('hidden')) {
    refreshMailItemOptions();
  }
  if (consignUi.modal && !consignUi.modal.classList.contains('hidden')) {
    renderConsignInventory(state.items || []);
  }
  if (bagUi.modal && !bagUi.modal.classList.contains('hidden')) {
    renderBagModal();
  }
  if (repairUi.modal && !repairUi.modal.classList.contains('hidden')) {
    renderRepairList(state.equipment || []);
  }
  if (statsUi.modal && !statsUi.modal.classList.contains('hidden')) {
    renderStatsModal();
  }

  if (ui.training) {
    const training = state.training || { hp: 0, mp: 0, atk: 0, mag: 0, spirit: 0, dex: 0 };
    const trainingButtons = TRAINING_OPTIONS.map((opt) => {
      const currentLevel = training[opt.id] || 0;
      const cost = trainingCost(currentLevel);
      const perLevel = getTrainingPerLevel(opt.id);
      const totalBonus = currentLevel * perLevel;
      return {
        id: opt.id,
        label: `${opt.label} Lv${currentLevel}`,
        tooltip: `${opt.label} 属性+${totalBonus.toFixed(2)}\n单次消耗 ${cost} 金币\n点击选择修炼次数`,
        raw: { id: opt.id }
      };
    });
    renderChips(ui.training, trainingButtons, (opt) => {
      openTrainingBatchModal(opt.raw.id);
    });
  }
  if (tradeUi.itemSelect && !tradeUi.modal.classList.contains('hidden')) {
    refreshTradeItemOptions(allItems);
  }

  const actions = [
    { id: 'stats', label: '\u72b6\u6001' },
    { id: 'bag', label: '\u80cc\u5305' },
    { id: 'party', label: '\u961f\u4f0d' },
    { id: 'guild', label: '\u884c\u4f1a' },
    { id: 'mail list', label: '\u90ae\u4ef6' },
    { id: 'shop', label: '\u5546\u5e97' },
    { id: 'repair', label: '\u4FEE\u7406' },
    { id: 'consign', label: '\u5BC4\u552E' },
    { id: 'changeclass', label: '\u8f6c\u804c' },
    { id: 'forge', label: '\u88C5\u5907\u5408\u6210' },
    { id: 'refine', label: '\u88C5\u5907\u953B\u9020' },
    { id: 'effect', label: '\u7279\u6548\u91CD\u7F6E' },
    { id: 'drops', label: '\u5957\u88c5\u6389\u843d' },
    { id: 'switch', label: '\u5207\u6362\u89d2\u8272' },
    { id: 'logout', label: '\u9000\u51fa\u6e38\u620f' }
  ];
  // 只对非VIP玩家显示VIP激活按钮，并且自助领取功能开启时显示领取按钮
  if (!state.stats || !state.stats.vip) {
    if (vipSelfClaimEnabled) {
      actions.splice(actions.length, 0, { id: 'vip claim', label: 'VIP\u9886\u53d6' });
    }
    actions.splice(actions.length, 0, { id: 'vip activate', label: 'VIP\u6fc0\u6d3b' });
  }
  actions.push({ id: 'rank', label: '\u73a9\u5bb6\u6392\u884c' });
  const afkLabel = state.stats && state.stats.autoSkillId ? '\u505c\u6b62\u6302\u673a' : '\u6302\u673a';
  actions.push({ id: 'afk', label: afkLabel });
  actions.push({ id: 'sponsor', label: '\u8d5e\u52a9\u4f5c\u8005', highlight: true });
  renderChips(ui.actions, actions, async (a) => {
    if (socket && isStateThrottleActive()) {
      socket.emit('state_request', { reason: `action:${a.id}` });
    }
    if (a.id === 'stats') {
      showStatsModal();
      return;
    }
    if (a.id === 'bag') {
      showBagModal();
      return;
    }
    if (a.id === 'party') {
      renderPartyModal();
      return;
    }
    if (a.id === 'guild') {
      showGuildModal();
      return;
    }
    if (a.id === 'mail list') {
      openMailModal();
      return;
    }
    if (a.id === 'vip claim') {
      socket.emit('cmd', { text: 'vip claim' });
      return;
    }
    if (a.id === 'vip activate') {
      const code = await promptModal({
        title: 'VIP\u6fc0\u6d3b',
        text: '\u8bf7\u8f93\u5165VIP\u6fc0\u6d3b\u7801',
        placeholder: 'VIPXXXX'
      });
      if (!code) return;
      socket.emit('cmd', { text: `vip activate ${code.trim()}` });
      return;
    }
    if (a.id === 'logout') {
      exitGame();
      return;
    }
    if (a.id === 'train') {
      const stat = await promptModal({
        title: '\u4fee\u70bc',
        text: '\u53ef\u4fee\u70bc: \u751f\u547d/\u9b54\u6cd5/\u653b\u51fb/\u9b54\u6cd5\u503c/\u9053\u672f',
        placeholder: '\u8bf7\u8f93\u5165\u5c5e\u6027'
      });
      if (!stat) return;
      socket.emit('cmd', { text: `train ${stat.trim()}` });
      return;
    }
    if (a.id === 'afk') {
      if (state.stats && state.stats.autoSkillId) {
        socket.emit('cmd', { text: 'autoskill off' });
        return;
      }
      showAfkModal(state.skills || [], state.stats ? state.stats.autoSkillId : null);
      return;
    }
    if (a.id === 'consign') {
      showConsignModal();
      return;
    }
    if (a.id === 'repair') {
      showRepairModal();
      return;
    }
    if (a.id === 'changeclass') {
      showChangeClassModal(state.player ? state.player.classId : null);
      return;
    }
    if (a.id === 'forge') {
      showForgeModal();
      return;
    }
    if (a.id === 'refine') {
      showRefineModal();
      return;
    }
    if (a.id === 'effect') {
      showEffectModal();
      return;
    }
    if (a.id === 'drops') {
      showDropsModal();
      return;
    }
    if (a.id === 'rank') {
      showRankModal();
      return;
    }
    if (a.id === 'sponsor') {
      showSponsorModal();
      return;
    }
    if (a.id === 'switch') {
      switchCharacter();
      return;
    }
      socket.emit('cmd', { text: a.id });
  });
}
const remembered = localStorage.getItem('rememberedUser');
if (remembered) {
  loginUserInput.value = remembered;
}
(async () => {
  // 加载赞助者名单，确保刷新页面后特效依然有效
  await loadSponsors();
  await ensureRealmsLoaded();
  const tokenKey = getUserStorageKey('savedToken', remembered);
  const savedToken = localStorage.getItem(tokenKey);
  if (savedToken) {
    token = savedToken;
    // loadRealms()已经正确设置了currentRealmId，不需要重复设置
    const charsKey = getUserStorageKey('savedCharacters', remembered, currentRealmId);
    let savedChars = [];
    try {
      savedChars = JSON.parse(localStorage.getItem(charsKey) || '[]');
    } catch {
      savedChars = [];
    }
    const lastCharKey = getUserStorageKey('lastCharacter', remembered, currentRealmId);
    const lastChar = localStorage.getItem(lastCharKey);
    const hasLastChar = lastChar && savedChars.some((c) => c.name === lastChar);
    if (hasLastChar) {
      enterGame(lastChar);
    } else {
      renderCharacters(savedChars);
      show(characterSection);
    }
  }
})();

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiGet(path, withAuth = false) {
  const headers = {};
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(path, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function login() {
  const username = loginUserInput.value.trim();
  const password = document.getElementById('login-password').value.trim();
  const captchaCode = captchaUi.loginInput ? captchaUi.loginInput.value.trim() : '';
  const captchaToken = captchaUi.loginImg ? captchaUi.loginImg.dataset.token : '';
  authMsg.textContent = '';
  const loginBtn = document.getElementById('login-btn');
  loginBtn.classList.add('btn-loading');
  try {
    const data = await apiPost('/api/login', { username, password, captchaToken, captchaCode, realmId: currentRealmId });
    localStorage.setItem('rememberedUser', username);
    token = data.token;
    const storageKey = getUserStorageKey('savedToken', username);
    localStorage.setItem(storageKey, token);
    // 重新加载服务器列表,确保获取最新的服务器信息
    realmList = [];
    realmInitPromise = null;
    await ensureRealmsLoaded();
    // 使用后端返回的realmId,而不是localStorage中的
    const count = realmList.length || 1;
    const preferredRealmId = data.realmId || normalizeRealmId(1, count);
    setCurrentRealmId(preferredRealmId, username);
    if (preferredRealmId === data.realmId && Array.isArray(data.characters)) {
      const charsKey = getUserStorageKey('savedCharacters', username, preferredRealmId);
      localStorage.setItem(charsKey, JSON.stringify(data.characters || []));
      renderCharacters(data.characters || []);
    } else {
      await refreshCharactersForRealm();
    }
    show(characterSection);
    showToast('登录成功');
  } catch (err) {
    // 如果是"新区不存在"错误,清除旧的realmId并重新尝试
    if (err.message && err.message.includes('新区不存在')) {
      const username = localStorage.getItem('rememberedUser');
      if (username) {
        const key = getUserStorageKey('lastRealm', username);
        localStorage.removeItem(key);
      }
      // 重新加载服务器列表
      realmList = [];
      realmInitPromise = null;
      await ensureRealmsLoaded();
      const count = realmList.length || 1;
      const newRealmId = normalizeRealmId(1, count);
      setCurrentRealmId(newRealmId, username);
      // 使用新的realmId重新登录
      try {
        const data = await apiPost('/api/login', { username, password, captchaToken, captchaCode, realmId: newRealmId });
        localStorage.setItem('rememberedUser', username);
        token = data.token;
        const storageKey = getUserStorageKey('savedToken', username);
        localStorage.setItem(storageKey, token);
        const preferredRealmId = data.realmId || normalizeRealmId(1, count);
        setCurrentRealmId(preferredRealmId, username);
        if (preferredRealmId === data.realmId && Array.isArray(data.characters)) {
          const charsKey = getUserStorageKey('savedCharacters', username, preferredRealmId);
          localStorage.setItem(charsKey, JSON.stringify(data.characters || []));
          renderCharacters(data.characters || []);
        } else {
          await refreshCharactersForRealm();
        }
        show(characterSection);
        showToast('登录成功(已自动切换服务器)');
      } catch (retryErr) {
        authMsg.textContent = retryErr.message;
        showToast('登录失败');
        loginBtn.classList.add('shake');
        setTimeout(() => loginBtn.classList.remove('shake'), 500);
        refreshCaptcha('login');
      }
    } else {
      authMsg.textContent = err.message;
      showToast('登录失败');
      loginBtn.classList.add('shake');
      setTimeout(() => loginBtn.classList.remove('shake'), 500);
      refreshCaptcha('login');
    }
  } finally {
    loginBtn.classList.remove('btn-loading');
  }
}

async function register() {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const captchaCode = captchaUi.registerInput ? captchaUi.registerInput.value.trim() : '';
  const captchaToken = captchaUi.registerImg ? captchaUi.registerImg.dataset.token : '';
  authMsg.textContent = '';
  const registerBtn = document.getElementById('register-btn');
  registerBtn.classList.add('btn-loading');
  try {
    await apiPost('/api/register', { username, password, captchaToken, captchaCode });
    authMsg.textContent = '注册成功，请登录。';
    showToast('注册成功');
    refreshCaptcha('register');
  } catch (err) {
    authMsg.textContent = err.message;
    showToast('注册失败');
    registerBtn.classList.add('shake');
    setTimeout(() => registerBtn.classList.remove('shake'), 500);
    refreshCaptcha('register');
  } finally {
    registerBtn.classList.remove('btn-loading');
  }
}

function renderCharacters(chars) {
  characterList.innerHTML = '';
  if (chars.length === 0) {
    characterList.textContent = '还没有角色。';
    return;
  }
  chars.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'char-card';
    const classLabel = classNames[c.class] || c.class;
    card.innerHTML = `<strong>${c.name}</strong><br>Lv ${c.level} ${classLabel}`;
    const btn = document.createElement('button');
    btn.textContent = '进入';
    btn.addEventListener('click', () => enterGame(c.name));
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', async () => {
      if (!token) return;
      const confirmed = await confirmModal({
        title: '删除角色',
        text: `确认删除角色「${c.name}」？此操作不可恢复。`
      });
      if (!confirmed) return;
      try {
        await apiPost('/api/character/delete', { token, name: c.name, realmId: currentRealmId });
        const username = localStorage.getItem('rememberedUser');
        const charsKey = getUserStorageKey('savedCharacters', username, currentRealmId);
        let saved = [];
        try {
          saved = JSON.parse(localStorage.getItem(charsKey) || '[]');
        } catch {
          saved = [];
        }
        saved = Array.isArray(saved) ? saved.filter((item) => item.name !== c.name) : [];
        localStorage.setItem(charsKey, JSON.stringify(saved));
        await refreshCharactersForRealm();
        showToast('角色已删除');
      } catch (err) {
        showToast(err.message || '删除失败');
      }
    });
    const actions = document.createElement('div');
    actions.className = 'char-card-actions';
    actions.appendChild(btn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
    characterList.appendChild(card);
  });
}

function renderBattleList(container, entries, onClick) {
  if (!container) return;
  container.innerHTML = '';
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'battle-card';
    empty.textContent = '暂无目标';
    container.appendChild(empty);
    return;
  }
  entries.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'battle-card';
    if (typeof onClick === 'function') {
      card.classList.add('battle-card-clickable');
      card.addEventListener('click', () => onClick(entry));
    }
    if (entry.type === 'mob' && entry.name) {
      card.dataset.mobName = entry.name;
      card.dataset.mobNameNorm = normalizeBattleName(entry.name);
      if (entry.id != null) card.dataset.mobId = String(entry.id);
      if (entry.hp != null) card.dataset.mobHp = String(entry.hp);
    }
    if (entry.type === 'player' && entry.name) {
      card.dataset.playerName = entry.name;
      card.dataset.playerNameNorm = normalizeBattleName(entry.name);
    }
    const header = document.createElement('div');
    header.className = 'battle-card-header';
    const name = document.createElement('div');
    name.className = 'battle-card-name';
    if (entry.className) {
      name.classList.add(entry.className);
    }
    name.textContent = entry.name || '-';
    if (entry.badgeLabel) {
      const badge = document.createElement('span');
      badge.className = entry.badgeClass || 'cross-realm-badge';
      badge.textContent = entry.badgeLabel;
      name.appendChild(badge);
    }
    const meta = document.createElement('div');
    meta.className = 'battle-card-meta';
    meta.textContent = entry.meta || '';
    header.appendChild(name);
    header.appendChild(meta);
    const bar = document.createElement('div');
    bar.className = 'hp-bar';
    const fill = document.createElement('div');
    fill.className = 'hp-bar-fill';
    const pct = entry.maxHp ? Math.max(0, Math.min(100, (entry.hp / entry.maxHp) * 100)) : 0;
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);
    card.appendChild(header);
    card.appendChild(bar);
    container.appendChild(card);
  });
}

function normalizeBattleName(name) {
  return String(name || '')
    .replace(/\s+/g, '')
    .replace(/[()（）\[\]【】]/g, '');
}

function isKnownPlayerName(name) {
  if (!name) return false;
  const norm = normalizeBattleName(name);
  if (!norm) return false;
  if (localHpCache.players.has(name) || localHpCache.players.has(norm)) return true;
  const selfName = lastState?.player?.name || activeChar || '';
  if (normalizeBattleName(selfName) === norm) return true;
  const others = lastState?.players || [];
  return others.some((p) => normalizeBattleName(p.name) === norm);
}

function isSummonName(name) {
  if (!name) return false;
  const norm = normalizeBattleName(name);
  if (!norm) return false;
  const summons = lastState?.summons || (lastState?.summon ? [lastState.summon] : []);
  return summons.some((s) => s && normalizeBattleName(s.name) === norm);
}

function setLocalHpCache(type, name, hp, maxHp) {
  if (!name || !localHpCache[type]) return;
  localHpCache[type].set(name, {
    hp: Math.max(0, Math.floor(hp || 0)),
    maxHp: Math.max(1, Math.floor(maxHp || 1))
  });
}

function applyLocalDamage(type, name, amount) {
  if (!name || !amount || !localHpCache[type]) return null;
  const cached = localHpCache[type].get(name);
  if (!cached) return null;
  const nextHp = Math.max(0, cached.hp - amount);
  cached.hp = nextHp;
  localHpCache[type].set(name, cached);
  return cached;
}

function applyLocalHeal(type, name, amount) {
  if (!name || !amount || !localHpCache[type]) return null;
  const cached = localHpCache[type].get(name);
  if (!cached) return null;
  const nextHp = Math.min(cached.maxHp || cached.hp, cached.hp + amount);
  cached.hp = nextHp;
  localHpCache[type].set(name, cached);
  return cached;
}

function updateBattleCardHp(card, hp, maxHp, isMob) {
  if (!card) return;
  const fill = card.querySelector('.hp-bar-fill');
  if (fill && maxHp) {
    const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    fill.style.width = `${pct}%`;
  }
  if (isMob) {
    const meta = card.querySelector('.battle-card-meta');
    if (meta) {
      meta.textContent = `HP ${Math.max(0, Math.floor(hp))}/${Math.max(1, Math.floor(maxHp))}`;
    }
  }
}

function spawnDamageFloat(amount, kind = 'mob', label = null) {
  if (!battleUi.damageLayer || (!amount && !label)) return;
  const el = document.createElement('div');
  el.className = `damage-float damage-${kind}`;
  el.textContent = label || `-${amount}`;
  const rect = battleUi.damageLayer.getBoundingClientRect();
  const x = Math.max(12, Math.min(rect.width - 48, Math.random() * rect.width));
  const y = Math.max(20, Math.min(rect.height - 40, rect.height * 0.4 + Math.random() * rect.height * 0.2));
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  battleUi.damageLayer.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 1200);
}

function pickMobCardByName(mobName) {
  if (!battleUi.mobs) return null;
  const direct = battleUi.mobs.querySelector(`[data-mob-name="${CSS.escape(mobName)}"]`);
  if (direct) return direct;
  const norm = normalizeBattleName(mobName);
  const cards = battleUi.mobs.querySelectorAll('[data-mob-name-norm]');
  if (!cards || !cards.length) return null;
  let best = null;
  let bestHp = Infinity;
  cards.forEach((card) => {
    if (card.dataset.mobNameNorm !== norm) return;
    const hp = Number(card.dataset.mobHp ?? Infinity);
    if (!best || (!Number.isNaN(hp) && hp < bestHp)) {
      best = card;
      bestHp = hp;
    }
  });
  return best;
}

function pickPlayerCardByName(playerName) {
  if (!battleUi.players) return null;
  const direct = battleUi.players.querySelector(`[data-player-name="${CSS.escape(playerName)}"]`);
  if (direct) return direct;
  const norm = normalizeBattleName(playerName);
  const cards = battleUi.players.querySelectorAll('[data-player-name-norm]');
  if (!cards || !cards.length) return null;
  let best = null;
  cards.forEach((card) => {
    if (card.dataset.playerNameNorm !== norm) return;
    if (!best) best = card;
  });
  return best;
}

function positionFloatInCard(card, el, yOffset = 0) {
  const cardRect = card.getBoundingClientRect();
  if (!cardRect.width || !cardRect.height) return;
  const bar = card.querySelector('.hp-bar');
  if (bar) {
    const barRect = bar.getBoundingClientRect();
    const left = Math.max(6, Math.min(cardRect.width - 40, barRect.left - cardRect.left + barRect.width - 24));
    const top = Math.max(-4, barRect.top - cardRect.top - 12 - yOffset);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.right = 'auto';
    return;
  }
  const left = Math.max(6, Math.min(cardRect.width - 40, cardRect.width * 0.6));
  const top = Math.max(-6, cardRect.height * 0.15 - yOffset);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.right = 'auto';
}

function spawnDamageFloatOnMob(mobName, amount, kind = 'mob', label = null, mobId = null) {
  if (!battleUi.damageLayer || !mobName || (!amount && !label)) return;
  let card = null;
  if (mobId != null) {
    card = battleUi.mobs?.querySelector(`[data-mob-id="${CSS.escape(String(mobId))}"]`);
  }
  if (!card) {
    card = pickMobCardByName(mobName);
  }
  if (!card) {
    return;
  }
  const el = document.createElement('div');
  const isPoison = kind === 'poison';
  el.className = `damage-float damage-${kind} in-card${isPoison ? ' poison-offset' : ''}`;
  el.textContent = label || `-${amount}`;
  card.appendChild(el);
  positionFloatInCard(card, el, isPoison ? 18 : 0);
  setTimeout(() => {
    el.remove();
  }, 2000);
}

function spawnDamageFloatOnPlayer(playerName, amount, kind = 'player', label = null) {
  if (!battleUi.damageLayer || !playerName || (!amount && !label)) return;
  const card = pickPlayerCardByName(playerName);
  if (!card) {
    return;
  }
  const el = document.createElement('div');
  el.className = `damage-float damage-${kind} in-card`;
  el.textContent = label || `-${amount}`;
  card.appendChild(el);
  positionFloatInCard(card, el);
  setTimeout(() => {
    el.remove();
  }, 2000);
}

async function createCharacter() {
  charMsg.textContent = '';
  const name = document.getElementById('char-name').value.trim();
  const classId = document.getElementById('char-class').value;
  if (!name) {
    charMsg.textContent = '请输入角色名。';
    return;
  }
  if (!token) {
    charMsg.textContent = '请先登录后创建角色。';
    show(authSection);
    return;
  }
  try {
    await apiPost('/api/character', { token, name, classId, realmId: currentRealmId });
    const username = localStorage.getItem('rememberedUser');
    const charsKey = getUserStorageKey('savedCharacters', username, currentRealmId);
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(charsKey) || '[]');
    } catch {
      saved = [];
    }
    if (!Array.isArray(saved)) saved = [];
    if (!saved.some((c) => c.name === name)) {
      saved.push({ name, level: 1, class: classId });
    }
    localStorage.setItem(charsKey, JSON.stringify(saved));
    renderCharacters(saved);
    charMsg.textContent = '角色已创建。';
  } catch (err) {
    if (err.message === '验证码错误。') {
      charMsg.textContent = '创建角色不需要验证码，请重新登录。';
      show(authSection);
      return;
    }
    if (err.message && err.message.includes('新区不存在')) {
      const username = localStorage.getItem('rememberedUser');
      if (username) {
        const key = getUserStorageKey('lastRealm', username);
        localStorage.removeItem(key);
      }
      charMsg.textContent = '服务器已合并,请刷新页面重新选择服务器';
    } else {
      charMsg.textContent = err.message;
    }
  }
}

function enterGame(name) {
  // 断开旧的 socket 连接
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  activeChar = name;
  const username = localStorage.getItem('rememberedUser');
  const storageKey = getUserStorageKey('lastCharacter', username, currentRealmId);
  localStorage.setItem(storageKey, name);
  lastSavedLevel = null;
  show(gameSection);
  log.innerHTML = '';
  setTradeStatus('\u672a\u5728\u4ea4\u6613\u4e2d');
  if (shopUi.modal) shopUi.modal.classList.add('hidden');
  appendLine('正在连接...');
  ui.name.textContent = name;
  ui.classLevel.textContent = '-';
  ui.guild.textContent = '-';
  ui.pk.textContent = '-';
  ui.vip.textContent = '-';
  ui.gold.textContent = '0';
  if (ui.cultivation) ui.cultivation.textContent = '-';
  if (ui.cultivationUpgrade) ui.cultivationUpgrade.classList.add('hidden');
  setBar(ui.hp, 0, 1);
  setBar(ui.mp, 0, 1);
  setBar(ui.exp, 0, 1);
  socket = io();
  const rawEmit = socket.emit.bind(socket);
  socket.emit = (event, payload) => {
    if (event === 'cmd' && payload && typeof payload === 'object' && !payload.source) {
      payload = { ...payload, source: 'ui' };
    }
    return rawEmit(event, payload);
  };
  socket.on('connect', async () => {
    // 登录时已经确保realmList是最新的，这里不需要重新加载
    // await ensureRealmsLoaded();
    socket.emit('auth', {
      token,
      name,
      realmId: currentRealmId,
      deviceId: getOrCreateDeviceId(),
      deviceFingerprint: computeDeviceFingerprint()
    });
    socket.emit('cmd', { text: 'stats' });
    if (stateThrottleOverrideServerAllowed) {
      socket.emit('state_throttle_override', { enabled: stateThrottleOverride });
    }
    // 加载聊天缓存（socket已连接，按钮可以正常绑定）
    if (chat.log) {
      loadChatCache(name);
    }
    // 加载赞助者列表
    await loadSponsors();
    // 加载修炼配置
    await loadTrainingConfig();
  });
  socket.on('auth_error', (payload) => {
    appendLine(`认证失败: ${payload.error}`);
    // 如果是"新区不存在"错误,清除旧的realmId并提示用户
    if (payload.error && payload.error.includes('新区不存在')) {
      const username = localStorage.getItem('rememberedUser');
      if (username) {
        const key = getUserStorageKey('lastRealm', username);
        localStorage.removeItem(key);
      }
      showToast('服务器已合并,已自动清除旧服务器信息,请重新选择服务器');
      exitGame();
    } else {
      if (payload.error && payload.error.includes('设备已在线')) {
        showToast('该设备已在线，无法重复登录。');
      } else if (payload.error && payload.error.includes('设备指纹缺失')) {
        showToast('设备指纹缺失，无法登录。');
      } else {
        showToast('登录已过期，请重新登录。');
      }
      exitGame();
    }
  });
  socket.on('trade_invite', (payload) => {
    const from = payload?.from;
    if (from) handleTradeInvite(from);
  });
  socket.on('output', (payload) => {
    console.log('Received output:', payload);
    appendLine(payload);
    if (payload && payload.text && payload.text.startsWith('转职成功')) {
      showToast(payload.text);
    }
    if (!isStateThrottleActive()) {
      parseStats(payload.text);
    }
    if (isChatLine(payload.text)) {
      appendChatLine(payload);
    }
    const tradeFrom = parseTradeRequest(payload.text);
    if (tradeFrom) {
      handleTradeInvite(tradeFrom);
    }
    const followFrom = parseFollowInvite(payload.text);
    if (followFrom && socket) {
      promptModal({
        title: '跟随邀请',
        text: `${followFrom} 邀请你跟随，是否前往？`,
        placeholder: '',
        extra: { text: '拒绝' },
        allowEmpty: true
      }).then((res) => {
        if (res === '__extra__' || res === null) return;
        // 队员接受队长的跟随邀请
        socket.emit('cmd', { text: `party follow accept` });
      });
    }
    const shopItems = parseShopLine(payload.text);
    if (shopItems) {
      lastShopItems = shopItems;
      showShopModal(shopItems);
    }
    const rankData = parseRankLine(payload.text);
    if (rankData) {
      renderRankList(rankData);
    }
    if (payload.text.startsWith('\u4ea4\u6613')) {
      appendChatLine(payload);
      setTradeStatus(payload.text);
      updateTradePartnerStatus(payload.text);
      parseTradeItems(payload.text);
    }
  });
  socket.on('guild_members', (payload) => {
    if (!payload || !payload.ok) {
      if (payload && payload.error) appendLine(payload.error);
      guildMembers = [];
      if (guildUi.modal && !guildUi.modal.classList.contains('hidden')) {
        renderGuildModal();
      }
      return;
    }
    guildMembers = payload.members || [];
    if (guildUi.modal && !guildUi.modal.classList.contains('hidden')) {
      renderGuildModal();
    }
  });
  socket.on('guild_list', (payload) => {
    if (!payload || !payload.ok) {
      if (payload && payload.error) appendLine(payload.error);
      return;
    }
    renderGuildListModal(payload.guilds);
  });
  socket.on('guild_applications', (payload) => {
    if (!payload || !payload.ok) {
      if (payload && payload.error) appendLine(payload.error);
      return;
    }
    renderGuildApplicationsModal(payload.applications);
  });
  socket.on('guild_apply_result', (payload) => {
    if (!payload) return;
    const msg = payload.ok ? payload.msg : (payload.msg || '申请失败');
    appendLine(msg);
    showToast(msg);
    const targetId = payload.guildId || lastGuildApplyId;
    const shouldLockTarget = payload.ok || msg.includes('已经申请了行会') || msg.includes('已申请加入行会');
    if (shouldLockTarget && targetId) {
      const btn = guildApplyButtons.get(targetId);
      if (btn) {
        btn.textContent = '等待审批';
        btn.disabled = true;
      }
      guildApplyPending.delete(targetId);
      return;
    }
    if (targetId) {
      const btn = guildApplyButtons.get(targetId);
      if (btn) {
        btn.textContent = '申请加入';
        btn.disabled = false;
      }
      guildApplyPending.delete(targetId);
    }
  });
  socket.on('guild_approve_result', (payload) => {
    if (!payload) return;
    if (payload.ok) {
      appendLine(payload.msg);
      if (socket) socket.emit('guild_applications');
    } else {
      appendLine(payload.msg || '批准失败');
    }
  });
  socket.on('guild_reject_result', (payload) => {
    if (!payload) return;
    if (payload.ok) {
      appendLine(payload.msg);
      if (socket) socket.emit('guild_applications');
    } else {
      appendLine(payload.msg || '拒绝失败');
    }
  });
  socket.on('sabak_info', (payload) => {
    if (!payload) return;
    renderSabakModal(payload);
  });
  socket.on('chat', (payload) => {
    appendChatLine(payload);
  });
  socket.on('consign_list', (payload) => {
    if (!payload || !payload.type) return;
    if (payload.type === 'market') {
      consignMarketItems = payload.items || [];
      renderConsignMarket(consignMarketItems);
      return;
    }
    if (payload.type === 'mine') {
      consignMyItems = payload.items || [];
      renderConsignMine(consignMyItems);
    }
  });
  socket.on('consign_history', (payload) => {
    if (!payload || !payload.items) return;
    consignHistoryItems = payload.items || [];
    renderConsignHistory(consignHistoryItems);
  });
  socket.on('mail_list', (payload) => {
    if (!payload || !payload.ok) return;
    renderMailList(payload.mails || []);
  });
  socket.on('mail_send_result', (payload) => {
    if (!payload) return;
    showToast(payload.msg || '发送完成');
    if (payload.ok && mailUi.to) {
      mailUi.to.value = '';
      if (mailUi.subject) mailUi.subject.value = '';
      if (mailUi.body) mailUi.body.value = '';
      if (mailUi.item) mailUi.item.value = '';
      if (mailUi.qty) mailUi.qty.value = '';
      if (mailUi.gold) mailUi.gold.value = '';
      mailAttachments = [];
      renderMailAttachmentList();
      if (socket) socket.emit('mail_list');
    }
  });
  socket.on('mail_claim_result', (payload) => {
    if (!payload) return;
    showToast(payload.msg || '领取完成');
    if (payload.ok && socket) socket.emit('mail_list');
  });
  socket.on('mail_delete_result', (payload) => {
    if (!payload) return;
    showToast(payload.msg || '删除完成');
    if (payload.ok) {
      selectedMailId = null;
      if (socket) socket.emit('mail_list');
    }
  });
  socket.on('state', (payload) => {
    console.log('Received state payload:', payload);
    handleIncomingState(payload);
  });
  
  socket.on('observe_data', (data) => {
    showObserveModal(data);
  });
  socket.on('sponsors_updated', async () => {
    await loadSponsors();
  });
}

function showObserveModal(data) {
  if (!observeUi || !observeUi.modal || !observeUi.content) return;

  observeUi.title.textContent = `${data.name} 的信息`;

  let html = '';

  // 基础信息
  html += '<div class="observe-section">';
  html += '<div class="observe-section-title">基础属性</div>';
  html += '<div class="observe-stats">';
  html += `<div class="observe-stat-row"><span class="observe-stat-label">等级</span><span class="observe-stat-value">${data.level}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">职业</span><span class="observe-stat-value">${data.class}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">生命</span><span class="observe-stat-value">${Math.floor(data.hp)}/${Math.floor(data.maxHp)}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">魔法</span><span class="observe-stat-value">${Math.floor(data.mp)}/${Math.floor(data.maxMp)}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">攻击</span><span class="observe-stat-value">${Math.floor(data.atk)}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">防御</span><span class="observe-stat-value">${Math.floor(data.def)}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">魔法</span><span class="observe-stat-value">${Math.floor(data.matk)}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">魔防</span><span class="observe-stat-value">${Math.floor(data.mdef)}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">道术</span><span class="observe-stat-value">${Math.floor(data.spirit)}</span></div>`;
  html += `<div class="observe-stat-row"><span class="observe-stat-label">闪避</span><span class="observe-stat-value">${Math.floor(data.evade)}%</span></div>`;
  html += '</div>';
  html += '</div>';

  // 装备信息
  if (data.equipment && data.equipment.length > 0) {
    html += '<div class="observe-section">';
    html += '<div class="observe-section-title">装备</div>';
    html += '<div class="observe-equipment-list">';
    data.equipment.forEach(eq => {
      html += '<div class="observe-equipment-item">';
      html += `<span class="observe-equipment-name">${eq.slot}: ${eq.name}</span>`;
      if (eq.durability != null) {
        html += `<span class="observe-equipment-durability">[${Math.floor(eq.durability)}/${Math.floor(eq.maxDurability)}]</span>`;
      }
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  } else {
    html += '<div class="observe-section">';
    html += '<div class="observe-section-title">装备</div>';
    html += '<div style="color: var(--ink); opacity: 0.6; padding: 8px;">无装备</div>';
    html += '</div>';
  }

  // 召唤物信息
  if (data.summons && data.summons.length > 0) {
    html += '<div class="observe-section">';
    html += '<div class="observe-section-title">召唤物</div>';
    html += '<div class="observe-summon-list">';
    data.summons.forEach(summon => {
      html += '<div class="observe-summon-item">';
      html += `<span class="observe-summon-name">${summon.name} (Lv ${summon.level})</span>`;
      html += `<span class="observe-summon-stats">HP: ${Math.floor(summon.hp)}/${Math.floor(summon.maxHp)} | 攻击: ${Math.floor(summon.atk || 0)} | 防御: ${Math.floor(summon.def || 0)} | 魔御: ${Math.floor(summon.mdef || 0)}</span>`;
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  observeUi.content.innerHTML = html;
  observeUi.modal.classList.remove('hidden');
}

document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('register-btn').addEventListener('click', register);
document.getElementById('create-char-btn').addEventListener('click', createCharacter);
if (realmSelect) {
  realmSelect.addEventListener('change', () => {
    const username = localStorage.getItem('rememberedUser');
    const count = realmList.length || 1;
    const nextRealm = normalizeRealmId(realmSelect.value, count);
    setCurrentRealmId(nextRealm, username);
    if (!characterSection.classList.contains('hidden')) {
      refreshCharactersForRealm();
    }
  });
}
if (ui.changePasswordButtons && ui.changePasswordButtons.length) {
  ui.changePasswordButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      promptChangePassword();
    });
  });
} else {
  const fallbackBtn = document.getElementById('change-password-btn');
  if (fallbackBtn) {
    fallbackBtn.addEventListener('click', () => {
      promptChangePassword();
    });
  }
}
if (chat.emojiToggle) {
  chat.emojiToggle.addEventListener('click', () => {
    if (!chat.emojiPanel) return;
    renderEmojiPanel();
    chat.emojiPanel.classList.toggle('hidden');
  });
}
if (chat.clearBtn) {
  chat.clearBtn.addEventListener('click', () => {
    clearChatLog();
    showToast('聊天已清屏');
  });
}
if (chat.setSponsorTitleBtn) {
  chat.setSponsorTitleBtn.addEventListener('click', () => {
    console.log('点击设置称号按钮');
    console.log('sponsorTitleUi.modal:', sponsorTitleUi.modal);
    console.log('lastState.player?.name:', lastState?.player?.name);
    showSponsorTitleModal();
  });
} else {
  console.warn('设置称号按钮未找到');
}
if (chat.emojiPanel) {
  document.addEventListener('click', (evt) => {
    if (!chat.emojiPanel || chat.emojiPanel.classList.contains('hidden')) return;
    const target = evt.target;
    if (target === chat.emojiPanel || chat.emojiPanel.contains(target)) return;
    if (target === chat.emojiToggle) return;
    chat.emojiPanel.classList.add('hidden');
  });
}

document.addEventListener('click', (evt) => {
  // 如果promptModal正在显示，不关闭其他modal
  if (promptUi.modal && !promptUi.modal.classList.contains('hidden')) {
    return;
  }

  const modals = [
    shopUi?.modal,
    repairUi?.modal,
    forgeUi?.modal,
    consignUi?.modal,
    bagUi?.modal,
    statsUi?.modal,
    afkUi?.modal,
    playerUi?.modal,
    guildUi?.modal,
    partyUi?.modal,
    trainingBatchUi?.modal
  ];

  for (const modal of modals) {
    if (!modal || modal.classList.contains('hidden')) continue;
    const card = modal.querySelector('.modal-card');
    if (!card) continue;
    if (evt.target === modal || (evt.target !== card && !card.contains(evt.target) && !evt.target.closest('.chip'))) {
      modal.classList.add('hidden');
      hideItemTooltip();
    }
  }
}, true);
if (captchaUi.loginRefresh) {
  captchaUi.loginRefresh.addEventListener('click', () => refreshCaptcha('login'));
}
if (captchaUi.registerRefresh) {
  captchaUi.registerRefresh.addEventListener('click', () => refreshCaptcha('register'));
}
if (captchaUi.loginImg) {
  captchaUi.loginImg.addEventListener('click', () => refreshCaptcha('login'));
}
if (captchaUi.registerImg) {
  captchaUi.registerImg.addEventListener('click', () => refreshCaptcha('register'));
}
refreshCaptcha('login');
refreshCaptcha('register');
if (chat.sendBtn) {
  chat.sendBtn.addEventListener('click', sendChatMessage);
}
if (chat.input) {
  chat.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
}
if (chat.partyInviteBtn) {
  chat.partyInviteBtn.addEventListener('click', async () => {
    if (!socket) return;
    const inParty = Boolean(lastState && lastState.party && lastState.party.size > 0);
    if (!inParty) {
      socket.emit('cmd', { text: 'party create' });
      return;
    }
    const name = await promptModal({
      title: '队伍邀请',
      text: '请输入玩家名',
      placeholder: '玩家名',
      extra: { text: '退出组队' }
    });
    if (name === '__extra__') {
      socket.emit('cmd', { text: 'party leave' });
      return;
    }
    if (!name) return;
    socket.emit('cmd', { text: `party invite ${name.trim()}` });
  });
}
if (chat.guildInviteBtn) {
  chat.guildInviteBtn.addEventListener('click', async () => {
    const name = await promptModal({
      title: '\u884C\u4F1A\u9080\u8BF7',
      text: '\u8BF7\u8F93\u5165\u73A9\u5BB6\u540D',
      placeholder: '\u73A9\u5BB6\u540D'
    });
    if (!name || !socket) return;
    socket.emit('cmd', { text: `guild invite ${name.trim()}` });
  });
}
if (chat.guildCreateBtn) {
  chat.guildCreateBtn.addEventListener('click', async () => {
    const name = await promptModal({
      title: '\u521B\u5EFA\u884C\u4F1A',
      text: '\u8BF7\u8F93\u5165\u884C\u4F1A\u540D\u79F0',
      placeholder: '\u884C\u4F1A\u540D'
    });
    if (!name || !socket) return;
    socket.emit('cmd', { text: `guild create ${name.trim()}` });
  });
}
if (chat.guildListBtn) {
  chat.guildListBtn.addEventListener('click', () => {
    if (!socket) return;
    socket.emit('guild_list');
  });
}
if (chat.partyToggleBtn) {
  chat.partyToggleBtn.addEventListener('click', () => {});
}
if (chat.sabakRegisterBtn) {
  chat.sabakRegisterBtn.addEventListener('click', async () => {
    if (!socket) return;
    socket.emit('sabak_info');
  });
}
  if (sabakUi.confirm) {
    sabakUi.confirm.addEventListener('click', () => {
      if (!socket) return;
      socket.emit('sabak_register_confirm');
      socket.emit('sabak_info');
    });
  }
if (sabakUi.close) {
  sabakUi.close.addEventListener('click', () => {
    if (sabakUi.modal) sabakUi.modal.classList.add('hidden');
  });
}
if (sabakUi.modal) {
  sabakUi.modal.addEventListener('click', (e) => {
    if (e.target === sabakUi.modal) {
      sabakUi.modal.classList.add('hidden');
    }
  });
}

if (socket) {
  socket.on('sabak_register_result', (payload) => {
    if (!sabakUi.msg) return;
    const ok = Boolean(payload?.ok);
    const msg = payload?.msg || (ok ? '报名成功。' : '报名失败。');
    sabakUi.msg.textContent = msg;
    sabakUi.msg.style.color = ok ? 'green' : 'red';
  });
}
if (chat.locationBtn) {
  chat.locationBtn.addEventListener('click', () => {
    if (!socket || !lastState || !lastState.room) return;
    const zone = lastState.room.zone || '';
    const room = lastState.room.name || '';
    const location = zone && room ? `${zone} - ${room}` : zone || room || '';
    if (!location) return;
    socket.emit('cmd', { text: `say \u6211\u5728 ${location}` });
  });
}
if (tradeUi.requestBtn) {
  tradeUi.requestBtn.addEventListener('click', async () => {
    const name = await promptModal({
      title: '\u53D1\u8D77\u4EA4\u6613',
      text: '\u8BF7\u8F93\u5165\u4EA4\u6613\u5BF9\u8C61',
      placeholder: '\u73A9\u5BB6\u540D'
    });
    if (!name || !socket) return;
    socket.emit('cmd', { text: `trade request ${name.trim()}` });
    setTradeStatus('\u4ea4\u6613\u8bf7\u6c42\u5df2\u53d1\u9001');
  });
}
if (tradeUi.addItemBtn) {
  tradeUi.addItemBtn.addEventListener('click', () => {
    if (!socket || !tradeUi.itemSelect) return;
    const itemId = tradeUi.itemSelect.value;
    if (!itemId) return;
    const qtyValue = tradeUi.qtyInput ? tradeUi.qtyInput.value : '1';
    const qty = Math.max(1, Number(qtyValue || 1));
    socket.emit('cmd', { text: `trade add item ${itemId} ${qty}` });
  });
}
if (tradeUi.addGoldBtn) {
  tradeUi.addGoldBtn.addEventListener('click', () => {
    if (!socket) return;
    const goldValue = tradeUi.goldInput ? tradeUi.goldInput.value : '0';
    const amount = Number(goldValue || 0);
    if (!amount || amount <= 0) return;
    socket.emit('cmd', { text: `trade add gold ${amount}` });
  });
}
if (tradeUi.lockBtn) {
  tradeUi.lockBtn.addEventListener('click', () => {
    if (!socket) return;
    socket.emit('cmd', { text: 'trade lock' });
  });
}
if (tradeUi.confirmBtn) {
  tradeUi.confirmBtn.addEventListener('click', () => {
    if (!socket) return;
    socket.emit('cmd', { text: 'trade confirm' });
  });
}
if (tradeUi.cancelBtn) {
  tradeUi.cancelBtn.addEventListener('click', () => {
    if (!socket) return;
    socket.emit('cmd', { text: 'trade cancel' });
    setTradeStatus('\u4ea4\u6613\u5df2\u53d6\u6d88');
  });
}
if (tradeUi.modal) {
  tradeUi.modal.addEventListener('click', (e) => {
    if (e.target === tradeUi.modal) {
      // 禁止点击遮罩自动关闭交易窗口
      e.preventDefault();
    }
  });
}
if (shopUi.close) {
  shopUi.close.addEventListener('click', () => {
    shopUi.modal.classList.add('hidden');
    hideItemTooltip();
  });
}
if (shopUi.modal) {
  shopUi.modal.addEventListener('click', (e) => {
    if (e.target === shopUi.modal) {
      shopUi.modal.classList.add('hidden');
      hideItemTooltip();
    }
  });
}
if (mailUi.close) {
  mailUi.close.addEventListener('click', () => {
    mailUi.modal.classList.add('hidden');
  });
}
if (mailUi.modal) {
  mailUi.modal.addEventListener('click', (e) => {
    if (e.target === mailUi.modal) {
      mailUi.modal.classList.add('hidden');
    }
  });
}

if (ui.cultivationUpgrade) {
  ui.cultivationUpgrade.addEventListener('click', () => {
    if (!socket) return;
    socket.emit('cmd', { text: '修真' });
  });
}
if (mailUi.refresh) {
  mailUi.refresh.addEventListener('click', () => {
    if (socket) socket.emit('mail_list');
  });
}
  if (mailUi.send) {
    mailUi.send.addEventListener('click', () => {
    if (!socket) return;
    const toName = mailUi.to ? mailUi.to.value.trim() : '';
    const title = mailUi.subject ? mailUi.subject.value.trim() : '';
    const body = mailUi.body ? mailUi.body.value.trim() : '';
    const gold = mailUi.gold ? Math.max(0, Number(mailUi.gold.value || 0)) : 0;
    const items = mailAttachments.map((entry) => ({
      key: entry.key,
      qty: entry.qty
    }));
      socket.emit('mail_send', { toName, title, body, items, gold });
    });
  }
  if (mailUi.item) {
    mailUi.item.addEventListener('change', () => {
      updateMailQtyLimit();
    });
  }
  if (mailUi.claim) {
    mailUi.claim.addEventListener('click', () => {
      if (!socket || !selectedMailId) return;
      socket.emit('mail_claim', { mailId: selectedMailId });
    });
  }
  if (mailUi.delete) {
    mailUi.delete.addEventListener('click', async () => {
      if (!socket || !selectedMailId) return;
      const confirmed = await confirmModal({
        title: '删除邮件',
        text: '确定要删除这封邮件吗？'
      });
      if (confirmed) {
        socket.emit('mail_delete', { mailId: selectedMailId, folder: currentMailFolder });
      }
    });
  }
  if (mailUi.tabInbox) {
    mailUi.tabInbox.addEventListener('click', () => {
      if (currentMailFolder !== 'inbox') {
        switchMailFolder('inbox');
      }
    });
  }
  if (mailUi.tabSent) {
    mailUi.tabSent.addEventListener('click', () => {
      if (currentMailFolder !== 'sent') {
        switchMailFolder('sent');
      }
    });
  }
  if (mailUi.addItem) {
    mailUi.addItem.addEventListener('click', () => {
      if (!mailUi.item) return;
      const key = mailUi.item.value;
      if (!key) return;
      const qtyRaw = mailUi.qty ? Number(mailUi.qty.value || 1) : 1;
      const qty = Math.max(1, Number.isNaN(qtyRaw) ? 1 : qtyRaw);
      const item = (lastState?.items || []).find((i) => (i.key || i.id) === key);
      if (!item) return;
      const ownedQty = Math.max(0, Number(item.qty || 0));
      const usedQty = mailAttachments
        .filter((entry) => entry.key === key)
        .reduce((sum, entry) => sum + Number(entry.qty || 0), 0);
      const remainingQty = Math.max(0, ownedQty - usedQty);
      if (remainingQty <= 0) {
        showToast('该物品附件数量已达上限');
        return;
      }
      const finalQty = Math.min(qty, remainingQty);
      if (finalQty < qty) {
        showToast('数量超过背包剩余数量，已自动调整');
      }
      if (mailUi.qty) mailUi.qty.value = String(finalQty);
      mailAttachments.push({ key, qty: finalQty, item });
      renderMailAttachmentList();
    });
  }
if (shopUi.sellBulk) {
  shopUi.sellBulk.addEventListener('click', async () => {
    if (!socket) return;
    const confirmed = await confirmModal({
      title: '\u4E00\u952E\u552E\u5356',
      text: '\u5C06\u51FA\u552E\u65E0\u7279\u6548\u4E14\u53F2\u8BD7\u4EE5\u4E0B\u7684\u88C5\u5907\u3002\u786E\u5B9A\u5417\uFF1F'
    });
    if (!confirmed) return;
    socket.emit('cmd', { text: 'sell_bulk', source: 'ui' });
  });
}
if (repairUi.close) {
  repairUi.close.addEventListener('click', () => {
    repairUi.modal.classList.add('hidden');
    hideItemTooltip();
  });
}
if (changeClassUi.close) {
  changeClassUi.close.addEventListener('click', () => {
    changeClassUi.modal.classList.add('hidden');
    changeClassSelection = null;
  });
}
if (changeClassUi.modal) {
  changeClassUi.modal.addEventListener('click', (e) => {
    if (e.target === changeClassUi.modal) {
      changeClassUi.modal.classList.add('hidden');
      changeClassSelection = null;
    }
  });
}
if (changeClassUi.options && changeClassUi.options.length) {
  changeClassUi.options.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      changeClassSelection = btn.dataset.class || null;
      changeClassUi.options.forEach((node) => node.classList.toggle('selected', node === btn));
      if (changeClassUi.confirm) {
        changeClassUi.confirm.disabled = !changeClassSelection;
      }
    });
  });
}
if (changeClassUi.confirm) {
  changeClassUi.confirm.addEventListener('click', () => {
    if (!socket) return;
    if (!changeClassSelection) {
      showToast('请选择职业');
      return;
    }
    socket.emit('cmd', { text: `changeclass ${changeClassSelection}`, source: 'ui' });
    changeClassUi.modal.classList.add('hidden');
    changeClassSelection = null;
  });
}
if (forgeUi.close) {
  forgeUi.close.addEventListener('click', () => {
    forgeUi.modal.classList.add('hidden');
    hideItemTooltip();
  });
}
if (forgeUi.modal) {
  forgeUi.modal.addEventListener('click', (e) => {
    if (e.target === forgeUi.modal) {
      forgeUi.modal.classList.add('hidden');
      hideItemTooltip();
    }
  });
}
if (forgeUi.confirm) {
  forgeUi.confirm.addEventListener('click', () => {
    if (!socket || !forgeSelection || !forgeSelection.mainSlot || !forgeSelection.secondaryKey) return;
    socket.emit('cmd', {
      text: `forge equip:${forgeSelection.mainSlot} | ${forgeSelection.secondaryKey}`,
      source: 'ui'
    });
    forgeUi.modal.classList.add('hidden');
  });
}
if (refineUi.confirm) {
  refineUi.confirm.addEventListener('click', () => {
    if (!socket || !refineSelection || !refineSelection.slot) return;
    const mainItem = refineSelection.fromEquip ? `equip:${refineSelection.slot}` : refineSelection.slot;
    socket.emit('cmd', {
      text: `refine ${mainItem}`,
      source: 'ui'
    });
    // 不自动关闭窗口
  });
}
if (refineUi.batch) {
  refineUi.batch.addEventListener('click', () => {
    if (!socket || !refineSelection || !refineSelection.slot) return;
    const mainItem = refineSelection.fromEquip ? `equip:${refineSelection.slot}` : refineSelection.slot;
    // 一键锻造：自动消耗所有满足条件的装备
    const materials = countRefineMaterials();
    const batches = Math.floor(materials / refineMaterialCount);
    if (batches <= 0) return;

    for (let i = 0; i < batches; i++) {
      setTimeout(() => {
        socket.emit('cmd', {
          text: `refine ${mainItem}`,
          source: 'ui'
        });
      }, i * 100); // 每次间隔100ms
    }
  });
}
if (refineUi.close) {
  refineUi.close.addEventListener('click', () => {
    refineUi.modal.classList.add('hidden');
    hideItemTooltip();
  });
}
if (effectUi.close) {
  effectUi.close.addEventListener('click', () => {
    effectUi.modal.classList.add('hidden');
    hideItemTooltip();
  });
}
if (effectUi.modal) {
  effectUi.modal.addEventListener('click', (e) => {
    if (e.target === effectUi.modal) {
      effectUi.modal.classList.add('hidden');
      hideItemTooltip();
    }
  });
}
if (trainingBatchUi.close) {
  trainingBatchUi.close.addEventListener('click', () => {
    trainingBatchUi.modal.classList.add('hidden');
    selectedTrainingType = null;
    hideItemTooltip();
  });
}
if (trainingBatchUi.confirm) {
  console.log('[INIT] trainingBatchUi.confirm found:', trainingBatchUi.confirm);
  console.log('[INIT] Adding click listener to trainingBatchUi.confirm');

  // 方式1：使用 addEventListener
  trainingBatchUi.confirm.addEventListener('click', (e) => {
    console.log('[trainingBatchUi.confirm click] Event triggered via addEventListener');
    console.log('[trainingBatchUi.confirm click] e.target:', e.target);
    executeBatchTraining();
  });

  // 方式2：使用 onclick 属性（备用）
  trainingBatchUi.confirm.onclick = (e) => {
    console.log('[trainingBatchUi.confirm click] Event triggered via onclick');
    console.log('[trainingBatchUi.confirm click] e.target:', e.target);
    executeBatchTraining();
  };
} else {
  console.error('[INIT] trainingBatchUi.confirm NOT FOUND!');
}
if (trainingBatchUi.countInput) {
  trainingBatchUi.countInput.addEventListener('input', updateTrainingBatchCost);
}
if (repairUi.all) {
  repairUi.all.addEventListener('click', () => {
    if (!socket) return;
    socket.emit('cmd', { text: 'repair all' });
  });
}
if (consignUi.close) {
  consignUi.close.addEventListener('click', () => {
    consignUi.modal.classList.add('hidden');
    hideItemTooltip();
  });
}
if (consignUi.tabs && consignUi.tabs.length) {
  consignUi.tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (!tab) return;
      consignUi.tabs.forEach((b) => b.classList.toggle('active', b === btn));
      consignUi.panels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.panel !== tab);
      });
      if (tab === 'history' && socket) {
        socket.emit('cmd', { text: 'consign history' });
      }
    });
  });
}
if (consignUi.filters && consignUi.filters.length) {
  consignUi.filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter || 'all';
      consignMarketFilter = filter;
      consignMarketPage = 0;
      consignUi.filters.forEach((b) => b.classList.toggle('active', b === btn));
      renderConsignMarket(consignMarketItems);
    });
  });
}
if (consignUi.marketPrev) {
  consignUi.marketPrev.addEventListener('click', () => {
    consignMarketPage -= 1;
    renderConsignMarket(consignMarketItems);
  });
}
if (consignUi.marketNext) {
  consignUi.marketNext.addEventListener('click', () => {
    consignMarketPage += 1;
    renderConsignMarket(consignMarketItems);
  });
}
if (consignUi.myPrev) {
  consignUi.myPrev.addEventListener('click', () => {
    consignMyPage -= 1;
    renderConsignMine(consignMyItems);
  });
}
if (consignUi.myNext) {
  consignUi.myNext.addEventListener('click', () => {
    consignMyPage += 1;
    renderConsignMine(consignMyItems);
  });
}
if (consignUi.inventoryPrev) {
  consignUi.inventoryPrev.addEventListener('click', () => {
    consignInventoryPage -= 1;
    renderConsignInventory(consignInventoryItems);
  });
}
if (consignUi.inventoryNext) {
  consignUi.inventoryNext.addEventListener('click', () => {
    consignInventoryPage += 1;
    renderConsignInventory(consignInventoryItems);
  });
}
if (consignUi.historyPrev) {
  consignUi.historyPrev.addEventListener('click', () => {
    consignHistoryPage -= 1;
    renderConsignHistory(consignHistoryItems);
  });
}
if (consignUi.historyNext) {
  consignUi.historyNext.addEventListener('click', () => {
    consignHistoryPage += 1;
    renderConsignHistory(consignHistoryItems);
  });
}
// Rank modal tabs
const rankTabs = document.querySelectorAll('.rank-tab');
if (rankTabs && rankTabs.length) {
  rankTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const classType = tab.id.replace('rank-tab-', '');
      renderRankModal(classType);
    });
  });
}
if (document.getElementById('rank-close')) {
  document.getElementById('rank-close').addEventListener('click', () => {
    document.getElementById('rank-modal').classList.add('hidden');
  });
}
if (document.getElementById('rank-modal')) {
  document.getElementById('rank-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('rank-modal')) {
      document.getElementById('rank-modal').classList.add('hidden');
    }
  });
}
  if (bagUi.tabs && bagUi.tabs.length) {
    bagUi.tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';
        bagFilter = filter;
        bagPage = 0;
        bagUi.tabs.forEach((b) => b.classList.toggle('active', b === btn));
        renderBagModal();
      });
    });
  }
  if (bagUi.prev) {
    bagUi.prev.addEventListener('click', () => {
      if (bagPage > 0) {
        bagPage -= 1;
        renderBagModal();
      }
    });
  }
  if (bagUi.next) {
    bagUi.next.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(filterBagItems(bagItems, bagFilter).length / BAG_PAGE_SIZE));
      if (bagPage < totalPages - 1) {
        bagPage += 1;
        renderBagModal();
      }
    });
}
  if (bagUi.close) {
    bagUi.close.addEventListener('click', () => {
      if (bagUi.modal) bagUi.modal.classList.add('hidden');
      hideItemTooltip();
    });
  }
  if (statsUi.close) {
    statsUi.close.addEventListener('click', () => {
      if (statsUi.modal) statsUi.modal.classList.add('hidden');
      hideItemTooltip();
    });
  }
if (afkUi.start) {
  afkUi.start.addEventListener('click', () => {
    if (!socket || !afkUi.selected) return;
    const ids = Array.from(afkUi.selected);
    if (!ids.length) return;
    socket.emit('cmd', { text: `autoskill set ${ids.join(',')}` });
    if (afkUi.modal) afkUi.modal.classList.add('hidden');
  });
}
if (afkUi.auto) {
  afkUi.auto.addEventListener('click', () => {
    if (socket) socket.emit('cmd', { text: 'autoskill all' });
    if (afkUi.modal) afkUi.modal.classList.add('hidden');
  });
}
if (afkUi.close) {
  afkUi.close.addEventListener('click', () => {
    if (afkUi.modal) afkUi.modal.classList.add('hidden');
  });
}
if (playerUi.close) {
  playerUi.close.addEventListener('click', () => {
    if (playerUi.modal) playerUi.modal.classList.add('hidden');
  });
}
if (observeUi.close) {
  observeUi.close.addEventListener('click', () => {
    if (observeUi.modal) observeUi.modal.classList.add('hidden');
  });
}
if (observeUi.modal) {
  observeUi.modal.addEventListener('click', (e) => {
    if (e.target === observeUi.modal) {
      observeUi.modal.classList.add('hidden');
    }
  });
}
if (guildUi.prev) {
  guildUi.prev.addEventListener('click', () => {
    if (guildPage > 0) {
      guildPage -= 1;
      renderGuildModal();
    }
  });
}
if (guildUi.next) {
  guildUi.next.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(guildMembers.length / GUILD_PAGE_SIZE));
    if (guildPage < totalPages - 1) {
      guildPage += 1;
      renderGuildModal();
    }
  });
}
if (guildUi.invite) {
  guildUi.invite.addEventListener('click', async () => {
    const name = await promptModal({
      title: '行会邀请',
      text: '请输入玩家名',
      placeholder: '玩家名'
    });
    if (!name) return;
    if (socket) socket.emit('cmd', { text: `guild invite ${name.trim()}` });
  });
}
if (guildUi.leave) {
  guildUi.leave.addEventListener('click', async () => {
    const confirmed = await promptModal({
      title: '退出行会',
      text: '确定要退出行会吗？',
      placeholder: '输入 "确认" 继续'
    });
    if (confirmed === '确认' && socket) {
      socket.emit('cmd', { text: 'guild leave' });
    }
  });
}
if (guildUi.close) {
  guildUi.close.addEventListener('click', () => {
    if (guildUi.modal) guildUi.modal.classList.add('hidden');
  });
}
if (guildUi.applications) {
  guildUi.applications.addEventListener('click', () => {
    if (!socket) return;
    // 显示加载提示
    appendLine('正在加载申请列表...');
    socket.emit('guild_applications');
  });
}
if (guildListUi.close) {
  guildListUi.close.addEventListener('click', () => {
    if (guildListUi.modal) guildListUi.modal.classList.add('hidden');
  });
}
if (guildApplicationsUi.close) {
  guildApplicationsUi.close.addEventListener('click', () => {
    if (guildApplicationsUi.modal) guildApplicationsUi.modal.classList.add('hidden');
  });
}
if (guildUi.modal) {
  guildUi.modal.addEventListener('click', (e) => {
    if (e.target === guildUi.modal) {
      guildUi.modal.classList.add('hidden');
    }
  });
}
if (partyUi.modal) {
  partyUi.modal.addEventListener('click', (e) => {
    if (e.target === partyUi.modal) {
      partyUi.modal.classList.add('hidden');
    }
  });
}
if (partyUi.close) {
  partyUi.close.addEventListener('click', () => {
    if (partyUi.modal) partyUi.modal.classList.add('hidden');
  });
}
if (partyUi.leave) {
  partyUi.leave.addEventListener('click', () => {
    if (socket) socket.emit('cmd', { text: 'party leave' });
    if (partyUi.modal) partyUi.modal.classList.add('hidden');
  });
}
if (partyUi.inviteAllFollow) {
  partyUi.inviteAllFollow.addEventListener('click', () => {
    const party = lastState?.party;
    if (!party || !party.members) return;
    const onlineMembers = party.members.filter(m => m.name !== party.leader && m.online);
    onlineMembers.forEach(member => {
      if (socket) socket.emit('cmd', { text: `party follow ${member.name}` });
    });
  });
}
if (partyUi.followLeader) {
  partyUi.followLeader.addEventListener('click', () => {
    const party = lastState?.party;
    if (!party || !party.leader) return;
    if (socket) socket.emit('cmd', { text: `party follow ${party.leader}` });
  });
}
if (playerUi.observe) {
  playerUi.observe.addEventListener('click', () => {
    if (!socket || !playerUi.selected) return;
    socket.emit('cmd', { text: `observe ${playerUi.selected.name}` });
    if (playerUi.modal) playerUi.modal.classList.add('hidden');
  });
}
if (playerUi.attack) {
  playerUi.attack.addEventListener('click', () => {
    if (!socket || !playerUi.selected) return;
    socket.emit('cmd', { text: `attack ${playerUi.selected.name}` });
    if (playerUi.modal) playerUi.modal.classList.add('hidden');
  });
}
if (playerUi.trade) {
  playerUi.trade.addEventListener('click', () => {
    if (!socket || !playerUi.selected) return;
    socket.emit('cmd', { text: `trade request ${playerUi.selected.name}` });
    if (playerUi.modal) playerUi.modal.classList.add('hidden');
  });
}
if (playerUi.party) {
  playerUi.party.addEventListener('click', () => {
    if (!socket || !playerUi.selected) return;
    socket.emit('cmd', { text: `party invite ${playerUi.selected.name}` });
    if (playerUi.modal) playerUi.modal.classList.add('hidden');
  });
}
if (playerUi.guild) {
  playerUi.guild.addEventListener('click', () => {
    if (!socket || !playerUi.selected) return;
    socket.emit('cmd', { text: `guild invite ${playerUi.selected.name}` });
    if (playerUi.modal) playerUi.modal.classList.add('hidden');
  });
}
if (playerUi.mail) {
  playerUi.mail.addEventListener('click', () => {
    if (!socket || !playerUi.selected) return;
    // 打开邮件面板，并自动填充收件人
    currentMailFolder = 'inbox';
    updateMailTabs();
    mailAttachments = [];
    renderMailAttachmentList();
    if (mailUi.to) mailUi.to.value = playerUi.selected.name;
    if (mailUi.subject) mailUi.subject.value = '';
    if (mailUi.body) mailUi.body.value = '';
    if (mailUi.item) mailUi.item.value = '';
    if (mailUi.qty) mailUi.qty.value = '';
    if (mailUi.gold) mailUi.gold.value = '';
    refreshMailItemOptions();
    mailUi.modal.classList.remove('hidden');
    if (playerUi.modal) playerUi.modal.classList.add('hidden');
    if (socket) socket.emit('mail_list');
  });
}
if (ui.party) {
  ui.party.addEventListener('click', () => {
    if (!socket) return;
    renderPartyModal();
  });
}

// 日志折叠功能
const logWrap = document.getElementById('log-wrap');
const logToggle = document.getElementById('log-toggle');
const battleWrap = document.querySelector('.battle-wrap');
const battleToggle = document.getElementById('battle-toggle');
const collapseButtons = document.querySelectorAll('[data-toggle]');
const logShowDamage = document.getElementById('log-show-damage');
const logShowExpGold = document.getElementById('log-show-exp-gold');
const logThrottleNormal = document.getElementById('log-throttle-normal');

if (logWrap && logToggle) {
  // 应用初始状态
  function applyLogCollapsed(collapsed) {
    if (collapsed) {
      logWrap.classList.add('collapsed');
      document.body.classList.add('log-collapsed');
      logToggle.textContent = '▶';
    } else {
      logWrap.classList.remove('collapsed');
      document.body.classList.remove('log-collapsed');
      logToggle.textContent = '◀';
    }
  }

  applyLogCollapsed(isLogCollapsed);

  logToggle.addEventListener('click', () => {
    isLogCollapsed = !isLogCollapsed;
    localStorage.setItem('logCollapsed', isLogCollapsed.toString());
    applyLogCollapsed(isLogCollapsed);
  });
}

if (battleWrap && battleToggle) {
  function applyBattleCollapsed(collapsed) {
    if (collapsed) {
      battleWrap.classList.add('collapsed');
      battleToggle.textContent = '▼';
    } else {
      battleWrap.classList.remove('collapsed');
      battleToggle.textContent = '▲';
    }
  }

  applyBattleCollapsed(isBattleCollapsed);

  battleToggle.addEventListener('click', () => {
    isBattleCollapsed = !isBattleCollapsed;
    localStorage.setItem('battleCollapsed', isBattleCollapsed.toString());
    applyBattleCollapsed(isBattleCollapsed);
  });
}

if (collapseButtons.length) {
  collapseButtons.forEach((btn) => {
    const targetKey = btn.dataset.toggle;
    if (targetKey === 'log' || targetKey === 'battle') {
      return;
    }
    if (!targetKey) return;
    const target = document.querySelector(`[data-collapsible="${targetKey}"]`);
    if (!target) return;

    const storageKey = `collapse:${targetKey}`;
    const isCollapsed = localStorage.getItem(storageKey) === 'true';
    if (isCollapsed) {
      target.classList.add('collapsed');
      btn.textContent = '▼';
    }

    btn.addEventListener('click', () => {
      const collapsed = !target.classList.contains('collapsed');
      target.classList.toggle('collapsed', collapsed);
      btn.textContent = collapsed ? '▼' : '▲';
      localStorage.setItem(storageKey, collapsed.toString());
    });
  });
}

// 伤害信息开关
if (logShowDamage) {
  logShowDamage.checked = showDamage;
  logShowDamage.addEventListener('change', () => {
    showDamage = logShowDamage.checked;
    localStorage.setItem('showDamage', showDamage.toString());
  });
}

// 经验金币信息开关
if (logShowExpGold) {
  logShowExpGold.checked = showExpGold;
  logShowExpGold.addEventListener('change', () => {
    showExpGold = logShowExpGold.checked;
    localStorage.setItem('showExpGold', showExpGold.toString());
  });
}

function clearChatLog() {
  if (!chat.log) return;
  chat.log.innerHTML = '';
  const name = activeChar || '';
  try {
    const key = chatCacheKey(name);
    localStorage.setItem(key, JSON.stringify([]));
  } catch {
    // ignore cache failures
  }
}

function syncStateThrottleToggle() {
  if (!logThrottleNormal) return;
  logThrottleNormal.checked = stateThrottleOverride;
  logThrottleNormal.disabled = !stateThrottleEnabled;
}

if (logThrottleNormal) {
  syncStateThrottleToggle();
  logThrottleNormal.addEventListener('change', () => {
    stateThrottleOverride = logThrottleNormal.checked;
    localStorage.setItem('stateThrottleOverride', stateThrottleOverride.toString());
    if (socket && stateThrottleOverrideServerAllowed) {
      socket.emit('state_throttle_override', { enabled: stateThrottleOverride });
    }
  });
}









