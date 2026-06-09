import { checkAndMarkMessageSeen } from './duplicate-cache';
import { createDiscordNotification, createTestNotification } from './notification-service';
import { ensureStartupDeactivation } from './startup-deactivation';
import { matchTrackedUser } from '../matching/match-message';
import type { PopupStatus, RuntimeMessage } from '../shared/types';
import { loadSettings, updateSettings } from '../storage/settings-repository';

async function handleObservedMessage(message: RuntimeMessage & { type: 'discord-message-observed' }): Promise<void> {
  const settings = await loadSettings();
  if (!settings.monitoringEnabled) {
    return;
  }

  const trackedUser = matchTrackedUser(settings.trackedUsers, message.payload);
  if (!trackedUser) {
    return;
  }

  if (await checkAndMarkMessageSeen(message.payload)) {
    return;
  }

  await createDiscordNotification(trackedUser, message.payload);
}

async function getNotificationPermission(): Promise<PopupStatus['notificationPermission']> {
  if (!globalThis.chrome?.notifications?.getPermissionLevel) {
    return 'unknown';
  }

  return new Promise((resolve) => {
    chrome.notifications.getPermissionLevel((level) => {
      resolve(level === 'granted' || level === 'denied' ? level : 'unknown');
    });
  });
}

async function getPopupStatus(): Promise<PopupStatus> {
  const settings = await loadSettings();
  const enabledTrackedUsers = settings.trackedUsers.filter((user) => user.enabled).length;
  const defaultTrackedUsers = settings.trackedUsers.filter((user) => user.isDefault).length;
  const temporarilyEnabledUsers = settings.trackedUsers.filter(
    (user) => user.enabled && !user.isDefault,
  ).length;

  return {
    monitoringEnabled: settings.monitoringEnabled,
    enabledTrackedUsers,
    defaultTrackedUsers,
    temporarilyEnabledUsers,
    disabledTrackedUsers: settings.trackedUsers.length - enabledTrackedUsers,
    notificationPermission: await getNotificationPermission(),
  };
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureStartupDeactivation();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureStartupDeactivation();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === 'discord-message-observed') {
    void ensureStartupDeactivation().then(() => handleObservedMessage(message));
    return false;
  }

  if (message.type === 'get-popup-status') {
    void ensureStartupDeactivation().then(getPopupStatus).then(sendResponse);
    return true;
  }

  if (message.type === 'set-monitoring-enabled') {
    void ensureStartupDeactivation()
      .then(() =>
        updateSettings((settings) => ({
          ...settings,
          monitoringEnabled: message.enabled,
        })),
      )
      .then(getPopupStatus)
      .then(sendResponse);
    return true;
  }

  if (message.type === 'test-notification') {
    void ensureStartupDeactivation()
      .then(createTestNotification)
      .then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});
