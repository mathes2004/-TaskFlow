/**
 * Demo API for local preview (VITE_USE_MOCK=true).
 *
 * It replaces only Axios' network layer, so the rest of the app (services, interceptors,
 * AuthContext, pages) runs exactly as it will against the real Laravel API. It mimics the
 * API contract from Section 8 of the build guide: same URLs, status codes, JSON shapes,
 * validation messages, ownership rules (404 for other users' tasks) and rate limiting.
 *
 * Data lives in this browser's localStorage. Never use this mode in production.
 */
import { AxiosError } from 'axios';
import { addDays, todayIn } from '../../utils/dates';

const DB_KEY = 'taskflow_mock_db_v1';
const SESSION_KEY = 'taskflow_mock_session_v1';
const LATENCY = 180;

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'in_progress', 'completed'];
const COMMON_PASSWORDS = ['password', 'password1', 'password123', '12345678', 'qwerty123', 'letmein123', 'abc12345', '123456789'];

/* ---------------------------------------------------------------- storage */
function seed() {
  let n = 7;
  const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const verbs = ['Write', 'Review', 'Plan', 'Fix', 'Prepare', 'Update', 'Test', 'Design', 'Email', 'Call'];
  const things = ['Laravel API', 'React forms', 'quarterly report', 'budget sheet', 'login page', 'database backup', 'team agenda', 'invoice list', 'study notes', 'release checklist', 'dashboard cards', 'client proposal'];
  const now = new Date();
  const users = [];
  const tasks = [];
  [['Alice Johnson', 'alice@example.com'], ['Bob Smith', 'bob@example.com']].forEach(([name, email], i) => {
    const id = i + 1;
    users.push({ id, name, email, password: 'Password123', timezone: 'Asia/Colombo', created_at: now.toISOString(), updated_at: now.toISOString() });
    const today = todayIn('Asia/Colombo');
    for (let k = 0; k < 30; k++) {
      const status = pick(STATUSES);
      const created = new Date(now.getTime() - Math.floor(rnd() * 20 * 86400000));
      const updated = new Date(created.getTime() + Math.floor(rnd() * (now - created)));
      const hasDue = rnd() > 0.2;
      tasks.push({
        id: tasks.length + 1,
        user_id: id,
        title: `${pick(verbs)} ${pick(things)}`,
        description: rnd() > 0.4 ? `Notes for this task: ${pick(things)} needs attention before the deadline.` : null,
        priority: pick(PRIORITIES),
        status,
        due_date: hasDue ? addDays(today, Math.floor(rnd() * 40) - 10) : null,
        completed_at: status === 'completed' ? updated.toISOString() : null,
        created_at: created.toISOString(),
        updated_at: updated.toISOString(),
      });
    }
  });
  return { users, tasks, nextUserId: 3, nextTaskId: tasks.length + 1 };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to fresh seed */ }
  const db = seed();
  saveDb(db);
  return db;
}
function saveDb(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* storage full or blocked */ }
}
const getSessionUserId = () => {
  try { return Number(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
};
const setSessionUserId = (id) => {
  try { id ? localStorage.setItem(SESSION_KEY, String(id)) : localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
};

/* --------------------------------------------------------------- helpers */
class HttpError extends Error {
  constructor(status, body, headers = {}) {
    super(body?.message ?? 'Error');
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}
const invalid = (errors) => {
  const first = Object.values(errors)[0][0];
  const more = Object.keys(errors).length - 1;
  return new HttpError(422, { message: more > 0 ? `${first} (and ${more} more error${more > 1 ? 's' : ''})` : first, errors });
};
const unauthenticated = () => new HttpError(401, { message: 'Unauthenticated.' });
const notFound = () => new HttpError(404, { message: 'Not found.' });

const userJson = (u) => ({ id: u.id, name: u.name, email: u.email, timezone: u.timezone, email_verified: false });

function taskJson(t, user) {
  const today = todayIn(user.timezone);
  return {
    id: t.id, title: t.title, description: t.description, priority: t.priority, status: t.status,
    due_date: t.due_date,
    is_overdue: !!t.due_date && t.status !== 'completed' && t.due_date < today,
    completed_at: t.completed_at, created_at: t.created_at, updated_at: t.updated_at,
  };
}

function validTimezone(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

function passwordErrors(pw, confirmation) {
  const e = [];
  if (!pw) return ['The password field is required.'];
  if (confirmation !== undefined && pw !== confirmation) e.push('The password confirmation does not match.');
  if (pw.length < 8) e.push('The password field must be at least 8 characters.');
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) e.push('The password field must contain at least one letter and one number.');
  if (COMMON_PASSWORDS.includes(pw.toLowerCase())) e.push('The given password has appeared in a data leak. Please choose a different password.');
  return e;
}

/* ---------------------------------------------------------- rate limiting */
const attempts = new Map(); // key -> [timestamps]
function throttle(key, max, windowMs = 60000) {
  const now = Date.now();
  const list = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    const wait = Math.ceil((windowMs - (now - list[0])) / 1000);
    throw new HttpError(429, { message: 'Too Many Attempts.' }, { 'retry-after': String(wait) });
  }
  list.push(now);
  attempts.set(key, list);
}

/* ---------------------------------------------------------------- handlers */
function currentUser(db) {
  const id = getSessionUserId();
  const user = id && db.users.find((u) => u.id === id);
  if (!user) throw unauthenticated();
  return user;
}

function validateTask(body, { full, create, user }) {
  const errors = {};
  const add = (f, m) => (errors[f] ??= []).push(m);
  const clean = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (full || has('title')) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) add('title', 'The title field is required.');
    else if (title.length > 150) add('title', 'The title field must not be greater than 150 characters.');
    else clean.title = title;
  }
  if (has('description')) {
    if (body.description != null && typeof body.description !== 'string') add('description', 'The description field must be a string.');
    else if (body.description && body.description.length > 5000) add('description', 'The description field must not be greater than 5000 characters.');
    else clean.description = body.description || null;
  }
  if (full || has('priority')) {
    if (!PRIORITIES.includes(body.priority)) { if (full && !create) add('priority', body.priority == null ? 'The priority field is required.' : 'The selected priority is invalid.'); else if (has('priority') && body.priority != null && body.priority !== '') add('priority', 'The selected priority is invalid.'); }
    else clean.priority = body.priority;
  }
  if (full || has('status')) {
    if (!STATUSES.includes(body.status)) { if (full && !create) add('status', body.status == null ? 'The status field is required.' : 'The selected status is invalid.'); else if (has('status') && body.status != null && body.status !== '') add('status', 'The selected status is invalid.'); }
    else clean.status = body.status;
  }
  if (has('due_date')) {
    const d = body.due_date;
    if (d == null || d === '') clean.due_date = null;
    else if (!isDate(d)) add('due_date', 'The due date field must match the format Y-m-d.');
    else if (create && d < todayIn(user.timezone)) add('due_date', 'The due date field must be a date after or equal to today.');
    else clean.due_date = d;
  }
  if (Object.keys(errors).length) throw invalid(errors);
  return clean;
}

function applyTaskChanges(task, changes) {
  const prevStatus = task.status;
  Object.assign(task, changes);
  if (changes.status && changes.status !== prevStatus) {
    task.completed_at = task.status === 'completed' ? new Date().toISOString() : null;
  }
  task.updated_at = new Date().toISOString();
}

function ownTask(db, user, id) {
  const t = db.tasks.find((x) => x.id === Number(id));
  if (!t || t.user_id !== user.id) throw notFound(); // 404, never reveal that it exists
  return t;
}

function listTasks(db, user, q) {
  const errors = {};
  const add = (f, m) => (errors[f] ??= []).push(m);
  if (q.search && String(q.search).length > 100) add('search', 'The search field must not be greater than 100 characters.');
  if (q.status && !STATUSES.includes(q.status)) add('status', 'The selected status is invalid.');
  if (q.priority && !PRIORITIES.includes(q.priority)) add('priority', 'The selected priority is invalid.');
  if (q.sort && !['created_at', 'due_date', 'priority', 'title'].includes(q.sort)) add('sort', 'The selected sort is invalid.');
  if (q.direction && !['asc', 'desc'].includes(q.direction)) add('direction', 'The selected direction is invalid.');
  if (q.per_page && !(Number.isInteger(+q.per_page) && +q.per_page >= 1 && +q.per_page <= 50)) add('per_page', 'The per page field must not be greater than 50.');
  if (q.page && !(Number.isInteger(+q.page) && +q.page >= 1)) add('page', 'The page field must be at least 1.');
  if (Object.keys(errors).length) throw invalid(errors);

  const today = todayIn(user.timezone);
  const overdueOnly = ['1', 'true', 1, true].includes(q.overdue);
  let rows = db.tasks.filter((t) => t.user_id === user.id); // ownership by design
  if (q.search) rows = rows.filter((t) => t.title.toLowerCase().includes(String(q.search).toLowerCase())); // literal match, % and _ are not wildcards
  if (q.status) rows = rows.filter((t) => t.status === q.status);
  if (q.priority) rows = rows.filter((t) => t.priority === q.priority);
  if (overdueOnly) rows = rows.filter((t) => t.status !== 'completed' && t.due_date && t.due_date < today);

  const sort = q.sort || 'created_at';
  const dir = q.direction === 'asc' ? 1 : -1;
  const key = (t) => {
    if (sort === 'priority') return PRIORITIES.indexOf(t.priority);
    if (sort === 'title') return t.title.toLowerCase();
    return t[sort];
  };
  rows.sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (ka == null && kb == null) return b.id - a.id;
    if (ka == null) return 1; // nulls last
    if (kb == null) return -1;
    if (ka < kb) return -dir;
    if (ka > kb) return dir;
    return b.id - a.id;
  });

  const perPage = Number(q.per_page) || 15;
  const total = rows.length;
  const last = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Number(q.page) || 1, last);
  const slice = rows.slice((page - 1) * perPage, page * perPage);
  return {
    data: slice.map((t) => taskJson(t, user)),
    links: { first: '?page=1', last: `?page=${last}`, prev: page > 1 ? `?page=${page - 1}` : null, next: page < last ? `?page=${page + 1}` : null },
    meta: { current_page: page, last_page: last, per_page: perPage, total },
  };
}

