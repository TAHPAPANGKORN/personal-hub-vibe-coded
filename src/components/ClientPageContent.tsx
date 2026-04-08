"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ProfileSection } from "@/components/ProfileSection";
import { BentoGrid } from "@/components/BentoGrid";
import { SetupCard } from "@/components/SetupCard";
import { FocusModal } from "@/components/FocusModal";
import { FloatingComments } from "@/components/FloatingComments";
import { CommentInput } from "@/components/CommentInput";
import { InteractiveHero } from "@/components/InteractiveHero";
import Image from "next/image";
import { Gamepad2, Keyboard, Monitor, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ClientPageContentProps {
  gearItems: any[];
  gamesList: any[];
  categoriesList: any[];
  pcSpecsList: any[];
  hotspots: any[];
  siteSettings: any;
}

export const ClientPageContent = ({
  gearItems: initialGearItems,
  gamesList,
  categoriesList,
  pcSpecsList: initialPcSpecsList,
  hotspots: initialHotspots,
  siteSettings: initialSiteSettings
}: ClientPageContentProps) => {
  const [gearItems, setGearItems] = useState(initialGearItems);
  const [pcSpecsList, setPcSpecsList] = useState(initialPcSpecsList);
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [siteSettings, setSiteSettings] = useState(initialSiteSettings);
  const [focusedItem, setFocusedItem] = useState<any>(null);
  const [focusedType, setFocusedType] = useState<"gear" | "pc">("gear");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  
  const focusedItemRef = useRef<any>(null);

  // Persistence: Get or Create a stable Client ID for this session to prevent refresh double-counting
  const clientId = useMemo(() => {
    if (typeof window === "undefined") return null;
    let id = sessionStorage.getItem("vibe_client_id");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("vibe_client_id", id);
    }
    return id;
  }, []);

  useEffect(() => {
    focusedItemRef.current = focusedItem;
  }, [focusedItem]);

  useEffect(() => {
    if (!clientId) return;

    // 1. CONSOLIDATED REAL-TIME: One channel for Presence and all Postgres updates
    const dashboardChannel = supabase.channel("dashboard_main");
    
    // Helper to calculate distinct counts efficiently
    const calculateCount = () => {
      const state = dashboardChannel.presenceState();
      const uniqueIds = new Set();
      
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (p.clientId) {
            uniqueIds.add(p.clientId);
          }
        });
      });

      const finalCount = uniqueIds.size > 0 ? uniqueIds.size : Object.keys(state).length;
      setOnlineCount(finalCount || 1);
    };

    dashboardChannel
      // Presence (Online Count) - Listening to all events for maximum responsiveness
      .on("presence", { event: "sync" }, calculateCount)
      .on("presence", { event: "join" }, calculateCount)
      .on("presence", { event: "leave" }, calculateCount)
      
      // Gear Updates
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "gear_items" }, (payload) => {
        setGearItems((prev) => prev.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item));
        if (focusedItemRef.current?.id === payload.new.id) {
          setFocusedItem(payload.new);
        }
      })
      // PC Spec Updates
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pc_specs" }, (payload) => {
        setPcSpecsList((prev) => prev.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item));
        if (focusedItemRef.current?.id === payload.new.id) {
          setFocusedItem(payload.new);
        }
      })
      // SITE SETTINGS Updates
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "site_settings" }, (payload) => {
        setSiteSettings(payload.new);
      })
      // Hotspot Updates (Fetch fresh hotspots on any change)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hotspots" }, async () => {
        const { data } = await supabase.from("hotspots").select("*").order("created_at", { ascending: true });
        if (data) setHotspots(data);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "hotspots" }, async () => {
        const { data } = await supabase.from("hotspots").select("*").order("created_at", { ascending: true });
        if (data) setHotspots(data);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track presence immediately on subscription
          await dashboardChannel.track({ 
            online_at: new Date().toISOString(),
            clientId: clientId
          });
        }
      });

    return () => {
      dashboardChannel.unsubscribe();
    };
  }, [clientId]); 

  const openFocus = (item: any, type: "gear" | "pc") => {
    setFocusedItem(item);
    setFocusedType(type);
    setIsModalOpen(true);
  };

  // Performance: Memoize unique categories and their order
  const uniqueCategories = useMemo(() => {
    const categories = Array.from(new Set(gearItems.map((item: any) => item.category)));
    
    return categories.sort((a: any, b: any) => {
      const aCat = categoriesList.find((c: any) => c.name === a);
      const bCat = categoriesList.find((c: any) => c.name === b);
      const aOrder = aCat ? aCat.sort_order : 999;
      const bOrder = bCat ? bCat.sort_order : 999;
      
      if (aOrder === bOrder) return a.localeCompare(b);
      return aOrder - bOrder;
    });
  }, [gearItems, categoriesList]);

  return (
    <>
      <main className="relative z-10 min-h-screen py-10 md:py-16 space-y-16 md:space-y-24 pb-32">
        {/* HERO SECTION — FloatingComments is scoped inside here via absolute positioning */}
        <div className="relative overflow-hidden min-h-[420px] md:min-h-[480px]">
          {/* z-0: comments float behind everything */}
          {siteSettings?.show_floating_comments !== false && <FloatingComments />}
          {/* z-10: profile content sits in front of comments */}
          <div className="relative z-10">
            <ProfileSection onlineCount={onlineCount} settings={siteSettings} />
          </div>
        </div>

        {/* GAMES & RANKS SECTION */}
        {siteSettings.show_games && gamesList.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                <Trophy size={18} className="text-yellow-500" />
              </div>
              <h2 className="text-xs font-black italic uppercase tracking-[0.3em] text-zinc-400">
                Competitive Status
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {gamesList.map((game: any) => (
                <div key={game.id} className="group bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-3xl flex items-center gap-4 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-300">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-black border border-zinc-800 relative flex items-center justify-center font-black text-white text-xl overflow-hidden group-hover:scale-105 transition-transform">
                    {game.image_url ? (
                      <Image src={game.image_url} alt={game.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      game.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm text-white font-bold line-clamp-1">{game.name}</p>
                    {game.rank && (
                      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-0.5">{game.rank}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* INTERACTIVE SETUP SECTION: THE COMMAND CENTER */}
        {siteSettings.show_setup_visual !== false && siteSettings.setup_main_image_url && (
          <section className="relative w-full">
            {/* Background Glow Bleed - Desktop Only */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-purple-600/10 blur-[120px] -z-10 pointer-events-none hidden md:block" />
            
            <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
               <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] w-8 md:w-16 bg-gradient-to-r from-transparent to-purple-500" />
                    <div className="p-3 bg-zinc-900 border border-purple-500/20 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.15)] relative group">
                       <div className="absolute inset-0 bg-purple-500/20 rounded-2xl animate-ping-slow opacity-20" />
                       <Monitor size={24} className="text-purple-400 relative z-10" />
                    </div>
                    <div className="h-[2px] w-8 md:w-16 bg-gradient-to-l from-transparent to-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-[0.2em] text-white">Interactive Zone</h2>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-500 mt-2">Interactive Hardware Ecosystem Mapping</p>
                  </div>
               </div>
            </div>

            <InteractiveHero 
              imageUrl={siteSettings.setup_main_image_url}
              hotspots={hotspots}
              gearItems={gearItems}
              pcSpecs={pcSpecsList}
              onOpenFocus={openFocus}
            />
          </section>
        )}


        {/* PC BUILD SECTION */}
        {siteSettings.show_pc_specs && pcSpecsList.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8 mt-12 mb-8 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <Monitor size={18} className="text-purple-500" />
                </div>
                <h2 className="text-xs font-black italic uppercase tracking-[0.3em] text-zinc-400">
                  The Core Arsenal
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pcSpecsList.map((pc: any) => (
                <div 
                  key={pc.id} 
                  onClick={() => openFocus(pc, "pc")}
                  className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-3xl flex items-center gap-5 hover:border-purple-500/40 hover:bg-zinc-900 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-14 w-14 shrink-0 bg-black border border-zinc-800 rounded-2xl relative overflow-hidden flex items-center justify-center group-hover:bg-purple-500/5 transition-colors">
                    {pc.image_url ? (
                      <Image src={pc.image_url} alt={pc.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <span className="text-[10px] font-black text-zinc-700 uppercase">{pc.component_type.slice(0, 3)}</span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="inline-block px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-[8px] uppercase tracking-wider font-black text-purple-400 rounded-md mb-2">{pc.component_type}</span>
                    <h3 className="text-white font-bold text-sm leading-tight mb-1 truncate group-hover:text-purple-400 transition-colors">{pc.name}</h3>
                    {pc.specs_detail && (
                      <p className="text-[10px] text-zinc-500 font-medium truncate italic">{pc.specs_detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GAMING SETUP SECTION */}
        {siteSettings.show_gear && (
          <section className="space-y-16">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <Keyboard size={18} className="text-white" />
                </div>
                <h2 className="text-xs font-black italic uppercase tracking-[0.3em] text-zinc-400">
                  Tactical Peripherals
                </h2>
              </div>
            </div>

            <div className="space-y-20 md:space-y-24">
              {uniqueCategories.map((categoryName, catIndex) => {
                const itemsInCategory = gearItems.filter((item: any) => item.category === categoryName);
                
                return (
                  <div key={categoryName as string} className="space-y-8">
                    <div className="max-w-7xl mx-auto px-4 md:px-8">
                      <h3 className="text-lg font-black italic text-white tracking-widest uppercase border-l-2 border-purple-500 pl-4 py-1">
                        {categoryName as string}
                      </h3>
                    </div>
                    
                    <BentoGrid>
                      {itemsInCategory.map((item: any, index: number) => (
                        <SetupCard
                          key={item.id}
                          id={item.id}
                          category={item.category}
                          model_name={item.model_name}
                          brand={item.brand}
                          image_url={item.image_url}
                          affiliate_link={item.affiliate_link}
                          likes={item.likes}
                          index={index}
                          priority={catIndex === 0 && index < 2}
                          onClick={() => openFocus(item, "gear")}
                        />
                      ))}
                    </BentoGrid>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>


      {siteSettings?.show_comment_input !== false && (
        <CommentInput siteSettings={siteSettings} />
      )}

      <FocusModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        item={focusedItem}
        type={focusedType}
      />
    </>
  );
};
