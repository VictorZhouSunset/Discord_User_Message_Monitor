import { beforeEach, describe, expect, it } from 'vitest';
import { SETTINGS_STORAGE_KEY } from '../shared/constants';
import type { StoredSettings } from '../shared/types';
import { createDefaultSettings } from './schema';
import { loadSettings } from './settings-repository';

function installChromeStorageMock(initialStore: Record<string, unknown> = {}): {
  store: Record<string, unknown>;
  setCalls: Record<string, unknown>[];
} {
  const store: Record<string, unknown> = { ...initialStore };
  const setCalls: Record<string, unknown>[] = [];
  const storageArea = {
    get: (key: string, callback: (items: Record<string, unknown>) => void) => {
      callback({ [key]: store[key] });
    },
    set: (items: Record<string, unknown>, callback?: () => void) => {
      setCalls.push(items);
      Object.assign(store, items);
      callback?.();
    },
    remove: (key: string, callback?: () => void) => {
      delete store[key];
      callback?.();
    },
  };

  globalThis.chrome = {
    storage: {
      local: storageArea as chrome.storage.StorageArea,
    },
  } as typeof chrome;

  return { store, setCalls };
}

describe('settings repository', () => {
  beforeEach(() => {
    installChromeStorageMock();
  });

  it('does not write back current valid settings during load', async () => {
    const settings = createDefaultSettings();
    const { setCalls } = installChromeStorageMock({ [SETTINGS_STORAGE_KEY]: settings });

    await expect(loadSettings()).resolves.toEqual(settings);
    expect(setCalls).toHaveLength(0);
  });

  it('writes back migrated settings during load', async () => {
    const legacySettings = {
      schemaVersion: 0,
      monitoringEnabled: true,
      trackedUsers: [{ id: 'tracked-1', enabled: true, username: 'Alice', matchMode: 'username' }],
    };
    const { store, setCalls } = installChromeStorageMock({ [SETTINGS_STORAGE_KEY]: legacySettings });

    const loaded = await loadSettings();

    expect(setCalls).toHaveLength(1);
    expect(loaded.trackedUsers[0]?.isDefault).toBe(true);
    expect((store[SETTINGS_STORAGE_KEY] as StoredSettings).trackedUsers[0]?.isDefault).toBe(true);
  });
});
