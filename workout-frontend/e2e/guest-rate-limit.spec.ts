import { test, expect } from '@playwright/test';

/**
 * 게스트 발급은 호출 1회당 DB에 약 35행을 만든다. nginx의 limit_req가 단일 출처의
 * 연속 호출을 막지 못하면 상한 2,000이 몇 분 만에 소진되어 실제 방문자가 429를 본다.
 *
 * 이 스펙은 일부러 한도를 넘기므로 실행 후 약 1분간 같은 IP의 발급이 제한된다.
 * 파일 이름 순서상 마지막에 실행된다(playwright.config.ts 참고).
 */
test.describe('게스트 발급 제한', () => {
  test('발급 응답이 게스트 계약을 지킨다', async ({ request }) => {
    const response = await request.post('/api/auth/guest');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.guest).toBe(true);
    expect(body.username).toMatch(/^guest_[a-z0-9]{10}$/);
    expect(body.token).toBeTruthy();
  });

  test('연속 호출은 429로 막힌다', async ({ request }) => {
    const statuses: number[] = [];
    for (let i = 0; i < 20; i++) {
      statuses.push((await request.post('/api/auth/guest')).status());
    }

    expect(statuses).toContain(429);
    // 한도 안의 초기 몇 건은 통과해야 한다 — 전부 429면 정상 방문자도 못 들어온다.
    expect(statuses.filter((s) => s === 200).length).toBeGreaterThan(0);
  });
});
