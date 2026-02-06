import {
  PoseLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import type { PoseLandmark } from '../types';

// Type for MediaPipe pose detection result
type PoseLandmarkerResult = ReturnType<PoseLandmarker['detectForVideo']>;

const MODEL_PATH = '/models/pose_landmarker_lite.task';
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

type RunningMode = 'IMAGE' | 'VIDEO';

/**
 * PoseService: MediaPipe PoseLandmarker의 초기화와 추론을 담당하는 서비스
 * 
 * 싱글톤 패턴으로 구현하여 앱 전체에서 하나의 인스턴스만 사용
 * GPU 가속을 사용하며, VIDEO 모드로 실시간 프레임 처리 지원
 */
export class PoseService {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private currentRunningMode: RunningMode = 'VIDEO';

  /**
   * MediaPipe PoseLandmarker 초기화
   * WASM 파일은 CDN에서 로드하고, 모델은 로컬에서 로드
   */
  async initialize(): Promise<void> {
    if (this.poseLandmarker) {
      return;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this.doInitialize();

    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  private async doInitialize(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.currentRunningMode = 'VIDEO';
      console.log('PoseLandmarker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PoseLandmarker:', error);
      throw error;
    }
  }

  /**
   * 비디오 프레임에서 포즈 감지 실행
   * VIDEO 모드에서 동작하며, 동일 프레임 재처리 방지를 위해 timestamp 필요
   */
  detectForVideo(
    videoElement: HTMLVideoElement,
    timestamp: number
  ): PoseLandmarkerResult | null {
    if (!this.poseLandmarker) {
      console.warn('PoseLandmarker not initialized');
      return null;
    }

    if (this.currentRunningMode !== 'VIDEO') {
      console.warn('PoseLandmarker is not in VIDEO mode');
      return null;
    }

    try {
      return this.poseLandmarker.detectForVideo(videoElement, timestamp);
    } catch (error) {
      console.error('Pose detection error:', error);
      return null;
    }
  }

  /**
   * 단일 이미지에서 포즈 감지 실행
   * 필요 시 자동으로 IMAGE 모드로 전환
   */
  async detectForImage(imageElement: HTMLImageElement): Promise<PoseLandmarkerResult | null> {
    if (!this.poseLandmarker) {
      console.warn('PoseLandmarker not initialized');
      return null;
    }

    try {
      if (this.currentRunningMode !== 'IMAGE') {
        await this.poseLandmarker.setOptions({ runningMode: 'IMAGE' });
        this.currentRunningMode = 'IMAGE';
      }

      return this.poseLandmarker.detect(imageElement);
    } catch (error) {
      console.error('Image detection error:', error);
      return null;
    }
  }

  /**
   * VIDEO 모드로 전환 (이미지 모드에서 비디오 모드로 복귀 시 사용)
   */
  async switchToVideoMode(): Promise<void> {
    if (!this.poseLandmarker) {
      console.warn('PoseLandmarker not initialized');
      return;
    }

    if (this.currentRunningMode === 'VIDEO') {
      return;
    }

    await this.poseLandmarker.setOptions({ runningMode: 'VIDEO' });
    this.currentRunningMode = 'VIDEO';
  }

  /**
   * MediaPipe 결과를 앱 내부 PoseLandmark 타입으로 변환
   */
  static convertLandmarks(result: PoseLandmarkerResult): PoseLandmark[] | null {
    if (!result.landmarks || result.landmarks.length === 0) {
      return null;
    }

    const landmarks = result.landmarks[0];
    const worldLandmarks = result.worldLandmarks?.[0];

    return landmarks.map((lm, index) => ({
      x: lm.x,
      y: lm.y,
      z: worldLandmarks?.[index]?.z ?? lm.z ?? 0,
      visibility: lm.visibility ?? 0,
      presence: (lm as { presence?: number }).presence ?? 1,
    }));
  }

  /**
   * 초기화 상태 확인
   */
  isReady(): boolean {
    return this.poseLandmarker !== null;
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.initPromise = null;
    this.isInitializing = false;
  }
}

// 싱글톤 인스턴스 export
export const poseService = new PoseService();
export default poseService;
