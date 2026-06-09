import type { PopupStatus } from '../shared/types';

export type StatusDisplay = {
  text: string;
  iconClass: 'status-icon active' | 'status-icon paused' | 'status-icon danger';
};

export function getStatusDisplay(status: Pick<
  PopupStatus,
  'monitoringEnabled' | 'notificationPermission' | 'discordStatus'
>): StatusDisplay {
  if (!status.monitoringEnabled) {
    return { text: 'Monitoring paused', iconClass: 'status-icon paused' };
  }

  if (status.notificationPermission === 'denied') {
    return { text: 'Notification permission unavailable', iconClass: 'status-icon danger' };
  }

  if (status.discordStatus === 'not-detected') {
    return { text: 'Discord tab not detected', iconClass: 'status-icon danger' };
  }

  if (status.discordStatus === 'structure-unrecognized') {
    return { text: 'Discord page structure not recognized', iconClass: 'status-icon danger' };
  }

  return { text: 'Monitoring active', iconClass: 'status-icon active' };
}
