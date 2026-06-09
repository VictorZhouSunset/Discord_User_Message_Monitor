import type { ObservedDiscordMessage, TrackedUser } from '../shared/types';
import { exactNormalizedMatch } from './normalize-identifier';

export function matchesScope(trackedUser: TrackedUser, message: ObservedDiscordMessage): boolean {
  if (trackedUser.serverId && trackedUser.serverId !== message.serverId) {
    return false;
  }

  if (trackedUser.channelId && trackedUser.channelId !== message.channelId) {
    return false;
  }

  return true;
}

function matchesUserIdentity(trackedUser: TrackedUser, message: ObservedDiscordMessage): boolean {
  if (trackedUser.discordUserId && message.authorUserId) {
    return trackedUser.discordUserId === message.authorUserId;
  }

  if (trackedUser.matchMode === 'user-id') {
    return (
      exactNormalizedMatch(trackedUser.username, message.authorUsername) ||
      exactNormalizedMatch(trackedUser.displayName, message.authorDisplayName)
    );
  }

  if (trackedUser.matchMode === 'username') {
    return exactNormalizedMatch(trackedUser.username, message.authorUsername);
  }

  return exactNormalizedMatch(trackedUser.displayName, message.authorDisplayName);
}

export function matchTrackedUser(
  trackedUsers: TrackedUser[],
  message: ObservedDiscordMessage,
): TrackedUser | undefined {
  return trackedUsers.find(
    (trackedUser) =>
      trackedUser.enabled && matchesScope(trackedUser, message) && matchesUserIdentity(trackedUser, message),
  );
}
