const loginSection = document.getElementById('login');
const dashboardSection = document.getElementById('dashboard');
const loginMsg = document.getElementById('login-msg');
const usersList = document.getElementById('users-list');
const charMsg = document.getElementById('char-msg');
const mailMsg = document.getElementById('mail-msg');
const vipCodesResult = document.getElementById('vip-codes-result');
const vipCodesList = document.getElementById('vip-codes-list');
const vipCodesTableContainer = document.getElementById('vip-codes-table-container');
const vipSelfClaimStatus = document.getElementById('vip-self-claim-status');
const vipSelfClaimMsg = document.getElementById('vip-self-claim-msg');
const vipSelfClaimToggle = document.getElementById('vip-self-claim-toggle');
const usersPaginationInfo = document.getElementById('users-pagination-info');
const backupMsg = document.getElementById('backup-msg');
const importFileInput = document.getElementById('import-file');
const themeToggleBtn = document.getElementById('theme-toggle');
const collapseAllBtn = document.getElementById('collapse-all');
const lootLogStatus = document.getElementById('loot-log-status');
const lootLogMsg = document.getElementById('loot-log-msg');
const lootLogToggle = document.getElementById('loot-log-toggle');
const stateThrottleToggle = document.getElementById('state-throttle-toggle');
const stateThrottleOverrideAllowedToggle = document.getElementById('state-throttle-override-allowed');
const stateThrottleIntervalInput = document.getElementById('state-throttle-interval');
const stateThrottleSaveBtn = document.getElementById('state-throttle-save');
const stateThrottleStatus = document.getElementById('state-throttle-status');
const stateThrottleMsg = document.getElementById('state-throttle-msg');
const consignExpireStatus = document.getElementById('consign-expire-status');
const consignExpireMsg = document.getElementById('consign-expire-msg');
const consignExpireInput = document.getElementById('consign-expire-hours');
const consignExpireSaveBtn = document.getElementById('consign-expire-save');
const roomVariantStatus = document.getElementById('room-variant-status');
const roomVariantMsg = document.getElementById('room-variant-msg');
const roomVariantInput = document.getElementById('room-variant-count');
const roomVariantSaveBtn = document.getElementById('room-variant-save');
const realmCountStatus = document.getElementById('realm-count-status');
const realmCountMsg = document.getElementById('realm-count-msg');
const realmCountInput = document.getElementById('realm-count-input');
const realmCountSaveBtn = document.getElementById('realm-count-save');
const usersSearchInput = document.getElementById('users-search');
const usersSearchBtn = document.getElementById('users-search-btn');
const adminPwModal = document.getElementById('admin-pw-modal');
const adminPwTitle = document.getElementById('admin-pw-title');
const adminPwText = document.getElementById('admin-pw-text');
const adminPwInput = document.getElementById('admin-pw-input');
const adminPwCancel = document.getElementById('admin-pw-cancel');
const adminPwSubmit = document.getElementById('admin-pw-submit');

let pendingPwUser = null;

let adminToken = localStorage.getItem('adminToken');
let currentUsersPage = 1;
let totalUsersPages = 1;
let currentUsersSearch = '';

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
}

function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'dark' ? '切换亮色' : '切换暗色';
  }
}

function toggleTheme() {
  const current = localStorage.getItem('adminTheme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('adminTheme', next);
  applyTheme(next);
}

function initCollapsibleBlocks() {
  const blocks = Array.from(document.querySelectorAll('.block[data-collapsible]'));
  blocks.forEach((block) => {
    const toggle = block.querySelector('.block-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      block.classList.toggle('collapsed');
      toggle.textContent = block.classList.contains('collapsed') ? '展开' : '折叠';
    });
  });
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      const shouldCollapse = !collapseAllBtn.classList.contains('active');
      collapseAllBtn.classList.toggle('active', shouldCollapse);
      collapseAllBtn.textContent = shouldCollapse ? '展开全部' : '折叠全部';
      blocks.forEach((block) => {
        const toggle = block.querySelector('.block-toggle');
        if (!toggle) return;
        block.classList.toggle('collapsed', shouldCollapse);
        toggle.textContent = shouldCollapse ? '展开' : '折叠';
      });
    });
  }
}

