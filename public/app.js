let token = null;
let socket = null;
let activeChar = null;
const classNames = { warrior: '战士', mage: '法师', taoist: '道士' };
let selectedMob = null;
let lastState = null;
let serverTimeBase = null;
let serverTimeLocal = null;
let serverTimeTimer = null;
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
  name: document.getElementById('ui-name'),
  classLevel: document.getElementById('ui-class'),
  guild: document.getElementById('ui-guild'),
  pk: document.getElementById('ui-pk'),
  vip: document.getElementById('ui-vip'),
  sabakBonus: document.getElementById('ui-sabak-bonus'),
  online: document.getElementById('ui-online'),
  serverTime: document.getElementById('ui-server-time'),
  party: document.getElementById('ui-party'),
  gold: document.getElementById('ui-gold'),
  hpValue: document.getElementById('ui-hp'),
  mpValue: document.getElementById('ui-mp'),
  atk: document.getElementById('ui-atk'),
  def: document.getElementById('ui-def'),
  mag: document.getElementById('ui-mag'),
  spirit: document.getElementById('ui-spirit'),
  mdef: document.getElementById('ui-mdef'),
  hp: document.getElementById('bar-hp'),
  mp: document.getElementById('bar-mp'),
  exp: document.getElementById('bar-exp'),
  exits: document.getElementById('exits-list'),
  mobs: document.getElementById('mobs-list'),
  players: document.getElementById('players-list'),
  skills: document.getElementById('skills-list'),
  summon: document.getElementById('summon-panel'),
  items: document.getElementById('items-list'),
  training: document.getElementById('training-list'),
  actions: document.getElementById('actions-list')
};
const chat = {
  log: document.getElementById('chat-log'),
  input: document.getElementById('chat-input'),
  sendBtn: document.getElementById('chat-send'),
  partyInviteBtn: document.getElementById('chat-party-invite'),
  guildInviteBtn: document.getElementById('chat-guild-invite'),
  guildCreateBtn: document.getElementById('chat-guild-create'),
  partyToggleBtn: document.getElementById('chat-party-toggle'),
  sabakRegisterBtn: document.getElementById('chat-sabak-register'),
  locationBtn: document.getElementById('chat-send-location')
};
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
  panel: document.getElementById('trade-panel')
};
const promptUi = {
  modal: document.getElementById('prompt-modal'),
  title: document.getElementById('prompt-title'),
  text: document.getElementById('prompt-text'),
  input: document.getElementById('prompt-input'),
  ok: document.getElementById('prompt-ok'),
  cancel: document.getElementById('prompt-cancel'),
  extra: document.getElementById('prompt-extra')
};
const shopUi = {
  modal: document.getElementById('shop-modal'),
  list: document.getElementById('shop-list'),
  subtitle: document.getElementById('shop-subtitle'),
  sellList: document.getElementById('shop-sell-list'),
  close: document.getElementById('shop-close')
};
const repairUi = {
  modal: document.getElementById('repair-modal'),
  list: document.getElementById('repair-list'),
  all: document.getElementById('repair-all'),
  close: document.getElementById('repair-close')
};
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
  attack: document.getElementById('player-attack'),
  trade: document.getElementById('player-trade'),
  party: document.getElementById('player-party'),
  close: document.getElementById('player-close')
};
const itemTooltip = document.getElementById('item-tooltip');
let lastShopItems = [];
let consignMarketItems = [];
let consignMyItems = [];
let consignInventoryItems = [];
let consignMarketPage = 0;
let consignMyPage = 0;
let consignInventoryPage = 0;
let consignMarketFilter = 'all';
const CONSIGN_PAGE_SIZE = 9;
  let bagItems = [];
  let bagPage = 0;
  let bagFilter = 'all';
  const BAG_PAGE_SIZE = 40;

const authSection = document.getElementById('auth');
const characterSection = document.getElementById('character');
const gameSection = document.getElementById('game');
const log = document.getElementById('log');

const authMsg = document.getElementById('auth-msg');
const authToast = document.getElementById('auth-toast');
const charMsg = document.getElementById('char-msg');
const characterList = document.getElementById('character-list');
const loginUserInput = document.getElementById('login-username');
let lastSavedLevel = null;
const CHAT_CACHE_LIMIT = 200;

