'use strict';

// ---------- 工具 ----------
const $ = (id) => document.getElementById(id);
const toastBox = $('toast');
let toastTimer = null;
function toast(msg, type = '') {
  toastBox.textContent = msg;
  toastBox.className = 'toast' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.add('hidden'), 2600);
}

function setError(inputEl, errorEl, msg) {
  errorEl.textContent = msg || '';
  if (inputEl) inputEl.classList.toggle('invalid', !!msg);
}

// ---------- 本地存储（替代后端数据库） ----------
const LS = {
  users: 'panda_users',
  sessions: 'panda_sessions', // { token: email }
  token: 'panda_token',
  user: 'panda_user',
};

function loadUsers() {
  try {
    const d = JSON.parse(localStorage.getItem(LS.users) || '{"users":[]}');
    return Array.isArray(d.users) ? d.users : [];
  } catch (e) { return []; }
}
function saveUsers(users) {
  localStorage.setItem(LS.users, JSON.stringify({ users }));
}
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(LS.sessions) || '{}'); }
  catch (e) { return {}; }
}
function saveSessions(s) {
  localStorage.setItem(LS.sessions, JSON.stringify(s));
}
function getToken() { return localStorage.getItem(LS.token); }
function setToken(t) { t ? localStorage.setItem(LS.token, t) : localStorage.removeItem(LS.token); }
function getStoredUser() { try { return JSON.parse(localStorage.getItem(LS.user) || 'null'); } catch (e) { return null; } }
function setStoredUser(u) { u ? localStorage.setItem(LS.user, JSON.stringify(u)) : localStorage.removeItem(LS.user); }

function newToken() {
  return (crypto.randomUUID ? crypto.randomUUID() : 't' + Date.now() + Math.random().toString(16).slice(2));
}
function onlineEmails() {
  const s = loadSessions();
  return new Set(Object.values(s));
}

// 注册时获取公网 IP（失败则记本机）
async function getClientIP() {
  try {
    const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const j = await r.json();
    return j.ip || '本机/未知';
  } catch (e) { return '本机/未知'; }
}

// ---------- Tab 切换 ----------
const tabLogin = $('tab-login');
const tabRegister = $('tab-register');
const indicator = $('tab-indicator');
const loginForm = $('login-form');
const registerForm = $('register-form');

function showLogin() {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  indicator.classList.remove('right');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
}
function showRegister() {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  indicator.classList.add('right');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
}
tabLogin.addEventListener('click', showLogin);
tabRegister.addEventListener('click', showRegister);
$('go-register').addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
$('go-login').addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

// ---------- 显示/隐藏密码 ----------
document.querySelectorAll('.toggle-pw').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = $(btn.dataset.target);
    const show = target.type === 'password';
    target.type = show ? 'text' : 'password';
    btn.textContent = show ? '隐藏' : '显示';
  });
});

// ---------- 登录模式切换（邮箱/用户名） ----------
const loginModeRadios = document.querySelectorAll('input[name="loginMode"]');
const loginAccountLabel = $('login-account-label');
const loginAccount = $('login-account');
loginModeRadios.forEach((r) => {
  r.addEventListener('change', () => {
    if (r.value === 'username') {
      loginAccountLabel.textContent = '用户名';
      loginAccount.placeholder = '请输入用户名';
    } else {
      loginAccountLabel.textContent = '邮箱';
      loginAccount.placeholder = '请输入邮箱';
    }
    setError(loginAccount, $('login-account-error'), '');
  });
});

// ---------- 注册校验 ----------
function validateRegister() {
  let ok = true;
  const email = $('reg-email').value.trim();
  const username = $('reg-username').value.trim();
  const password = $('reg-password').value;
  const confirm = $('reg-confirm').value;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  setError($('reg-email'), $('reg-email-error'), emailOk ? '' : '请输入有效的邮箱地址');
  if (!emailOk) ok = false;

  const usernameOk = /^[A-Za-z0-9_\u4e00-\u9fa5]{3,16}$/.test(username);
  setError($('reg-username'), $('reg-username-error'), usernameOk ? '' : '用户名需为3-16位字母/数字/下划线/中文');
  if (!usernameOk) ok = false;

  const pwOk = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  setError($('reg-password'), $('reg-password-error'), pwOk ? '' : '密码至少8位且同时包含字母和数字');
  if (!pwOk) ok = false;

  if (confirm !== password) {
    setError($('reg-confirm'), $('reg-confirm-error'), '两次输入的密码不一致');
    ok = false;
  } else {
    setError($('reg-confirm'), $('reg-confirm-error'), '');
  }
  return ok;
}

