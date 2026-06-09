import { DUPLICATE_CACHE_MAX_ENTRIES, DUPLICATE_CACHE_STORAGE_KEY } from '../shared/constants';
import type { ObservedDiscordMessage } from '../shared/types';

type DuplicateCacheEntry = {
  key: string;
  seenAt: number;
};

type DuplicateCacheState = {
  entries: DuplicateCacheEntry[];
};

const IN_MEMORY_CACHE_MAX_ENTRIES = DUPLICATE_CACHE_MAX_ENTRIES * 2;
const inMemorySeen = new Map<string, number>();
const pendingStorageWrites = new Set<string>();

function storageSession(): chrome.storage.StorageArea | undefined {
  return globalThis.chrome?.storage?.session;
}

function stablePart(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? '';
}

export function createMessageDeduplicationKey(message: ObservedDiscordMessage): string {
  if (message.messageId) {
    return `message:${message.messageId}`;
  }

  return [
    'hash',
    stablePart(message.authorUserId),
    stablePart(message.authorUsername),
    stablePart(message.channelId),
    stablePart(message.content),
  ].join('|');
}

function normalizeCacheState(value: unknown): DuplicateCacheState {
  if (typeof value !== 'object' || value === null || !('entries' in value)) {
    return { entries: [] };
  }

  const entriesValue = (value as { entries: unknown }).entries;
  if (!Array.isArray(entriesValue)) {
    return { entries: [] };
  }

  const entries = entriesValue
    .filter((entry): entry is DuplicateCacheEntry => {
      return (
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as DuplicateCacheEntry).key === 'string' &&
        typeof (entry as DuplicateCacheEntry).seenAt === 'number'
      );
    })
    .slice(-DUPLICATE_CACHE_MAX_ENTRIES);

  return { entries };
}

function rememberInMemoryKey(key: string): void {
  inMemorySeen.set(key, Date.now());
  pruneInMemorySeen();
}

function pruneInMemorySeen(): void {
  while (inMemorySeen.size > IN_MEMORY_CACHE_MAX_ENTRIES) {
    let pruned = false;
    for (const key of inMemorySeen.keys()) {
      if (!pendingStorageWrites.has(key)) {
        inMemorySeen.delete(key);
        pruned = true;
        break;
      }
    }

    if (!pruned) {
      return;
    }
  }
}

async function readCache(): Promise<DuplicateCacheState> {
  const storage = storageSession();
  if (!storage) {
    return { entries: [] };
  }

  return new Promise((resolve) => {
    storage.get(DUPLICATE_CACHE_STORAGE_KEY, (items) => {
      resolve(normalizeCacheState((items as Record<string, unknown>)[DUPLICATE_CACHE_STORAGE_KEY]));
    });
  });
}

async function writeCache(cache: DuplicateCacheState): Promise<void> {
  const storage = storageSession();
  if (!storage) {
    return;
  }

  const bounded = {
    entries: cache.entries.slice(-DUPLICATE_CACHE_MAX_ENTRIES),
  };

  await new Promise<void>((resolve) => {
    storage.set({ [DUPLICATE_CACHE_STORAGE_KEY]: bounded }, () => resolve());
  });
}

export async function hasSeenMessage(message: ObservedDiscordMessage): Promise<boolean> {
  const key = createMessageDeduplicationKey(message);
  const cache = await readCache();
  return cache.entries.some((entry) => entry.key === key);
}

export async function markMessageSeen(message: ObservedDiscordMessage): Promise<void> {
  const key = createMessageDeduplicationKey(message);
  const cache = await readCache();
  const entries = cache.entries.filter((entry) => entry.key !== key);
  entries.push({ key, seenAt: Date.now() });
  await writeCache({ entries });
}

export async function checkAndMarkMessageSeen(message: ObservedDiscordMessage): Promise<boolean> {
  const key = createMessageDeduplicationKey(message);
  if (inMemorySeen.has(key)) {
    return true;
  }

  rememberInMemoryKey(key);
  pendingStorageWrites.add(key);

  try {
    const cache = await readCache();
    if (cache.entries.some((entry) => entry.key === key)) {
      return true;
    }

    const entries = cache.entries.filter((entry) => entry.key !== key);
    entries.push({ key, seenAt: Date.now() });
    await writeCache({ entries });
    return false;
  } finally {
    pendingStorageWrites.delete(key);
    pruneInMemorySeen();
  }
}

export function resetDuplicateCacheMemoryForTest(): void {
  inMemorySeen.clear();
  pendingStorageWrites.clear();
}

export function getDuplicateCacheMemorySizeForTest(): number {
  return inMemorySeen.size;
}
