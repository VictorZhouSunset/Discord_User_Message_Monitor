import type { NotificationSoundId, PlayNotificationSoundRuntimeMessage } from '../shared/types';

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
let offscreenDocumentCreation: Promise<void> | undefined;

function supportsOffscreenAudio(): boolean {
  return Boolean(globalThis.chrome?.offscreen?.createDocument);
}

async function hasOffscreenDocument(): Promise<boolean> {
  if (!supportsOffscreenAudio()) {
    return false;
  }

  return chrome.offscreen.hasDocument();
}

async function ensureOffscreenDocument(): Promise<void> {
  if (!supportsOffscreenAudio() || (await hasOffscreenDocument())) {
    return;
  }

  offscreenDocumentCreation ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Play the user-selected local notification sound for Discord message alerts.',
    })
    .finally(() => {
      offscreenDocumentCreation = undefined;
    });

  await offscreenDocumentCreation;
}

export async function playNotificationSound(sound: NotificationSoundId): Promise<void> {
  if (sound === 'system') {
    return;
  }

  await ensureOffscreenDocument();

  if (!supportsOffscreenAudio()) {
    return;
  }

  await chrome.runtime.sendMessage({
    type: 'play-notification-sound',
    sound,
  } satisfies PlayNotificationSoundRuntimeMessage);
}