function showToast(message) {
  authToast.textContent = message;
  authToast.classList.remove('hidden');
  authToast.classList.add('show');
  setTimeout(() => {
    authToast.classList.remove('show');
  }, 1600);
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
  localStorage.removeItem('savedToken');
  show(authSection);
}

function updateSavedCharacters(player) {
  if (!player || !player.name) return;
  let chars = [];
  try {
    chars = JSON.parse(localStorage.getItem('savedCharacters') || '[]');
  } catch {
    chars = [];
  }
  if (!Array.isArray(chars) || !chars.length) return;
  const idx = chars.findIndex((c) => c.name === player.name);
  if (idx === -1) return;
  if (chars[idx].level === player.level && chars[idx].class === player.classId) return;
  chars[idx] = { ...chars[idx], level: player.level, class: player.classId };
  localStorage.setItem('savedCharacters', JSON.stringify(chars));
  if (!characterSection.classList.contains('hidden')) {
    renderCharacters(chars);
  }
}

function normalizePayload(payload) {
  if (payload && typeof payload === 'object') return payload;
  return { text: String(payload || '') };
}

function buildLine(payload) {
  const data = normalizePayload(payload);
  const p = document.createElement('p');
  p.classList.add('log-line');
  if (data.color) p.classList.add(`line-${data.color}`);
  if (data.prefix) {
    const prefix = document.createElement('span');
    prefix.classList.add('line-prefix');
    if (data.prefixColor) prefix.classList.add(`prefix-${data.prefixColor}`);
    prefix.textContent = data.prefix;
    p.appendChild(prefix);
  }
  const text = document.createElement('span');
  text.textContent = data.text || '';
  p.appendChild(text);
  return p;
}

