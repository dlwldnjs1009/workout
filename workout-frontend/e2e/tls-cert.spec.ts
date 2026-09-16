import { test, expect } from '@playwright/test';
import tls from 'node:tls';

/**
 * 인증서 갱신이 조용히 실패하는 것을 막는다.
 *
 * certbot은 만료 30일 전부터 갱신을 시도한다. 그 시도가 실패해도 알려주는 곳이 없어,
 * 아무 신호 없이 한 달이 지난 뒤 사이트가 인증서 오류로 죽는 경로가 실재한다.
 * 배포할 때마다 이 테스트가 돌면 갱신 창(30일) 안에서 경보가 뜬다.
 */
const MIN_DAYS_LEFT = 14;

function daysUntilExpiry(host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port: 443, servername: host }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();

      if (!cert || !cert.valid_to) {
        reject(new Error(`${host}의 인증서를 읽지 못했다`));
        return;
      }
      resolve((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000);
    });
    socket.setTimeout(10_000, () => socket.destroy(new Error(`${host} TLS 연결 시간 초과`)));
    socket.on('error', reject);
  });
}

test.describe('TLS 인증서', () => {
  test(`만료까지 ${MIN_DAYS_LEFT}일 이상 남아 있다`, async ({ baseURL }) => {
    const url = new URL(baseURL!);
    test.skip(url.protocol !== 'https:', 'https 대상일 때만 의미가 있다');

    const daysLeft = await daysUntilExpiry(url.hostname);

    // 실패하면 certbot 갱신이 멈춰 있다는 뜻이다.
    // 서버에서 `sudo certbot renew --dry-run`으로 원인을 확인한다.
    expect(
      daysLeft,
      `${url.hostname} 인증서가 ${Math.floor(daysLeft)}일 뒤 만료된다 — certbot 갱신을 확인할 것`,
    ).toBeGreaterThan(MIN_DAYS_LEFT);
  });
});
