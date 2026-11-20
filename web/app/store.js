// Every call goes to the platform's single entry point (the nginx load balancer
// in front of the gateway replicas), never straight to a microservice.
// credentials: 'include' makes the browser send the JWT cookie
// (__store_jwt_token) that /auth/login sets.
const BASE_URL = 'http://localhost:8080';

const TABS = [
  ['conta.html', 'Conta'],
  ['loja.html', 'Loja'],
];

// Parody catalog. Prices are in BRL; the USD price comes from the exchange
// service (GET /exchanges/BRL/USD).
const PRODUCTS = [
  { id: 'umberto', emoji: '🧑‍🏫', name: 'Umberto', price: 999.90,
    description: 'Professor original de fábrica. Acompanha arguição oral grátis.' },
  { id: 'doisberto', emoji: '🧑‍🏫🧑‍🏫', name: 'Doisberto', price: 1899.90,
    description: 'Dois Umbertos pelo preço de quase dois. Corrige o dobro de quizzes.' },
  { id: 'tresberto', emoji: '🧑‍🏫🧑‍🏫🧑‍🏫', name: 'Trêsberto', price: 2699.90,
    description: 'Edição cluster: três réplicas atrás de um load balancer.' },
  { id: 'corinthians', emoji: '⚽', name: '+3 pontos pro Corinthians', price: 333.33,
    description: 'Aplicados direto na tabela. Não garantimos que o VAR aceite.' },
  { id: 'gta7', emoji: '🎮', name: 'GTA 7', price: 499.90,
    description: 'Lançamento previsto para depois do GTA 6. Pré-venda eterna.' },
  { id: 'chevette', emoji: '🚗', name: 'Chevette Turbo', price: 15990.00,
    description: 'De 0 a 100 em algum momento. Toca-fitas incluso.' },
  { id: 'vibe-code', emoji: '🕶️', name: 'Ocultador de vibe code', price: 79.90,
    description: 'Some com os comentários óbvios. Não funciona na arguição oral.' },
  { id: 'ram-zip', emoji: '💾', name: 'Memória RAM .zip', price: 19.90,
    description: '16 GB compactados em 2 MB. É só descompactar no slot.' },
  { id: 'spa-gabriel', emoji: '💆', name: 'Dia de spa com o Gabriel', price: 249.90,
    description: 'Massagem, pepino nos olhos e um code review relaxante.' },
  { id: 'vesicula', emoji: '🫘', name: 'Vesícula seminova', price: 1200.00,
    description: 'Pouco uso, sem pedras, único dono. Aceitamos rim na troca.' },
];

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

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
    return { ok: false, status: 0, data: null, message: `Sem conexão com a API em ${BASE_URL}.` };
  }

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  return { ok: response.ok, status: response.status, data, message: errorMessage(response.status, data) };
}

function errorMessage(status, data) {
  if (status === 401) return 'Sessão expirada: faça login de novo.';
  if (status === 404) return 'Não encontrado.';
  // Spring answers {"message": ...}; FastAPI answers {"detail": ...}
  if (data && typeof data === 'object') {
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string' && data.message) return data.message;
  }
  return `Erro HTTP ${status}.`;
}

// ---------- UI helpers ----------

function $(id) {
  return document.getElementById(id);
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

function showMessage(text, kind = 'info', id = 'message') {
  const box = $(id);
  if (!box) return;
  box.textContent = text;
  box.dataset.kind = kind;
}

// Per-browser storage for the purchase history. It can be unavailable
// (private window, blocked site data), so every access is guarded.
function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* history is optional */ }
}

// ---------- Session ----------

let me = null;

// Pages behind login: no session -> back to the login screen.
async function requireSession() {
  const result = await api('GET', '/auth/me');
  if (!result.ok) {
    location.replace('index.html');
    return null;
  }
  me = result.data;
  renderTabs();
  document.body.classList.remove('checking');
  return me;
}

function renderTabs() {
  const nav = $('nav');
  const current = location.pathname.split('/').pop();
  const tabs = el('div', { className: 'tabs' });
  for (const [href, label] of TABS) {
    const link = el('a', { href, textContent: label });
    if (href === current) link.setAttribute('aria-current', 'page');
    tabs.append(link);
  }
  const logoutButton = el('button', { type: 'button', textContent: 'Sair' });
  logoutButton.addEventListener('click', logout);
  nav.replaceChildren(
    el('span', { className: 'brand', textContent: 'Store' }),
    tabs,
    el('span', { className: 'who', textContent: me.name }),
    logoutButton,
  );
}

async function logout() {
  await api('GET', '/auth/logout');
  location.replace('index.html');
}

// ---------- Login / register (index.html) ----------

