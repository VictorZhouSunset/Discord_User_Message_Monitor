import { describe, expect, it, vi } from 'vitest';
import { determineDiscordStatus } from './discord-status-service';

describe('Discord status service', () => {
  it('returns not-detected when no Discord tabs are open', async () => {
    const sendMessage = vi.fn();

    await expect(determineDiscordStatus([], sendMessage)).resolves.toBe('not-detected');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('returns active when a tab reports recognized structure', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });

    await expect(determineDiscordStatus([{ id: 1 }], sendMessage)).resolves.toBe('active');
    expect(sendMessage).toHaveBeenCalledWith(1, { type: 'check-discord-structure' });
  });

  it('returns active when any Discord tab reports recognized structure', async () => {
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockRejectedValueOnce(new Error('content script missing'))
      .mockResolvedValueOnce({ ok: true });

    await expect(determineDiscordStatus([{ id: 1 }, { id: 2 }, { id: 3 }], sendMessage)).resolves.toBe(
      'active',
    );
  });

  it('returns structure-unrecognized when every tab returns false', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: false });

    await expect(determineDiscordStatus([{ id: 1 }, { id: 2 }], sendMessage)).resolves.toBe(
      'structure-unrecognized',
    );
  });

  it('returns structure-unrecognized when structure checks fail', async () => {
    const sendMessage = vi.fn().mockRejectedValue(new Error('No receiving end'));

    await expect(determineDiscordStatus([{ id: 1 }], sendMessage)).resolves.toBe('structure-unrecognized');
  });
});
