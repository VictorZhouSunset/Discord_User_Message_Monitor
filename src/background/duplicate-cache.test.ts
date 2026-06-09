import { beforeEach, describe, expect, it } from 'vitest';
import { DUPLICATE_CACHE_MAX_ENTRIES, DUPLICATE_CACHE_STORAGE_KEY } from '../shared/constants';
import type { ObservedDiscordMessage } from '../shared/types';
import {
  checkAndMarkMessageSeen,
  createMessageDeduplicationKey,
  getDuplicateCacheMemorySizeForTest,
  hasSeenMessage,
  markMessageSeen,
  resetDuplicateCacheMemoryForTest,
} from './duplicate-cache';

function installChromeStorageMock(initialStore: Record<string, unknown> = {}): Record<string, unknown> {
  const store: Record<string, unknown> = { ...initialStore };
  const storageArea = {
    get: (key: string, callback: (items: Record<string, unknown>) => void) => {
      callback({ [key]: store[key] });
    },
    set: (items: Record<string, unknown>, callback?: () => void) => {
      Object.assign(store, items);
      callback?.();
    },
  };

  globalThis.chrome = {
    storage: {
      session: storageArea as chrome.storage.StorageArea,
    },
  } as typeof chrome;

  return store;
}

const message: ObservedDiscordMessage = {
  messageId: 'message-1',
  authorUserId: 'user-1',
  channelId: 'channel-1',
  content: 'Hello',
  observedAt: 10_000,
};

describe('duplicate cache', () => {
  beforeEach(() => {
    resetDuplicateCacheMemoryForTest();
    installChromeStorageMock();
  });

  it('uses message IDs as the preferred cache key', () => {
    expect(createMessageDeduplicationKey(message)).toBe('message:message-1');
  });

  it('falls back to a composite hash when message ID is missing', () => {
    expect(createMessageDeduplicationKey({ ...message, messageId: undefined })).toContain('hash|user-1');
  });

  it('keeps fallback keys stable across rerenders observed at different times', () => {
    const firstKey = createMessageDeduplicationKey({
      ...message,
      messageId: undefined,
      observedAt: 10_000,
    });
    const secondKey = createMessageDeduplicationKey({
      ...message,
      messageId: undefined,
      observedAt: 30_000,
    });

    expect(secondKey).toBe(firstKey);
  });

  it('persists seen messages in chrome.storage.session', async () => {
    expect(await hasSeenMessage(message)).toBe(false);
    await markMessageSeen(message);
    expect(await hasSeenMessage(message)).toBe(true);
  });

  it('bounds the session cache size', async () => {
    const store = installChromeStorageMock();
    for (let index = 0; index < DUPLICATE_CACHE_MAX_ENTRIES + 5; index += 1) {
      await markMessageSeen({ ...message, messageId: `message-${index}` });
    }

    const cache = store[DUPLICATE_CACHE_STORAGE_KEY] as { entries: unknown[] };
    expect(cache.entries).toHaveLength(DUPLICATE_CACHE_MAX_ENTRIES);
  });

  it('atomically blocks concurrent duplicate checks before session storage writes finish', async () => {
    const concurrentMessage = { ...message, messageId: 'concurrent-message' };

    const [firstResult, secondResult] = await Promise.all([
      checkAndMarkMessageSeen(concurrentMessage),
      checkAndMarkMessageSeen(concurrentMessage),
    ]);

    expect(firstResult).toBe(false);
    expect(secondResult).toBe(true);
  });

  it('treats session-stored keys as already seen', async () => {
    const storedMessage = { ...message, messageId: 'stored-message' };
    const store = installChromeStorageMock({
      [DUPLICATE_CACHE_STORAGE_KEY]: {
        entries: [{ key: createMessageDeduplicationKey(storedMessage), seenAt: Date.now() }],
      },
    });

    expect(await checkAndMarkMessageSeen(storedMessage)).toBe(true);
    expect(store[DUPLICATE_CACHE_STORAGE_KEY]).toEqual({
      entries: [{ key: createMessageDeduplicationKey(storedMessage), seenAt: expect.any(Number) }],
    });
  });

  it('bounds the in-memory duplicate cache after storage writes complete', async () => {
    for (let index = 0; index < DUPLICATE_CACHE_MAX_ENTRIES * 2 + 5; index += 1) {
      await checkAndMarkMessageSeen({ ...message, messageId: `memory-message-${index}` });
    }

    expect(getDuplicateCacheMemorySizeForTest()).toBe(DUPLICATE_CACHE_MAX_ENTRIES * 2);
  });
});
