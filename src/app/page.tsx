import { getKebabalogueData } from '@/lib/kebabalogue';
import KebabFinder from '@/components/KebabFinder';

export default async function Home() {
  const kebabShops = await getKebabalogueData();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Kebab Director</h1>
      </div>

      <KebabFinder shops={kebabShops} />

      <div className="w-full max-w-5xl mt-12">
        <h2 className="text-2xl font-semibold mb-4">Kebabalogue Data Preview</h2>
        <p className="mb-4">Found {kebabShops.length} kebab shops.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kebabShops.slice(0, 9).map((shop, index) => (
            <div key={index} className="border p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg">{shop['Shop Name']}</h3> 
              <div className="text-sm text-gray-600 mt-2">
                <p>{shop['Suburb']}, {shop['Postcode']}</p>
                <p className="mt-1 font-semibold">Rank: {shop['RANK']}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