async function api(path, method, body) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken ? `Bearer ${adminToken}` : ''
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
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
    await refreshUsers();
    await refreshVipSelfClaimStatus();
    await refreshLootLogStatus();
    await refreshStateThrottleStatus();
    await refreshConsignExpireStatus();
    await refreshRoomVariantStatus();
    await refreshRealmCountStatus();
  } catch (err) {
    loginMsg.textContent = err.message;
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
        if (!confirm(`确认对用户 "${u.username}" 执行 ${actionLabel} 吗？`)) return;
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

async function quickToggleGM(username, isAdmin) {
  try {
    await api('/admin/users/promote', 'POST', { username, isAdmin });
    await refreshUsers(currentUsersPage);
  } catch (err) {
    alert(`操作失败: ${err.message}`);
  }
}

async function deleteUserAccount(userId, username) {
  if (!confirm(`确定要删除用户 "${username}" 吗？\n\n此操作将删除该用户的所有数据（角色、邮件、行会等），且无法恢复！`)) {
    return;
  }
  
  if (!confirm(`再次确认：真的要删除用户 "${username}" 吗？`)) {
    return;
  }
  
  try {
    await api('/admin/users/delete', 'POST', { userId });
    alert('用户已删除');
    await refreshUsers(currentUsersPage);
  } catch (err) {
    alert(`删除失败: ${err.message}`);
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

async function createVipCodes() {
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
    renderPlayerBonusList(data.playerBonusConfig || []);
    msg.textContent = '加载成功';
    msg.style.color = 'green';
  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = 'red';
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
      dropBonus: Number(document.getElementById('wb-drop-bonus').value),
      playerBonusConfig
    });
    msg.textContent = '保存成功';
    msg.style.color = 'green';
  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = 'red';
  }
}

