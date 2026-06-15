import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';

const ALERT_THRESHOLDS = [10, 5, 3, 2, 1] as const;
const AUTO_DISMISS_MS = 5000;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextConstructor = window.AudioContext
      || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error('AudioContext is not available');
    }

    audioCtx = new AudioContextConstructor();
  }
  return audioCtx;
}

function isAlertThreshold(seconds: number): seconds is typeof ALERT_THRESHOLDS[number] {
  return ALERT_THRESHOLDS.includes(seconds as typeof ALERT_THRESHOLDS[number]);
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
  // 네이티브(안드로이드 APK)에서는 @capacitor/haptics 사용 — navigator.vibrate와 달리
  // 무음/매너 모드에서도 동작. 웹/PWA에서는 navigator.vibrate fallback.
  if (Capacitor.isNativePlatform()) {
    const duration = Array.isArray(pattern)
      ? pattern.reduce((sum, ms) => sum + ms, 0)  // 패턴은 총 길이의 단일 진동으로 근사
      : pattern;
    if (duration > 0) {
      Haptics.vibrate({ duration }).catch(() => { /* unavailable */ });
    }
    return;
  }
  try {
    navigator?.vibrate?.(pattern);
  } catch {
    // Vibration not available (iOS Safari/PWA 등)
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
    if (!isAlertThreshold(restTimerSeconds)) return;
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
        vibrate(50);
        playBeep(523, 120);  // C5 (도)
        break;
      case 2:
        vibrate(50);
        playBeep(659, 150);  // E5 (미)
        break;
      case 1:
        vibrate(50);
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
