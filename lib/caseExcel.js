/**
 * Read / update data/create-cases.xlsx for bulk case creation.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const CASE_NUMBER_HEADER = 'Case Number';

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function pickCell(row, ...aliases) {
  const wanted = new Set(aliases.map((a) => normalizeHeader(a)));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(normalizeHeader(key))) {
      const text = String(value ?? '').trim();
      if (text) return text;
    }
  }
  return '';
}

function defaultExcelPath() {
  return path.resolve(__dirname, '..', 'data', 'create-cases.xlsx');
}

/**
 * @param {string} [excelPath]
 * @returns {Array<{
 *   rowNumber: number,
 *   user: string,
 *   subject: string,
 *   description: string,
 *   accountName: string,
 *   asset: string,
 *   subAsset: string,
 *   caseType: string,
 *   subType: string,
 *   caseNumber: string,
 * }>}
 */
function readCaseRows(excelPath = defaultExcelPath()) {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}. Run: node scripts/create-sample-cases-xlsx.js`);
  }

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const cases = [];
  rawRows.forEach((row, index) => {
    const subject = pickCell(row, 'Subject');
    if (!subject) return;

    const user = pickCell(row, 'User', 'Case Owner', 'Owner');
    if (!user) {
      throw new Error(`Excel row ${index + 2}: User is required (Setup → Users → Login as user).`);
    }

    cases.push({
      rowNumber: index + 2,
      user,
      subject,
      description: pickCell(row, 'Description'),
      accountName: pickCell(row, 'Account Name', 'Account', 'AccountName'),
      asset: pickCell(row, 'Asset', 'ASSET'),
      subAsset: pickCell(row, 'Sub Asset', 'SubAsset', 'SUB ASSET'),
      caseType: pickCell(row, 'Case Type', 'CaseType'),
      subType: pickCell(row, 'Sub Type', 'Sub Type', 'SubType', 'Subtype', 'Case Sub Type'),
      caseNumber: pickCell(row, 'Case Number', 'CaseNumber', 'Case No', 'Case #'),
    });
  });

  if (cases.length === 0) {
    throw new Error(`No data rows with Subject in ${excelPath}`);
  }

  return cases;
}

/**
 * @param {string} excelPath
 * @param {number} excelRowNumber 1-based Excel row (header = 1, first data row = 2)
 * @param {string} caseNumber
 */
function writeCaseNumberToExcel(excelPath, excelRowNumber, caseNumber) {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet['!ref']) {
    throw new Error(`Excel sheet "${sheetName}" is empty`);
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  let caseNumberCol = -1;

  for (let c = range.s.c; c <= range.e.c; c++) {
    const headerCell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    const header = headerCell ? String(headerCell.v) : '';
    if (normalizeHeader(header) === normalizeHeader(CASE_NUMBER_HEADER)) {
      caseNumberCol = c;
      break;
    }
  }

  if (caseNumberCol < 0) {
    caseNumberCol = range.e.c + 1;
    sheet[XLSX.utils.encode_cell({ r: range.s.r, c: caseNumberCol })] = { t: 's', v: CASE_NUMBER_HEADER };
    range.e.c = caseNumberCol;
  }

  const dataRowIndex = excelRowNumber - 1;
  sheet[XLSX.utils.encode_cell({ r: dataRowIndex, c: caseNumberCol })] = { t: 's', v: caseNumber };
  sheet['!ref'] = XLSX.utils.encode_range(range);

  XLSX.writeFile(workbook, excelPath);
}

module.exports = {
  defaultExcelPath,
  readCaseRows,
  writeCaseNumberToExcel,
  CASE_NUMBER_HEADER,
};
