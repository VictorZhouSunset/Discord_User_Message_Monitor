import { describe, expect, it } from 'vitest';
import { SETTINGS_SCHEMA_VERSION } from '../shared/constants';
import { createDefaultSettings, validateAndMigrateSettings } from './schema';

describe('settings schema', () => {
  it('creates safe defaults for malformed storage', () => {
    expect(validateAndMigrateSettings(null)).toEqual({
      settings: createDefaultSettings(),
      changed: true,
    });
  });

  it('does not mark current valid settings as changed', () => {
    expect(validateAndMigrateSettings(createDefaultSettings())).toEqual({
      settings: createDefaultSettings(),
      changed: false,
    });
  });

  it('validates tracked users and removes invalid entries', () => {
    const result = validateAndMigrateSettings({
      schemaVersion: 1,
      monitoringEnabled: false,
      trackedUsers: [
        {
          id: 'tracked-1',
          enabled: true,
          isDefault: true,
          username: ' Alice ',
          matchMode: 'username',
          showMessagePreview: true,
          playSound: false,
        },
        {
          enabled: true,
          username: 'missing-id',
        },
      ],
    });

    expect(result).toEqual({
      changed: true,
      settings: {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      monitoringEnabled: false,
      trackedUsers: [
        {
          id: 'tracked-1',
          enabled: true,
          isDefault: true,
          username: 'Alice',
          discordUserId: undefined,
          displayName: undefined,
          matchMode: 'username',
          serverId: undefined,
          channelId: undefined,
          showMessagePreview: true,
          playSound: false,
        },
      ],
      },
    });
  });

  it('migrates old enabled tracked users into defaults', () => {
    const result = validateAndMigrateSettings({
      schemaVersion: 0,
      monitoringEnabled: true,
      trackedUsers: [{ id: 'tracked-1', enabled: true, username: 'Alice', matchMode: 'username' }],
    });

    expect(result.changed).toBe(true);
    expect(result.settings.trackedUsers[0]?.isDefault).toBe(true);
  });
});
