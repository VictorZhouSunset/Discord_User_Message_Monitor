import { DEFAULT_NOTIFICATION_SOUND, DEFAULT_SETTINGS, NOTIFICATION_SOUNDS, SETTINGS_SCHEMA_VERSION } from '../shared/constants';
import type { MatchMode, NotificationSoundId, StoredSettings, TrackedUser } from '../shared/types';

const MATCH_MODES = new Set<MatchMode>(['user-id', 'username', 'display-name']);
const NOTIFICATION_SOUND_IDS = new Set<NotificationSoundId>(
  NOTIFICATION_SOUNDS.map((sound) => sound.id),
);

export type SettingsValidationResult = {
  settings: StoredSettings;
  changed: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(record: Record<string, unknown>, key: string): {
  value: string | undefined;
  changed: boolean;
} {
  if (!(key in record)) {
    return { value: undefined, changed: false };
  }

  const rawValue = record[key];
  if (typeof rawValue !== 'string') {
    return { value: undefined, changed: true };
  }

  const trimmed = rawValue.trim();
  const value = trimmed.length > 0 ? trimmed : undefined;
  return { value, changed: value !== rawValue };
}

function requiredBoolean(record: Record<string, unknown>, key: string, fallback: boolean): {
  value: boolean;
  changed: boolean;
} {
  const rawValue = record[key];
  if (typeof rawValue === 'boolean') {
    return { value: rawValue, changed: false };
  }

  return { value: fallback, changed: true };
}

function parseMatchMode(record: Record<string, unknown>): {
  value: MatchMode;
  changed: boolean;
} {
  const rawValue = record.matchMode;
  if (typeof rawValue === 'string' && MATCH_MODES.has(rawValue as MatchMode)) {
    return { value: rawValue as MatchMode, changed: false };
  }

  return { value: 'username', changed: true };
}

function parseNotificationSound(record: Record<string, unknown>): {
  value: NotificationSoundId;
  changed: boolean;
} {
  const rawValue = record.notificationSound;
  if (typeof rawValue === 'string' && NOTIFICATION_SOUND_IDS.has(rawValue as NotificationSoundId)) {
    return { value: rawValue as NotificationSoundId, changed: false };
  }

  return { value: DEFAULT_NOTIFICATION_SOUND, changed: true };
}

function parseTrackedUser(value: unknown): {
  user?: TrackedUser;
  changed: boolean;
} {
  if (!isRecord(value)) {
    return { changed: true };
  }

  const id = optionalString(value, 'id');
  if (!id.value) {
    return { changed: true };
  }

  const enabled = requiredBoolean(value, 'enabled', true);
  const isDefault = requiredBoolean(value, 'isDefault', false);
  const discordUserId = optionalString(value, 'discordUserId');
  const username = optionalString(value, 'username');
  const displayName = optionalString(value, 'displayName');
  const matchMode = parseMatchMode(value);
  const serverId = optionalString(value, 'serverId');
  const channelId = optionalString(value, 'channelId');
  const showMessagePreview = requiredBoolean(value, 'showMessagePreview', false);
  const playSound = requiredBoolean(value, 'playSound', true);
  const notificationSound = parseNotificationSound(value);
  const changed = [
    id,
    enabled,
    isDefault,
    discordUserId,
    username,
    displayName,
    matchMode,
    serverId,
    channelId,
    showMessagePreview,
    playSound,
    notificationSound,
  ].some((parsed) => parsed.changed);

  return {
    user: {
      id: id.value,
      enabled: enabled.value,
      isDefault: isDefault.value,
      discordUserId: discordUserId.value,
      username: username.value,
      displayName: displayName.value,
      matchMode: matchMode.value,
      serverId: serverId.value,
      channelId: channelId.value,
      showMessagePreview: showMessagePreview.value,
      playSound: playSound.value,
      notificationSound: notificationSound.value,
    },
    changed,
  };
}

export function createDefaultSettings(): StoredSettings {
  return {
    ...DEFAULT_SETTINGS,
    trackedUsers: [],
  };
}

export function validateAndMigrateSettings(value: unknown): SettingsValidationResult {
  if (!isRecord(value)) {
    return { settings: createDefaultSettings(), changed: true };
  }

  const schemaVersion =
    typeof value.schemaVersion === 'number' && Number.isInteger(value.schemaVersion)
      ? value.schemaVersion
      : 0;
  let changed = schemaVersion !== SETTINGS_SCHEMA_VERSION;

  const monitoringEnabled = requiredBoolean(value, 'monitoringEnabled', true);
  changed ||= monitoringEnabled.changed;

  const parsedTrackedUsers = Array.isArray(value.trackedUsers)
    ? value.trackedUsers.map(parseTrackedUser)
    : [];
  changed ||= !Array.isArray(value.trackedUsers);
  changed ||= parsedTrackedUsers.some((item) => item.changed || !item.user);

  const trackedUsers = parsedTrackedUsers
    .map((item) => item.user)
    .filter((item): item is TrackedUser => Boolean(item));

  const settings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    monitoringEnabled: monitoringEnabled.value,
    trackedUsers: trackedUsers.map((user) => ({
      ...user,
      isDefault: schemaVersion < 1 ? user.enabled : user.isDefault,
    })),
  };

  return { settings, changed };
}
