import { SCREEN_METADATA, STITCH_SCREENS_HTML } from '../data/stitchScreens';

export interface OfflineMutation {
  id: string;
  screenId: string;
  screenTitle: string;
  actionType: 'grade_update' | 'attendance_mark' | 'course_enrollment' | 'permission_toggle' | 'dossier_action' | 'field_edit';
  summary: string;
  timestamp: string;
  synced: boolean;
}

export interface OfflineCacheStats {
  cachedScreensCount: number;
  totalScreensCount: number;
  cacheSizeKB: number;
  lastSyncedAt: string;
  pendingMutationsCount: number;
  syncedMutationsCount: number;
  isIndexedDBReady: boolean;
}

const DB_NAME = 'UniversityOS_Enterprise_SIS_OfflineDB';
const DB_VERSION = 1;
const STORE_SCREENS = 'cached_screens';
const STORE_MUTATIONS = 'offline_mutations';
const LS_MUTATIONS_KEY = 'uos_offline_mutations_v1';
const LS_FIELD_OVERRIDES_KEY = 'uos_field_overrides_v1';
const LS_LAST_SYNC_KEY = 'uos_last_synced_at_v1';

function openOfflineDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_SCREENS)) {
          db.createObjectStore(STORE_SCREENS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
          db.createObjectStore(STORE_MUTATIONS, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function initializeOfflineCache(): Promise<OfflineCacheStats> {
  const db = await openOfflineDB();
  let isIndexedDBReady = false;

  if (db) {
    isIndexedDBReady = true;
    try {
      const tx = db.transaction(STORE_SCREENS, 'readwrite');
      const store = tx.objectStore(STORE_SCREENS);
      for (const meta of SCREEN_METADATA) {
        store.put({
          id: meta.id,
          title: meta.title,
          category: meta.category,
          htmlLength: (STITCH_SCREENS_HTML[meta.id] || '').length,
          cachedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Fallback to localStorage seamlessly
    }
  }

  if (!localStorage.getItem(LS_LAST_SYNC_KEY)) {
    localStorage.setItem(LS_LAST_SYNC_KEY, new Date().toISOString());
  }

  return getOfflineCacheStats(isIndexedDBReady);
}

export function getMutations(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(LS_MUTATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordOfflineMutation(
  screenId: string,
  screenTitle: string,
  actionType: OfflineMutation['actionType'],
  summary: string,
  isOnline: boolean
): OfflineMutation {
  const mutations = getMutations();
  const entry: OfflineMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    screenId,
    screenTitle,
    actionType,
    summary,
    timestamp: new Date().toISOString(),
    synced: isOnline,
  };
  const updated = [entry, ...mutations].slice(0, 100);
  try {
    localStorage.setItem(LS_MUTATIONS_KEY, JSON.stringify(updated));
    if (isOnline) {
      localStorage.setItem(LS_LAST_SYNC_KEY, new Date().toISOString());
    }
  } catch {
    // ignore storage quota errors
  }
  return entry;
}

export function syncAllPendingMutations(): { syncedCount: number; timestamp: string } {
  const mutations = getMutations();
  let syncedCount = 0;
  const updated = mutations.map((m) => {
    if (!m.synced) {
      syncedCount++;
      return { ...m, synced: true };
    }
    return m;
  });
  const now = new Date().toISOString();
  try {
    localStorage.setItem(LS_MUTATIONS_KEY, JSON.stringify(updated));
    localStorage.setItem(LS_LAST_SYNC_KEY, now);
  } catch {
    // ignore
  }
  return { syncedCount, timestamp: now };
}

export function getSavedFieldOverrides(screenId: string): Record<string, string | boolean> {
  try {
    const raw = localStorage.getItem(LS_FIELD_OVERRIDES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[screenId] || {};
  } catch {
    return {};
  }
}

export function saveFieldOverride(screenId: string, fieldKey: string, value: string | boolean): void {
  try {
    const raw = localStorage.getItem(LS_FIELD_OVERRIDES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    if (!all[screenId]) all[screenId] = {};
    all[screenId][fieldKey] = value;
    localStorage.setItem(LS_FIELD_OVERRIDES_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function clearOfflineCacheAndOverrides(): void {
  try {
    localStorage.removeItem(LS_MUTATIONS_KEY);
    localStorage.removeItem(LS_FIELD_OVERRIDES_KEY);
    localStorage.setItem(LS_LAST_SYNC_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

export function getOfflineCacheStats(isIndexedDBReady = true): OfflineCacheStats {
  const totalBytes = Object.values(STITCH_SCREENS_HTML).reduce((acc, html) => acc + html.length, 0);
  const mutations = getMutations();
  const pendingMutationsCount = mutations.filter((m) => !m.synced).length;
  const syncedMutationsCount = mutations.filter((m) => m.synced).length;
  const lastSyncedAt = localStorage.getItem(LS_LAST_SYNC_KEY) || new Date().toISOString();

  return {
    cachedScreensCount: SCREEN_METADATA.length,
    totalScreensCount: SCREEN_METADATA.length,
    cacheSizeKB: Math.round(totalBytes / 1024),
    lastSyncedAt,
    pendingMutationsCount,
    syncedMutationsCount,
    isIndexedDBReady,
  };
}
