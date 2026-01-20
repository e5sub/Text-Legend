let token = null;
let socket = null;
let activeChar = null;
const classNames = { warrior: '战士', mage: '法师', taoist: '道士' };
let selectedMob = null;
let lastState = null;
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
  gold: document.getElementById('ui-gold'),
  hp: document.getElementById('bar-hp'),
  mp: document.getElementById('bar-mp'),
  exp: document.getElementById('bar-exp'),
  exits: document.getElementById('exits-list'),
  mobs: document.getElementById('mobs-list'),
  skills: document.getElementById('skills-list'),
  items: document.getElementById('items-list'),
  training: document.getElementById('training-list'),
  actions: document.getElementById('actions-list'),
  target: document.getElementById('target-label')
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
  acceptBtn: document.getElementById('chat-trade-accept'),
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
  cancel: document.getElementById('prompt-cancel')
};
const shopUi = {
  modal: document.getElementById('shop-modal'),
  list: document.getElementById('shop-list'),
  subtitle: document.getElementById('shop-subtitle'),
  sellList: document.getElementById('shop-sell-list'),
  close: document.getElementById('shop-close')
};
const itemTooltip = document.getElementById('item-tooltip');
let lastShopItems = [];

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

function appendLine(text) {
  const p = document.createElement('p');
  p.textContent = text;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

function appendChatLine(text) {
  if (!chat.log) return;
  const p = document.createElement('p');
  p.textContent = text;
  chat.log.appendChild(p);
  chat.log.scrollTop = chat.log.scrollHeight;
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

function promptModal({ title, text, placeholder, value }) {
  if (!promptUi.modal || !promptUi.input) return Promise.resolve(null);
  return new Promise((resolve) => {
    const onCancel = () => {
      cleanup();
      resolve(null);
    };
    const onOk = () => {
      const result = promptUi.input.value.trim();
      cleanup();
      resolve(result || null);
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
    };

    promptUi.title.textContent = title || '输入';
    promptUi.text.textContent = text || '';
    promptUi.input.placeholder = placeholder || '';
    promptUi.input.value = value || '';
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
      card.textContent = `${item.name} (${item.price}\u91D1)`;
      card.addEventListener('click', () => {
        if (socket) socket.emit('cmd', { text: `buy ${item.name}` });
      });
      shopUi.list.appendChild(card);
    });
  }
  renderShopSellList(lastState ? lastState.items : []);
  shopUi.modal.classList.remove('hidden');
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
    btn.textContent = `${item.name} x${item.qty}`;
    btn.addEventListener('click', async () => {
      const qtyText = await promptModal({
        title: '\u51fa\u552e\u7269\u54c1',
        text: `\u8bf7\u8f93\u5165\u51fa\u552e\u6570\u91cf: ${item.name}`,
        placeholder: '1',
        value: '1'
      });
      if (!qtyText) return;
      const qty = Math.max(1, Number(qtyText || 1));
      if (Number.isNaN(qty) || qty <= 0) return;
      if (!socket) return;
      socket.emit('cmd', { text: `sell ${item.id} ${qty}` });
    });
    shopUi.sellList.appendChild(btn);
  });
}

function parseShopLine(text) {
  if (!text.startsWith('\u5546\u5E97\u5546\u54C1:')) return null;
  const list = [];
  const regex = /([^,]+)\((\d+)\u91D1\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
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

function renderChips(container, items, onClick, activeId) {
  container.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('div');
    btn.className = `chip${activeId && activeId === item.id ? ' active' : ''}`;
    btn.textContent = item.label;
    if (item.tooltip) {
      btn.addEventListener('mouseenter', (evt) => showItemTooltip(item.tooltip, evt));
      btn.addEventListener('mousemove', (evt) => positionTooltip(evt.clientX, evt.clientY));
      btn.addEventListener('mouseleave', hideItemTooltip);
    }
    btn.addEventListener('click', () => onClick(item));
    container.appendChild(btn);
  });
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
  { id: 'mp', label: '\u9b54\u6cd5', inc: 10 },
  { id: 'atk', label: '\u653b\u51fb', inc: 1 },
  { id: 'mag', label: '\u9b54\u6cd5\u503c', inc: 1 },
  { id: 'spirit', label: '\u9053\u672f', inc: 1 }
];

