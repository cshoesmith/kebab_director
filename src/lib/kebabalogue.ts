import Papa from 'papaparse';
import geocodedData from '@/data/geocoded_shops.json';

export interface KebabShop {
  [key: string]: string | number | undefined | null; // Allow numbers for lat/lon and optional fields
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
          String(shop['Shop Name']).trim() !== '' &&
          !String(shop['Shop Name']).includes('THE KEBABALOGUE WILL NOT BE UPDATED')
        );

        // Merge with pre-calculated geocoded data
        const mergedData = validData.map(shop => {
          const key = `${shop['Shop Name']}-${shop['Suburb']}`;
          // @ts-expect-error - geocodedData is a JSON object with dynamic keys
          const coords = (geocodedData as Record<string, { lat: number; lon: number }>)[key];
          if (coords) {
            return { ...shop, lat: coords.lat, lon: coords.lon };
          }
          return shop;
        });

        resolve(mergedData);
      },
      error: (error: unknown) => {
        reject(error);
      },
    });
  });
}
