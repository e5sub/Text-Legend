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
  gold: document.getElementById('ui-gold'),
  hp: document.getElementById('bar-hp'),
  mp: document.getElementById('bar-mp'),
  exp: document.getElementById('bar-exp'),
  exits: document.getElementById('exits-list'),
  mobs: document.getElementById('mobs-list'),
  skills: document.getElementById('skills-list'),
  items: document.getElementById('items-list'),
  actions: document.getElementById('actions-list'),
  target: document.getElementById('target-label')
};
const chat = {
  log: document.getElementById('chat-log'),
  input: document.getElementById('chat-input'),
  sendBtn: document.getElementById('chat-send'),
  partyInviteBtn: document.getElementById('chat-party-invite'),
  guildInviteBtn: document.getElementById('chat-guild-invite'),
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
  status: document.getElementById('trade-status')
};

const authSection = document.getElementById('auth');
const characterSection = document.getElementById('character');
const gameSection = document.getElementById('game');
const log = document.getElementById('log');

const authMsg = document.getElementById('auth-msg');
const authToast = document.getElementById('auth-toast');
const charMsg = document.getElementById('char-msg');
const characterList = document.getElementById('character-list');
const loginUserInput = document.getElementById('login-username');

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

function renderChips(container, items, onClick, activeId) {
  container.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('div');
    btn.className = `chip${activeId && activeId === item.id ? ' active' : ''}`;
    btn.textContent = item.label;
    btn.addEventListener('click', () => onClick(item));
    container.appendChild(btn);
  });
}

function renderState(state) {
  lastState = state;
  if (state.player) {
    ui.name.textContent = state.player.name || '-';
    const classLabel = classNames[state.player.classId] || state.player.classId || '-';
    ui.classLevel.textContent = `${classLabel} | Lv ${state.player.level}`;
  }
  if (state.stats) {
    setBar(ui.hp, state.stats.hp, state.stats.max_hp);
    setBar(ui.mp, state.stats.mp, state.stats.max_mp);
    setBar(ui.exp, state.stats.exp, state.stats.exp_next);
    ui.gold.textContent = state.stats.gold;
    ui.pk.textContent = `${state.stats.pk} (${state.stats.pk >= 100 ? '红名' : '正常'})`;
    ui.vip.textContent = state.stats.vip ? '是' : '否';
    ui.guild.textContent = state.guild || '无';
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
  const items = Object.values(itemTotals).map((i) => ({ id: i.id, label: `${i.name} x${i.qty}`, raw: i }));
  renderChips(ui.items, items, (i) => {
    if (i.raw.type === 'consumable') {
      socket.emit('cmd', { text: `use ${i.raw.id}` });
    } else if (i.raw.slot) {
      socket.emit('cmd', { text: `equip ${i.raw.id}` });
    }
  });
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
    { id: 'quests', label: '\u4efb\u52a1' },
    { id: 'party', label: '\u961f\u4f0d' },
    { id: 'guild', label: '\u884c\u4f1a' },
    { id: 'sabak status', label: '\u6c99\u5df4\u514b' },
    { id: 'mail list', label: '\u90ae\u4ef6' },
    { id: 'shop', label: '\u5546\u5e97' },
    { id: 'vip activate', label: 'VIP\u6fc0\u6d3b' }
  ];
  if (state.stats && state.stats.vip) {
    actions.push({ id: 'afk', label: '\u6302\u673a' });
  }
  renderChips(ui.actions, actions, (a) => {
    if (a.id === 'vip activate') {
      const code = window.prompt('\u8f93\u5165VIP\u6fc0\u6d3b\u7801');
      if (!code) return;
      socket.emit('cmd', { text: `vip activate ${code.trim()}` });
      return;
    }
    if (a.id === 'afk') {
      const skillList = (state.skills || []).map((s) => `${s.name}(${s.id})`).join(', ');
      const skillInput = window.prompt(`\u8f93\u5165\u81ea\u52a8\u6280\u80fd(\u8f93\u5165all\u5168\u90e8\u6280\u80fd, off\u5173\u95ed)\n\u53ef\u9009: ${skillList}`);
      if (skillInput === null) return;
      const skillValue = skillInput.trim();
      if (skillValue) {
        if (skillValue.toLowerCase() === 'off') {
          socket.emit('cmd', { text: 'autoskill off' });
        } else {
          socket.emit('cmd', { text: `autoskill ${skillValue}` });
        }
      }
      const potionInput = window.prompt('\u81ea\u52a8\u559d\u836f\u9608\u503c: \u8f93\u5165 "HP MP" (5-95) \u6216 off \u5173\u95ed');
      if (potionInput === null) return;
      const potionValue = potionInput.trim();
      if (potionValue) {
        if (potionValue.toLowerCase() === 'off') {
          socket.emit('cmd', { text: 'autopotion off' });
        } else {
          socket.emit('cmd', { text: `autopotion ${potionValue}` });
        }
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
    renderCharacters(loginData.characters || []);
    charMsg.textContent = '角色已创建。';
  } catch (err) {
    charMsg.textContent = err.message;
  }
}

function enterGame(name) {
  activeChar = name;
  show(gameSection);
  log.innerHTML = '';
  if (chat.log) chat.log.innerHTML = '';
  setTradeStatus('\u672a\u5728\u4ea4\u6613\u4e2d');
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
  chat.partyInviteBtn.addEventListener('click', () => {
    const name = window.prompt('\u8F93\u5165\u8981\u9080\u8BF7\u7684\u73A9\u5BB6\u540D');
    if (!name || !socket) return;
    socket.emit('cmd', { text: `party invite ${name.trim()}` });
  });
}
if (chat.guildInviteBtn) {
  chat.guildInviteBtn.addEventListener('click', () => {
    const name = window.prompt('\u8F93\u5165\u8981\u9080\u8BF7\u7684\u73A9\u5BB6\u540D');
    if (!name || !socket) return;
    socket.emit('cmd', { text: `guild invite ${name.trim()}` });
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
  tradeUi.requestBtn.addEventListener('click', () => {
    const name = window.prompt('\u8bf7\u8f93\u5165\u4ea4\u6613\u5bf9\u8c61');
    if (!name || !socket) return;
    socket.emit('cmd', { text: `trade request ${name.trim()}` });
    setTradeStatus('\u4ea4\u6613\u8bf7\u6c42\u5df2\u53d1\u9001');
  });
}
if (tradeUi.acceptBtn) {
  tradeUi.acceptBtn.addEventListener('click', () => {
    const name = window.prompt('\u8bf7\u8f93\u5165\u5bf9\u65b9\u540d\u5b57');
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
document.querySelectorAll('.quick-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cmd = btn.getAttribute('data-cmd');
    if (cmd && socket) socket.emit('cmd', { text: cmd });
  });
});
