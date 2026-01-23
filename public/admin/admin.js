const loginSection = document.getElementById('login');
const dashboardSection = document.getElementById('dashboard');
const loginMsg = document.getElementById('login-msg');
const usersList = document.getElementById('users-list');
const promoteMsg = document.getElementById('promote-msg');
const charMsg = document.getElementById('char-msg');
const mailMsg = document.getElementById('mail-msg');
const vipCodesResult = document.getElementById('vip-codes-result');
const vipCodesList = document.getElementById('vip-codes-list');
const vipCodesTableContainer = document.getElementById('vip-codes-table-container');
const vipSelfClaimStatus = document.getElementById('vip-self-claim-status');
const vipSelfClaimMsg = document.getElementById('vip-self-claim-msg');
const usersPaginationInfo = document.getElementById('users-pagination-info');

let adminToken = localStorage.getItem('adminToken');
let currentUsersPage = 1;
let totalUsersPages = 1;

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
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
  } catch (err) {
    loginMsg.textContent = err.message;
  }
}

async function refreshUsers(page = 1) {
  try {
    const data = await api(`/admin/users?page=${page}&limit=10`, 'GET');
    currentUsersPage = data.page;
    totalUsersPages = data.totalPages;
    
    usersList.innerHTML = '';
    if (!data.users || data.users.length === 0) {
      usersList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">暂无用户</td></tr>';
      usersPaginationInfo.textContent = '';
      return;
    }
    
    usersPaginationInfo.textContent = `第 ${data.page} / ${data.totalPages} 页 (共 ${data.total} 个用户)`;
    
    data.users.forEach((u) => {
      const tr = document.createElement('tr');
      
      // 用户名
      const tdName = document.createElement('td');
      tdName.textContent = u.username;
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

async function promoteUser() {
  promoteMsg.textContent = '';
  try {
    await api('/admin/users/promote', 'POST', {
      username: document.getElementById('promote-username').value.trim(),
      isAdmin: document.getElementById('promote-flag').value === 'true'
    });
    promoteMsg.textContent = '已更新 GM 权限。';
    await refreshUsers(currentUsersPage);
  } catch (err) {
    promoteMsg.textContent = err.message;
  }
}

async function updateCharacter() {
  charMsg.textContent = '';
  try {
    const patch = JSON.parse(document.getElementById('char-patch').value || '{}');
    await api('/admin/characters/update', 'POST', {
      username: document.getElementById('char-username').value.trim(),
      name: document.getElementById('char-name').value.trim(),
      patch
    });
    charMsg.textContent = '角色已更新。';
  } catch (err) {
    charMsg.textContent = err.message;
  }
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

if (adminToken) {
  showDashboard();
  refreshUsers();
  refreshVipSelfClaimStatus();
}

document.getElementById('admin-login-btn').addEventListener('click', login);
document.getElementById('refresh-users').addEventListener('click', () => refreshUsers(currentUsersPage));
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
document.getElementById('promote-btn').addEventListener('click', promoteUser);
document.getElementById('char-update-btn').addEventListener('click', updateCharacter);
document.getElementById('mail-send-btn').addEventListener('click', sendMail);
document.getElementById('vip-create-btn').addEventListener('click', createVipCodes);
document.getElementById('vip-list-btn').addEventListener('click', listVipCodes);
document.getElementById('vip-self-claim-on').addEventListener('click', () => toggleVipSelfClaim(true));
document.getElementById('vip-self-claim-off').addEventListener('click', () => toggleVipSelfClaim(false));
