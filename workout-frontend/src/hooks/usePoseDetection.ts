import { useCallback, useEffect, useRef, useState } from 'react';
import { poseService, PoseService } from '../services/poseService';
import { usePoseStore } from '../store/poseStore';
import type { PoseLandmark } from '../types';

interface UsePoseDetectionOptions {
  /**
   * 목표 FPS (기본: 15)
   * 모바일에서는 10-15 권장
   */
  targetFps?: number;
  /**
   * 감지 활성화 여부
   */
  enabled?: boolean;
}

interface UsePoseDetectionReturn {
  isInitialized: boolean;
  isDetecting: boolean;
  fps: number;
  landmarks: PoseLandmark[] | null;
  error: string | null;
  startDetection: () => void;
  stopDetection: () => void;
}

/**
 * usePoseDetection: 실시간 포즈 감지를 수행하는 훅
 * 
 * - poseService 초기화 관리
 * - requestAnimationFrame 루프로 프레임 처리
 * - lastVideoTime 패턴으로 중복 프레임 스킵
 * - FPS 계산 및 성능 모니터링
 */
export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UsePoseDetectionOptions = {}
): UsePoseDetectionReturn {
  const { targetFps = 15, enabled = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });
  // Note: targetFps is available for future throttling implementation
  void targetFps;

  const {
    isDetecting,
    fps,
    currentLandmarks,
    setIsDetecting,
    updateLandmarks,
    setFps,
  } = usePoseStore();

  // MediaPipe 초기화
  useEffect(() => {
    let isMounted = true;

    const initializePose = async () => {
      try {
        await poseService.initialize();
        if (isMounted) {
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize pose detection:', err);
        if (isMounted) {
          setError('포즈 감지 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
          setIsInitialized(false);
        }
      }
    };

    initializePose();

    return () => {
      isMounted = false;
    };
  }, []);

  // 감지 루프
  const detectLoop = useCallback(() => {
    const video = videoRef.current;

    if (!video || !poseService.isReady() || video.paused || video.ended) {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const currentTime = video.currentTime;

    // lastVideoTime 패턴: 동일 프레임 스킵
    if (currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = currentTime;

      // 포즈 감지 실행
      const timestamp = performance.now();
      const result = poseService.detectForVideo(video, timestamp);

      if (result) {
        const landmarks = PoseService.convertLandmarks(result);
        updateLandmarks(landmarks);
      } else {
        updateLandmarks(null);
      }

      // FPS 계산
      fpsCounterRef.current.frames++;
      const now = performance.now();
      const elapsed = now - fpsCounterRef.current.lastTime;

      if (elapsed >= 1000) {
        const calculatedFps = Math.round(
          (fpsCounterRef.current.frames * 1000) / elapsed
        );
        setFps(calculatedFps);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectLoop);
  }, [videoRef, updateLandmarks, setFps]);

  // 감지 시작
  const startDetection = useCallback(() => {
    if (!isInitialized || !enabled) {
      return;
    }

    setIsDetecting(true);
    lastVideoTimeRef.current = -1;
    fpsCounterRef.current = { frames: 0, lastTime: performance.now() };

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
    }
  }, [isInitialized, enabled, setIsDetecting, detectLoop]);

  // 감지 중지
  const stopDetection = useCallback(() => {
    setIsDetecting(false);

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    updateLandmarks(null);
    setFps(0);
  }, [setIsDetecting, updateLandmarks, setFps]);

  // isDetecting 상태 변경에 따른 루프 제어
  useEffect(() => {
    if (isDetecting && animationFrameRef.current === null && isInitialized) {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isDetecting, isInitialized, detectLoop]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isInitialized,
    isDetecting,
    fps,
    landmarks: currentLandmarks,
    error,
    startDetection,
    stopDetection,
  };
}

export default usePoseDetection;
