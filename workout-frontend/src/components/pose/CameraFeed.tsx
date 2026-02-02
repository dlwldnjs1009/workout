import { forwardRef, useEffect } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { VideocamOff, CameraAlt } from '@mui/icons-material';
import type { CameraStatus } from '../../types';

interface CameraFeedProps {
  cameraStatus: CameraStatus;
  error: string | null;
  onVideoReady?: () => void;
  width?: number | string;
  height?: number | string;
  /** 미러링 여부 - FRONT 모드에서 true, SIDE 모드에서 false 권장 */
  mirrored?: boolean;
}

/**
 * CameraFeed: 카메라 비디오 피드를 표시하는 컴포넌트
 * 
 * - 카메라 상태에 따른 UI 표시 (로딩, 에러, 권한 거부 등)
 * - video 요소는 forwardRef로 부모 컴포넌트에서 접근 가능
 * - PoseOverlay와 함께 사용하여 랜드마크 오버레이 표시
 */
export const CameraFeed = forwardRef<HTMLVideoElement, CameraFeedProps>(
  ({ cameraStatus, error, onVideoReady, width = '100%', height = 'auto', mirrored = true }, ref) => {
    useEffect(() => {
      const videoElement = (ref as React.RefObject<HTMLVideoElement>)?.current;
      if (videoElement && cameraStatus === 'ACTIVE') {
        const handleCanPlay = () => {
          onVideoReady?.();
        };
        videoElement.addEventListener('canplay', handleCanPlay);
        return () => {
          videoElement.removeEventListener('canplay', handleCanPlay);
        };
      }
    }, [ref, cameraStatus, onVideoReady]);

    return (
      <Box
        sx={{
          position: 'relative',
          width,
          height,
          backgroundColor: 'grey.900',
          borderRadius: 0, // 모바일에서 모서리 둥글기 제거
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 비디오 요소 */}
        <Box
          component="video"
          ref={ref}
          autoPlay
          playsInline
          muted
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // contain으로 비율 유지 (letterbox)
            // FRONT 모드: 미러링 (거울처럼), SIDE 모드: 미러링 없음
            transform: mirrored ? 'scaleX(-1)' : 'none',
            display: cameraStatus === 'ACTIVE' ? 'block' : 'none',
          }}
        />

        {/* 로딩 상태 */}
        {cameraStatus === 'REQUESTING' && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress color="primary" />
            <Typography variant="body2" color="grey.400">
              카메라 접근 요청 중...
            </Typography>
          </Box>
        )}

        {/* 대기 상태 */}
        {cameraStatus === 'IDLE' && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CameraAlt sx={{ fontSize: 64, color: 'grey.600' }} />
            <Typography variant="body2" color="grey.400">
              카메라를 시작해주세요
            </Typography>
          </Box>
        )}

        {/* 권한 거부 */}
        {cameraStatus === 'DENIED' && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 2,
            }}
          >
            <VideocamOff sx={{ fontSize: 64, color: 'error.main' }} />
            <Typography variant="body2" color="error.main" textAlign="center">
              카메라 권한이 거부되었습니다
            </Typography>
            <Typography variant="caption" color="grey.500" textAlign="center">
              브라우저 설정에서 카메라 권한을 허용해주세요
            </Typography>
          </Box>
        )}

        {/* 에러 상태 */}
        {cameraStatus === 'ERROR' && error && (
          <Box sx={{ p: 2, width: '100%' }}>
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          </Box>
        )}
      </Box>
    );
  }
);

CameraFeed.displayName = 'CameraFeed';

export default CameraFeed;
