const loginSection = document.getElementById('login');
const dashboardSection = document.getElementById('dashboard');
const loginMsg = document.getElementById('login-msg');
const usersList = document.getElementById('users-list');
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

// 世界BOSS相关
const wbMsg = document.getElementById('wb-msg');
const wbPlayerBonusList = document.getElementById('wb-player-bonus-list');

// 特殊BOSS相关
const sbMsg = document.getElementById('sb-msg');
const sbPlayerBonusList = document.getElementById('sb-player-bonus-list');

const adminPwModal = document.getElementById('admin-pw-modal');
const adminPwTitle = document.getElementById('admin-pw-title');
const adminPwText = document.getElementById('admin-pw-text');
const adminPwInput = document.getElementById('admin-pw-input');
const adminPwCancel = document.getElementById('admin-pw-cancel');
const adminPwSubmit = document.getElementById('admin-pw-submit');

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

function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'dark' ? '切换亮色' : '切换暗色';
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

function toggleTheme() {
  const current = localStorage.getItem('adminTheme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('adminTheme', next);
  applyTheme(next);
}

function initCollapsibleBlocks() {
  const blocks = Array.from(document.querySelectorAll('.block[data-collapsible]'));
  // 默认折叠所有模块
  blocks.forEach((block) => {
    block.classList.add('collapsed');
  });
  blocks.forEach((block) => {
    const toggle = block.querySelector('.block-toggle');
    if (!toggle) return;
    toggle.textContent = '展开';
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
  const res = await fetch(path, {
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
    await loadWorldBossSettings();
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
    renderPlayerBonusList(data.playerBonusConfig || []);
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

async function respawnWorldBoss() {
  if (!document.getElementById('wb-msg')) return;
  const msg = document.getElementById('wb-msg');
  msg.textContent = '';
  const confirmed = await customConfirm('刷新世界BOSS', '确定要立即刷新所有区服的世界BOSS吗？\n\n这会删除当前的所有世界BOSS并重新生成。');
  if (!confirmed) return;

  try {
    const data = await api('/admin/worldboss-respawn', 'POST', {});
    msg.textContent = data.message || '刷新成功';
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
    const data = await api('/admin/vip/create', 'POST', { count });
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
    await api('/admin/state-throttle-toggle', 'POST', { enabled, intervalSec, overrideServerAllowed });
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
    await api('/admin/state-throttle-toggle', 'POST', { enabled: stateThrottleToggle?.checked === true, intervalSec, overrideServerAllowed });
    stateThrottleMsg.textContent = '节流秒数已保存';
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

    await api('/admin/training-fruit-settings/update', 'POST', { coefficient, dropRate });
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
    document.getElementById('wb-drop-bonus').value = data.dropBonus || '';
    worldBossPlayerBonusConfig = data.playerBonusConfig || [];
    renderWorldBossPlayerBonusList();
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
      dropBonus: document.getElementById('wb-drop-bonus').value,
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

async function respawnWorldBoss() {
  const confirmed = confirm('确定要刷新世界BOSS吗？');
  if (!confirmed) return;

  try {
    await api('/admin/worldboss-respawn', 'POST', {});
    alert('世界BOSS已刷新');
  } catch (err) {
    alert(`刷新失败: ${err.message}`);
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
    document.getElementById('sb-drop-bonus').value = data.dropBonus || '';
    specialBossPlayerBonusConfig = data.playerBonusConfig || [];
    renderSpecialBossPlayerBonusList();
  } catch (err) {
    if (sbMsg) sbMsg.textContent = `加载失败: ${err.message}`;
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
      dropBonus: document.getElementById('sb-drop-bonus').value,
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

if (adminToken) {
  showDashboard();
  refreshUsers();
  refreshVipSelfClaimStatus();
  refreshLootLogStatus();
  refreshStateThrottleStatus();
  refreshConsignExpireStatus();
  refreshRoomVariantStatus();
  refreshRealms();
  listSponsors();
  loadWorldBossSettings();
  loadSpecialBossSettings();
  loadClassBonusConfig();
  loadTrainingFruitSettings();
  loadTrainingSettings();
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
if (document.getElementById('wb-respawn-btn')) {
  document.getElementById('wb-respawn-btn').addEventListener('click', respawnWorldBoss);
}
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

// 修炼果配置事件
if (tfSaveBtn) {
  tfSaveBtn.addEventListener('click', saveTrainingFruitSettings);
}

// 修炼系统配置事件
if (trainingSaveBtn) {
  trainingSaveBtn.addEventListener('click', saveTrainingSettings);
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
      <td style="font-size: 12px;">${getTypeName(item.type)}</td>
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
  if (!res.ok) return;

  itemDropsCache = res.drops;
  renderItemDrops();
}

function renderItemDrops() {
  itemDropsList.innerHTML = '';
  if (itemDropsCache.length === 0) {
    itemDropsList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">暂无掉落配置</td></tr>';
    return;
  }

  itemDropsCache.forEach(drop => {
    const mob = mobsList.find(m => m.id === drop.mob_id);
    const mobName = mob ? mob.name : drop.mob_id;
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

function getTypeName(type) {
  const typeNames = {
    weapon: '武器',
    armor: '胸甲',
    helmet: '头盔',
    boots: '鞋子',
    belt: '腰带',
    necklace: '项链',
    ring: '戒指',
    bracelet: '手镯',
    consumable: '消耗品',
    book: '技能书',
    material: '材料'
  };
  return typeNames[type] || type;
}

function getRarityName(rarity) {
  const rarityNames = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
    supreme: '至尊'
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
    tr.style.opacity = isImported ? '0.5' : '1';

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
        <input type="checkbox" class="import-item-checkbox" data-id="${template.item_id}" ${isImported ? 'disabled' : ''}>
      </td>
      <td style="font-size: 12px;">${template.item_id}</td>
      <td style="font-size: 13px;">${template.name}</td>
      <td style="font-size: 12px;">${getTypeName(template.type)}</td>
      <td style="font-size: 12px;">${getRarityName(template.rarity)}</td>
      <td style="font-size: 12px;">${mainStats.join(', ') || '-'}</td>
      <td style="font-size: 12px;">${template.price || '-'}</td>
      <td style="font-size: 12px;">${isImported ? '<span style="color: #999;">已导入</span>' : '<span style="color: #4CAF50;">可导入</span>'}</td>
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
  const checkboxes = document.querySelectorAll('.import-item-checkbox:checked:not(:disabled)');
  const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.id);

  if (selectedIds.length === 0) {
    await customAlert('提示', '请选择要导入的装备');
    return;
  }

  const confirmed = await customConfirm('确认导入', `确定要导入 ${selectedIds.length} 个装备吗？`);
  if (!confirmed) return;

  const res = await api('/admin/items/import', 'POST', { itemIds: selectedIds });
  if (!res.ok) {
    await customAlert('导入失败', res.error || '导入装备失败');
    return;
  }

  const { results } = res;

  // 计算总掉落数
  const totalDrops = results.success.reduce((sum, item) => sum + (item.dropsCount || 0), 0);

  let message = `成功: ${results.success.length} 个\n跳过: ${results.skipped.length} 个\n失败: ${results.failed.length} 个`;
  if (totalDrops > 0) {
    message += `\n\n共导入 ${totalDrops} 条掉落配置`;
  }

  await customAlert('导入完成', message);

  // 更新已导入的装备ID集合（包括成功导入和跳过的）
  results.success.forEach(item => {
    importedItemIds.add(item.itemId);
  });
  results.skipped.forEach(item => {
    importedItemIds.add(item.itemId);
  });

  renderImportItems();
  loadItems(itemsCurrentPage, itemsCurrentKeyword);
}

function openItemEditModal(item = null) {
  if (item) {
    itemEditTitle.textContent = '编辑装备';
    document.getElementById('item-edit-id').value = item.id;
    document.getElementById('item-edit-item-id').value = item.item_id;
    document.getElementById('item-edit-name').value = item.name;
    document.getElementById('item-edit-type').value = item.type;
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

async function saveItem() {
  const itemId = document.getElementById('item-edit-item-id').value.trim();
  const name = document.getElementById('item-edit-name').value.trim();
  const type = document.getElementById('item-edit-type').value;
  const slot = document.getElementById('item-edit-slot').value;
  const rarity = document.getElementById('item-edit-rarity').value;
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

  if (!itemId || !name) {
    await customAlert('错误', '装备ID和名称不能为空');
    return;
  }

  const data = {
    item_id: itemId,
    name,
    type,
    slot,
    rarity,
    price,
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
    world_boss_only
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

// 装备类型变化时自动清空槽位（技能书、消耗品、材料）
const itemTypeSelect = document.getElementById('item-edit-type');
if (itemTypeSelect) {
  itemTypeSelect.addEventListener('change', () => {
    const slotSelect = document.getElementById('item-edit-slot');
    const type = itemTypeSelect.value;
    if (type === 'book' || type === 'consumable' || type === 'material') {
      slotSelect.value = '';
    }
  });
}

// 导入装备事件
if (itemsImportBtn) {
  itemsImportBtn.addEventListener('click', openImportModal);
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

