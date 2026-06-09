import type { NotificationSoundId, PlayNotificationSoundRuntimeMessage } from '../shared/types';

type ToneStep = {
  frequency: number;
  start: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

const SOUND_PATTERNS: Record<Exclude<NotificationSoundId, 'system'>, ToneStep[]> = {
  'soft-ping': [{ frequency: 880, start: 0, duration: 0.16, gain: 0.18, type: 'sine' }],
  'double-chime': [
    { frequency: 659, start: 0, duration: 0.13, gain: 0.16, type: 'sine' },
    { frequency: 988, start: 0.16, duration: 0.18, gain: 0.15, type: 'sine' },
  ],
  'bright-pop': [
    { frequency: 1175, start: 0, duration: 0.08, gain: 0.16, type: 'triangle' },
    { frequency: 1568, start: 0.075, duration: 0.11, gain: 0.12, type: 'triangle' },
  ],
  'urgent-pulse': [
    { frequency: 740, start: 0, duration: 0.1, gain: 0.18, type: 'square' },
    { frequency: 740, start: 0.14, duration: 0.1, gain: 0.18, type: 'square' },
    { frequency: 740, start: 0.28, duration: 0.1, gain: 0.18, type: 'square' },
  ],
};

let audioContext: AudioContext | undefined;

function getAudioContext(): AudioContext {
  audioContext ??= new AudioContext();
  return audioContext;
}

function playToneStep(context: AudioContext, step: ToneStep): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + step.start;
  const endAt = startAt + step.duration;

  oscillator.type = step.type ?? 'sine';
  oscillator.frequency.setValueAtTime(step.frequency, startAt);
  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(step.gain, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, endAt);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.02);
}

async function playSound(sound: NotificationSoundId): Promise<void> {
  if (sound === 'system') {
    return;
  }

  const context = getAudioContext();
  if (context.state === 'suspended') {
    await context.resume();
  }

  for (const step of SOUND_PATTERNS[sound]) {
    playToneStep(context, step);
  }
}

chrome.runtime.onMessage.addListener((message: PlayNotificationSoundRuntimeMessage) => {
  if (message.type !== 'play-notification-sound') {
    return false;
  }

  void playSound(message.sound);
  return false;
});