function addPlayerBonusConfig() {
  const tbody = document.getElementById('wb-player-bonus-list');
  const currentConfigs = getPlayerBonusConfigFromUI();
  currentConfigs.push({ min: 1, hp: 0, atk: 0, def: 0, mdef: 0 });
  renderPlayerBonusList(currentConfigs);
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

async function sendMail() {
  mailMsg.textContent = '';
  try {
    await api('/admin/mail/send', 'POST', {
      username: document.getElementById('mail-username').value.trim(),
      title: document.getElementById('mail-title').value.trim(),
      body: document.getElementById('mail-body').value.trim()
    });
    mailMsg.textContent = '邮件已发送。';
  } catch (err) {
    mailMsg.textContent = err.message;
  }
}

async function createVipCodes() {
  vipCodesResult.textContent = '';
  vipCodesTableContainer.style.display = 'none';
  try {
    const count = Number(document.getElementById('vip-count').value || 1);
    const data = await api('/admin/vip/create', 'POST', { count });
    vipCodesResult.textContent = `成功生成 ${data.codes.length} 个激活码:\n\n` + data.codes.join('\n');
  } catch (err) {
    vipCodesResult.textContent = err.message;
  }
}

async function listVipCodes() {
  vipCodesResult.textContent = '';
  vipCodesList.innerHTML = '';
  vipCodesTableContainer.style.display = 'none';
  
  try {
    const data = await api('/admin/vip/list', 'GET');
    if (!data.codes || data.codes.length === 0) {
      vipCodesResult.textContent = '暂无激活码';
      return;
    }
    
    vipCodesTableContainer.style.display = 'block';
    data.codes.forEach((c) => {
      const tr = document.createElement('tr');
      
      // 激活码
      const tdCode = document.createElement('td');
      tdCode.textContent = c.code;
      tdCode.style.fontFamily = 'monospace';
      tr.appendChild(tdCode);
      
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

async function refreshLootLogStatus() {
  if (!lootLogStatus) return;
  try {
    const data = await api('/admin/loot-log-status', 'GET');
    lootLogStatus.textContent = data.enabled ? '已开启' : '已关闭';
    lootLogStatus.style.color = data.enabled ? 'green' : 'red';
    if (lootLogToggle) lootLogToggle.checked = data.enabled === true;
  } catch (err) {
    lootLogStatus.textContent = '加载失败';
  }
}

async function toggleLootLog(enabled) {
  if (!lootLogMsg) return;
  lootLogMsg.textContent = '';
  try {
    await api('/admin/loot-log-toggle', 'POST', { enabled });
    lootLogMsg.textContent = enabled ? '掉落日志已开启' : '掉落日志已关闭';
    await refreshLootLogStatus();
  } catch (err) {
    lootLogMsg.textContent = err.message;
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
  } catch (err) {
    stateThrottleStatus.textContent = '加载失败';
  }
}

async function refreshConsignExpireStatus() {
  if (!consignExpireStatus) return;
  try {
    const data = await api('/admin/consign-expire-status', 'GET');
    const hours = Number(data.hours ?? 48);
    if (hours <= 0) {
      consignExpireStatus.textContent = '已关闭';
      consignExpireStatus.style.color = 'red';
    } else {
      consignExpireStatus.textContent = `已开启(${hours}小时)`;
      consignExpireStatus.style.color = 'green';
    }
    if (consignExpireInput) consignExpireInput.value = String(hours);
  } catch (err) {
    consignExpireStatus.textContent = '加载失败';
  }
}

async function saveConsignExpireHours() {
  if (!consignExpireMsg) return;
  consignExpireMsg.textContent = '';
  try {
    const hours = consignExpireInput ? Number(consignExpireInput.value || 48) : 48;
    if (!Number.isFinite(hours) || hours < 0) {
      throw new Error('请输入有效小时数');
    }
    await api('/admin/consign-expire-update', 'POST', { hours });
    consignExpireMsg.textContent = '寄售到期已保存';
    await refreshConsignExpireStatus();
  } catch (err) {
    consignExpireMsg.textContent = err.message;
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

async function refreshRealmCountStatus() {
  if (!realmCountStatus) return;
  try {
    const data = await api('/admin/realm-count-status', 'GET');
    const count = Number(data.count || 1);
    realmCountStatus.textContent = `已设置(${count})`;
    realmCountStatus.style.color = 'green';
    if (realmCountInput) realmCountInput.value = String(count);
  } catch (err) {
    realmCountStatus.textContent = '加载失败';
  }
}

async function saveRealmCount() {
  if (!realmCountMsg) return;
  realmCountMsg.textContent = '';
  try {
    const count = realmCountInput ? Number(realmCountInput.value || 1) : 1;
    if (!Number.isFinite(count) || count < 1) {
      throw new Error('请输入有效数量');
    }
    await api('/admin/realm-count-update', 'POST', { count });
    realmCountMsg.textContent = '新区数量已保存';
    await refreshRealmCountStatus();
  } catch (err) {
    realmCountMsg.textContent = err.message;
  }
}

async function toggleStateThrottle(enabled) {
  if (!stateThrottleMsg) return;
  stateThrottleMsg.textContent = '';
  try {
    const intervalSec = stateThrottleIntervalInput ? Number(stateThrottleIntervalInput.value || 10) : undefined;
    const overrideServerAllowed = stateThrottleOverrideAllowedToggle ? stateThrottleOverrideAllowedToggle.checked : undefined;
    await api('/admin/state-throttle-toggle', 'POST', { enabled, intervalSec, overrideServerAllowed });
    stateThrottleMsg.textContent = enabled ? '状态刷新节流已开启' : '状态刷新节流已关闭';
    await refreshStateThrottleStatus();
  } catch (err) {
    stateThrottleMsg.textContent = err.message;
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
    await api('/admin/state-throttle-toggle', 'POST', { enabled: stateThrottleToggle?.checked === true, intervalSec, overrideServerAllowed });
    stateThrottleMsg.textContent = '节流秒数已保存';
    await refreshStateThrottleStatus();
  } catch (err) {
    stateThrottleMsg.textContent = err.message;
  }
}

async function downloadBackup() {
  backupMsg.textContent = '';
  try {
    const res = await fetch('/admin/backup', {
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

async function importBackup() {
  backupMsg.textContent = '';
  const file = importFileInput?.files?.[0];
  if (!file) {
    backupMsg.textContent = '请选择备份文件。';
    return;
  }
  if (!confirm('导入会覆盖当前全部数据，确定继续吗？')) return;
  if (!confirm('再次确认：导入后无法恢复，是否继续？')) return;
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

// 区服管理相关
const realmsList = document.getElementById('realms-list');
const realmsMsg = document.getElementById('realms-msg');
const realmNameInput = document.getElementById('realm-name-input');
const mergeSourceSelect = document.getElementById('merge-source-realm');
const mergeTargetSelect = document.getElementById('merge-target-realm');
const mergeMsg = document.getElementById('merge-msg');

async function refreshRealms() {
  if (!realmsList) return;
  try {
    const data = await api('/admin/realms', 'GET');
    const realms = data.realms || [];
    
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
    
    // 更新合区下拉框
    updateMergeSelects(realms);
  } catch (err) {
    realmsList.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #dc3545;">${err.message}</td></tr>`;
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

async function createRealm() {
  if (!realmNameInput || !realmsMsg) return;
  const name = realmNameInput.value.trim();
  if (!name) {
    realmsMsg.textContent = '请输入区服名称';
    return;
  }
  
  if (!confirm(`确定要创建新区 "${name}" 吗？`)) return;
  
  try {
    await api('/admin/realms/create', 'POST', { name });
    realmsMsg.textContent = '新区创建成功';
    realmNameInput.value = '';
    await refreshRealms();
  } catch (err) {
    realmsMsg.textContent = err.message;
  }
}

async function editRealmName(realmId, currentName) {
  const newName = prompt(`修改区名 (当前: ${currentName}):`, currentName);
  if (!newName || newName.trim() === currentName) return;
  
  try {
    await api('/admin/realms/update', 'POST', { realmId, name: newName.trim() });
    alert('区名修改成功');
    await refreshRealms();
  } catch (err) {
    alert(`修改失败: ${err.message}`);
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

  if (!confirm(`⚠️ 警告：合区操作将强制下线所有玩家！\n\n源区: ${sourceText}\n目标区: ${targetText}\n\n系统会自动创建合区前的完整备份，请稍候...`)) {
    return;
  }

  if (!confirm(`⚠️ 最终确认：合区后源区将被删除，所有数据（角色、行会、邮件、寄售）将合并到目标区，目标区沙巴克状态将重置为无人占领！\n\n确定要执行合区吗？`)) {
    return;
  }

  try {
    mergeMsg.textContent = '正在创建备份并执行合区，请稍候...';

    const res = await fetch('/admin/realms/merge', {
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

async function fixRealmId() {
  if (!realmsMsg) return;
  if (!confirm('确定要修复旧数据吗？\n\n此操作将所有realm_id为null或0的记录设置为1。\n通常用于升级后修复历史数据。')) {
    return;
  }

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

if (adminToken) {
  showDashboard();
  refreshUsers();
  refreshVipSelfClaimStatus();
  refreshLootLogStatus();
  refreshStateThrottleStatus();
  refreshConsignExpireStatus();
  refreshRoomVariantStatus();
  refreshRealms();
}

applyTheme(localStorage.getItem('adminTheme') || 'light');
initCollapsibleBlocks();

document.getElementById('admin-login-btn').addEventListener('click', login);
document.getElementById('refresh-users').addEventListener('click', () => refreshUsers(currentUsersPage));
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
document.getElementById('users-next-page').addEventListener('click', () => {
  if (currentUsersPage < totalUsersPages) {
    refreshUsers(currentUsersPage + 1);
  }
});
document.getElementById('wb-load-btn').addEventListener('click', loadWorldBossSettings);
document.getElementById('wb-save-btn').addEventListener('click', saveWorldBossSettings);
if (document.getElementById('wb-add-bonus-btn')) {
  document.getElementById('wb-add-bonus-btn').addEventListener('click', addPlayerBonusConfig);
}
document.getElementById('vip-create-btn').addEventListener('click', createVipCodes);
document.getElementById('vip-list-btn').addEventListener('click', listVipCodes);
if (vipSelfClaimToggle) {
  vipSelfClaimToggle.addEventListener('change', () => toggleVipSelfClaim(vipSelfClaimToggle.checked));
}
if (lootLogToggle) {
  lootLogToggle.addEventListener('change', () => toggleLootLog(lootLogToggle.checked));
}
if (stateThrottleToggle) {
  stateThrottleToggle.addEventListener('change', () => toggleStateThrottle(stateThrottleToggle.checked));
}
if (stateThrottleOverrideAllowedToggle) {
  stateThrottleOverrideAllowedToggle.addEventListener('change', () => {
    toggleStateThrottle(stateThrottleToggle?.checked === true);
  });
}
if (stateThrottleSaveBtn) {
  stateThrottleSaveBtn.addEventListener('click', saveStateThrottleInterval);
}
if (consignExpireSaveBtn) {
  consignExpireSaveBtn.addEventListener('click', saveConsignExpireHours);
}
if (roomVariantSaveBtn) {
  roomVariantSaveBtn.addEventListener('click', saveRoomVariantCount);
}
document.getElementById('backup-download').addEventListener('click', downloadBackup);
document.getElementById('import-btn').addEventListener('click', importBackup);
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

// 区服管理事件
if (document.getElementById('realm-create-btn')) {
  document.getElementById('realm-create-btn').addEventListener('click', createRealm);
}
if (document.getElementById('realm-refresh-btn')) {
  document.getElementById('realm-refresh-btn').addEventListener('click', refreshRealms);
}
if (document.getElementById('fix-realm-btn')) {
  document.getElementById('fix-realm-btn').addEventListener('click', fixRealmId);
}
if (document.getElementById('merge-realms-btn')) {
  document.getElementById('merge-realms-btn').addEventListener('click', mergeRealms);
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
      alert('密码至少4位');
      return;
    }
    try {
      await api('/admin/users/password', 'POST', {
        username: pendingPwUser,
        password
      });
      alert('密码已更新，已清理登录状态。');
      pendingPwUser = null;
      adminPwModal.classList.add('hidden');
    } catch (err) {
      alert(`修改失败: ${err.message}`);
    }
  });
}
