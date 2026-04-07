import { supabase } from "@/lib/supabase";
import { ProfileSection } from "@/components/ProfileSection";
import { BentoGrid } from "@/components/BentoGrid";
import { SetupCard } from "@/components/SetupCard";
import Image from "next/image";
import { Gamepad2, Keyboard } from "lucide-react";

export const revalidate = 60; // Revalidate every 60 seconds

async function getGearItems() {
  const { data, error } = await supabase
    .from("gear_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}

async function getGames() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}

async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}

export default async function Home() {
  const gearItems = await getGearItems();
  const gamesList = await getGames();
  const categoriesList = await getCategories();

  // Extract unique categories present in gear items
  const uniqueCategories = Array.from(new Set(gearItems.map((item: any) => item.category)));
  
  // Sort those categories based on the database sort_order, falling back to 999 (bottom) for deleted categories
  uniqueCategories.sort((a: any, b: any) => {
    const aCat = categoriesList.find((c: any) => c.name === a);
    const bCat = categoriesList.find((c: any) => c.name === b);
    const aOrder = aCat ? aCat.sort_order : 999;
    const bOrder = bCat ? bCat.sort_order : 999;
    
    if (aOrder === bOrder) return a.localeCompare(b);
    return aOrder - bOrder;
  });

  return (
    <main className="min-h-screen py-12 space-y-12 pb-24">
      <ProfileSection />

      {/* GAMES & RANKS SECTION */}
      {gamesList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-xs font-black italic uppercase tracking-widest text-zinc-400 mb-4 flex items-center">
            <Gamepad2 size={16} className="text-white mr-2" /> Current Games & Ranks
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gamesList.map((game: any) => (
              <div key={game.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 hover:bg-zinc-900 hover:border-zinc-700 transition-all">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 relative flex items-center justify-center font-black text-white text-xl overflow-hidden">
                  {game.image_url ? (
                    <Image src={game.image_url} alt={game.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    game.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm text-white font-bold line-clamp-1">{game.name}</p>
                  {game.rank && (
                    <p className="text-[10px] uppercase font-bold text-zinc-500 line-clamp-1">{game.rank}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GAMING SETUP SECTION (GROUPED BY CATEGORY) */}
      <section className="space-y-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-xs font-black italic uppercase tracking-widest text-zinc-400 mb-4 flex items-center">
            <Keyboard size={16} className="text-white mr-2" /> Gaming Setup
          </h2>
        </div>

        <div className="space-y-12">
          {uniqueCategories.length > 0 ? (
            uniqueCategories.map((categoryName) => {
              const itemsInCategory = gearItems.filter((item: any) => item.category === categoryName);
              
              return (
                <div key={categoryName as string} className="space-y-4">
                  <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <h3 className="text-sm font-semibold text-white/90 border-b border-zinc-800/80 pb-2 inline-block pr-6">
                      {categoryName as string}
                    </h3>
                  </div>
                  
                  <BentoGrid>
                    {itemsInCategory.map((item: any, index: number) => (
                      <SetupCard
                        key={item.id}
                        category={item.category}
                        model_name={item.model_name}
                        brand={item.brand}
                        image_url={item.image_url}
                        affiliate_link={item.affiliate_link}
                        index={index}
                        className="h-full"
                      />
                    ))}
                  </BentoGrid>
                </div>
              );
            })
          ) : (
            <BentoGrid>
              <div className="col-span-full py-10 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-center text-zinc-500">
                <p className="text-sm font-medium">No gear items found.</p>
              </div>
            </BentoGrid>
          )}
        </div>
      </section>
    </main>
  );
}
