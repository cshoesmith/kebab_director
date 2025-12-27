const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const SHEET_ID = '1ywNVd7LYWZg1Vh5weRwaUdsklkqggI-tDbWAqcOKCL8';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const OUTPUT_FILE = path.join(__dirname, '../src/data/geocoded_shops.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function geocodeAddress(address) {
  try {
    // Respect rate limit: 1 second delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`  Nominatim Query: ${address}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'KebabDirectorBuildScript/1.0'
        }
      }
    );

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error(`  Error geocoding ${address}:`, error.message);
  }
  return null;
}

async function resolveGoogleInfo(googleUrl) {
  if (!googleUrl || !googleUrl.startsWith('http')) return null;
  try {
    // console.log(`  Resolving Google Link: ${googleUrl}`);
    const response = await fetch(googleUrl, { 
      redirect: 'follow',
      method: 'GET', // Use GET to get the full URL and potentially content
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KebabDirector/1.0)'
      }
    });
    
    const finalUrl = response.url;
    // console.log(`  Final URL: ${finalUrl}`);
    
    const info = {
      name: null,
      coords: null
    };

    // 1. Try to extract name from 'q' param
    try {
      const urlObj = new URL(finalUrl);
      const qParam = urlObj.searchParams.get('q');
      if (qParam) {
        info.name = decodeURIComponent(qParam).replace(/\+/g, ' ');
      }
    } catch (e) {}

    // 2. Try to extract coords from URL (e.g. /@ -33.123,151.123)
    // Google Maps URLs often look like .../maps/place/.../@-33.8839046,150.9245333,17z/...
    const coordsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = finalUrl.match(coordsRegex);
    if (match) {
      info.coords = {
        lat: parseFloat(match[1]),
        lon: parseFloat(match[2])
      };
    }

    return info;
  } catch (e) {
    // Ignore errors
    return null;
  }
}

function cleanShopName(name) {
  return name
    .replace(/\(.*?\)/g, '') // Remove text in parentheses
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

async function main() {
  console.log('Fetching CSV...');
  const response = await fetch(CSV_URL);
  const csvText = await response.text();

  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const shops = results.data.filter(shop => 
    shop['Shop Name'] && 
    shop['Shop Name'].trim() !== '' &&
    !shop['Shop Name'].includes('THE KEBABALOGUE WILL NOT BE UPDATED')
  );

  console.log(`Found ${shops.length} shops. Processing...`);

  // Load existing data to avoid re-geocoding
  let geocodedData = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      geocodedData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {
      console.log('Error reading existing data, starting fresh.');
    }
  }

  // Process top 100 shops
  const shopsToProcess = shops.slice(0, 100);
  let newFoundCount = 0;

  for (const shop of shopsToProcess) {
    const key = `${shop['Shop Name']}-${shop['Suburb']}`;
    
    // Skip if already found
    if (geocodedData[key]) {
      // console.log(`Skipping ${shop['Shop Name']} (Already cached)`);
      continue;
    }

    console.log(`Processing: ${shop['Shop Name']} (${shop['Suburb']})`);
    let coords = null;
    let searchName = shop['Shop Name'];

    // Strategy 1: Use Google Link to get canonical name or coords
    if (shop['Google']) {
      const googleInfo = await resolveGoogleInfo(shop['Google']);
      if (googleInfo) {
        if (googleInfo.coords) {
          console.log(`  [Google] Found coordinates directly in URL!`);
          coords = googleInfo.coords;
        }
        if (googleInfo.name) {
          console.log(`  [Google] Canonical Name: '${googleInfo.name}'`);
          searchName = googleInfo.name;
        }
      }
    }

    // Strategy 2: Nominatim with Canonical Name (or original) + Suburb + Postcode
    if (!coords) {
      const cleanName = cleanShopName(searchName);
      coords = await geocodeAddress(`${cleanName}, ${shop['Suburb']} ${shop['Postcode']}, Australia`);
    }

    // Strategy 3: Nominatim with Canonical Name + Suburb (No Postcode)
    if (!coords) {
      const cleanName = cleanShopName(searchName);
      coords = await geocodeAddress(`${cleanName}, ${shop['Suburb']}, Australia`);
    }

    // Strategy 4: Nominatim with JUST Name + Australia (if name is specific enough)
    // Only do this if we have a "Google Canonical Name" which is usually very specific
    if (!coords && searchName !== shop['Shop Name']) {
       coords = await geocodeAddress(`${searchName}, Australia`);
    }

    // Strategy 5: Fallback to Suburb Center
    if (!coords && shop['Suburb']) {
      console.log(`  [Fallback] Trying Suburb Center: ${shop['Suburb']}, Australia`);
      coords = await geocodeAddress(`${shop['Suburb']}, Australia`);
    }
    
    if (coords) {
      geocodedData[key] = coords;
      console.log(`  -> Found: ${coords.lat}, ${coords.lon}`);
      newFoundCount++;
      // Save incrementally every 5 finds
      if (newFoundCount % 5 === 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geocodedData, null, 2));
      }
    } else {
      console.log(`  -> Not found`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geocodedData, null, 2));
  console.log(`Saved geocoded data to ${OUTPUT_FILE}`);
}

main();