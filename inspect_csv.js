const SHEET_ID = '1ywNVd7LYWZg1Vh5weRwaUdsklkqggI-tDbWAqcOKCL8';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

async function inspectCsv() {
  try {
    const response = await fetch(CSV_URL);
    const text = await response.text();
    const lines = text.split('\n');
    if (lines.length > 0) {
      console.log('Headers:', lines[0]);
      if (lines.length > 1) {
        console.log('First Row:', lines[1]);
      }
    } else {
      console.log('Empty CSV');
    }
  } catch (error) {
    console.error('Error fetching CSV:', error);
  }
}

inspectCsv();
