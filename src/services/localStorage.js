import { seedData } from '../data/seed';

const STORAGE_KEY = 'contracting_custody_data_v1';
const SESSION_KEY = 'contracting_custody_session_v1';
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzDJ4gGygDOAvlm4uGBocMJaEfUG0HImIrp7ANnlfoQlG1FtnYUb9p4V_KEc_b24p30cw/exec';
const GAS_TOKEN = 'token_312743_2026';

const clone = (value) => JSON.parse(JSON.stringify(value));
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const collectionToPrefix = {
  users: 'u',
  projects: 'p',
  userProjects: 'up',
  custodyAllocations: 'ca',
  transactions: 't'
};

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').replace(/^0+/, '');
const normalizePassword = (value) => String(value || '');

export function initializeData() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  }
}

export function getDatabase() {
  initializeData();
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const migrated = {
    custodyAllocations: [],
    ...data
  };
  if (!data.custodyAllocations) {
    saveDatabase(migrated);
  }
  return migrated;
}

export function saveDatabase(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('storage-updated'));
}

export async function apiRequest(action, payload = {}) {
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      token: GAS_TOKEN,
      action,
      payload
    })
  });
  return response.json();
}

export async function syncDatabaseFromRemote() {
  const result = await apiRequest('sync');
  if (!result.ok) {
    throw new Error(result.error || 'تعذر جلب البيانات من Google Sheets');
  }
  saveDatabase({
    users: result.data.users || [],
    projects: result.data.projects || [],
    userProjects: result.data.userProjects || [],
    custodyAllocations: result.data.custodyAllocations || [],
    transactions: result.data.transactions || []
  });
  return result.data;
}

function syncUpsert(collection, item) {
  const action = collection === 'transactions' ? 'addTransaction' : 'upsert';
  const normalizedItem = collection === 'users'
    ? { ...item, phone: String(item.phone || ''), password: String(item.password || '') }
    : item;
  const payload = collection === 'transactions'
    ? { record: normalizedItem }
    : { sheet: collection, record: normalizedItem };

  apiRequest(action, payload)
    .then((result) => {
      if (!result.ok) console.warn(result.error || 'تعذر حفظ البيانات في Google Sheets');
    })
    .catch((error) => console.warn('Google Sheets sync failed', error));
}

function syncDelete(collection, id) {
  apiRequest('delete', { sheet: collection, id })
    .then((result) => {
      if (!result.ok) console.warn(result.error || 'تعذر حذف البيانات من Google Sheets');
    })
    .catch((error) => console.warn('Google Sheets delete failed', error));
}

export function getCollection(name) {
  return getDatabase()[name] || [];
}

export function upsertRecord(collection, record, prefix) {
  const db = getDatabase();
  const list = db[collection] || [];
  const now = new Date().toISOString();
  const item = {
    ...record,
    id: record.id || makeId(prefix || collectionToPrefix[collection] || 'id'),
    createdAt: record.createdAt || now,
    updatedAt: now
  };
  const index = list.findIndex((entry) => entry.id === item.id);
  db[collection] = index >= 0 ? list.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...list];
  saveDatabase(db);
  syncUpsert(collection, item);
  return item;
}

export function deleteRecord(collection, id) {
  const db = getDatabase();
  db[collection] = (db[collection] || []).filter((entry) => entry.id !== id);
  saveDatabase(db);
  syncDelete(collection, id);
}

export function setUserProjects(userId, projectIds) {
  const db = getDatabase();
  const previousLinks = db.userProjects.filter((link) => link.userId === userId);
  const kept = db.userProjects.filter((link) => link.userId !== userId);
  const nextLinks = projectIds.map((projectId) => ({
    id: makeId('up'),
    userId,
    projectId
  }));
  db.userProjects = [...kept, ...nextLinks];
  saveDatabase(db);
  nextLinks.forEach((link) => syncUpsert('userProjects', link));
  previousLinks
    .filter((link) => !projectIds.includes(link.projectId))
    .forEach((link) => syncDelete('userProjects', link.id));
}

export function authenticate(phone, password) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedPassword = normalizePassword(password);
  const user = getCollection('users').find(
    (entry) => normalizePhone(entry.phone) === normalizedPhone &&
      normalizePassword(entry.password) === normalizedPassword &&
      entry.status === 'active'
  );
  if (!user) return null;
  localStorage.setItem(SESSION_KEY, user.id);
  return clone(user);
}

export function getSessionUser() {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return getCollection('users').find((user) => user.id === id) || null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function clearAndSeed() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  window.dispatchEvent(new Event('storage-updated'));
}
