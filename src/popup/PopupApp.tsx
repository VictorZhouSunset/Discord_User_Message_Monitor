import { Bell, BellRing, Pause, Play, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  GetPopupStatusRuntimeMessage,
  PopupStatus,
  RuntimeMessage,
  SetMonitoringEnabledRuntimeMessage,
  TestNotificationRuntimeMessage,
} from '../shared/types';
import { getStatusDisplay } from './status-display';

function sendRuntimeMessage<TResponse>(message: RuntimeMessage): Promise<TResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: TResponse) => resolve(response));
  });
}

async function loadStatus(): Promise<PopupStatus> {
  return sendRuntimeMessage<PopupStatus>({ type: 'get-popup-status' } satisfies GetPopupStatusRuntimeMessage);
}

export function PopupApp() {
  const [status, setStatus] = useState<PopupStatus | undefined>();
  const [message, setMessage] = useState('Ready');

  useEffect(() => {
    void loadStatus().then(setStatus);
  }, []);

  async function toggleMonitoring(): Promise<void> {
    if (!status) {
      return;
    }

    const next = await sendRuntimeMessage<PopupStatus>({
      type: 'set-monitoring-enabled',
      enabled: !status.monitoringEnabled,
    } satisfies SetMonitoringEnabledRuntimeMessage);
    setStatus(next);
    setMessage(next.monitoringEnabled ? 'Monitoring resumed' : 'Monitoring paused');
  }

  async function testNotification(): Promise<void> {
    await sendRuntimeMessage<{ ok: true }>({ type: 'test-notification' } satisfies TestNotificationRuntimeMessage);
    setMessage('Test notification sent');
  }

  function openSettings(): void {
    chrome.runtime.openOptionsPage();
  }

  const monitoringEnabled = status?.monitoringEnabled ?? false;
  const statusDisplay = status
    ? getStatusDisplay(status)
    : ({ text: 'Loading status', iconClass: 'status-icon paused' } as const);

  return (
    <main className="popup-shell">
      <header>
        <div className={statusDisplay.iconClass}>
          <Bell size={20} />
        </div>
        <div>
          <h1>Discord Notifier</h1>
          <p>{statusDisplay.text}</p>
        </div>
      </header>

      <section className="metric-grid" aria-label="Tracking summary">
        <div>
          <strong>{status?.defaultTrackedUsers ?? 0}</strong>
          <span>Default</span>
        </div>
        <div>
          <strong>{status?.temporarilyEnabledUsers ?? 0}</strong>
          <span>Temporary</span>
        </div>
        <div>
          <strong>{status?.disabledTrackedUsers ?? 0}</strong>
          <span>Disabled</span>
        </div>
      </section>

      <section className="popup-detail">
        <span>{status?.enabledTrackedUsers ?? 0} enabled tracked users</span>
        <span>Notifications: {status?.notificationPermission ?? 'unknown'}</span>
      </section>

      <div className="action-grid">
        <button className="primary-button" type="button" onClick={() => void toggleMonitoring()}>
          {monitoringEnabled ? <Pause size={17} /> : <Play size={17} />}
          {monitoringEnabled ? 'Pause' : 'Resume'}
        </button>
        <button type="button" onClick={() => void testNotification()}>
          <BellRing size={17} />
          Test
        </button>
        <button type="button" onClick={openSettings}>
          <Settings size={17} />
          Settings
        </button>
      </div>

      <p className="popup-message" aria-live="polite">
        {message}
      </p>
    </main>
  );
}
