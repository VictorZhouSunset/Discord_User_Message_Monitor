import { Bell, BellOff, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { MatchMode, StoredSettings, TrackedUser } from '../shared/types';
import { createDefaultSettings } from '../storage/schema';
import { loadSettings, resetSettings, saveSettings } from '../storage/settings-repository';

type TrackedUserForm = {
  discordUserId: string;
  username: string;
  displayName: string;
  matchMode: MatchMode;
  serverId: string;
  channelId: string;
  enabled: boolean;
  isDefault: boolean;
  showMessagePreview: boolean;
  playSound: boolean;
};

const emptyForm: TrackedUserForm = {
  discordUserId: '',
  username: '',
  displayName: '',
  matchMode: 'username',
  serverId: '',
  channelId: '',
  enabled: true,
  isDefault: true,
  showMessagePreview: false,
  playSound: true,
};

function toForm(user: TrackedUser): TrackedUserForm {
  return {
    discordUserId: user.discordUserId ?? '',
    username: user.username ?? '',
    displayName: user.displayName ?? '',
    matchMode: user.matchMode,
    serverId: user.serverId ?? '',
    channelId: user.channelId ?? '',
    enabled: user.enabled,
    isDefault: user.isDefault,
    showMessagePreview: user.showMessagePreview,
    playSound: user.playSound,
  };
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function createTrackedUser(form: TrackedUserForm, id: string = crypto.randomUUID()): TrackedUser {
  return {
    id,
    enabled: form.enabled,
    isDefault: form.isDefault,
    discordUserId: optionalText(form.discordUserId),
    username: optionalText(form.username),
    displayName: optionalText(form.displayName),
    matchMode: form.matchMode,
    serverId: optionalText(form.serverId),
    channelId: optionalText(form.channelId),
    showMessagePreview: form.showMessagePreview,
    playSound: form.playSound,
  };
}

function userLabel(user: TrackedUser): string {
  return user.discordUserId ?? user.username ?? user.displayName ?? 'Unnamed user';
}

function MatchWarning({ matchMode }: { matchMode: MatchMode }) {
  if (matchMode === 'display-name') {
    return (
      <p className="notice warning">
        Display names are not unique. Exact display-name matching can alert for the wrong person if
        several visible users share the same name.
      </p>
    );
  }

  if (matchMode === 'user-id') {
    return (
      <p className="notice">
        User ID matching is preferred, but Discord may not expose an ID in rendered DOM when a user
        has a default avatar. Add a username fallback when possible.
      </p>
    );
  }

  return null;
}

export function OptionsApp() {
  const [settings, setSettings] = useState<StoredSettings>(createDefaultSettings());
  const [form, setForm] = useState<TrackedUserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [status, setStatus] = useState('Loading settings...');

  useEffect(() => {
    void loadSettings().then((loaded) => {
      setSettings(loaded);
      setStatus('Settings loaded');
    });
  }, []);

  const activeCount = useMemo(
    () => settings.trackedUsers.filter((user) => user.enabled).length,
    [settings.trackedUsers],
  );

  async function persist(nextSettings: StoredSettings, nextStatus: string): Promise<void> {
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setStatus(nextStatus);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextUser = createTrackedUser(form, editingId);
    const nextUsers = editingId
      ? settings.trackedUsers.map((user) => (user.id === editingId ? nextUser : user))
      : [...settings.trackedUsers, nextUser];

    await persist({ ...settings, trackedUsers: nextUsers }, editingId ? 'Tracked user updated' : 'Tracked user added');
    setEditingId(undefined);
    setForm(emptyForm);
  }

  function editUser(user: TrackedUser): void {
    setEditingId(user.id);
    setForm(toForm(user));
    setStatus(`Editing ${userLabel(user)}`);
  }

  async function deleteUser(userId: string): Promise<void> {
    await persist(
      {
        ...settings,
        trackedUsers: settings.trackedUsers.filter((user) => user.id !== userId),
      },
      'Tracked user removed',
    );
  }

  async function toggleUser(userId: string, key: 'enabled' | 'isDefault'): Promise<void> {
    await persist(
      {
        ...settings,
        trackedUsers: settings.trackedUsers.map((user) =>
          user.id === userId ? { ...user, [key]: !user[key] } : user,
        ),
      },
      'Tracked user updated',
    );
  }

  async function toggleMonitoring(): Promise<void> {
    await persist(
      {
        ...settings,
        monitoringEnabled: !settings.monitoringEnabled,
      },
      settings.monitoringEnabled ? 'Monitoring paused' : 'Monitoring resumed',
    );
  }

  async function clearLocalData(): Promise<void> {
    const next = await resetSettings();
    setSettings(next);
    setForm(emptyForm);
    setEditingId(undefined);
    setStatus('Local settings cleared');
  }

  return (
    <main className="options-shell">
      <section className="settings-header">
        <div>
          <h1>Discord User Activity Notifier</h1>
          <p>Track configured users in Discord Web and keep alerts local to this browser.</p>
        </div>
        <button className="primary-button" type="button" onClick={toggleMonitoring}>
          {settings.monitoringEnabled ? <BellOff size={18} /> : <Bell size={18} />}
          {settings.monitoringEnabled ? 'Pause monitoring' : 'Resume monitoring'}
        </button>
      </section>

      <section className="status-strip" aria-live="polite">
        <span className={settings.monitoringEnabled ? 'status-dot active' : 'status-dot paused'} />
        <span>{settings.monitoringEnabled ? 'Monitoring active' : 'Monitoring paused'}</span>
        <span>{activeCount} enabled tracked users</span>
        <span>{status}</span>
      </section>

      <div className="layout-grid">
        <section className="panel">
          <h2>{editingId ? 'Edit tracked user' : 'Add tracked user'}</h2>
          <form className="tracked-user-form" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Match mode
              <select
                value={form.matchMode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, matchMode: event.target.value as MatchMode }))
                }
              >
                <option value="user-id">Discord user ID</option>
                <option value="username">Username</option>
                <option value="display-name">Display name</option>
              </select>
            </label>

            <MatchWarning matchMode={form.matchMode} />

            <label>
              Discord user ID
              <input
                value={form.discordUserId}
                onChange={(event) => setForm((current) => ({ ...current, discordUserId: event.target.value }))}
                placeholder="123456789012345678"
              />
            </label>
            <label>
              Username
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="alice"
              />
            </label>
            <label>
              Display name
              <input
                value={form.displayName}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="Alice"
              />
            </label>
            <div className="field-row">
              <label>
                Server ID
                <input
                  value={form.serverId}
                  onChange={(event) => setForm((current) => ({ ...current, serverId: event.target.value }))}
                  placeholder="Optional"
                />
              </label>
              <label>
                Channel ID
                <input
                  value={form.channelId}
                  onChange={(event) => setForm((current) => ({ ...current, channelId: event.target.value }))}
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="checkbox-grid">
              <label>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
                />
                Use as a default tracking target
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.showMessagePreview}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, showMessagePreview: event.target.checked }))
                  }
                />
                Show message preview
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.playSound}
                  onChange={(event) => setForm((current) => ({ ...current, playSound: event.target.checked }))}
                />
                Use system notification sound
              </label>
            </div>

            <div className="button-row">
              <button className="primary-button" type="submit">
                {editingId ? <Save size={18} /> : <Plus size={18} />}
                {editingId ? 'Save changes' : 'Add tracked user'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(undefined);
                    setForm(emptyForm);
                    setStatus('Edit cancelled');
                  }}
                >
                  <X size={18} />
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Tracked users</h2>
            <button className="danger-button" type="button" onClick={() => void clearLocalData()}>
              <RotateCcw size={17} />
              Clear local data
            </button>
          </div>

          {settings.trackedUsers.length === 0 ? (
            <p className="empty-state">No tracked users yet.</p>
          ) : (
            <ul className="tracked-list">
              {settings.trackedUsers.map((user) => (
                <li key={user.id} className="tracked-item">
                  <div>
                    <strong>{userLabel(user)}</strong>
                    <span>
                      {user.matchMode} {user.serverId ? `server ${user.serverId}` : 'all servers'}{' '}
                      {user.channelId ? `channel ${user.channelId}` : 'all channels'}
                    </span>
                    <div className="pill-row">
                      <span className={user.enabled ? 'pill green' : 'pill muted'}>
                        {user.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className={user.isDefault ? 'pill blue' : 'pill muted'}>
                        {user.isDefault ? 'Default' : 'Saved'}
                      </span>
                      <span className={user.showMessagePreview ? 'pill amber' : 'pill muted'}>
                        {user.showMessagePreview ? 'Preview on' : 'Preview off'}
                      </span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button type="button" onClick={() => void toggleUser(user.id, 'enabled')}>
                      {user.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" onClick={() => void toggleUser(user.id, 'isDefault')}>
                      {user.isDefault ? 'Unmark default' : 'Mark default'}
                    </button>
                    <button type="button" aria-label={`Edit ${userLabel(user)}`} onClick={() => editUser(user)}>
                      <Pencil size={17} />
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      aria-label={`Delete ${userLabel(user)}`}
                      onClick={() => void deleteUser(user.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
