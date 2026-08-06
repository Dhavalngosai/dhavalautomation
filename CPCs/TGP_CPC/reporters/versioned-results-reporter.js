const fs = require('fs');
const path = require('path');
const {
  ensureSharedRunTimestamp,
  getLocaleFromTestFile,
  getRunArchiveDir,
  getPackageVersion,
} = require('../lib/comparisonReport');

/**
 * Archives full run results version-wise:
 *   TGP_CPC_English_Results/v{version}/{timestamp}/
 *   TGP_CPC_Arabic_Results/v{version}/{timestamp}/
 *
 * Copies playwright-report, test-results, and terminal log into each locale
 * archive used during the run (alongside comparison-table archives).
 *
 * @implements {import('@playwright/test/reporter').Reporter}
 */
class VersionedResultsReporter {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || path.resolve(__dirname, '..');
    this.playwrightReportDir = path.resolve(
      this.projectRoot,
      options.playwrightReportDir || 'playwright-report'
    );
    this.testResultsDir = path.resolve(
      this.projectRoot,
      options.testResultsDir || 'test-results'
    );
    this.terminalLogFile = path.resolve(
      this.projectRoot,
      options.terminalLogFile || path.join('test-results', 'terminal-output.log')
    );
    /** @type {Set<string>} */
    this.locales = new Set();
    /** @type {string[]} */
    this.testFiles = [];
  }

  onBegin() {
    ensureSharedRunTimestamp();
  }

  onTestBegin(test) {
    const file = test.location?.file || '';
    if (file) {
      this.testFiles.push(file);
      this.locales.add(getLocaleFromTestFile(file));
    }
  }

  /**
   * @param {string} source
   * @param {string} destination
   */
  _copyDirIfExists(source, destination) {
    if (!fs.existsSync(source)) {
      return false;
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true, force: true });
    return true;
  }

  /**
   * @param {string} source
   * @param {string} destination
   */
  _copyFileIfExists(source, destination) {
    if (!fs.existsSync(source)) {
      return false;
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
    return true;
  }

  /**
   * @param {import('@playwright/test/reporter').FullResult} [result]
   */
  onEnd(result) {
    if (!this.locales.size) {
      // Fallback: English when no tests recorded a file (e.g. empty filter)
      this.locales.add('English');
    }

    const version = getPackageVersion();
    const timestamp = ensureSharedRunTimestamp();
    const archivedRoots = [];

    for (const locale of this.locales) {
      // Pick any matching test file so getRunArchiveDir resolves the right locale root
      const sampleFile =
        this.testFiles.find((file) => getLocaleFromTestFile(file) === locale) ||
        (locale === 'Arabic' ? 'tests/arabic/country-of-residence.spec.js' : 'tests/country-of-residence.spec.js');

      const { dir, resultsRoot } = getRunArchiveDir(sampleFile);
      fs.mkdirSync(dir, { recursive: true });

      const copied = {
        playwrightReport: this._copyDirIfExists(
          this.playwrightReportDir,
          path.join(dir, 'playwright-report')
        ),
        testResults: this._copyDirIfExists(this.testResultsDir, path.join(dir, 'test-results')),
        terminalLog: this._copyFileIfExists(
          this.terminalLogFile,
          path.join(dir, 'terminal-output.log')
        ),
      };

      const summaryPath = path.join(dir, 'run-summary.json');
      const summary = {
        locale,
        version: `v${version}`,
        runTimestamp: timestamp,
        resultsRoot,
        archiveDir: dir,
        status: result?.status || 'unknown',
        archivedAt: new Date().toISOString(),
        copied,
      };
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

      archivedRoots.push(dir);
      console.log(`\nVersioned ${locale} results saved: ${dir}`);
    }

    return undefined;
  }
}

module.exports = VersionedResultsReporter;
