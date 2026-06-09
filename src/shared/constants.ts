export const SETTINGS_SCHEMA_VERSION = 1;
export const SETTINGS_STORAGE_KEY = 'discordUserActivityNotifier.settings';
export const DUPLICATE_CACHE_STORAGE_KEY = 'discordUserActivityNotifier.duplicateCache';
export const STARTUP_SESSION_INITIALIZED_KEY = 'discordUserActivityNotifier.sessionInitialized';
export const DUPLICATE_CACHE_MAX_ENTRIES = 100;
export const MESSAGE_PREVIEW_MAX_LENGTH = 140;
export const DISCORD_CHANNELS_MATCH_PATTERN = 'https://discord.com/channels/*';

export const DEFAULT_SETTINGS = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  monitoringEnabled: true,
  trackedUsers: [],
} as const;
