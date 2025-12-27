const SHEET_ID = '1ywNVd7LYWZg1Vh5weRwaUdsklkqggI-tDbWAqcOKCL8';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

async function inspectCsv() {
  try {
    const response = await fetch(CSV_URL);
    const text = await response.text();
    const lines = text.split('\n');
    if (lines.length > 0) {
      console.log('Headers:', lines[0]);
      // Parse a few lines to find one with a Google link
      const Papa = require('papaparse');
      const results = Papa.parse(text, { header: true });
      const shopsWithGoogle = results.data.filter(s => s['Shop Name'] === 'Merrifield Kebab House');
      
      if (shopsWithGoogle.length > 0) {
        console.log('Shop:', shopsWithGoogle[0]['Shop Name']);
        console.log('Google Link:', shopsWithGoogle[0]['Google']);
      }
    } else {
      console.log('Empty CSV');
    }
  } catch (error) {
    console.error('Error fetching CSV:', error);
  }
}

inspectCsv();