function dashboard(db, user) {
  const today = todayIn(user.timezone);
  const mine = db.tasks.filter((t) => t.user_id === user.id);
  const counts = {
    total: mine.length,
    pending: mine.filter((t) => t.status === 'pending').length,
    in_progress: mine.filter((t) => t.status === 'in_progress').length,
    completed: mine.filter((t) => t.status === 'completed').length,
    overdue: mine.filter((t) => t.status !== 'completed' && t.due_date && t.due_date < today).length,
  };
  const recent = [...mine].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);
  const horizon = addDays(today, 7);
  const upcoming = mine
    .filter((t) => t.status !== 'completed' && t.due_date && t.due_date >= today && t.due_date <= horizon)
    .sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5);
  return { data: { counts, recent: recent.map((t) => taskJson(t, user)), upcoming: upcoming.map((t) => taskJson(t, user)) } };
}

/* ------------------------------------------------------------------ router */
function route(method, path, params, body) {
  const db = loadDb();

  if (method === 'get' && path === '/sanctum/csrf-cookie') return [204, null];

  if (method === 'post' && path === '/api/register') {
    throttle('register', 10);
    const errors = {};
    const add = (f, m) => (errors[f] ??= []).push(m);
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!name) add('name', 'The name field is required.');
    else if (name.length < 2) add('name', 'The name field must be at least 2 characters.');
    else if (name.length > 100) add('name', 'The name field must not be greater than 100 characters.');
    if (!email) add('email', 'The email field is required.');
    else if (!isEmail(email) || email.length > 255) add('email', 'The email field must be a valid email address.');
    else if (db.users.some((u) => u.email === email)) add('email', 'The email has already been taken.');
    passwordErrors(body.password, body.password_confirmation).forEach((m) => add('password', m));
    if (Object.keys(errors).length) throw invalid(errors);
    const now = new Date().toISOString();
    const user = { id: db.nextUserId++, name, email, password: body.password, timezone: 'Asia/Colombo', created_at: now, updated_at: now };
    db.users.push(user);
    saveDb(db);
    setSessionUserId(user.id);
    return [201, { data: userJson(user) }];
  }

  // Demo mode sends no email: same generic reply as the real API, and any reset token is rejected.
  if (method === 'post' && path === '/api/forgot-password') {
    throttle('forgot', 3);
    return [200, { message: 'If that email exists, a link has been sent.' }];
  }
  if (method === 'post' && path === '/api/reset-password') {
    throw invalid({ email: ['This password reset token is invalid.'] });
  }

  if (method === 'post' && path === '/api/login') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const errors = {};
    if (!email) errors.email = ['The email field is required.'];
    else if (!isEmail(email)) errors.email = ['The email field must be a valid email address.'];
    if (!body.password) errors.password = ['The password field is required.'];
    if (Object.keys(errors).length) throw invalid(errors);
    throttle(`login:${email}`, 5);
    const user = db.users.find((u) => u.email === email);
    if (!user || user.password !== body.password) throw invalid({ email: ['These credentials do not match our records.'] });
    setSessionUserId(user.id);
    return [200, { data: userJson(user) }];
  }

  // Everything below needs a session
  const user = currentUser(db);

  if (method === 'post' && path === '/api/logout') { setSessionUserId(null); return [204, null]; }
  if (method === 'get' && path === '/api/user') return [200, { data: userJson(user) }];

  if (method === 'patch' && path === '/api/user') {
    const errors = {};
    const add = (f, m) => (errors[f] ??= []).push(m);
    const out = {};
    if ('name' in body) {
      const name = String(body.name ?? '').trim();
      if (name.length < 2) add('name', name ? 'The name field must be at least 2 characters.' : 'The name field is required.');
      else if (name.length > 100) add('name', 'The name field must not be greater than 100 characters.');
      else out.name = name;
    }
    if ('email' in body) {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!email) add('email', 'The email field is required.');
      else if (!isEmail(email)) add('email', 'The email field must be a valid email address.');
      else if (db.users.some((u) => u.email === email && u.id !== user.id)) add('email', 'The email has already been taken.');
      else out.email = email;
    }
    if ('timezone' in body) {
      if (!validTimezone(body.timezone)) add('timezone', 'The timezone field must be a valid timezone.');
      else out.timezone = body.timezone;
    }
    if (Object.keys(errors).length) throw invalid(errors);
    Object.assign(user, out, { updated_at: new Date().toISOString() });
    saveDb(db);
    return [200, { data: userJson(user) }];
  }

  if (method === 'put' && path === '/api/user/password') {
    throttle(`sensitive:${user.id}`, 5);
    const errors = {};
    const add = (f, m) => (errors[f] ??= []).push(m);
    if (!body.current_password) add('current_password', 'The current password field is required.');
    else if (body.current_password !== user.password) add('current_password', 'The password is incorrect.');
    passwordErrors(body.password, body.password_confirmation).forEach((m) => add('password', m));
    if (body.password && body.password === body.current_password) add('password', 'The password field and current password must be different.');
    if (Object.keys(errors).length) throw invalid(errors);
    user.password = body.password;
    saveDb(db);
    return [204, null];
  }

  if (method === 'delete' && path === '/api/user') {
    throttle(`sensitive:${user.id}`, 5);
    if (body.password !== user.password) throw invalid({ password: ['The password is incorrect.'] });
    db.tasks = db.tasks.filter((t) => t.user_id !== user.id); // cascade
    db.users = db.users.filter((u) => u.id !== user.id);
    saveDb(db);
    setSessionUserId(null);
    return [204, null];
  }

  if (method === 'get' && path === '/api/dashboard') return [200, dashboard(db, user)];

  if (path === '/api/tasks') {
    if (method === 'get') return [200, listTasks(db, user, params)];
    if (method === 'post') {
      const clean = validateTask(body, { full: true, create: true, user });
      const now = new Date().toISOString();
      const task = {
        id: db.nextTaskId++, user_id: user.id, // owner is always the session user; body.user_id is ignored
        title: clean.title, description: clean.description ?? null,
        priority: clean.priority ?? 'medium', status: clean.status ?? 'pending',
        due_date: clean.due_date ?? null,
        completed_at: clean.status === 'completed' ? now : null,
        created_at: now, updated_at: now,
      };
      db.tasks.push(task);
      saveDb(db);
      return [201, { data: taskJson(task, user) }];
    }
  }

  const m = path.match(/^\/api\/tasks\/(\d+)$/);
  if (m) {
    const task = ownTask(db, user, m[1]);
    if (method === 'get') return [200, { data: taskJson(task, user) }];
    if (method === 'put' || method === 'patch') {
      const clean = validateTask(body, { full: method === 'put', create: false, user });
      applyTaskChanges(task, clean);
      saveDb(db);
      return [200, { data: taskJson(task, user) }];
    }
    if (method === 'delete') {
      db.tasks = db.tasks.filter((t) => t.id !== task.id);
      saveDb(db);
      return [204, null];
    }
  }

  throw notFound();
}

/* ----------------------------------------------------------------- adapter */
export function mockAdapter(config) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let status, data, headers = {};
      try {
        const url = new URL(config.url, 'http://mock.local');
        const method = (config.method || 'get').toLowerCase();
        let body = {};
        if (typeof config.data === 'string' && config.data) body = JSON.parse(config.data);
        else if (config.data && typeof config.data === 'object') body = config.data;
        const params = { ...Object.fromEntries(url.searchParams), ...(config.params ?? {}) };
        [status, data] = route(method, url.pathname, params, body);
      } catch (e) {
        if (e instanceof HttpError) { status = e.status; data = e.body; headers = e.headers; }
        else { console.error(e); status = 500; data = { message: 'Server Error' }; }
      }
      const response = { data, status, statusText: String(status), headers, config, request: {} };
      if (status >= 200 && status < 300) resolve(response);
      else reject(new AxiosError(`Request failed with status code ${status}`, status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, response.request, response));
    }, LATENCY);
  });
}
