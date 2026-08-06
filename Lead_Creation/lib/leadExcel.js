/**
 * Read / update Lead_Creation/data/create-leads.xlsx for bulk lead creation.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const LEAD_ID_HEADER = 'Lead Id';
const LEAD_URL_HEADER = 'Lead URL';

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
  return path.resolve(__dirname, '..', 'data', 'create-leads.xlsx');
}

/**
 * @param {string} [excelPath]
 * @returns {Array<{
 *   rowNumber: number,
 *   salutation: string,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   countryCode: string,
 *   description: string,
 *   contactNumber: string,
 *   addressSearch: string,
 *   dummyApplicationNumber: string,
 *   leadId: string,
 *   leadUrl: string,
 * }>}
 */
function readLeadRows(excelPath = defaultExcelPath()) {
  if (!fs.existsSync(excelPath)) {
    throw new Error(
      `Excel file not found: ${excelPath}. Run: node Lead_Creation/scripts/create-sample-leads-xlsx.js`,
    );
  }

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const leads = [];
  rawRows.forEach((row, index) => {
    const lastName = pickCell(row, 'Last Name', 'LastName', 'Surname');
    if (!lastName) return;

    leads.push({
      rowNumber: index + 2,
      salutation: pickCell(row, 'Salutation'),
      firstName: pickCell(row, 'First Name', 'FirstName'),
      lastName,
      email: pickCell(row, 'Email', 'Email Address'),
      countryCode: pickCell(row, 'Country Code', 'CountryCode', 'Dial Code'),
      description: pickCell(row, 'Description/Notes', 'Description', 'Notes', 'Description/ Notes'),
      contactNumber: pickCell(row, 'Contact Number', 'ContactNumber', 'Phone', 'Mobile'),
      addressSearch: pickCell(row, 'Address Search', 'AddressSearch', 'Address'),
      dummyApplicationNumber: pickCell(
        row,
        'Dummy Application Number',
        'DummyApplicationNumber',
        'Application Number',
      ),
      leadId: pickCell(row, 'Lead Id', 'LeadId', 'Lead ID'),
      leadUrl: pickCell(row, 'Lead URL', 'LeadUrl', 'Lead Link'),
    });
  });

  if (leads.length === 0) {
    throw new Error(`No data rows with Last Name in ${excelPath}`);
  }

  return leads;
}

/**
 * Ensure a header column exists; return 0-based column index.
 * @param {import('xlsx').WorkSheet} sheet
 * @param {import('xlsx').Range} range
 * @param {string} headerName
 */
function ensureHeaderColumn(sheet, range, headerName) {
  for (let c = range.s.c; c <= range.e.c; c++) {
    const headerCell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    const header = headerCell ? String(headerCell.v) : '';
    if (normalizeHeader(header) === normalizeHeader(headerName)) {
      return c;
    }
  }

  const col = range.e.c + 1;
  sheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })] = { t: 's', v: headerName };
  range.e.c = col;
  return col;
}

/**
 * @param {string} excelPath
 * @param {number} excelRowNumber 1-based Excel row (header = 1, first data row = 2)
 * @param {{ leadId?: string, leadUrl?: string }} values
 */
function writeLeadResultToExcel(excelPath, excelRowNumber, values) {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet['!ref']) {
    throw new Error(`Excel sheet "${sheetName}" is empty`);
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const leadIdCol = ensureHeaderColumn(sheet, range, LEAD_ID_HEADER);
  const leadUrlCol = ensureHeaderColumn(sheet, range, LEAD_URL_HEADER);
  const dataRowIndex = excelRowNumber - 1;

  if (values.leadId) {
    sheet[XLSX.utils.encode_cell({ r: dataRowIndex, c: leadIdCol })] = {
      t: 's',
      v: values.leadId,
    };
  }
  if (values.leadUrl) {
    sheet[XLSX.utils.encode_cell({ r: dataRowIndex, c: leadUrlCol })] = {
      t: 's',
      v: values.leadUrl,
    };
  }

  sheet['!ref'] = XLSX.utils.encode_range(range);
  XLSX.writeFile(workbook, excelPath);
}

module.exports = {
  defaultExcelPath,
  readLeadRows,
  writeLeadResultToExcel,
  LEAD_ID_HEADER,
  LEAD_URL_HEADER,
};