// ---------- 登录校验 ----------
function validateLogin() {
  let ok = true;
  const mode = document.querySelector('input[name="loginMode"]:checked').value;
  const account = loginAccount.value.trim();
  if (!account) {
    setError(loginAccount, $('login-account-error'), mode === 'username' ? '请输入用户名' : '请输入邮箱');
    ok = false;
  } else if (mode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
    setError(loginAccount, $('login-account-error'), '邮箱格式不正确');
    ok = false;
  } else {
    setError(loginAccount, $('login-account-error'), '');
  }
  if (!loginAccount.value || !$('login-password').value) {
    setError($('login-password'), $('login-password-error'), $('login-password').value ? '' : '请输入密码');
    if (!$('login-password').value) ok = false;
  } else {
    setError($('login-password'), $('login-password-error'), '');
  }
  return ok;
}

// ---------- 业务：注册 / 登录 / 登出 / 会话 ----------
async function doRegister(body) {
  const users = loadUsers();
  if (users.some((u) => u.email === body.email)) return { ok: false, message: '该邮箱已被注册' };
  if (users.some((u) => u.username === body.username)) return { ok: false, message: '该用户名已被占用' };
  const isAdmin = users.length === 0; // 首个注册用户为管理员
  const user = {
    email: body.email,
    username: body.username,
    pwd: body.password, // 明文存储，仅用于管理员面板展示（演示用途）
    ip: await getClientIP(),
    isAdmin,
    banned: false,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  const token = newToken();
  const sessions = loadSessions();
  sessions[token] = user.email;
  saveSessions(sessions);
  return { ok: true, message: '注册成功', token, user: publicUser(user) };
}

function doLogin(body) {
  const users = loadUsers();
  const user = users.find((u) => u[body.mode] === body.account);
  if (!user) return { ok: false, message: '账号不存在' };
  if (user.banned) return { ok: false, message: '账号已被封禁！' };
  if (user.pwd !== body.password) return { ok: false, message: '密码错误' };
  const token = newToken();
  const sessions = loadSessions();
  sessions[token] = user.email;
  saveSessions(sessions);
  return { ok: true, message: '登录成功', token, user: publicUser(user) };
}

function doLogoutApi() {
  const token = getToken();
  if (token) {
    const sessions = loadSessions();
    delete sessions[token];
    saveSessions(sessions);
  }
  setToken(null);
  setStoredUser(null);
}

// 当前登录态（用于轮询检测被封禁）
function doMe() {
  const token = getToken();
  const sessions = loadSessions();
  const email = sessions[token];
  if (!email) return { ok: false };
  const user = loadUsers().find((u) => u.email === email);
  if (!user) return { ok: false };
  if (user.banned) { delete sessions[token]; saveSessions(sessions); return { ok: false, banned: true }; }
  return { ok: true, user: publicUser(user) };
}

function doAdminList() {
  const u = getStoredUser();
  if (!u || !u.isAdmin) return { ok: false, message: '无权限' };
  const online = onlineEmails();
  const list = loadUsers().map((x) => ({
    email: x.email,
    username: x.username,
    password: x.pwd || '（未记录明文）',
    online: online.has(x.email),
    ip: x.ip || '未知',
    banned: !!x.banned,
    isAdmin: !!x.isAdmin,
    createdAt: x.createdAt,
  }));
  return { ok: true, list };
}

function doBan(target, action) {
  const u = getStoredUser();
  if (!u || !u.isAdmin) return { ok: false, message: '无权限' };
  const users = loadUsers();
  const user = users.find((x) => x.email === target || x.username === target);
  if (!user) return { ok: false, message: '用户不存在' };
  if (user.isAdmin) return { ok: false, message: '不能封禁管理员账号' };
  user.banned = action === 'ban';
  if (action === 'ban') {
    const sessions = loadSessions();
    for (const t of Object.keys(sessions)) if (sessions[t] === user.email) delete sessions[t];
    saveSessions(sessions);
  }
  saveUsers(users);
  return { ok: true, message: action === 'ban' ? '已封禁' : '已解封' };
}

function publicUser(u) {
  return { email: u.email, username: u.username, isAdmin: !!u.isAdmin };
}

// ---------- 成功页 / 打字机 ----------
let meTimer = null;
function startPolling() {
  stopPolling();
  meTimer = setInterval(() => {
    if ($('success-panel').classList.contains('hidden')) return;
    const r = doMe();
    if (!r.ok) {
      if (r.banned) toast('账号已被封禁！', 'error');
      else toast('登录已失效，请重新登录', 'error');
      doLogout();
    }
  }, 5000);
}
function stopPolling() { if (meTimer) { clearInterval(meTimer); meTimer = null; } }

function showSuccess(username) {
  $('auth-panel').classList.add('hidden');
  $('admin-panel').classList.add('hidden');
  $('success-panel').classList.remove('hidden');
  const u = getStoredUser();
  $('admin-btn').classList.toggle('hidden', !(u && u.isAdmin));
  $('welcome-user').textContent = username ? `欢迎你，${username}` : '';
  const text = '加入成功！';
  const out = $('type-text');
  out.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    out.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(timer);
  }, 180);
  startPolling();
}

