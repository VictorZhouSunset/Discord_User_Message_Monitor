export type MatchMode = 'user-id' | 'username' | 'display-name';

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
};

export type RuntimeMessage =
  | DiscordMessageObservedRuntimeMessage
  | GetPopupStatusRuntimeMessage
  | SetMonitoringEnabledRuntimeMessage
  | TestNotificationRuntimeMessage;
