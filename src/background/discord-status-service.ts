import type {
  CheckDiscordStructureResponse,
  CheckDiscordStructureRuntimeMessage,
  PopupStatus,
} from '../shared/types';

export type DiscordStatus = PopupStatus['discordStatus'];

export type DiscordStatusTab = {
  id?: number;
};

export type SendStructureCheck = (
  tabId: number,
  message: CheckDiscordStructureRuntimeMessage,
) => Promise<CheckDiscordStructureResponse>;

export async function determineDiscordStatus(
  tabs: DiscordStatusTab[],
  sendMessage: SendStructureCheck,
): Promise<DiscordStatus> {
  if (tabs.length === 0) {
    return 'not-detected';
  }

  for (const tab of tabs) {
    if (typeof tab.id !== 'number') {
      continue;
    }

    try {
      const response = await sendMessage(tab.id, { type: 'check-discord-structure' });
      if (response.ok) {
        return 'active';
      }
    } catch {
      // Missing content scripts and loading pages are treated as unrecognized structure.
    }
  }

  return 'structure-unrecognized';
}
