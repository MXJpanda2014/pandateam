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

function showSuccess(username, showJoin = false) {
  $('auth-panel').classList.add('hidden');
  $('admin-panel').classList.add('hidden');
  $('success-panel').classList.remove('hidden');
  $('user-avatar').classList.remove('hidden');
  const u = getStoredUser();
  $('admin-btn').classList.toggle('hidden', !(u && u.isAdmin));
  startPolling();
  renderTeamFiles();

  // 仅注册时显示「加入成功！」覆盖层，3 秒后平滑淡出
  const overlay = $('join-overlay');
  const out = $('type-text');
  overlay.classList.add('hidden');
  overlay.classList.remove('fade-out');
  out.textContent = '';
  if (!showJoin) return;

  overlay.classList.remove('hidden');
  const text = '加入成功！';
  let i = 0;
  const timer = setInterval(() => {
    out.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(timer);
      setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => { overlay.classList.add('hidden'); overlay.classList.remove('fade-out'); }, 800);
      }, 3000);
    }
  }, 180);
}

function doLogout() {
  doLogoutApi();
  stopPolling();
  closeDrawer();
  $('success-panel').classList.add('hidden');
  $('admin-panel').classList.add('hidden');
  $('user-avatar').classList.add('hidden');
  $('auth-panel').classList.remove('hidden');
  loginForm.reset();
  setError(loginAccount, $('login-account-error'), '');
  setError($('login-password'), $('login-password-error'), '');
}

$('logout-btn').addEventListener('click', doLogout);

// ---------- 主页：顶部菜单 ----------
document.querySelectorAll('.menu-item').forEach((mi) => {
  mi.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach((x) => x.classList.remove('active'));
    mi.classList.add('active');
  });
});

// ---------- 团队文件库（GitHub API 云端共享存储：国内可直连 + 原生 CORS） ----------
// ⚠️ 配置区：下面 4 项需按你自己的 GitHub 填写（token 保密，自己填，别发到群里）
const GH_OWNER  = 'MXJpanda2014';                              // GitHub 用户名
const GH_REPO   = 'pandateam-files';                           // 存放团队文件的仓库
const GH_TOKEN  = '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';   // ⚠️ 此 token 属于 MF-panda2024 账号，无法访问本仓库，待替换为 MXJpanda2014 账号下新生成的 token
const GH_BRANCH = 'main';                                      // 默认分支（新建仓库多为 main，也可能是 master）
const GH_API    = 'https://api.github.com';
const MAX_FILE  = 10 * 1024 * 1024;        // 单文件上限 10MB
const MAX_TOTAL = 1024 * 1024 * 1024;      // 总量上限 1GB
const UPLOADER_COLORS = ['#2563eb', '#16a34a', '#db2777', '#9333ea', '#0891b2', '#d97706'];
const DELIM = '\u241f';                      // 文件名分隔符（单元分隔符，几乎不会出现在文件名里）

const ICON_PENCIL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICON_DL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
const ICON_TRASH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_FILE = '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

function ghHeaders(extra) {
  const h = { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + GH_TOKEN };
  if (extra) Object.assign(h, extra);
  return h;
}
// 文件名编码：uploader␟时间戳␟文件名（云端按文件名还原上传者/时间）
function encPath(uploader, ts, filename) { return uploader + DELIM + ts + DELIM + filename; }
function decPath(name) {
  const i1 = name.indexOf(DELIM), i2 = name.indexOf(DELIM, i1 + 1);
  if (i1 < 0 || i2 < 0) return { uploader: '匿名', ts: 0, filename: name };
  return { uploader: name.slice(0, i1), ts: Number(name.slice(i1 + 1, i2)) || 0, filename: name.slice(i2 + 1) };
}

