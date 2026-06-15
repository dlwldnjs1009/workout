import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';

// 휴식 종료 알림을 OS 레벨로 예약 — 앱이 백그라운드/화면꺼짐/무음이어도 발화.
// 인페이지 타이머(updateRestTimer)는 백그라운드에서 throttle되어 알림이 안 울리는 문제를 보완.
const REST_NOTIF_ID = 1001;
const isNative = Capacitor.isNativePlatform();

async function scheduleRestDone(at: Date) {
  if (!isNative) return;
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: REST_NOTIF_ID,
        title: '휴식 완료',
        body: '다음 세트를 시작하세요 💪',
        schedule: { at, allowWhileIdle: true },
      }],
    });
  } catch {
    // 권한 미허용 등 — 무시 (인앱 알림으로 fallback)
  }
}

async function cancelRestDone() {
  if (!isNative) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_NOTIF_ID }] });
  } catch {
    // noop
  }
}

/**
 * 휴식 타이머가 시작되면 종료 시각에 로컬 알림을 예약하고, 멈추면 취소한다.
 * - 포그라운드: updateRestTimer가 종료 시 isRestTimerRunning=false로 만들어 알림 취소 → 인앱 알림만.
 * - 백그라운드: 타이머가 throttle되어 취소되지 않음 → OS가 예약 알림 발화(안전망).
 */
export function useRestTimerNotification() {
  const isRunning = useWorkoutSessionStore((s) => s.isRestTimerRunning);
  const startedAt = useWorkoutSessionStore((s) => s.restTimerStartedAt);
  const duration = useWorkoutSessionStore((s) => s.restTimerDuration);
  const permissionAsked = useRef(false);

  // 알림 권한 요청 (네이티브, 1회)
  useEffect(() => {
    if (!isNative || permissionAsked.current) return;
    permissionAsked.current = true;
    LocalNotifications.requestPermissions().catch(() => {});
  }, []);

  // 시작 시 예약, 정지/종료 시 취소
  useEffect(() => {
    if (isRunning && startedAt) {
      const fireAt = new Date(startedAt + duration * 1000);
      if (fireAt.getTime() > Date.now()) {
        scheduleRestDone(fireAt);
      }
    } else {
      cancelRestDone();
    }
  }, [isRunning, startedAt, duration]);
}
