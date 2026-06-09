import { SETTINGS_STORAGE_KEY } from '../shared/constants';
import type { StoredSettings } from '../shared/types';
import { createDefaultSettings, validateAndMigrateSettings } from './schema';

function storageLocal(): chrome.storage.StorageArea | undefined {
  return globalThis.chrome?.storage?.local;
}

function getFromStorage(key: string): Promise<Record<string, unknown>> {
  const storage = storageLocal();
  if (!storage) {
    return Promise.resolve({});
  }

  return new Promise((resolve) => {
    storage.get(key, (items) => resolve(items as Record<string, unknown>));
  });
}

function setInStorage(items: Record<string, unknown>): Promise<void> {
  const storage = storageLocal();
  if (!storage) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    storage.set(items, () => resolve());
  });
}

function clearStorage(): Promise<void> {
  const storage = storageLocal();
  if (!storage) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    storage.remove(SETTINGS_STORAGE_KEY, () => resolve());
  });
}

export async function loadSettings(): Promise<StoredSettings> {
  const items = await getFromStorage(SETTINGS_STORAGE_KEY);
  const { settings, changed } = validateAndMigrateSettings(items[SETTINGS_STORAGE_KEY]);

  if (changed) {
    await saveSettings(settings);
  }

  return settings;
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
  await setInStorage({ [SETTINGS_STORAGE_KEY]: validateAndMigrateSettings(settings).settings });
}

export async function updateSettings(
  updater: (settings: StoredSettings) => StoredSettings,
): Promise<StoredSettings> {
  const current = await loadSettings();
  const next = validateAndMigrateSettings(updater(current)).settings;
  await saveSettings(next);
  return next;
}

export async function resetSettings(): Promise<StoredSettings> {
  await clearStorage();
  return createDefaultSettings();
}
