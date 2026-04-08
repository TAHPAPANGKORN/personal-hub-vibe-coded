import { supabase } from "@/lib/supabase";
import { ProfileSection } from "@/components/ProfileSection";
import { BentoGrid } from "@/components/BentoGrid";
import { SetupCard } from "@/components/SetupCard";
import Image from "next/image";
import { Gamepad2, Keyboard, Monitor } from "lucide-react";

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

async function getPcSpecs() {
  const { data, error } = await supabase
    .from("pc_specs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).single();
  if (error || !data) return { show_games: true, show_pc_specs: true, show_gear: true };
  return data;
}

export default async function Home() {
  const gearItems = await getGearItems();
  const gamesList = await getGames();
  const categoriesList = await getCategories();
  const pcSpecsList = await getPcSpecs();
  const siteSettings = await getSiteSettings();

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
      {siteSettings.show_games && gamesList.length > 0 && (
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

      {/* PC BUILD SECTION (Highlighted) */}
      {siteSettings.show_pc_specs && pcSpecsList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-12 mb-8">
          <h2 className="text-xs font-black italic uppercase tracking-widest text-zinc-400 mb-6 flex items-center">
            <Monitor size={16} className="text-purple-400 mr-2" /> Core System Specs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pcSpecsList.map((pc: any) => (
              <div key={pc.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-start gap-4 hover:border-purple-500/30 hover:bg-zinc-800/50 transition-colors group">
                <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 bg-black/40 border border-zinc-800 rounded-xl relative overflow-hidden flex items-center justify-center p-2 group-hover:bg-purple-500/10 transition-colors">
                  {pc.image_url ? (
                    <Image src={pc.image_url} alt={pc.name} fill className="object-cover p-0" sizes="48px" />
                  ) : (
                    <span className="text-[10px] font-black text-zinc-600 block text-center uppercase tracking-tighter leading-tight">{pc.component_type}</span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="inline-block px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-[9px] uppercase tracking-wider font-bold text-purple-400 rounded-full mb-1">{pc.component_type}</span>
                  <h3 className="text-white font-bold text-sm leading-tight mb-1 truncate">{pc.name}</h3>
                  {pc.specs_detail && (
                    <p className="text-xs text-zinc-500 truncate">{pc.specs_detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GAMING SETUP SECTION (GROUPED BY CATEGORY) */}
      {siteSettings.show_gear && (
        <section className="space-y-8">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-xs font-black italic uppercase tracking-widest text-zinc-400 mb-4 flex items-center">
            <Keyboard size={16} className="text-white mr-2" /> Peripherals & Gear
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
      )}
    </main>
  );
}
