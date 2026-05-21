import { seedData } from '../data/seed';

const STORAGE_KEY = 'contracting_custody_data_v1';
const SESSION_KEY = 'contracting_custody_session_v1';

const clone = (value) => JSON.parse(JSON.stringify(value));
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

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

export function getCollection(name) {
  return getDatabase()[name] || [];
}

export function upsertRecord(collection, record, prefix) {
  const db = getDatabase();
  const list = db[collection] || [];
  const now = new Date().toISOString();
  const item = {
    ...record,
    id: record.id || makeId(prefix),
    createdAt: record.createdAt || now,
    updatedAt: now
  };
  const index = list.findIndex((entry) => entry.id === item.id);
  db[collection] = index >= 0 ? list.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...list];
  saveDatabase(db);
  return item;
}

export function deleteRecord(collection, id) {
  const db = getDatabase();
  db[collection] = (db[collection] || []).filter((entry) => entry.id !== id);
  saveDatabase(db);
}

export function setUserProjects(userId, projectIds) {
  const db = getDatabase();
  const kept = db.userProjects.filter((link) => link.userId !== userId);
  const nextLinks = projectIds.map((projectId) => ({
    id: makeId('up'),
    userId,
    projectId
  }));
  db.userProjects = [...kept, ...nextLinks];
  saveDatabase(db);
}

export function authenticate(phone, password) {
  const user = getCollection('users').find(
    (entry) => entry.phone === phone && entry.password === password && entry.status === 'active'
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
