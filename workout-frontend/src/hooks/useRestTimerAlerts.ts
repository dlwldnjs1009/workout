import { useEffect, useRef, useCallback } from 'react';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';

const ALERT_THRESHOLDS = [10, 5, 3, 2, 1] as const;
const AUTO_DISMISS_MS = 5000;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playBeep(frequency: number, durationMs: number, volume = 0.3) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;

    // Fade out to avoid click
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Audio not available
  }
}

function vibrate(pattern: number | number[]) {
  try {
    navigator?.vibrate?.(pattern);
  } catch {
    // Vibration not available (iOS, etc.)
  }
}

export function useRestTimerAlerts() {
  const restTimerSeconds = useWorkoutSessionStore((s) => s.restTimerSeconds);
  const isRunning = useWorkoutSessionStore((s) => s.isRestTimerRunning);
  const finished = useWorkoutSessionStore((s) => s.restTimerFinished);
  const dismissAlert = useWorkoutSessionStore((s) => s.dismissRestTimerAlert);

  const firedRef = useRef<Set<number>>(new Set());
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Reset fired thresholds when timer starts
  useEffect(() => {
    if (isRunning) {
      firedRef.current.clear();
    }
  }, [isRunning]);

  // Countdown alerts at specific thresholds
  useEffect(() => {
    if (!isRunning) return;
    if (!ALERT_THRESHOLDS.includes(restTimerSeconds as any)) return;
    if (firedRef.current.has(restTimerSeconds)) return;

    firedRef.current.add(restTimerSeconds);

    switch (restTimerSeconds) {
      case 10:
        vibrate(100);
        break;
      case 5:
        vibrate(300);
        break;
      case 3:
        playBeep(523, 120);  // C5 (도)
        break;
      case 2:
        playBeep(659, 150);  // E5 (미)
        break;
      case 1:
        playBeep(784, 180);  // G5 (솔)
        break;
    }
  }, [restTimerSeconds, isRunning]);

  // Final alert when timer finishes
  useEffect(() => {
    if (!finished) return;

    // "ding!" - C6 + E6 (높은 도+미, 밝은 장3도 해결)
    playBeep(1047, 400, 0.45);
    setTimeout(() => playBeep(1319, 300, 0.35), 150);

    // Strong vibration pattern
    vibrate([200, 100, 200, 100, 400]);

    // Auto-dismiss after 5 seconds
    autoDismissRef.current = setTimeout(() => {
      dismissAlert();
    }, AUTO_DISMISS_MS);

    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, [finished, dismissAlert]);

  const dismiss = useCallback(() => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    dismissAlert();
    vibrate(0); // Cancel ongoing vibration
  }, [dismissAlert]);

  return { finished, dismiss };
}