function trainingCost(current, inc) {
  const base = 10;
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
    ui.pk.textContent = `${state.stats.pk} (${state.stats.pk >= 100 ? '红名' : '正常'})`;
    ui.vip.textContent = state.stats.vip ? '是' : '否';
    if (ui.sabakBonus) {
      ui.sabakBonus.textContent = state.stats.sabak_bonus ? '已生效' : '无';
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
  }

  if (selectedMob && !(state.mobs || []).some((m) => m.id === selectedMob.id)) {
    selectedMob = null;
  }
  ui.target.textContent = selectedMob ? `目标: ${selectedMob.name}` : '未选择';

  const exits = (state.exits || []).map((e) => ({ id: e.dir, label: e.label || directionLabels[e.dir] || e.dir }));
  renderChips(ui.exits, exits, (e) => socket.emit('cmd', { text: `go ${e.id}` }));

  const mobs = (state.mobs || []).map((m) => ({ id: m.id, label: `${m.name}(${m.hp})`, raw: m }));
  renderChips(ui.mobs, mobs, (m) => {
    selectedMob = m.raw;
    ui.target.textContent = `目标: ${m.raw.name}`;
    socket.emit('cmd', { text: `attack ${m.raw.name}` });
  }, selectedMob ? selectedMob.id : null);

  const skills = (state.skills || []).map((s) => ({ id: s.id, label: s.name, raw: s }));
  renderChips(ui.skills, skills, (s) => {
    if (!selectedMob) return;
    socket.emit('cmd', { text: `cast ${s.raw.id} ${selectedMob.name}` });
  });

  const itemTotals = {};
  (state.items || []).forEach((i) => {
    if (!itemTotals[i.id]) {
      itemTotals[i.id] = { ...i, qty: 0 };
    }
    itemTotals[i.id].qty += i.qty;
  });
  const items = Object.values(itemTotals).map((i) => ({
    id: i.id,
    label: `${i.name} x${i.qty}`,
    raw: i,
    tooltip: formatItemTooltip(i)
  }));
  renderChips(ui.items, items, (i) => {
    if (i.raw.type === 'consumable' || i.raw.type === 'book') {
      socket.emit('cmd', { text: `use ${i.raw.id}` });
    } else if (i.raw.slot) {
      socket.emit('cmd', { text: `equip ${i.raw.id}` });
    }
  });
  if (shopUi.modal && !shopUi.modal.classList.contains('hidden')) {
    renderShopSellList(state.items || []);
  }

  if (ui.training) {
    const training = state.training || { hp: 0, mp: 0, atk: 0, mag: 0, spirit: 0 };
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
    if (!items.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '\u65e0\u53ef\u7528\u7269\u54c1';
      tradeUi.itemSelect.appendChild(opt);
    } else {
      items.forEach((entry) => {
        const opt = document.createElement('option');
        opt.value = entry.raw.id;
        opt.textContent = entry.label;
        tradeUi.itemSelect.appendChild(opt);
      });
    }
  }

  const actions = [
    { id: 'look', label: '\u89c2\u5bdf' },
    { id: 'stats', label: '\u72b6\u6001' },
    { id: 'bag', label: '\u80cc\u5305' },
    { id: 'train', label: '\u4fee\u70bc' },
    { id: 'quests', label: '\u4efb\u52a1' },
    { id: 'party', label: '\u961f\u4f0d' },
    { id: 'guild', label: '\u884c\u4f1a' },
    { id: 'sabak status', label: '\u6c99\u5df4\u514b' },
    { id: 'mail list', label: '\u90ae\u4ef6' },
    { id: 'shop', label: '\u5546\u5e97' },
    { id: 'vip activate', label: 'VIP\u6fc0\u6d3b' }
  ];
  if (state.stats && state.stats.vip) {
    const afkLabel = state.stats.autoSkillId ? '\u505c\u6b62\u6302\u673a' : '\u6302\u673a';
    actions.push({ id: 'afk', label: afkLabel });
  }
  renderChips(ui.actions, actions, async (a) => {
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
      } else {
        socket.emit('cmd', { text: 'autoskill all' });
      }
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
  renderCharacters(savedChars);
  show(characterSection);
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
  lastSavedLevel = null;
  show(gameSection);
  log.innerHTML = '';
  if (chat.log) chat.log.innerHTML = '';
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
  });
  socket.on('output', (payload) => {
    appendLine(payload.text);
    parseStats(payload.text);
    if (isChatLine(payload.text)) {
      appendChatLine(payload.text);
    }
    const shopItems = parseShopLine(payload.text);
    if (shopItems) {
      lastShopItems = shopItems;
      showShopModal(shopItems);
    }
    if (payload.text.startsWith('\u4ea4\u6613')) {
      appendChatLine(payload.text);
      setTradeStatus(payload.text);
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
    const name = await promptModal({
      title: '\u961F\u4F0D\u9080\u8BF7',
      text: '\u8BF7\u8F93\u5165\u73A9\u5BB6\u540D',
      placeholder: '\u73A9\u5BB6\u540D'
    });
    if (!name || !socket) return;
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
  chat.partyToggleBtn.addEventListener('click', () => {
    if (!socket) return;
    const inParty = Boolean(lastState && lastState.party && lastState.party.size > 0);
    socket.emit('cmd', { text: inParty ? 'party leave' : 'party create' });
  });
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
if (tradeUi.acceptBtn) {
  tradeUi.acceptBtn.addEventListener('click', async () => {
    const name = await promptModal({
      title: '\u63A5\u53D7\u4EA4\u6613',
      text: '\u8BF7\u8F93\u5165\u5BF9\u65B9\u540D\u5B57',
      placeholder: '\u73A9\u5BB6\u540D'
    });
    if (!name || !socket) return;
    socket.emit('cmd', { text: `trade accept ${name.trim()}` });
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
document.querySelectorAll('.quick-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cmd = btn.getAttribute('data-cmd');
    if (cmd && socket) socket.emit('cmd', { text: cmd });
  });
});
