/**
 * Creates data/create-cases.xlsx with sample column headers and one example row.
 * Run: node scripts/create-sample-cases-xlsx.js
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const outPath = path.join(__dirname, '..', 'data', 'create-cases.xlsx');

const rows = [
  {
    User: 'Dhaval Gosai',
    Subject: 'Testing 220626 01',
    Description: 'Testing',
    'Account Name': 'Dhaval Gosai',
    Asset: 'Ain Dubai',
    'Sub Asset': '',
    'Case Type': 'AD - Marketing',
    'Sub Type': 'Influencer Visit',
    'Case Number': '',
  },
];

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Cases');
XLSX.writeFile(wb, outPath);

console.log(`Created ${outPath}`);
