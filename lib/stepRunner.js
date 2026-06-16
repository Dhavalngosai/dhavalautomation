const { retryAction } = require('./waitHelpers');

const ANSI_GREEN = '\x1b[32m';
const ANSI_RED = '\x1b[31m';
const ANSI_YELLOW = '\x1b[33m';
const ANSI_RESET = '\x1b[0m';

function colorPass(text) {
  return `${ANSI_GREEN}${text}${ANSI_RESET}`;
}

function colorFail(text) {
  return `${ANSI_RED}${text}${ANSI_RESET}`;
}

function colorRetry(text) {
  return `${ANSI_YELLOW}${text}${ANSI_RESET}`;
}

/**
 * Step runner with optional in-place retry on failure (same browser session).
 * @param {import('@playwright/test').test} test - Playwright test object (for test.step)
 * @param {Array<{ label: string, status: 'PASS' | 'FAIL' }>} stepResults
 * @param {number} defaultRetryMs - SALESFORCE_STEP_RETRY_MS window per step
 */
function createStepRunner(test, stepResults, defaultRetryMs) {
  const logStep = (label, status, detail) => {
    const tag = status === 'PASS' ? colorPass('[PASS]') : colorFail('[FAIL]');
    const suffix = detail ? ` — ${status === 'FAIL' ? colorFail(detail) : detail}` : '';
    console.log(`${tag} ${label}${suffix}`);
  };

  async function runStep(label, fn, options = {}) {
    const retry = options.retry === true;
    const timeoutMs = options.timeoutMs ?? defaultRetryMs;
    const intervalMs = options.intervalMs ?? 1_500;

    const execute = (attemptLabel) => test.step(attemptLabel, fn);

    try {
      let result;
      if (retry) {
        let attempt = 0;
        result = await retryAction(
          async () => {
            attempt += 1;
            if (attempt > 1) {
              console.log(colorRetry(`[RETRY] ${label} — attempt ${attempt}`));
            }
            const attemptLabel = attempt > 1 ? `${label} (retry ${attempt - 1})` : label;
            return execute(attemptLabel);
          },
          { timeoutMs, intervalMs },
        );
      } else {
        result = await execute(label);
      }

      stepResults.push({ label, status: 'PASS' });
      logStep(label, 'PASS');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
      stepResults.push({ label, status: 'FAIL' });
      logStep(label, 'FAIL', message);
      throw error;
    }
  }

  /** Retry the whole step on failure until timeout (does not restart login/create). */
  async function runPhase(label, fn, timeoutMs = defaultRetryMs) {
    return runStep(label, fn, { retry: true, timeoutMs });
  }

  function printStepSummary() {
    const passed = stepResults.filter((s) => s.status === 'PASS').length;
    const failed = stepResults.filter((s) => s.status === 'FAIL').length;
    console.log('\n============================================');
    console.log(' STEP SUMMARY');
    for (const step of stepResults) {
      const tag = step.status === 'PASS' ? colorPass('[PASS]') : colorFail('[FAIL]');
      console.log(`  ${tag} ${step.label}`);
    }
    console.log(
      `  Total: ${stepResults.length}  Passed: ${colorPass(String(passed))}  Failed: ${colorFail(String(failed))}`,
    );
    console.log(`  OVERALL: ${failed === 0 ? colorPass('PASS') : colorFail('FAIL')}`);
    console.log('============================================\n');
  }

  return { runStep, runPhase, printStepSummary };
}

module.exports = { createStepRunner };
