import { test, expect, type Page } from '@playwright/test';

/**
 * 진행 중인 운동에서 마지막이 아닌 종목을 지우면 화면 전체가 사라지던 회귀를 막는다.
 * 화면에 보이는 것과 페이지 런타임 에러만 검증한다.
 */
test.describe('운동 기록 — 종목 삭제', () => {
  async function startWithTwoExercises(page: Page) {
    await page.goto('/login');
    await page.getByRole('button', { name: '가입 없이 둘러보기' }).click();
    await expect(page.getByText('체험 계정으로 둘러보는 중이에요')).toBeVisible();

    await page.goto('/log-workout');
    const picker = page.locator('.MuiPaper-root', { has: page.getByRole('heading', { name: '운동 추가' }) });
    const exerciseButtons = picker.locator('button.MuiButton-root');
    await expect(exerciseButtons.nth(1)).toBeVisible();

    const firstName = (await exerciseButtons.nth(0).innerText()).trim();
    const secondName = (await exerciseButtons.nth(1).innerText()).trim();
    await exerciseButtons.nth(0).click();
    await exerciseButtons.nth(1).click();
    await page.getByRole('button', { name: '선택 완료 (2개)' }).click();
    await expect(page.getByRole('heading', { name: '진행 중인 운동 (2)' })).toBeVisible();
    return [firstName, secondName] as const;
  }

  test('첫 번째 종목을 지워도 나머지 종목이 남아 있다', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));
    const [firstName, secondName] = await startWithTwoExercises(page);

    await page.getByRole('button', { name: `${firstName} 삭제`, exact: true }).click();

    await expect(page.getByRole('heading', { name: '진행 중인 운동 (1)' })).toBeVisible();
    await expect(page.getByRole('button', { name: `${secondName} 삭제`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `${firstName} 삭제`, exact: true })).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('첫 번째 종목을 지워도 남은 종목의 펼침 상태가 유지된다', async ({ page }) => {
    const [firstName, secondName] = await startWithTwoExercises(page);
    await page.getByRole('button', { name: `${secondName} 세트 펼치기`, exact: true }).click();

    await page.getByRole('button', { name: `${firstName} 삭제`, exact: true }).click();

    await expect(page.getByRole('button', { name: `${secondName} 세트 접기`, exact: true }))
      .toHaveAttribute('aria-expanded', 'true');
  });
});
