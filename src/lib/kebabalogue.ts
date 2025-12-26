import Papa from 'papaparse';

export interface KebabShop {
  [key: string]: string; // Flexible for now until we know the columns
}

const SHEET_ID = '1ywNVd7LYWZg1Vh5weRwaUdsklkqggI-tDbWAqcOKCL8';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export async function getKebabalogueData(): Promise<KebabShop[]> {
  // Cache the data for 24 hours (86400 seconds)
  const response = await fetch(CSV_URL, { next: { revalidate: 86400 } });
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as KebabShop[];
        // Filter out rows that don't have a valid Shop Name or are the disclaimer
        const validData = data.filter(shop => 
          shop['Shop Name'] && 
          shop['Shop Name'].trim() !== '' &&
          !shop['Shop Name'].includes('THE KEBABALOGUE WILL NOT BE UPDATED')
        );
        resolve(validData);
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
}
