import { beforeEach, describe, expect, it } from 'vitest';
import { SETTINGS_STORAGE_KEY, STARTUP_SESSION_INITIALIZED_KEY } from '../shared/constants';
import type { StoredSettings } from '../shared/types';
import { loadSettings, saveSettings } from '../storage/settings-repository';
import { ensureStartupDeactivation } from './startup-deactivation';

function createStorageArea(store: Record<string, unknown>): chrome.storage.StorageArea {
  const area = {
    get: (key: string, callback: (items: Record<string, unknown>) => void) => {
      callback({ [key]: store[key] });
    },
    set: (items: Record<string, unknown>, callback?: () => void) => {
      Object.assign(store, items);
      callback?.();
    },
    remove: (key: string, callback?: () => void) => {
      delete store[key];
      callback?.();
    },
  };

  return area as unknown as chrome.storage.StorageArea;
}

function installChromeStorageMock(): {
  localStore: Record<string, unknown>;
  sessionStore: Record<string, unknown>;
} {
  const localStore: Record<string, unknown> = {};
  const sessionStore: Record<string, unknown> = {};

  globalThis.chrome = {
    storage: {
      local: createStorageArea(localStore) as chrome.storage.StorageArea,
      session: createStorageArea(sessionStore) as chrome.storage.StorageArea,
    },
  } as typeof chrome;

  return { localStore, sessionStore };
}

const settings: StoredSettings = {
  schemaVersion: 1,
  monitoringEnabled: true,
  trackedUsers: [
    {
      id: 'default-enabled',
      enabled: true,
      isDefault: true,
      username: 'default-user',
      matchMode: 'username',
      showMessagePreview: false,
      playSound: true,
    },
    {
      id: 'temporary-enabled',
      enabled: true,
      isDefault: false,
      username: 'temporary-user',
      matchMode: 'username',
      showMessagePreview: false,
      playSound: true,
    },
    {
      id: 'saved-disabled',
      enabled: false,
      isDefault: false,
      username: 'disabled-user',
      matchMode: 'username',
      showMessagePreview: false,
      playSound: true,
    },
  ],
};

describe('startup deactivation', () => {
  beforeEach(() => {
    installChromeStorageMock();
  });

  it('disables enabled non-default users during a cold session start', async () => {
    await saveSettings(settings);
    await ensureStartupDeactivation();

    const loaded = await loadSettings();

    expect(loaded.trackedUsers).toEqual([
      expect.objectContaining({ id: 'default-enabled', enabled: true }),
      expect.objectContaining({ id: 'temporary-enabled', enabled: false }),
      expect.objectContaining({ id: 'saved-disabled', enabled: false }),
    ]);
  });

  it('marks the browser session initialized after cold-start cleanup', async () => {
    const { sessionStore } = installChromeStorageMock();
    await saveSettings(settings);
    await ensureStartupDeactivation();

    expect(sessionStore[STARTUP_SESSION_INITIALIZED_KEY]).toBe(true);
  });

  it('preserves temporary enabled users after the same session has initialized', async () => {
    const { localStore, sessionStore } = installChromeStorageMock();
    sessionStore[STARTUP_SESSION_INITIALIZED_KEY] = true;
    await saveSettings(settings);
    await ensureStartupDeactivation();

    const stored = localStore[SETTINGS_STORAGE_KEY] as StoredSettings;
    expect(stored.trackedUsers.find((user) => user.id === 'temporary-enabled')?.enabled).toBe(true);
  });
});
