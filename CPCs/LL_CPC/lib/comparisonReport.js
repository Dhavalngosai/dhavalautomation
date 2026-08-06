const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_ENGLISH_RESULTS_ROOT = path.join(PROJECT_ROOT, 'LL_CPC_English_Results');
const DEFAULT_ARABIC_RESULTS_ROOT = path.join(PROJECT_ROOT, 'LL_CPC_Arabic_Results');
const LEGACY_RESULTS_ROOT = path.join(PROJECT_ROOT, 'LL_CPC_Results');

/** @type {Map<string, { dir: string, timestamp: string, version: string, locale: string, resultsRoot: string }>} */
const activeRunArchives = new Map();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatRunTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function getPackageVersion() {
  if (process.env.LL_CPC_VERSION?.trim()) {
    return process.env.LL_CPC_VERSION.trim();
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    return String(pkg.version || '0.0.0');
  } catch {
    return '0.0.0';
  }
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'comparison-report';
}

function getLocaleFromTestFile(testFile) {
  const normalized = String(testFile || '').replace(/\\/g, '/').toLowerCase();
  return /(^|\/)arabic\//.test(normalized) || normalized.includes('tests/arabic/') ? 'Arabic' : 'English';
}

function getResultsRootForLocale(locale) {
  if (locale === 'Arabic') {
    return (
      process.env.LL_CPC_ARABIC_RESULTS_DIR?.trim() ||
      process.env.LL_CPC_RESULTS_DIR?.trim() ||
      DEFAULT_ARABIC_RESULTS_ROOT
    );
  }

  return (
    process.env.LL_CPC_ENGLISH_RESULTS_DIR?.trim() ||
    process.env.LL_CPC_RESULTS_DIR?.trim() ||
    DEFAULT_ENGLISH_RESULTS_ROOT
  );
}

function getRunTimestampForLocale(locale) {
  if (locale === 'Arabic' && process.env.LL_CPC_ARABIC_RUN_TIMESTAMP?.trim()) {
    return process.env.LL_CPC_ARABIC_RUN_TIMESTAMP.trim();
  }

  if (locale === 'English' && process.env.LL_CPC_ENGLISH_RUN_TIMESTAMP?.trim()) {
    return process.env.LL_CPC_ENGLISH_RUN_TIMESTAMP.trim();
  }

  return process.env.LL_CPC_RUN_TIMESTAMP?.trim() || formatRunTimestamp(new Date());
}

/**
 * @param {string} [testFile]
 */
function getRunArchiveDir(testFile = '') {
  const locale = getLocaleFromTestFile(testFile);
  const version = getPackageVersion();
  const timestamp = getRunTimestampForLocale(locale);
  const resultsRoot = getResultsRootForLocale(locale);
  const cacheKey = `${locale}|v${version}|${timestamp}|${resultsRoot}`;

  const cached = activeRunArchives.get(cacheKey);
  if (cached) {
    return cached;
  }

  const dir = path.join(resultsRoot, `v${version}`, timestamp);
  fs.mkdirSync(dir, { recursive: true });

  const archive = { dir, timestamp, version, locale, resultsRoot };
  activeRunArchives.set(cacheKey, archive);
  return archive;
}

function summarizeRows(rows) {
  const total = rows.length;
  const success = rows.filter((row) => String(row.Result).toLowerCase() === 'success').length;
  return {
    total,
    success,
    failed: total - success,
  };
}

function updateRunMetadata(archiveDir, entry) {
  const metadataPath = path.join(archiveDir, 'run-metadata.json');
  let metadata = {
    locale: entry.locale,
    version: getPackageVersion(),
    timestamp: entry.runTimestamp,
    timestampFolder: path.basename(archiveDir),
    resultsRoot: entry.resultsRoot || path.dirname(path.dirname(archiveDir)),
    reports: [],
  };

  if (fs.existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch {
      /* rewrite metadata if corrupt */
    }
  }

  metadata.locale = entry.locale;
  metadata.reports = metadata.reports.filter((report) => report.id !== entry.id);
  metadata.reports.push(entry);
  metadata.lastUpdatedAt = new Date().toISOString();

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
}

/**
 * @param {Record<string, string>[]} rows
 * @param {string} title
 * @param {{ version?: string, timestamp?: string, locale?: string }} [meta]
 * @returns {string}
 */
