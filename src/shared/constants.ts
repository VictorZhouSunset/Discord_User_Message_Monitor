export const SETTINGS_SCHEMA_VERSION = 1;
export const SETTINGS_STORAGE_KEY = 'discordUserActivityNotifier.settings';
export const DUPLICATE_CACHE_STORAGE_KEY = 'discordUserActivityNotifier.duplicateCache';
export const STARTUP_SESSION_INITIALIZED_KEY = 'discordUserActivityNotifier.sessionInitialized';
export const DUPLICATE_CACHE_MAX_ENTRIES = 100;
export const MESSAGE_PREVIEW_MAX_LENGTH = 140;
export const DISCORD_CHANNELS_MATCH_PATTERN = 'https://discord.com/channels/*';
export const DEFAULT_NOTIFICATION_SOUND = 'soft-ping';

export const NOTIFICATION_SOUNDS = [
  { id: 'soft-ping', label: 'Soft ping' },
  { id: 'double-chime', label: 'Double chime' },
  { id: 'bright-pop', label: 'Bright pop' },
  { id: 'urgent-pulse', label: 'Urgent pulse' },
  { id: 'system', label: 'System default' },
] as const;

export const DEFAULT_SETTINGS = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  monitoringEnabled: true,
  trackedUsers: [],
} as const;