function doLogout() {
  doLogoutApi();
  stopPolling();
  $('success-panel').classList.add('hidden');
  $('admin-panel').classList.add('hidden');
  $('auth-panel').classList.remove('hidden');
  loginForm.reset();
  setError(loginAccount, $('login-account-error'), '');
  setError($('login-password'), $('login-password-error'), '');
}

$('logout-btn').addEventListener('click', doLogout);

// ---------- 管理员面板 ----------
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderUsers() {
  const box = $('user-list');
  box.innerHTML = '<p style="color:#fff;grid-column:1/-1;">加载中…</p>';
  const r = doAdminList();
  if (!r.ok) { toast(r.message || '无权访问', 'error'); return; }
  box.innerHTML = '';
  r.list.forEach((u) => {
    const card = document.createElement('div');
    card.className = 'user-card' + (u.banned ? ' banned' : '');
    const statusHtml = u.online
      ? '<span class="status-dot on"></span>在线'
      : '<span class="status-dot off"></span>离线';
    const tag = u.isAdmin
      ? '<span class="badge-admin">管理员</span>'
      : (u.banned ? '<span class="badge-banned">已封禁</span>' : '');
    const banBtn = u.isAdmin ? '' :
      `<button class="ban-btn ${u.banned ? 'unban' : ''}" data-target="${escapeHtml(u.email)}" data-action="${u.banned ? 'unban' : 'ban'}">${u.banned ? '解封' : '封禁'}</button>`;
    card.innerHTML = `
      ${tag}
      <div class="uname">${escapeHtml(u.username)}</div>
      <div class="row"><b>邮箱</b>${escapeHtml(u.email)}</div>
      <div class="row"><b>密码</b>${escapeHtml(u.password)}</div>
      <div class="row"><b>状态</b>${statusHtml}</div>
      <div class="row"><b>注册IP</b>${escapeHtml(u.ip)}</div>
      <div class="row"><b>注册时间</b>${escapeHtml((u.createdAt || '').replace('T', ' ').slice(0, 19))}</div>
      ${banBtn}
    `;
    box.appendChild(card);
  });
  box.querySelectorAll('.ban-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const r2 = doBan(btn.dataset.target, btn.dataset.action);
      toast(r2.message || (btn.dataset.action === 'ban' ? '已封禁' : '已解封'), r2.ok ? 'success' : 'error');
      if (r2.ok) {
        if (btn.dataset.action === 'ban' && btn.dataset.target === getStoredUser().email) doLogout();
        renderUsers();
      }
    });
  });
}

$('admin-btn').addEventListener('click', () => {
  $('success-panel').classList.add('hidden');
  $('admin-panel').classList.remove('hidden');
  renderUsers();
});
$('admin-back').addEventListener('click', () => {
  $('admin-panel').classList.add('hidden');
  $('success-panel').classList.remove('hidden');
});

// ---------- 事件绑定 ----------
async function handleAuth(data) {
  if (data.ok) {
    setToken(data.token);
    setStoredUser(data.user);
    toast(data.message || '成功', 'success');
    showSuccess(data.user.username);
  } else {
    toast(data.message || '操作失败', 'error');
  }
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateRegister()) return;
  const data = await doRegister({
    email: $('reg-email').value.trim(),
    username: $('reg-username').value.trim(),
    password: $('reg-password').value,
    confirm: $('reg-confirm').value,
  });
  await handleAuth(data);
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateLogin()) return;
  const mode = document.querySelector('input[name="loginMode"]:checked').value;
  const data = doLogin({
    mode,
    account: loginAccount.value.trim(),
    password: $('login-password').value,
  });
  await handleAuth(data);
});

// ---------- 会话恢复（刷新后仍保持登录） ----------
(function restore() {
  const r = doMe();
  if (r.ok) {
    setStoredUser(r.user);
    showSuccess(r.user.username);
  }
})();
