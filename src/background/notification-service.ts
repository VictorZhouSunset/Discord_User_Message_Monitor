import { MESSAGE_PREVIEW_MAX_LENGTH } from '../shared/constants';
import type { ObservedDiscordMessage, TrackedUser } from '../shared/types';

function notificationsApi(): typeof chrome.notifications | undefined {
  return globalThis.chrome?.notifications;
}

export function truncateMessagePreview(content: string | undefined): string | undefined {
  const trimmed = content?.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length <= MESSAGE_PREVIEW_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX_LENGTH - 3)}...`;
}

export function createNotificationMessage(
  trackedUser: TrackedUser,
  message: ObservedDiscordMessage,
): string {
  const sender =
    message.authorDisplayName ?? message.authorUsername ?? trackedUser.displayName ?? trackedUser.username ?? 'Someone';
  const location = [message.serverName, message.channelName].filter(Boolean).join(' / ');
  const locationText = location ? ` in ${location}` : '';
  const preview = trackedUser.showMessagePreview ? truncateMessagePreview(message.content) : undefined;
  return preview ? `${sender} posted${locationText}\n\n"${preview}"` : `${sender} posted${locationText}`;
}

export async function createDiscordNotification(
  trackedUser: TrackedUser,
  message: ObservedDiscordMessage,
): Promise<void> {
  const notifications = notificationsApi();
  if (!notifications) {
    return;
  }

  const notificationId = `discord-activity-${message.messageId ?? Date.now().toString()}`;
  const options: chrome.notifications.NotificationOptions<true> = {
    type: 'basic',
    iconUrl: 'icon.svg',
    title: 'Discord message alert',
    message: createNotificationMessage(trackedUser, message),
    silent: !trackedUser.playSound,
  };

  await new Promise<void>((resolve) => {
    notifications.create(notificationId, options, () => resolve());
  });
}

export async function createTestNotification(): Promise<void> {
  const notifications = notificationsApi();
  if (!notifications) {
    return;
  }

  await new Promise<void>((resolve) => {
    notifications.create(
      `discord-activity-test-${Date.now()}`,
      {
        type: 'basic',
        iconUrl: 'icon.svg',
        title: 'Discord message alert',
        message: 'Notifications are available. System sound is controlled by your browser and OS settings.',
        silent: false,
      },
      () => resolve(),
    );
  });
}
