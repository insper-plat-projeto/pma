// Every call goes to the gateway (the platform's single entry point), never
// straight to a microservice. credentials: 'include' makes the browser send
// the JWT cookie (__store_jwt_token) that /auth/login sets.
const BASE_URL = 'http://localhost:8080';

const PAGES = [
  ['index.html', 'Início'],
  ['register.html', 'Cadastro'],
  ['login.html', 'Login'],
  ['profile.html', 'Perfil'],
  ['accounts.html', 'Contas'],
  ['exchange.html', 'Câmbio'],
];

// ---------- HTTP ----------

async function api(method, path, body) {
  const options = { method, credentials: 'include', headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    return { ok: false, status: 0, data: null, message: `Sem conexão com o gateway em ${BASE_URL}.` };
  }

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  return { ok: response.ok, status: response.status, data, message: errorMessage(response.status, data) };
}

function errorMessage(status, data) {
  if (status === 401) return 'Não autenticado: faça login.';
  if (status === 404) return 'Não encontrado.';
  // Spring answers {"message": ...}; FastAPI answers {"detail": ...}
  if (data && typeof data === 'object') {
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string' && data.message) return data.message;
  }
  return `Erro HTTP ${status}.`;
}

// ---------- UI helpers ----------

function showMessage(text, kind = 'info') {
  const el = document.getElementById('message');
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
}

function renderNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const current = location.pathname.split('/').pop() || 'index.html';
  for (const [href, label] of PAGES) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    if (href === current) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.textContent = 'Sair';
  logoutButton.addEventListener('click', logout);
  nav.append(logoutButton);
}

function formValue(id) {
  return document.getElementById(id).value.trim();
}

// ---------- Auth ----------

async function register(event) {
  event.preventDefault();
  const result = await api('POST', '/auth/register', {
    name: formValue('name'),
    email: formValue('email'),
    password: document.getElementById('password').value,
  });
  if (!result.ok) return showMessage(result.message, 'error');
  showMessage('Conta criada. Redirecionando para o login…', 'ok');
  setTimeout(() => { location.href = 'login.html'; }, 1000);
}

async function login(event) {
  event.preventDefault();
  const result = await api('POST', '/auth/login', {
    email: formValue('email'),
    password: document.getElementById('password').value,
  });
  if (!result.ok) return showMessage('E-mail ou senha inválidos.', 'error');
  location.href = 'profile.html';
}

async function logout() {
  await api('GET', '/auth/logout');
  location.href = 'login.html';
}

// ---------- Pages ----------

async function loadSession() {
  const el = document.getElementById('session');
  const result = await api('GET', '/auth/me');
  el.textContent = result.ok
    ? `Conectado como ${result.data.name} (${result.data.email}).`
    : 'Você não está conectado.';
}

async function loadProfile() {
  const result = await api('GET', '/auth/me');
  if (!result.ok) return showMessage(result.message, 'error');
  document.getElementById('profile-name').textContent = result.data.name;
  document.getElementById('profile-email').textContent = result.data.email;
  document.getElementById('profile-id').textContent = result.data.id;
  document.getElementById('profile').hidden = false;
}

async function loadAccounts() {
  const result = await api('GET', '/accounts');
  if (!result.ok) return showMessage(result.message, 'error');
  const rows = document.getElementById('accounts');
  rows.replaceChildren();
  for (const account of result.data) {
    const tr = document.createElement('tr');
    for (const value of [account.name, account.email, account.id]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    rows.append(tr);
  }
  showMessage(`${result.data.length} conta(s).`, 'info');
}

async function getExchange(event) {
  event.preventDefault();
  const from = formValue('from').toUpperCase();
  const to = formValue('to').toUpperCase();
  const result = await api('GET', `/exchanges/${encodeURIComponent(from)}/${encodeURIComponent(to)}`);
  const box = document.getElementById('rate');
  if (!result.ok) {
    box.hidden = true;
    const text = result.status === 422 ? 'Use códigos de 3 letras, como USD ou BRL.' : result.message;
    return showMessage(text, 'error');
  }
  document.getElementById('rate-pair').textContent = `1 ${from} em ${to}`;
  document.getElementById('rate-buy').textContent = result.data.buy;
  document.getElementById('rate-sell').textContent = result.data.sell;
  document.getElementById('rate-date').textContent = result.data.date;
  box.hidden = false;
  showMessage('', 'info');
}

// ---------- Wiring ----------

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  document.getElementById('register-form')?.addEventListener('submit', register);
  document.getElementById('login-form')?.addEventListener('submit', login);
  document.getElementById('exchange-form')?.addEventListener('submit', getExchange);

  const onLoad = {
    index: loadSession,
    profile: loadProfile,
    accounts: loadAccounts,
  }[document.body.dataset.page];
  onLoad?.();
});
