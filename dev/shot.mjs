// Screenshot helper: drives the already-installed system Chrome via playwright-core
// (no browser download). Usage: node dev/shot.mjs <url> <outfile> [widthPx]
import { chromium } from 'playwright-core';

const [, , url, out, width] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: width ? Number(width) : 1500, height: 900 },
  deviceScaleFactor: 2,
});
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
// give ResizeObserver + container-query layout real frames to settle
await page.waitForTimeout(700);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('shot ->', out);