function formatSize(b) {
  if (b >= 1024 * 1024 * 1024) return (b / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  if (b >= 1024 * 1024) return (b / 1024 / 1024).toFixed(2) + ' MB';
  if (b >= 1024) return (b / 1024).toFixed(2) + ' KB';
  return b + ' B';
}
function colorForUser(name) {
  let h = 0; for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return UPLOADER_COLORS[h % UPLOADER_COLORS.length];
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('文件读取失败'));
    r.readAsDataURL(file);
  });
}
async function ghList() {
  // 加时间戳参数绕过 GitHub contents 接口的 CDN 缓存，确保删除/上传后刷新能拿到最新列表。
  // 注意：用 URL 参数而非 Cache-Control 头——后者会触发 CORS 预检被浏览器拦截。
  const res = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents?ref=${GH_BRANCH}&t=${Date.now()}`, { headers: ghHeaders() });
  if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message || ('HTTP ' + res.status)); }
  const arr = await res.json();
  // 只显示本应用上传的文件（文件名带分隔符），自动隐藏 README.md 等系统文件
  return (Array.isArray(arr) ? arr : []).filter((o) => o.type === 'file' && o.name.includes(DELIM));
}
function getDeleted() {
  try { return JSON.parse(localStorage.getItem('panda_tf_deleted') || '[]'); } catch (e) { return []; }
}
function addDeleted(id) {
  const arr = getDeleted();
  if (!arr.includes(id)) { arr.push(id); localStorage.setItem('panda_tf_deleted', JSON.stringify(arr)); }
}
function parseFiles(items) {
  return items.map((o) => {
    const d = decPath(o.name);
    return { id: o.path, name: d.filename, uploader: d.uploader, addedAt: d.ts, size: o.size || 0, sha: o.sha };
  }).filter((f) => f.uploader && f.name).sort((a, b) => b.addedAt - a.addedAt);
}

function renderTeamFiles() {
  const list = $('tf-list');
  list.innerHTML = '<div class="tf-empty">加载中…</div>';
  if (!GH_TOKEN || GH_TOKEN.indexOf('xxxx') >= 0) {
    list.innerHTML = '<div class="tf-empty">⚠️ 请先在 app.js 顶部填写 GH_TOKEN / GH_REPO 等配置</div>';
    return;
  }
  ghList().then((items) => {
    const deleted = getDeleted();
    const files = parseFiles(items).filter((f) => !deleted.includes(f.id));
    const used = files.reduce((s, f) => s + (f.size || 0), 0);
    $('tf-cap').textContent = formatSize(used) + ' / ' + formatSize(MAX_TOTAL);
    list.innerHTML = '';
    if (!files.length) { list.innerHTML = '<div class="tf-empty">还没有文件，点击右上角「上传文件」添加</div>'; return; }
    files.forEach((f) => list.appendChild(buildFileRow(f)));
  }).catch((e) => { toast('读取文件列表失败：' + e.message, 'error'); list.innerHTML = ''; });
}

// 渲染单个文件行（含事件绑定）。删除/上传的乐观更新也复用它。
function buildFileRow(f) {
  const row = document.createElement('div');
  row.className = 'tf-row';
  row.dataset.id = f.id;
  row.dataset.size = f.size || 0;
  const col = colorForUser(f.uploader || '匿名');
  row.innerHTML = `
    <div class="tf-icon">${ICON_FILE}</div>
    <div class="tf-meta">
      <div class="tf-name">${escapeHtml(f.name)}</div>
      <div class="tf-sub">
        <span class="tf-uploader" style="color:${col}">${escapeHtml(f.uploader || '匿名')}</span>
        <span class="tf-size">${formatSize(f.size)}</span>
        <span class="tf-date">${new Date(f.addedAt).toLocaleString()}</span>
      </div>
    </div>
    <div class="tf-actions">
      <button class="tf-act edit" title="重命名">${ICON_PENCIL}</button>
      <button class="tf-act dl" title="下载">${ICON_DL}</button>
      <button class="tf-act del" title="删除">${ICON_TRASH}</button>
    </div>`;
  row.querySelector('.tf-act.edit').addEventListener('click', () => renameTeamFile(f.id));
  row.querySelector('.tf-act.dl').addEventListener('click', () => downloadTeamFile(f.id));
  row.querySelector('.tf-act.del').addEventListener('click', () => deleteTeamFile(f.id));
  return row;
}

async function handleTeamFiles(fileList) {
  const u = getStoredUser();
  const uploader = u ? u.username : '匿名';
  const files = Array.from(fileList || []);
  const list = $('tf-list');
  let usedNow = 0;
  try { usedNow = parseFiles(await ghList()).reduce((s, f) => s + (f.size || 0), 0); } catch (e) { /* 忽略 */ }
  for (const file of files) {
    if (file.size > MAX_FILE) { toast(`「${file.name}」超过 10MB，已跳过`, 'error'); continue; }
    if (usedNow + file.size > MAX_TOTAL) { toast('团队文件库已满（总量 1GB），无法再添加', 'error'); break; }
    const path = encPath(uploader, Date.now(), file.name);
    try {
      const content = await fileToBase64(file);
      const res = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`, {
        method: 'PUT',
        headers: ghHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ message: 'upload: ' + path, content, branch: GH_BRANCH }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); toast('上传失败：' + (j.message || res.status), 'error'); continue; }
      toast(`已上传：${file.name}`, 'success');
      // 乐观添加：GitHub contents 接口有服务端缓存，刚上传立即重拉列表仍返回旧数据，
      // 所以直接把文件插入界面顶部，不依赖重新请求；需要强制同步时点「刷新」。
      const emptyTip = list.querySelector('.tf-empty');
      if (emptyTip) emptyTip.remove();
      const f = { id: path, name: file.name, uploader, addedAt: Date.now(), size: file.size };
      list.insertBefore(buildFileRow(f), list.firstChild);
      const used = Array.from(list.querySelectorAll('.tf-row')).reduce((s, r) => s + (Number(r.dataset.size) || 0), 0);
      $('tf-cap').textContent = formatSize(used) + ' / ' + formatSize(MAX_TOTAL);
      usedNow += file.size;
    } catch (e) { toast('上传失败：' + (e.message || e), 'error'); }
  }
  $('tf-file-input').value = '';
}

