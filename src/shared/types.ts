export type MatchMode = 'user-id' | 'username' | 'display-name';
export type NotificationSoundId =
  | 'system'
  | 'soft-ping'
  | 'double-chime'
  | 'bright-pop'
  | 'urgent-pulse'
  | 'mm';

export type TrackedUser = {
  id: string;
  enabled: boolean;
  isDefault: boolean;
  discordUserId?: string;
  username?: string;
  displayName?: string;
  matchMode: MatchMode;
  serverId?: string;
  channelId?: string;
  showMessagePreview: boolean;
  playSound: boolean;
  notificationSound: NotificationSoundId;
};

export type StoredSettings = {
  schemaVersion: number;
  monitoringEnabled: boolean;
  trackedUsers: TrackedUser[];
};

export type ObservedDiscordMessage = {
  messageId?: string;
  authorUserId?: string;
  authorUsername?: string;
  authorDisplayName?: string;
  serverId?: string;
  serverName?: string;
  channelId?: string;
  channelName?: string;
  content?: string;
  observedAt: number;
};

export type PopupStatus = {
  monitoringEnabled: boolean;
  enabledTrackedUsers: number;
  defaultTrackedUsers: number;
  temporarilyEnabledUsers: number;
  disabledTrackedUsers: number;
  notificationPermission: 'granted' | 'denied' | 'unknown';
  discordStatus: 'not-detected' | 'structure-unrecognized' | 'active';
};

export type DiscordMessageObservedRuntimeMessage = {
  type: 'discord-message-observed';
  payload: ObservedDiscordMessage;
};

export type GetPopupStatusRuntimeMessage = {
  type: 'get-popup-status';
};

export type SetMonitoringEnabledRuntimeMessage = {
  type: 'set-monitoring-enabled';
  enabled: boolean;
};

export type TestNotificationRuntimeMessage = {
  type: 'test-notification';
  sound?: NotificationSoundId;
};

export type PlayNotificationSoundRuntimeMessage = {
  type: 'play-notification-sound';
  sound: NotificationSoundId;
};

export type CheckDiscordStructureRuntimeMessage = {
  type: 'check-discord-structure';
};

export type CheckDiscordStructureResponse = {
  ok: boolean;
};

export type RuntimeMessage =
  | DiscordMessageObservedRuntimeMessage
  | GetPopupStatusRuntimeMessage
  | SetMonitoringEnabledRuntimeMessage
  | TestNotificationRuntimeMessage
  | PlayNotificationSoundRuntimeMessage
  | CheckDiscordStructureRuntimeMessage;