const LOCATION_LOOKUP = {
  '盟重省 - 盟重入口': { zoneId: 'mg_plains', roomId: 'gate' },
  '土城集市': { zoneId: 'mg_town', roomId: 'mg_market' },
  '沃玛寺庙 - 寺庙入口': { zoneId: 'wms', roomId: 'entrance' },
  '祖玛寺庙 - 祖玛大厅': { zoneId: 'zm', roomId: 'hall' },
  '赤月峡谷 - 赤月入口': { zoneId: 'cr', roomId: 'valley' },
  '世界BOSS领域 - 炎龙巢穴': { zoneId: 'wb', roomId: 'lair' }
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
  const p = buildLine(payload);
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

function formatServerTime(ms) {
  if (!ms) return '-';
  return new Date(ms).toLocaleString('zh-CN', { hour12: false });
}

function updateServerTimeDisplay() {
  if (!ui.serverTime || serverTimeBase == null || serverTimeLocal == null) return;
  const delta = Date.now() - serverTimeLocal;
  ui.serverTime.textContent = formatServerTime(serverTimeBase + delta);
}

function appendChatLine(payload) {
  if (!chat.log) return;
  const p = buildLine(payload);
  const loc = parseLocationMessage(normalizePayload(payload).text);
  const data = normalizePayload(payload);
  const staticLoc = parseStaticLocationLink(data.text);
  if (loc && socket) {
    const btn = document.createElement('button');
    btn.className = 'chat-link-btn';
    btn.textContent = '前往';
    btn.addEventListener('click', () => {
      socket.emit('cmd', { text: `goto ${loc.player}` });
    });
    p.appendChild(btn);
  }
  if (data.location && socket) {
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
    btn.className = 'chat-link-btn';
    btn.textContent = '前往';
    btn.addEventListener('click', () => {
      socket.emit('cmd', { text: `goto_room ${staticLoc.zoneId}:${staticLoc.roomId}` });
    });
    p.appendChild(btn);
  }
  chat.log.appendChild(p);
  chat.log.scrollTop = chat.log.scrollHeight;
  if (activeChar) cacheChatLine(activeChar, payload);
}

function parseTradeRequest(text) {
  if (!text) return null;
  const match = text.match(/^(.+?) 请求交易/);
  if (!match) return null;
  return match[1];
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
        chat.log.appendChild(p);
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
  if (!tradeUi.panel) return;
  if (!text) return;
  if (text.includes('交易建立')) {
    tradeUi.panel.classList.remove('hidden');
  } else if (
    text.includes('交易完成') ||
    text.includes('交易已取消') ||
    text.includes('交易失败') ||
    text.includes('未在交易中')
  ) {
    tradeUi.panel.classList.add('hidden');
  }
}

function promptModal({ title, text, placeholder, value, extra, allowEmpty }) {
  if (!promptUi.modal || !promptUi.input) return Promise.resolve(null);
  return new Promise((resolve) => {
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
    const cleanup = () => {
      promptUi.ok.removeEventListener('click', onOk);
      promptUi.cancel.removeEventListener('click', onCancel);
      promptUi.input.removeEventListener('keydown', onKey);
      promptUi.modal.classList.add('hidden');
      if (promptUi.extra) {
        promptUi.extra.removeEventListener('click', onExtra);
        promptUi.extra.classList.add('hidden');
      }
    };

    promptUi.title.textContent = title || '输入';
    promptUi.text.textContent = text || '';
    promptUi.input.placeholder = placeholder || '';
    promptUi.input.value = value || '';
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
    promptUi.modal.classList.remove('hidden');
    setTimeout(() => promptUi.input.focus(), 0);
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
  const filtered = filterConsignItems(items, consignMarketFilter);
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
  const { totalPages, page, slice } = paginateItems(items, consignMyPage);
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
  consignInventoryItems = equipItems;
  const { totalPages, page, slice } = paginateItems(equipItems, consignInventoryPage);
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

function showConsignModal() {
  if (!consignUi.modal) return;
  hideItemTooltip();
  consignMarketPage = 0;
  consignMyPage = 0;
  consignInventoryPage = 0;
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
    `职业: ${classNames[player.classId] || player.classId}`,
    `等级: Lv ${player.level}`,
    `行会: ${player.guild || '无'}`
  ];
  playerUi.info.textContent = lines.join('\n');
  playerUi.selected = player;
  playerUi.modal.classList.remove('hidden');
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
      btn.textContent = `${formatItemName(item)} x${item.qty}`;
      btn.addEventListener('click', async () => {
        const qtyText = await promptModal({
          title: '\u51fa\u552e\u7269\u54c1',
          text: `\u8bf7\u8f93\u5165\u51fa\u552e\u6570\u91cf: ${formatItemName(item)}`,
          placeholder: '1',
          value: '1'
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

function isChatLine(text) {
  const match = text.match(/^\[([^\]]+)\]/);
  if (!match) return false;
  const head = match[1];
  return !/^\d+$/.test(head);
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

function setBar(el, current, max) {
  if (!max) {
    el.style.width = '0%';
    return;
  }
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  el.style.width = `${pct}%`;
}

function parseStats(line) {
  if (line.startsWith('职业:')) {
    ui.classLevel.textContent = line.replace('职业:', '').trim();
  }
  if (line.startsWith('等级:')) {
    ui.classLevel.textContent = `${ui.classLevel.textContent} | ${line.replace('等级:', '').trim()}`;
    const match = line.match(/\((\d+)\/(\d+)\s+EXP\)/);
    if (match) {
      setBar(ui.exp, Number(match[1]), Number(match[2]));
    }
  }
  if (line.startsWith('生命:')) {
    const nums = line.replace('生命:', '').trim().split('/');
    setBar(ui.hp, Number(nums[0]), Number(nums[1]));
  }
  if (line.startsWith('魔法:')) {
    const nums = line.replace('魔法:', '').trim().split('/');
    setBar(ui.mp, Number(nums[0]), Number(nums[1]));
  }
  if (line.startsWith('金币:')) {
    ui.gold.textContent = line.replace('金币:', '').trim();
  }
  if (line.startsWith('行会:')) {
    ui.guild.textContent = line.replace('行会:', '').trim();
  }
  if (line.startsWith('PK值:')) {
    ui.pk.textContent = line.replace('PK值:', '').trim();
  }
  if (line.startsWith('VIP:')) {
    ui.vip.textContent = line.replace('VIP:', '').trim();
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
    if (item.className) {
      item.className.split(' ').filter(Boolean).forEach((name) => btn.classList.add(name));
    }
    btn.textContent = item.label;
    if (item.tooltip) {
      btn.addEventListener('mouseenter', (evt) => showItemTooltip(item.tooltip, evt));
      btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      btn.addEventListener('mouseleave', hideItemTooltip);
    }
    btn.addEventListener('click', () => onClick(item));
    container.appendChild(btn);
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
    const filtered = filterBagItems(bagItems, bagFilter);
    const totalPages = Math.max(1, Math.ceil(filtered.length / BAG_PAGE_SIZE));
    bagPage = Math.min(Math.max(0, bagPage), totalPages - 1);
    const start = bagPage * BAG_PAGE_SIZE;
    const pageItems = filtered.slice(start, start + BAG_PAGE_SIZE);
    pageItems.forEach((item) => {
      const btn = document.createElement('div');
      btn.className = 'bag-item';
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
      `PK值: ${stats.pk || 0}  VIP: ${stats.vip ? '是' : '否'}  沙巴克加成: ${stats.sabak_bonus ? '已生效' : '无'}`
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
          const slotLabel = slotLabels[entry.slot] || entry.slot;
          btn.textContent = `${slotLabel}: ${formatItemName(entry.item)}`;
          const tooltip = formatItemTooltip(entry.item);
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
  legendary: '\u4f20\u8bf4',
  epic: '\u53f2\u8bd7',
  rare: '\u7a00\u6709',
  uncommon: '\u9ad8\u7ea7',
  common: '\u666e\u901a'
};

  function repairMultiplier(rarity) {
    switch (rarity) {
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
  { id: 'hp', label: '\u751f\u547d', inc: 10 },
  { id: 'mp', label: '\u9b54\u6cd5\u503c', inc: 10 },
  { id: 'atk', label: '\u653b\u51fb', inc: 1 },
  { id: 'def', label: '\u9632\u5fa1', inc: 1 },
  { id: 'mag', label: '\u9b54\u6cd5', inc: 1 },
  { id: 'mdef', label: '\u9b54\u5fa1', inc: 1 },
  { id: 'spirit', label: '\u9053\u672f', inc: 1 },
  { id: 'dex', label: '\u8eb2\u95ea', inc: 1 }
];

function trainingCost(current, inc) {
  const base = 10000;
  const steps = Math.floor((current || 0) / inc);
  return Math.max(1, Math.floor(base + steps * (base * 0.2)));
}

function formatItemTooltip(item) {
  if (!item) return '';
  const lines = [];
  lines.push(item.name || '');
  if (item.is_set) lines.push('\u5957\u88c5');
  if (item.rarity) {
    lines.push(`\u7a00\u6709\u5ea6: ${RARITY_LABELS[item.rarity] || item.rarity}`);
  }
  if (item.effects && item.effects.combo) {
    lines.push('\u7279\u6548: \u8fde\u51fb(10%\u53cc\u51fb)');
  }
  if (item.effects && item.effects.fury) {
    lines.push('\u7279\u6548: \u7834\u8840\u72C2\u653B(\u6B66\u5668\u5C5E\u6027+25%)');
  }
  if (item.effects && item.effects.unbreakable) {
    lines.push('\u7279\u6548: \u6c38\u4e0d\u78e8\u635f(\u8010\u4e45\u4e0d\u4f1a\u964d\u4f4e)');
  }
  const typeLabel = ITEM_TYPE_LABELS[item.type] || ITEM_TYPE_LABELS.unknown;
  lines.push(`\u7c7b\u578b: ${typeLabel}`);
  if (item.slot) {
    const slotLabel = ITEM_SLOT_LABELS[item.slot] || item.slot;
    lines.push(`\u90e8\u4f4d: ${slotLabel}`);
  }
  const stats = [];
  if (item.atk) stats.push(`\u653b\u51fb+${item.atk}`);
  if (item.def) stats.push(`\u9632\u5fa1+${item.def}`);
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

function formatItemName(item) {
  if (!item) return '';
  const tags = [];
  if (item.effects && item.effects.combo) tags.push('\u8fde\u51fb');
  if (item.effects && item.effects.fury) tags.push('\u72C2\u653B');
  if (item.effects && item.effects.unbreakable) tags.push('\u4e0d\u78e8');
  return tags.length ? `${item.name}\u00b7${tags.join('\u00b7')}` : item.name;
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

function renderState(state) {
  const prevState = lastState;
  lastState = state;
  if (state.player) {
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
    setBar(ui.exp, state.stats.exp, state.stats.exp_next);
    ui.gold.textContent = state.stats.gold;
    if (ui.hpValue) ui.hpValue.textContent = `${state.stats.hp}/${state.stats.max_hp}`;
    if (ui.mpValue) ui.mpValue.textContent = `${state.stats.mp}/${state.stats.max_mp}`;
    if (ui.atk) ui.atk.textContent = state.stats.atk ?? '-';
    if (ui.def) ui.def.textContent = state.stats.def ?? '-';
    if (ui.mag) ui.mag.textContent = state.stats.mag ?? '-';
    if (ui.spirit) ui.spirit.textContent = state.stats.spirit ?? '-';
    if (ui.mdef) ui.mdef.textContent = state.stats.mdef ?? '-';
    ui.pk.textContent = `${state.stats.pk} (${state.stats.pk >= 100 ? '红名' : '正常'})`;
    ui.vip.textContent = state.stats.vip ? '是' : '否';
    if (ui.sabakBonus) {
      ui.sabakBonus.textContent = state.stats.sabak_bonus ? '已生效' : '无';
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
      } else {
        ui.party.textContent = '无';
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
  const exits = (state.exits || []).map((e) => ({ id: e.dir, label: e.label || directionLabels[e.dir] || e.dir }));
  renderChips(ui.exits, exits, (e) => socket.emit('cmd', { text: `go ${e.id}` }));

  const players = (state.players || [])
    .filter((p) => p.name && (!state.player || p.name !== state.player.name))
    .map((p) => ({
      id: p.name,
      label: `${p.name} Lv${p.level} ${classNames[p.classId] || p.classId}`,
      raw: p,
      className: (state.sabak && state.sabak.inZone)
        ? (state.player && state.player.guildId && p.guildId === state.player.guildId
          ? 'player-friendly'
          : 'player-enemy')
        : ''
    }));
  renderChips(ui.players, players, (p) => showPlayerModal(p.raw));

  const mobs = (state.mobs || []).map((m) => ({ id: m.id, label: `${m.name}(${m.hp})`, raw: m }));
  renderChips(ui.mobs, mobs, (m) => {
    selectedMob = m.raw;
    socket.emit('cmd', { text: `attack ${m.raw.name}` });
  }, selectedMob ? selectedMob.id : null);

  const skills = (state.skills || []).map((s) => ({
    id: s.id,
    label: s.level ? `${s.name} Lv${s.level}` : s.name,
    raw: s
  }));
  renderChips(ui.skills, skills, (s) => {
    if (s.raw.type === 'heal') {
      socket.emit('cmd', { text: `cast ${s.raw.id}` });
      return;
    }
    if (!selectedMob) return;
    socket.emit('cmd', { text: `cast ${s.raw.id} ${selectedMob.name}` });
  });

  if (ui.summon) {
    if (state.summon) {
      const levelMax = state.summon.levelMax || 8;
      const summonEntry = [{
        id: 'summon',
        label: `${state.summon.name} Lv${state.summon.level}/${levelMax} ${state.summon.hp}/${state.summon.max_hp}`,
        tooltip: `攻击: ${state.summon.atk} 防御: ${state.summon.def}`,
        raw: state.summon
      }];
      renderChips(ui.summon, summonEntry, () => {});
    } else {
      ui.summon.textContent = '\u65e0';
    }
  }

    const itemTotals = {};
    (state.items || []).forEach((i) => {
      const key = i.key || i.id;
      if (!itemTotals[key]) {
        itemTotals[key] = { ...i, qty: 0, key };
      }
      itemTotals[key].qty += i.qty;
    });
    const allItems = Object.values(itemTotals);
    const displayItems = allItems.filter((i) => i.type === 'consumable' && (i.hp || i.mp));
    const displayChips = displayItems.map((i) => ({
      id: i.key || i.id,
      label: `${formatItemName(i)} x${i.qty}`,
      raw: i,
      tooltip: formatItemTooltip(i),
      className: `${i.rarity ? `rarity-${i.rarity}` : ''}${i.is_set ? ' item-set' : ''}`.trim()
    }));
  bagItems = allItems.map((i) => ({ ...i, tooltip: formatItemTooltip(i) }));
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
      const current = training[opt.id] || 0;
      const cost = trainingCost(current, opt.inc);
      return {
        id: opt.id,
        label: `${opt.label} +${opt.inc} (${cost}金)`,
        tooltip: `${opt.label} 当前 +${current}`,
        raw: { id: opt.id }
      };
    });
    renderChips(ui.training, trainingButtons, (opt) => {
      socket.emit('cmd', { text: `train ${opt.raw.id}` });
    });
  }
  if (tradeUi.itemSelect) {
    tradeUi.itemSelect.innerHTML = '';
    if (!allItems.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '\u65e0\u53ef\u7528\u7269\u54c1';
      tradeUi.itemSelect.appendChild(opt);
    } else {
      allItems.forEach((entry) => {
        const opt = document.createElement('option');
        opt.value = entry.key || entry.id;
        opt.textContent = `${formatItemName(entry)} x${entry.qty}`;
        tradeUi.itemSelect.appendChild(opt);
      });
    }
  }

  const actions = [
    { id: 'stats', label: '\u72b6\u6001' },
    { id: 'bag', label: '\u80cc\u5305' },
    { id: 'quests', label: '\u4efb\u52a1' },
    { id: 'party', label: '\u961f\u4f0d' },
    { id: 'guild', label: '\u884c\u4f1a' },
    { id: 'sabak status', label: '\u6c99\u5df4\u514b' },
    { id: 'mail list', label: '\u90ae\u4ef6' },
    { id: 'shop', label: '\u5546\u5e97' },
    { id: 'repair', label: '\u4FEE\u7406' },
    { id: 'consign', label: '\u5BC4\u552E' },
    { id: 'vip activate', label: 'VIP\u6fc0\u6d3b' },
    { id: 'logout', label: '\u9000\u51fa\u6e38\u620f' }
  ];
  if (state.stats && state.stats.vip) {
    const afkLabel = state.stats.autoSkillId ? '\u505c\u6b62\u6302\u673a' : '\u6302\u673a';
    actions.push({ id: 'afk', label: afkLabel });
  }
  renderChips(ui.actions, actions, async (a) => {
    if (a.id === 'stats') {
      showStatsModal();
      return;
    }
    if (a.id === 'bag') {
      showBagModal();
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
    socket.emit('cmd', { text: a.id });
  });
}
const remembered = localStorage.getItem('rememberedUser');
if (remembered) {
  loginUserInput.value = remembered;
}
const savedToken = localStorage.getItem('savedToken');
if (savedToken) {
  token = savedToken;
  let savedChars = [];
  try {
    savedChars = JSON.parse(localStorage.getItem('savedCharacters') || '[]');
  } catch {
    savedChars = [];
  }
  const lastChar = localStorage.getItem('lastCharacter');
  const hasLastChar = lastChar && savedChars.some((c) => c.name === lastChar);
  if (hasLastChar) {
    enterGame(lastChar);
  } else {
    renderCharacters(savedChars);
    show(characterSection);
  }
}

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

async function login() {
  const username = loginUserInput.value.trim();
  const password = document.getElementById('login-password').value.trim();
  authMsg.textContent = '';
  const loginBtn = document.getElementById('login-btn');
  loginBtn.classList.add('btn-loading');
  try {
    const data = await apiPost('/api/login', { username, password });
    localStorage.setItem('rememberedUser', username);
    token = data.token;
    localStorage.setItem('savedToken', token);
    localStorage.setItem('savedCharacters', JSON.stringify(data.characters || []));
    renderCharacters(data.characters || []);
    show(characterSection);
    showToast('登录成功');
  } catch (err) {
    authMsg.textContent = err.message;
    showToast('登录失败');
    loginBtn.classList.add('shake');
    setTimeout(() => loginBtn.classList.remove('shake'), 500);
  } finally {
    loginBtn.classList.remove('btn-loading');
  }
}

async function register() {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value.trim();
  authMsg.textContent = '';
  const registerBtn = document.getElementById('register-btn');
  registerBtn.classList.add('btn-loading');
  try {
    await apiPost('/api/register', { username, password });
    authMsg.textContent = '注册成功，请登录。';
    showToast('注册成功');
  } catch (err) {
    authMsg.textContent = err.message;
    showToast('注册失败');
    registerBtn.classList.add('shake');
    setTimeout(() => registerBtn.classList.remove('shake'), 500);
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
    card.appendChild(document.createElement('div'));
    card.appendChild(btn);
    characterList.appendChild(card);
  });
}

async function createCharacter() {
  charMsg.textContent = '';
  const name = document.getElementById('char-name').value.trim();
  const classId = document.getElementById('char-class').value;
  if (!name) {
    charMsg.textContent = '请输入角色名。';
    return;
  }
  try {
    await apiPost('/api/character', { token, name, classId });
    const loginData = await apiPost('/api/login', {
      username: document.getElementById('login-username').value.trim(),
      password: document.getElementById('login-password').value.trim()
    });
    token = loginData.token;
    localStorage.setItem('savedToken', token);
    localStorage.setItem('savedCharacters', JSON.stringify(loginData.characters || []));
    renderCharacters(loginData.characters || []);
    charMsg.textContent = '角色已创建。';
  } catch (err) {
    charMsg.textContent = err.message;
  }
}

function enterGame(name) {
  activeChar = name;
  localStorage.setItem('lastCharacter', name);
  lastSavedLevel = null;
  show(gameSection);
  log.innerHTML = '';
  if (chat.log) {
    loadChatCache(name);
  }
  setTradeStatus('\u672a\u5728\u4ea4\u6613\u4e2d');
  if (shopUi.modal) shopUi.modal.classList.add('hidden');
  appendLine('正在连接...');
  ui.name.textContent = name;
  ui.classLevel.textContent = '-';
  ui.guild.textContent = '-';
  ui.pk.textContent = '-';
  ui.vip.textContent = '-';
  ui.gold.textContent = '0';
  setBar(ui.hp, 0, 1);
  setBar(ui.mp, 0, 1);
  setBar(ui.exp, 0, 1);
  socket = io();
  socket.on('connect', () => {
    socket.emit('auth', { token, name });
    socket.emit('cmd', { text: 'stats' });
  });
  socket.on('auth_error', (payload) => {
    appendLine(`认证失败: ${payload.error}`);
    showToast('登录已过期，请重新登录。');
    exitGame();
  });
  socket.on('output', (payload) => {
    appendLine(payload);
    parseStats(payload.text);
    if (isChatLine(payload.text)) {
      appendChatLine(payload);
    }
    const tradeFrom = parseTradeRequest(payload.text);
    if (tradeFrom && socket) {
      promptModal({
        title: '交易请求',
        text: `${tradeFrom} 请求交易，是否接受？`,
        placeholder: '',
        extra: { text: '拒绝' },
        allowEmpty: true
      }).then((res) => {
        if (res === '__extra__') {
          socket.emit('cmd', { text: `trade cancel` });
          return;
        }
        if (res === null) return;
        const targetName = res || tradeFrom;
        socket.emit('cmd', { text: `trade accept ${targetName}` });
      });
    }
    const shopItems = parseShopLine(payload.text);
    if (shopItems) {
      lastShopItems = shopItems;
      showShopModal(shopItems);
    }
    if (payload.text.startsWith('\u4ea4\u6613')) {
      appendChatLine(payload);
      setTradeStatus(payload.text);
    }
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
  socket.on('state', (payload) => {
    renderState(payload);
  });
}

document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('register-btn').addEventListener('click', register);
document.getElementById('create-char-btn').addEventListener('click', createCharacter);
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
if (chat.partyToggleBtn) {
  chat.partyToggleBtn.addEventListener('click', () => {});
}
if (chat.sabakRegisterBtn) {
  chat.sabakRegisterBtn.addEventListener('click', () => {
    if (!socket) return;
    socket.emit('cmd', { text: 'sabak register' });
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
if (shopUi.close) {
  shopUi.close.addEventListener('click', () => {
    shopUi.modal.classList.add('hidden');
    hideItemTooltip();
  });
}
if (repairUi.close) {
  repairUi.close.addEventListener('click', () => {
    repairUi.modal.classList.add('hidden');
    hideItemTooltip();
  });
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