function showAuthPanel(name) {
  for (const panel of ['login', 'register']) {
    $(`${panel}-form`).hidden = panel !== name;
    $(`tab-${panel}`).setAttribute('aria-selected', String(panel === name));
  }
  showMessage('');
}

async function login(event) {
  event.preventDefault();
  const result = await api('POST', '/auth/login', {
    email: $('login-email').value.trim(),
    password: $('login-password').value,
  });
  if (!result.ok) {
    const text = result.status === 0 ? result.message : 'E-mail ou senha inválidos.';
    return showMessage(text, 'error');
  }
  location.replace('conta.html');
}

async function register(event) {
  event.preventDefault();
  const email = $('register-email').value.trim();
  const password = $('register-password').value;
  const result = await api('POST', '/auth/register', {
    name: $('register-name').value.trim(),
    email,
    password,
  });
  if (!result.ok) return showMessage(result.message, 'error');

  // account created: log straight in with the same credentials
  const session = await api('POST', '/auth/login', { email, password });
  if (!session.ok) {
    showAuthPanel('login');
    return showMessage('Conta criada. Faça login.', 'ok');
  }
  location.replace('conta.html');
}

async function initIndex() {
  $('tab-login').addEventListener('click', () => showAuthPanel('login'));
  $('tab-register').addEventListener('click', () => showAuthPanel('register'));
  $('login-form').addEventListener('submit', login);
  $('register-form').addEventListener('submit', register);

  // already logged in: skip the login screen
  const result = await api('GET', '/auth/me');
  if (result.ok) return location.replace('conta.html');
  document.body.classList.remove('checking');
}

// ---------- Conta: account info + Redis cache demo ----------

// Reads the account-service cache counters exposed for Prometheus
// (cache_gets_total{cache="accounts",result="hit|miss"}).
async function cacheCounters() {
  const result = await api('GET', '/accounts/actuator/prometheus');
  if (!result.ok || typeof result.data !== 'string') return null;
  const counters = { hit: 0, miss: 0 };
  for (const line of result.data.split('\n')) {
    const match = line.match(/^cache_gets_total\{(.*)\}\s+([\d.eE+-]+)$/);
    if (!match || !match[1].includes('cache="accounts"')) continue;
    const kind = match[1].match(/result="(\w+)"/)?.[1];
    if (kind in counters) counters[kind] += Number(match[2]);
  }
  return counters;
}

function renderCacheTotals(counters) {
  if (!counters) {
    $('cache-hits').textContent = '—';
    $('cache-misses').textContent = '—';
    $('cache-ratio').textContent = '—';
    return;
  }
  const total = counters.hit + counters.miss;
  $('cache-hits').textContent = counters.hit;
  $('cache-misses').textContent = counters.miss;
  $('cache-ratio').textContent = total ? `${((counters.hit / total) * 100).toFixed(1)}%` : '—';
}

let probeCount = 0;

// One GET /accounts/{id}, classified as HIT or MISS by the counter that moved.
async function probe(id, label) {
  const before = await cacheCounters();
  const start = performance.now();
  const result = await api('GET', `/accounts/${encodeURIComponent(id)}`);
  const elapsed = performance.now() - start;
  const after = await cacheCounters();

  let source = '?';
  if (before && after) {
    if (after.hit > before.hit) source = 'hit';
    else if (after.miss > before.miss) source = 'miss';
  }
  renderCacheTotals(after);

  probeCount += 1;
  const badge = el('span', {
    className: `badge ${source}`,
    textContent: { hit: 'HIT · Redis', miss: 'MISS · Postgres', '?': 'sem métrica' }[source],
  });
  $('cache-log').prepend(el('tr', {},
    el('td', { textContent: probeCount }),
    el('td', { textContent: label }),
    el('td', {}, badge),
    el('td', { textContent: result.status }),
    el('td', { textContent: `${elapsed.toFixed(0)} ms` }),
  ));
  $('cache-table').hidden = false;
  return result;
}

async function runProbes(button, id, label, times) {
  button.disabled = true;
  try {
    for (let i = 0; i < times; i++) await probe(id, label);
  } finally {
    button.disabled = false;
  }
}

async function initConta() {
  if (!(await requireSession())) return;
  $('account-name').textContent = me.name;
  $('account-email').textContent = me.email;
  $('account-id').textContent = me.id;
  $('cache-key').textContent = `accounts::${me.id}`;

  $('probe-mine').addEventListener('click', (event) =>
    runProbes(event.currentTarget, me.id, 'minha conta', 5));
  $('probe-missing').addEventListener('click', (event) =>
    runProbes(event.currentTarget, 'conta-que-nao-existe', 'id inexistente', 1));

  renderCacheTotals(await cacheCounters());
}

// ---------- Loja: catalog, cart and checkout ----------

let rate = null; // 1 BRL in USD, from the exchange service
const cart = new Map(); // product id -> quantity

