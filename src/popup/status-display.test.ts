import { describe, expect, it } from 'vitest';
import type { PopupStatus } from '../shared/types';
import { getStatusDisplay } from './status-display';

const baseStatus: Pick<PopupStatus, 'monitoringEnabled' | 'notificationPermission' | 'discordStatus'> = {
  monitoringEnabled: true,
  notificationPermission: 'granted',
  discordStatus: 'active',
};

describe('popup status display', () => {
  it('shows paused before other warnings when monitoring is disabled', () => {
    expect(
      getStatusDisplay({
        monitoringEnabled: false,
        notificationPermission: 'denied',
        discordStatus: 'not-detected',
      }),
    ).toEqual({ text: 'Monitoring paused', iconClass: 'status-icon paused' });
  });

  it('shows notification permission unavailable when permission is denied', () => {
    expect(getStatusDisplay({ ...baseStatus, notificationPermission: 'denied' })).toEqual({
      text: 'Notification permission unavailable',
      iconClass: 'status-icon danger',
    });
  });

  it('shows Discord tab not detected when no Discord channel tab is open', () => {
    expect(getStatusDisplay({ ...baseStatus, discordStatus: 'not-detected' })).toEqual({
      text: 'Discord tab not detected',
      iconClass: 'status-icon danger',
    });
  });

  it('shows structure unrecognized when Discord is open but not parseable', () => {
    expect(getStatusDisplay({ ...baseStatus, discordStatus: 'structure-unrecognized' })).toEqual({
      text: 'Discord page structure not recognized',
      iconClass: 'status-icon danger',
    });
  });

  it('shows monitoring active when all checks pass', () => {
    expect(getStatusDisplay(baseStatus)).toEqual({
      text: 'Monitoring active',
      iconClass: 'status-icon active',
    });
  });
});
