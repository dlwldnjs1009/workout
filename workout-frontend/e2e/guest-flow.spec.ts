import { test, expect } from '@playwright/test';

/**
 * 회원가입 없이 둘러보기 — 면접관이 링크를 열었을 때 실제로 밟는 경로.
 * 화면에 보이는 것만 검증하고 내부 구현에는 의존하지 않는다.
 */
test.describe('게스트 둘러보기', () => {
  test('로그인 화면이 서비스를 설명하고 가입 없는 진입점을 제공한다', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: '오늘의 핏' })).toBeVisible();
    await expect(page.getByText('운동 기록과 식단을 한곳에서 관리')).toBeVisible();

    const guestButton = page.getByRole('button', { name: '가입 없이 둘러보기' });
    await expect(guestButton).toBeEnabled();
    await expect(page.getByText('24시간 뒤 자동으로 삭제돼요')).toBeVisible();
  });

  test('게스트로 들어가면 대시보드와 체험 안내 배너가 보인다', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '가입 없이 둘러보기' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('체험 계정으로 둘러보는 중이에요')).toBeVisible();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
  });

  test('게스트 계정에 시드 루틴과 기록이 미리 들어 있다', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '가입 없이 둘러보기' }).click();
    await expect(page.getByText('체험 계정으로 둘러보는 중이에요')).toBeVisible();

    await page.goto('/routines');
    await expect(page.getByText('체험용 3분할 루틴')).toBeVisible();

    // 빈 계정이면 EmptyState("운동 기록이 없습니다")가 뜬다. 시드 세션 3회차가 있어야 정상.
    await page.goto('/history');
    await expect(page.getByText('운동 기록이 없습니다')).toHaveCount(0);
  });
});
