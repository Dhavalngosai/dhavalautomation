/**
 * Creates Lead_Creation/data/create-leads.xlsx with sample headers and example rows.
 * Run: node Lead_Creation/scripts/create-sample-leads-xlsx.js
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const outPath = path.join(__dirname, '..', 'data', 'create-leads.xlsx');

const rows = [
  {
    Salutation: '',
    'First Name': 'QA test-001',
    'Last Name': 'ABCD',
    Email: 'dgosai+001@horizontal.com',
    'Country Code': '+971',
    'Description/Notes': 'Test',
    'Contact Number': '123456798',
    'Address Search': '121',
    'Dummy Application Number': '',
    'Lead Id': '',
    'Lead URL': '',
  },
  {
    Salutation: '',
    'First Name': 'QA test-002',
    'Last Name': 'EFGH',
    Email: 'dgosai+002@horizontal.com',
    'Country Code': '+971',
    'Description/Notes': 'Test lead from Excel',
    'Contact Number': '987654321',
    'Address Search': '121',
    'Dummy Application Number': '',
    'Lead Id': '',
    'Lead URL': '',
  },
];

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Leads');
XLSX.writeFile(wb, outPath);

console.log(`Created ${outPath}`);