async function downloadTeamFile(id) {
  try {
    const res = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(id)}?ref=${GH_BRANCH}`, {
      headers: ghHeaders({ 'Accept': 'application/vnd.github.v3.raw' }),
    });
    if (!res.ok) { toast('下载失败：HTTP ' + res.status, 'error'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = decPath(id).filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) { toast('下载失败：' + (e.message || e), 'error'); }
}
async function deleteTeamFile(id) {
  try {
    const meta = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(id)}?ref=${GH_BRANCH}`, { headers: ghHeaders() });
    if (!meta.ok) { toast('删除失败：找不到文件', 'error'); return; }
    const m = await meta.json();
    const res = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: ghHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message: 'delete: ' + id, sha: m.sha, branch: GH_BRANCH }),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); toast('删除失败：' + (j.message || res.status), 'error'); return; }
    toast('已删除', 'success');
    addDeleted(id);
    // 乐观删除：GitHub contents 接口有服务端缓存，刚删完立即重拉列表仍会返回旧数据。
    // 所以直接从界面移除该行并更新容量，不依赖重新请求；需要强制同步时点「刷新」。
    const list = $('tf-list');
    list.querySelectorAll('.tf-row').forEach((r) => { if (r.dataset.id === id) r.remove(); });
    const left = list.querySelectorAll('.tf-row');
    if (!left.length) {
      list.innerHTML = '<div class="tf-empty">还没有文件，点击右上角「上传文件」添加</div>';
    } else {
      const used = Array.from(left).reduce((s, r) => s + (Number(r.dataset.size) || 0), 0);
      $('tf-cap').textContent = formatSize(used) + ' / ' + formatSize(MAX_TOTAL);
    }
  } catch (e) { toast('删除失败：' + (e.message || e), 'error'); }
}
async function renameTeamFile(id) {
  const cur = decPath(id);
  const name = prompt('输入新的文件名：', cur.filename);
  if (!name || name === cur.filename) return;
  try {
    const res = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(id)}?ref=${GH_BRANCH}`, {
      headers: ghHeaders({ 'Accept': 'application/vnd.github.v3.raw' }),
    });
    if (!res.ok) { toast('重命名失败：原文件下载出错', 'error'); return; }
    const buf = await (await res.blob()).arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf), chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    const content = btoa(binary);
    const newPath = encPath(cur.uploader, cur.ts, name.trim());
    const up = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(newPath)}`, {
      method: 'PUT', headers: ghHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message: 'rename: ' + id, content, branch: GH_BRANCH }),
    });
    if (!up.ok) { const j = await up.json().catch(() => ({})); toast('重命名失败：' + (j.message || up.status), 'error'); return; }
    const meta = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(id)}?ref=${GH_BRANCH}`, { headers: ghHeaders() });
    if (meta.ok) {
      const m = await meta.json();
      await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: ghHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ message: 'delete old: ' + id, sha: m.sha, branch: GH_BRANCH }),
      });
    }
    toast('已重命名', 'success');
    renderTeamFiles();
  } catch (e) { toast('重命名失败：' + (e.message || e), 'error'); }
}

$('tf-file-input').addEventListener('change', (e) => handleTeamFiles(e.target.files));
$('tf-refresh').addEventListener('click', () => renderTeamFiles());
const tfPage = document.querySelector('.tf-page');
['dragenter', 'dragover'].forEach((ev) =>
  tfPage.addEventListener(ev, (e) => { e.preventDefault(); tfPage.classList.add('drag'); }));
['dragleave', 'drop'].forEach((ev) =>
  tfPage.addEventListener(ev, (e) => { e.preventDefault(); tfPage.classList.remove('drag'); }));
tfPage.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files.length) handleTeamFiles(e.dataTransfer.files);
});

// ---------- 右上角头像 + 右侧滑出菜单 ----------
function openDrawer() { $('side-drawer').classList.add('open'); $('drawer-overlay').classList.add('open'); }
function closeDrawer() { $('side-drawer').classList.remove('open'); $('drawer-overlay').classList.remove('open'); }
$('user-avatar').addEventListener('click', openDrawer);
$('drawer-close').addEventListener('click', closeDrawer);
$('drawer-overlay').addEventListener('click', closeDrawer);
$('goto-team-btn').addEventListener('click', () => { closeDrawer(); });

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
    showSuccess(data.user.username, data.message === '注册成功');
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
    showSuccess(r.user.username, false);
  }
})();
