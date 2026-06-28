import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

// Locally use the system Chrome channel (no browser download); in CI use
// Playwright's bundled chromium (installed via `playwright install chromium`).
const launchOptions = process.env.CI ? {} : { channel: 'chrome' };

/**
 * @web/test-runner config — runs the component/unit suite in real Chrome
 * (via Playwright), transpiling TypeScript + Lit decorators with esbuild and
 * collecting V8 coverage mapped back to the .ts sources.
 */
export default {
  files: 'test/unit/**/*.test.ts',
  nodeResolve: true,
  concurrency: 1,
  browsers: [playwrightLauncher({ product: 'chromium', launchOptions })],
  plugins: [
    esbuildPlugin({
      ts: true,
      tsconfig: 'tsconfig.json',
      target: 'es2021',
    }),
  ],
  testFramework: {
    config: { timeout: '8000', retries: 0 },
  },
  coverage: true,
  coverageConfig: {
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.d.ts'],
    reportDir: 'coverage',
    reporters: ['lcov', 'text-summary'],
    threshold: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
