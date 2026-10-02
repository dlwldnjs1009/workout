import { test, expect } from '@playwright/test';

/**
 * 페이지에서 렌더 에러가 나도 앱 전체가 사라지지 않고 다른 메뉴로 이동할 수 있어야 한다.
 * 배포 직후 옛 청크를 못 받는 상황을 페이지 청크 요청 차단으로 재현한다.
 */
// Service Worker가 가져오는 요청은 page.route로 가로챌 수 없다
test.use({ serviceWorkers: 'block' });

test('페이지를 불러오지 못해도 안내가 보이고 다른 메뉴로 이동할 수 있다', async ({ page }) => {
  // 의도한 에러가 Sentry 이슈로 쌓이지 않게 막는다
  await page.route(/sentry\.io/, (route) => route.abort());
  await page.route(/\/WorkoutLog[-.][^/]*$/, (route) => route.abort());

  await page.goto('/login');
  await page.getByRole('button', { name: '가입 없이 둘러보기' }).click();
  await expect(page.getByText('체험 계정으로 둘러보는 중이에요')).toBeVisible();

  await page.getByRole('button', { name: '운동 기록', exact: true }).click();
  await expect(page.getByText('화면을 불러오지 못했어요')).toBeVisible();

  await page.getByRole('button', { name: '홈', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('화면을 불러오지 못했어요')).toHaveCount(0);
});
