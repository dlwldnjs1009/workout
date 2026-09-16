import { defineConfig, devices } from '@playwright/test';

/**
 * 게스트 둘러보기 흐름의 배포 후 스모크 테스트.
 *
 * 기본 대상은 운영 도메인이다. 이 흐름은 백엔드·DB·nginx가 모두 맞물려야 성립하므로
 * 로컬 스택을 띄우는 것보다 실제 배포본을 확인하는 편이 값이 크다.
 * 로컬 스택에 붙이려면 E2E_BASE_URL=http://localhost:5173 으로 덮어쓴다.
 *
 * 테스트가 게스트 계정을 만든다. 24시간 뒤 GuestCleanupScheduler가 지운다.
 * nginx의 limit_req(IP당 10r/m)에 스스로 걸리지 않도록 워커 1개로 순차 실행하고,
 * 한도를 일부러 넘기는 guest-rate-limit 스펙이 파일 이름 순서상 마지막에 온다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://todayfit.site',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