function buildComparisonHtml(rows, title, meta = {}) {
  const version = meta.version || getPackageVersion();
  const timestamp = meta.timestamp || formatRunTimestamp();
  const locale = meta.locale || 'English';

  if (!rows.length) {
    return `<!DOCTYPE html><html><body><p>No comparison data recorded.</p></body></html>`;
  }

  const headers = Object.keys(rows[0]);
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const bodyHtml = rows
    .map((row) => {
      const cells = headers
        .map((header) => {
          const raw = row[header];
          const isResult = header === 'Result';
          const cls =
            isResult && String(raw).toLowerCase() === 'success'
              ? ' class="success"'
              : isResult
                ? ' class="failed"'
                : '';
          return `<td${cls}>${escapeHtml(raw)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    .meta { font-size: 13px; color: #4b5563; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    .success { color: #047857; font-weight: 600; }
    .failed { color: #b91c1c; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Locale: ${escapeHtml(locale)} | Version: v${escapeHtml(version)} | Run timestamp: ${escapeHtml(timestamp)}</p>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
</body>
</html>`;
}

function archiveComparisonReport(testInfo, rows, title) {
  const { dir, timestamp, version, locale, resultsRoot } = getRunArchiveDir(testInfo.file);
  const reportSlug = slugify(title);
  const reportDir = path.join(dir, reportSlug);

  fs.mkdirSync(reportDir, { recursive: true });

  const summary = summarizeRows(rows);
  const reportMeta = {
    id: reportSlug,
    title,
    locale,
    testFile: testInfo.file,
    testTitle: testInfo.title,
    version: `v${version}`,
    runTimestamp: timestamp,
    resultsRoot,
    archivedAt: new Date().toISOString(),
    ...summary,
  };

  const archivedHtmlPath = path.join(reportDir, 'comparison-table.html');
  const archivedJsonPath = path.join(reportDir, 'comparison-table.json');
  const archivedMetaPath = path.join(reportDir, 'report-metadata.json');

  const payload = {
    metadata: reportMeta,
    rows,
  };

  fs.writeFileSync(
    archivedHtmlPath,
    buildComparisonHtml(rows, title, { version, timestamp, locale }),
    'utf8'
  );
  fs.writeFileSync(archivedJsonPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(archivedMetaPath, JSON.stringify(reportMeta, null, 2), 'utf8');
  updateRunMetadata(dir, {
    ...reportMeta,
    htmlPath: archivedHtmlPath,
    jsonPath: archivedJsonPath,
  });

  console.log(`Archived ${locale} comparison report: ${archivedJsonPath}`);
  return reportDir;
}

/**
 * Print console.table and attach HTML/JSON comparison artifacts to the Playwright report.
 * Also archives a timestamped copy under locale-specific results folders:
 *   LL_CPC_English_Results/v{version}/{timestamp}/
 *   LL_CPC_Arabic_Results/v{version}/{timestamp}/
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {Record<string, string>[]} rows
 * @param {string} title
 */
async function attachComparisonReport(testInfo, rows, title) {
  const { timestamp, version, locale } = getRunArchiveDir(testInfo.file);

  console.log(`\n================ ${title.toUpperCase()} ================`);
  console.table(rows);
  console.log('==========================================================\n');

  const outputDir = testInfo.outputDir;
  fs.mkdirSync(outputDir, { recursive: true });

  const htmlPath = path.join(outputDir, 'comparison-table.html');
  const jsonPath = path.join(outputDir, 'comparison-table.json');

  fs.writeFileSync(
    htmlPath,
    buildComparisonHtml(rows, title, { version, timestamp, locale }),
    'utf8'
  );
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        metadata: {
          title,
          locale,
          version: `v${version}`,
          runTimestamp: timestamp,
          testFile: testInfo.file,
          testTitle: testInfo.title,
          ...summarizeRows(rows),
        },
        rows,
      },
      null,
      2
    ),
    'utf8'
  );

  archiveComparisonReport(testInfo, rows, title);

  await testInfo.attach('comparison-table', {
    path: htmlPath,
    contentType: 'text/html',
  });

  await testInfo.attach('comparison-table.json', {
    path: jsonPath,
    contentType: 'application/json',
  });
}

module.exports = {
  buildComparisonHtml,
  attachComparisonReport,
  archiveComparisonReport,
  getRunArchiveDir,
  getPackageVersion,
  getLocaleFromTestFile,
  getResultsRootForLocale,
  LEGACY_RESULTS_ROOT,
};
