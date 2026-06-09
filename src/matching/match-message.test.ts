import { describe, expect, it } from 'vitest';
import type { ObservedDiscordMessage, TrackedUser } from '../shared/types';
import { matchTrackedUser, matchesScope } from './match-message';
import { exactNormalizedMatch, normalizeIdentifier } from './normalize-identifier';

const baseUser: TrackedUser = {
  id: 'config-1',
  enabled: true,
  isDefault: true,
  discordUserId: '111',
  username: 'Alice',
  displayName: 'Alice Display',
  matchMode: 'user-id',
  showMessagePreview: false,
  playSound: true,
  notificationSound: 'soft-ping',
};

const baseMessage: ObservedDiscordMessage = {
  messageId: 'm1',
  authorUserId: '111',
  authorUsername: 'alice',
  authorDisplayName: 'Alice Display',
  serverId: 'server-1',
  channelId: 'channel-1',
  observedAt: 1,
};

describe('identifier normalization', () => {
  it('trims and lowercases identifiers', () => {
    expect(normalizeIdentifier(' Alice ')).toBe('alice');
    expect(exactNormalizedMatch(' Alice ', 'alice')).toBe(true);
  });

  it('does not perform substring matching', () => {
    expect(exactNormalizedMatch('Ali', 'Alice')).toBe(false);
  });
});

describe('message matching', () => {
  it('prefers user ID matching when IDs are available', () => {
    expect(matchTrackedUser([baseUser], baseMessage)).toEqual(baseUser);
  });

  it('falls back from user-id mode to exact username when message user ID is unavailable', () => {
    const message = { ...baseMessage, authorUserId: undefined };
    expect(matchTrackedUser([baseUser], message)).toEqual(baseUser);
  });

  it('matches exact display names when configured', () => {
    const user = { ...baseUser, discordUserId: undefined, matchMode: 'display-name' as const };
    expect(matchTrackedUser([user], baseMessage)).toEqual(user);
  });

  it('ignores disabled tracked users', () => {
    expect(matchTrackedUser([{ ...baseUser, enabled: false }], baseMessage)).toBeUndefined();
  });

  it('respects server and channel scope', () => {
    expect(matchesScope({ ...baseUser, serverId: 'server-1', channelId: 'channel-1' }, baseMessage)).toBe(true);
    expect(matchesScope({ ...baseUser, serverId: 'server-2' }, baseMessage)).toBe(false);
    expect(matchesScope({ ...baseUser, channelId: 'channel-2' }, baseMessage)).toBe(false);
  });
});
