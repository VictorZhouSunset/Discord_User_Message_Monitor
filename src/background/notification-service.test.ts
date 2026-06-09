import { describe, expect, it } from 'vitest';
import type { ObservedDiscordMessage, TrackedUser } from '../shared/types';
import { createNotificationMessage, truncateMessagePreview } from './notification-service';

const user: TrackedUser = {
  id: 'tracked-1',
  enabled: true,
  isDefault: true,
  username: 'alice',
  matchMode: 'username',
  showMessagePreview: true,
  playSound: true,
};

const message: ObservedDiscordMessage = {
  authorUsername: 'alice',
  serverName: 'Project Server',
  channelName: 'general',
  content: 'Deployment finished successfully.',
  observedAt: Date.now(),
};

describe('notification service', () => {
  it('truncates long message previews', () => {
    const preview = truncateMessagePreview('a'.repeat(200));
    expect(preview).toHaveLength(140);
    expect(preview?.endsWith('...')).toBe(true);
  });

  it('omits previews when disabled', () => {
    expect(createNotificationMessage({ ...user, showMessagePreview: false }, message)).toBe(
      'alice posted in Project Server / general',
    );
  });

  it('includes short previews when enabled', () => {
    expect(createNotificationMessage(user, message)).toContain('"Deployment finished successfully."');
  });
});
