import { useCallback, useEffect, useRef, useState } from 'react';
import { usePoseStore } from '../store/poseStore';
import type { CameraMode, CameraStatus } from '../types';

interface UseCameraOptions {
  /**
   * 원하는 비디오 해상도 (기본: 640x480)
   * 모바일에서 성능을 위해 낮은 해상도 권장
   */
  width?: number;
  height?: number;
  /**
   * 프레임 레이트 (기본: 30, 모바일에서는 15 권장)
   */
  frameRate?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  cameraStatus: CameraStatus;
  cameraMode: CameraMode;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  setCameraMode: (mode: CameraMode) => void;
}

/**
 * useCamera: 카메라 접근 및 제어를 담당하는 훅
 * 
 * - navigator.mediaDevices.getUserMedia() 래핑
 * - 전면/후면 카메라 전환 지원
 * - 권한 거부/에러 상태 처리
 * - 컴포넌트 언마운트 시 스트림 자동 정리
 */
export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { width = 640, height = 480, frameRate = 30 } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { cameraStatus, cameraMode, setCameraStatus, setCameraMode } = usePoseStore();

  // 현재 facingMode 계산 (FRONT = user, SIDE = 보통 후면 environment)
  const getFacingMode = useCallback(
    (mode: CameraMode): 'user' | 'environment' => {
      return mode === 'FRONT' ? 'user' : 'environment';
    },
    []
  );

  // 카메라 시작
  const startCamera = useCallback(async () => {
    if (cameraStatus === 'ACTIVE' && streamRef.current) {
      return;
    }

    setError(null);
    setCameraStatus('REQUESTING');

    try {
      // 기존 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: getFacingMode(cameraMode),
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      // 비디오 요소에 스트림 연결
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setCameraStatus('ACTIVE');
    } catch (err) {
      console.error('Camera access error:', err);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('카메라 권한이 거부되었습니다. 설정에서 카메라 접근을 허용해주세요.');
          setCameraStatus('DENIED');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('카메라를 찾을 수 없습니다.');
          setCameraStatus('ERROR');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('카메라가 다른 앱에서 사용 중입니다.');
          setCameraStatus('ERROR');
        } else {
          setError(`카메라 접근 중 오류: ${err.message}`);
          setCameraStatus('ERROR');
        }
      } else {
        setError('알 수 없는 카메라 오류가 발생했습니다.');
        setCameraStatus('ERROR');
      }
    }
  }, [cameraStatus, cameraMode, width, height, frameRate, getFacingMode, setCameraStatus]);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setError(null);
    setCameraStatus('IDLE');
  }, [setCameraStatus]);

  // 카메라 전환 (전면 <-> 후면)
  const switchCamera = useCallback(async () => {
    const newMode: CameraMode = cameraMode === 'FRONT' ? 'SIDE' : 'FRONT';
    setCameraMode(newMode);

    // 카메라가 활성 상태면 재시작
    if (cameraStatus === 'ACTIVE') {
      // 먼저 현재 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // 새 설정으로 카메라 시작
      setCameraStatus('REQUESTING');

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: getFacingMode(newMode),
            width: { ideal: width },
            height: { ideal: height },
            frameRate: { ideal: frameRate },
          },
          audio: false,
        });

        streamRef.current = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }

        setCameraStatus('ACTIVE');
      } catch (err) {
        console.error('Camera switch error:', err);
        setError('카메라 전환에 실패했습니다.');
        setCameraStatus('ERROR');
      }
    }
  }, [cameraMode, cameraStatus, width, height, frameRate, getFacingMode, setCameraMode, setCameraStatus]);

  // 컴포넌트 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    cameraStatus,
    cameraMode,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    setCameraMode,
  };
}

export default useCamera;
