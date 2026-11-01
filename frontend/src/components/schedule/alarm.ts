// Local alarm for timers and reminders, with the browser only (Web Audio + Notification API, no library).

type AudioContextConstructor = new () => AudioContext;

declare global {
  interface Window {
    /** Older Safari only has the prefixed constructor */
    webkitAudioContext?: AudioContextConstructor;
  }
}

interface Beep {
  frequency: number;
  start: number;
  length: number;
}

const LOW = 880;
const HIGH = 1100;
/** The old client's six-beep pattern (seconds). */
const PATTERN: readonly Beep[] = [
  { frequency: LOW, start: 0, length: 0.2 },
  { frequency: LOW, start: 0.28, length: 0.2 },
  { frequency: LOW, start: 0.56, length: 0.2 },
  { frequency: HIGH, start: 0.84, length: 0.45 },
  { frequency: LOW, start: 1.4, length: 0.2 },
  { frequency: HIGH, start: 1.7, length: 0.6 },
];
const VOLUME = 0.4;
const SILENT = 0.001;

const getAudioContext = (): AudioContextConstructor | undefined => {
  if (typeof window === 'undefined') return undefined;
  // Widened without a cast: browsers without Web Audio have no AudioContext at all
  const audioWindow: Window & { AudioContext?: AudioContextConstructor } = window;
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
};

/** Plays a short beep pattern. Does nothing when the browser has no Web Audio or blocks it. */
export const playAlarm = (): void => {
  const AudioCtx = getAudioContext();
  if (!AudioCtx) return;
  let ctx: AudioContext;
  try {
    ctx = new AudioCtx();
  } catch {
    return;
  }
  PATTERN.forEach(({ frequency, start, length }) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(VOLUME, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(SILENT, ctx.currentTime + start + length);
    oscillator.start(ctx.currentTime + start);
    oscillator.stop(ctx.currentTime + start + length);
  });
};

const hasNotifications = (): boolean => typeof window !== 'undefined' && 'Notification' in window;

/** Asks once for permission to show system notifications (call it from a click). */
export const requestNotificationPermission = (): void => {
  if (hasNotifications() && Notification.permission === 'default') {
    void Notification.requestPermission();
  }
};

/** A system notification when the user allowed them (the in-page alert is always shown too). */
export const showSystemNotification = (title: string, body: string): void => {
  if (!hasNotifications() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    // Some mobile browsers only allow notifications from a service worker: the in-page alert is enough
  }
};
