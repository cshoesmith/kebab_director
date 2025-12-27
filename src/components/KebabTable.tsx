'use client';

import { KebabShop } from '@/lib/kebabalogue';

interface KebabTableProps {
  shops: KebabShop[];
}

export default function KebabTable({ shops }: KebabTableProps) {
  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg border-2 border-turkish-gold">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-white uppercase bg-turkish-teal">
          <tr>
            <th scope="col" className="px-6 py-3 border-b-2 border-turkish-gold">Rank</th>
            <th scope="col" className="px-6 py-3 border-b-2 border-turkish-gold">Shop Name</th>
            <th scope="col" className="px-6 py-3 border-b-2 border-turkish-gold">Suburb</th>
            <th scope="col" className="px-6 py-3 border-b-2 border-turkish-gold">Rating</th>
            <th scope="col" className="px-6 py-3 border-b-2 border-turkish-gold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((shop, index) => (
            <tr key={index} className="bg-white border-b border-turkish-gold hover:bg-turkish-cream transition-colors">
              <td className="px-6 py-4 font-bold text-turkish-red whitespace-nowrap">
                #{shop['RANK']}
              </td>
              <td className="px-6 py-4 font-bold text-turkish-blue">
                {shop['Shop Name']}
              </td>
              <td className="px-6 py-4">
                {shop['Suburb']}, {shop['Postcode']}
              </td>
              <td className="px-6 py-4 font-semibold text-turkish-gold">
                {shop['Ox Rating']}
              </td>
              <td className="px-6 py-4">
                <a
                  href={shop['Google'] && shop['Google'].startsWith('http') ? shop['Google'] : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop['Shop Name']}, ${shop['Suburb']} ${shop['Postcode']}, Australia`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-turkish-teal hover:text-turkish-red hover:underline"
                >
                  View Venue
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