function toUsd(valueBrl) {
  return rate ? usd.format(valueBrl * rate.value) : 'US$ —';
}

async function loadRate() {
  const result = await api('GET', '/exchanges/BRL/USD');
  if (!result.ok) {
    rate = null;
    $('rate').textContent = `Cotação em dólar indisponível (${result.message}). Preços só em reais.`;
    $('rate').dataset.kind = 'error';
    return;
  }
  // sell = price charged to the customer, the conservative side for a sale
  rate = { value: result.data.sell, date: result.data.date };
  $('rate').textContent = `1 BRL = ${result.data.sell.toFixed(4)} USD · cotação de ${rate.date} (exchange-service)`;
  $('rate').dataset.kind = 'info';
}

function renderProducts() {
  const grid = $('products');
  grid.replaceChildren();
  for (const product of PRODUCTS) {
    const add = el('button', { type: 'button', textContent: 'Adicionar ao carrinho' });
    add.addEventListener('click', () => changeQuantity(product.id, 1));
    grid.append(el('article', { className: 'product' },
      el('div', { className: 'emoji', textContent: product.emoji, ariaHidden: 'true' }),
      el('h3', { textContent: product.name }),
      el('p', { className: 'description', textContent: product.description }),
      el('p', { className: 'price' },
        el('strong', { textContent: brl.format(product.price) }),
        el('span', { textContent: toUsd(product.price) }),
      ),
      add,
    ));
  }
}

function changeQuantity(id, delta) {
  const quantity = (cart.get(id) ?? 0) + delta;
  if (quantity > 0) cart.set(id, quantity);
  else cart.delete(id);
  renderCart();
  showMessage('', 'info', 'checkout-message');
}

function cartTotal() {
  let total = 0;
  for (const [id, quantity] of cart) total += PRODUCTS.find((p) => p.id === id).price * quantity;
  return total;
}

function renderCart() {
  const list = $('cart-items');
  list.replaceChildren();
  for (const [id, quantity] of cart) {
    const product = PRODUCTS.find((p) => p.id === id);
    const minus = el('button', { type: 'button', textContent: '−', ariaLabel: `Remover um ${product.name}` });
    const plus = el('button', { type: 'button', textContent: '+', ariaLabel: `Adicionar um ${product.name}` });
    minus.addEventListener('click', () => changeQuantity(id, -1));
    plus.addEventListener('click', () => changeQuantity(id, 1));
    list.append(el('li', {},
      el('span', { className: 'item-name', textContent: `${product.emoji} ${product.name}` }),
      el('span', { className: 'qty' }, minus, el('span', { textContent: quantity }), plus),
      el('span', { className: 'item-total', textContent: brl.format(product.price * quantity) }),
    ));
  }
  const total = cartTotal();
  $('cart-empty').hidden = cart.size > 0;
  $('cart-total-brl').textContent = brl.format(total);
  $('cart-total-usd').textContent = toUsd(total);
  $('checkout').disabled = cart.size === 0;
}

function historyKey() {
  return `store.orders.${me.id}`;
}

function checkout() {
  if (cart.size === 0) return;
  const total = cartTotal();
  const order = {
    number: Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleString('pt-BR'),
    items: [...cart].map(([id, quantity]) => ({ name: PRODUCTS.find((p) => p.id === id).name, quantity })),
    totalBrl: total,
    totalUsd: rate ? total * rate.value : null,
  };
  writeStore(historyKey(), [order, ...readStore(historyKey(), [])].slice(0, 20));
  cart.clear();
  renderCart();
  renderHistory();
  showMessage(`Pedido #${order.number} confirmado! Total ${brl.format(order.totalBrl)}. Obrigado, ${me.name}.`, 'ok', 'checkout-message');
}

function renderHistory() {
  const orders = readStore(historyKey(), []);
  const list = $('orders');
  list.replaceChildren();
  for (const order of orders) {
    const items = order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ');
    const totalUsd = order.totalUsd == null ? '' : ` · ${usd.format(order.totalUsd)}`;
    list.append(el('li', {},
      el('strong', { textContent: `#${order.number}` }),
      ` ${order.date} · ${brl.format(order.totalBrl)}${totalUsd}`,
      el('br'),
      el('span', { className: 'muted', textContent: items }),
    ));
  }
  $('orders-section').hidden = orders.length === 0;
}

async function initLoja() {
  if (!(await requireSession())) return;
  $('checkout').addEventListener('click', checkout);
  renderProducts();
  renderCart();
  renderHistory();
  await loadRate();
  renderProducts();
  renderCart();
}

// ---------- Wiring ----------

document.addEventListener('DOMContentLoaded', () => {
  ({ index: initIndex, conta: initConta, loja: initLoja })[document.body.dataset.page]?.();
});
