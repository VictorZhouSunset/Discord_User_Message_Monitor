import { STARTUP_SESSION_INITIALIZED_KEY } from '../shared/constants';
import { updateSettings } from '../storage/settings-repository';

function storageSession(): chrome.storage.StorageArea | undefined {
  return globalThis.chrome?.storage?.session;
}

function readSessionInitialized(session: chrome.storage.StorageArea): Promise<boolean> {
  return new Promise((resolve) => {
    session.get(STARTUP_SESSION_INITIALIZED_KEY, (items) => {
      resolve(Boolean((items as Record<string, unknown>)[STARTUP_SESSION_INITIALIZED_KEY]));
    });
  });
}

function markSessionInitialized(session: chrome.storage.StorageArea): Promise<void> {
  return new Promise((resolve) => {
    session.set({ [STARTUP_SESSION_INITIALIZED_KEY]: true }, () => resolve());
  });
}

export async function ensureStartupDeactivation(): Promise<void> {
  const session = storageSession();
  if (!session) {
    return;
  }

  if (await readSessionInitialized(session)) {
    return;
  }

  await updateSettings((settings) => ({
    ...settings,
    trackedUsers: settings.trackedUsers.map((user) =>
      user.enabled && !user.isDefault ? { ...user, enabled: false } : user,
    ),
  }));

  await markSessionInitialized(session);
}
