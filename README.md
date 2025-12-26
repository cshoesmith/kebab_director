# Kebab Director

Kebab Director is a Next.js application that helps users find the nearest kebab shop using the 'Kebabalogue' database.

## Features

- **Kebabalogue Integration**: Fetches kebab shop data directly from the official Google Sheet.
- **Geolocation**: Automatically detects your location to find the nearest shops.
- **Routing**: Provides direct links to Google Maps for walking, driving, or public transport directions.
- **Responsive UI**: Works on mobile and desktop.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Data Source

The app uses data from the [Kebabalogue Google Sheet](https://docs.google.com/spreadsheets/d/1ywNVd7LYWZg1Vh5weRwaUdsklkqggI-tDbWAqcOKCL8/edit?pli=1&gid=0#gid=0).

## Technologies

- Next.js
- React
- Tailwind CSS
- PapaParse (CSV Parsing)
