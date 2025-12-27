import { getKebabalogueData } from '@/lib/kebabalogue';
import KebabFinder from '@/components/KebabFinder';

export default async function Home() {
  const kebabShops = await getKebabalogueData();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col mb-8">
        <div className="bg-turkish-red text-white px-8 py-4 rounded-t-lg border-x-4 border-t-4 border-turkish-gold shadow-lg">
          <h1 className="text-5xl font-bold tracking-wider uppercase drop-shadow-md">Kebab Director</h1>
        </div>
        <div className="bg-white px-8 py-2 rounded-b-lg border-x-4 border-b-4 border-turkish-gold shadow-lg text-turkish-blue font-bold">
          The Ultimate Guide to Sydney&apos;s Best Kebabs
        </div>
      </div>

      <div className="w-full max-w-5xl turkish-border bg-white p-6 rounded-lg shadow-2xl mb-12">
        <KebabFinder shops={kebabShops} />
      </div>
    </main>
  );
}
