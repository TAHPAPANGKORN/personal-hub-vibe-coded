"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ShoppingCart, ArrowRight, MousePointer2, X, Plus, Info } from "lucide-react";
import type { Hotspot, GearItem, PcSpec } from "@/types/admin";

interface InteractiveHeroProps {
  imageUrl: string | null;
  hotspots: Hotspot[];
  gearItems: GearItem[];
  pcSpecs: PcSpec[];
  onOpenFocus: (item: any, type: "gear" | "pc") => void;
}

export function InteractiveHero({ imageUrl, hotspots, gearItems, pcSpecs, onOpenFocus }: InteractiveHeroProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showAmbient, setShowAmbient] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    // Show ambient glow after a short delay
    const ambientTimer = setTimeout(() => setShowAmbient(true), 1000);
    
    // Auto-hide instructions after 4 seconds
    const instructTimer = setTimeout(() => setShowInstructions(false), 4000);

    return () => {
      window.removeEventListener("resize", checkMobile);
      clearTimeout(ambientTimer);
      clearTimeout(instructTimer);
    };
  }, []);

  if (!imageUrl) return null;

  const getHotspotData = (h: Hotspot) => {
    if (h.gear_id) {
      const g = gearItems.find(i => i.id === h.gear_id);
      return { item: g, type: "gear" as const, name: g?.model_name, brand: g?.brand, category: g?.category, affiliate: g?.affiliate_link };
    }
    if (h.pc_id) {
      const p = pcSpecs.find(i => i.id === h.pc_id);
      return { item: p, type: "pc" as const, name: p?.name, brand: p?.brand, category: p?.component_type, affiliate: (p as any).affiliate_link };
    }
    return null;
  };

  const handlePointClick = (id: string) => {
    if (isMobile) {
      setActiveId(activeId === id ? null : id);
      setShowInstructions(false);
    }
  };

  // Close active point if clicking outside on mobile
  const handleContainerClick = (e: React.MouseEvent) => {
    if (isMobile && e.target === e.currentTarget) {
      setActiveId(null);
    }
  };

  return (
    <section className="relative max-w-7xl mx-auto px-4 md:px-8 mb-16 py-10 group/hero">
      
      {/* 1. AMBIENT GLOW BACKDROP - Desktop Only for performance and clarity */}
      <AnimatePresence>
        {showAmbient && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1 }}
            className="absolute -inset-48 -z-10 blur-[160px] pointer-events-none hidden md:block"
          >
            <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full animate-pulse-slow" />
            <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-600/20 rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* PERSPECTIVE REFLECTION / SHADOW - Desktop Only */}
        <div className="absolute -bottom-12 inset-x-12 h-24 bg-purple-600/20 blur-[60px] rounded-full -z-10 opacity-50 hidden md:block" />
        
        {/* CORNER BRACKETS (Scanning Frame) - Visible on all devices now */}
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-purple-500/40 rounded-tl-2xl z-20 pointer-events-none" />
        <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-purple-500/40 rounded-tr-2xl z-20 pointer-events-none" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-purple-500/40 rounded-bl-2xl z-20 pointer-events-none" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-purple-500/40 rounded-br-2xl z-20 pointer-events-none" />

        <div 
          ref={containerRef}
          onClick={handleContainerClick}
          className="relative group overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)]"
        >
          {/* Aspect Ratio Box — Standard 16:9 */}
          <div className={`relative aspect-video w-full overflow-hidden transition-all duration-700 ${activeId ? "scale-[1.01]" : "scale-100"}`}>
            <Image
              src={imageUrl}
              alt="Setup"
              fill
              className={`object-cover transition-all duration-1000 ${activeId ? "brightness-[0.3] scale-105" : "brightness-100"}`}
              priority
            />
          
          {/* Immersive Overlays */}
          <div className={`absolute inset-0 transition-opacity duration-700 ${activeId ? "bg-black/40" : "bg-transparent"}`} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

          {/* ⚡ HOTSPOTS LAYER */}
          <div className="absolute inset-0 z-20">
            {hotspots.map((h, idx) => {
              const data = getHotspotData(h);
              if (!data) return null;
              
              const isActive = activeId === h.id;
              
              // Mobile behavior: Toggle on click. Desktop behavior: Hover handle.
              const triggerProps = isMobile 
                ? { onClick: () => handlePointClick(h.id) }
                : { 
                    onMouseEnter: () => setActiveId(h.id),
                    onMouseLeave: () => setActiveId(null)
                  };

              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + (idx * 0.1), type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${h.x_percent}%`, top: `${h.y_percent}%` }}
                  {...triggerProps}
                >
                  <div className="relative">
                    {/* SOFT DUAL RING PULSE - Much more subtle now */}
                    {!isActive && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 bg-purple-500 rounded-full blur-[1px]"
                        />
                        <motion.div
                          animate={{ scale: [1, 2.2, 1], opacity: [0.15, 0, 0.15] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                          className="absolute inset-0 bg-purple-400 rounded-full blur-[2px]"
                        />
                      </>
                    )}

                    {/* Touch Target (Larger on Mobile) */}
                    <div className={`cursor-pointer flex items-center justify-center transition-all duration-500 ${isMobile ? "w-10 h-10" : "w-6 h-6"}`}>
                       <div className={`rounded-full border-2 transition-all duration-300 ${isActive ? "w-4 h-4 bg-white border-purple-500 ring-4 ring-purple-500/50 scale-125" : "w-3 h-3 bg-purple-500 border-white shadow-[0_0_15px_rgba(168,85,247,0.8)] hover:scale-125 hover:bg-white"}`} />
                    </div>
                  </div>

                  {/* DESKTOP TOOLTIP */}
                  <AnimatePresence>
                    {!isMobile && isActive && (
                      <motion.div
                        initial={{ 
                          opacity: 0, 
                          y: h.y_percent < 30 ? -15 : 15, 
                          scale: 0.9, 
                          rotateX: h.y_percent < 30 ? -20 : 20 
                        }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ 
                          opacity: 0, 
                          y: h.y_percent < 30 ? -10 : 10, 
                          scale: 0.9, 
                          rotateX: h.y_percent < 30 ? -20 : 20 
                        }}
                        style={{ transformPerspective: 1000 }}
                        className={`absolute z-50 mb-6 ${
                          h.y_percent < 30 ? "top-full mt-6" : "bottom-full mb-6"
                        } ${
                          h.x_percent < 25 ? "left-0 translate-x-0" : 
                          h.x_percent > 75 ? "right-0 translate-x-0" : 
                          "left-1/2 -translate-x-1/2"
                        }`}
                      >
                        <div className="bg-zinc-950/80 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] min-w-[280px] group/card relative">
                          <HeaderBlock data={data} onOpenFocus={onOpenFocus} />
                          <ActionButtons data={data} onOpenFocus={onOpenFocus} />
                          
                          {/* Indicator Arrow - Adaptive */}
                          <div className={`absolute left-1/2 -translate-x-1/2 border-[10px] border-transparent ${
                            h.y_percent < 30 
                              ? "bottom-full -mb-0.5 border-b-zinc-950/80" 
                              : "top-full -mt-1.5 border-t-zinc-950/80"
                          } ${
                            h.x_percent < 25 ? "left-8 translate-x-0" : 
                            h.x_percent > 75 ? "left-auto right-8 translate-x-0" : 
                            ""
                          }`} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* 📱 MOBILE BOTTOM SHEET / OVERLAY */}
          <AnimatePresence>
            {isMobile && activeId && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 z-50 bg-zinc-950/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[2rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-start mb-6">
                   <HeaderBlock data={getHotspotData(hotspots.find(h => h.id === activeId)!)!} onOpenFocus={onOpenFocus} mobile={true} />
                   <button onClick={() => setActiveId(null)} className="p-2 bg-zinc-900 rounded-full text-zinc-400">
                     <X size={20} />
                   </button>
                </div>
                <ActionButtons data={getHotspotData(hotspots.find(h => h.id === activeId)!)!} onOpenFocus={onOpenFocus} mobile={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 🏷️ Hero Labels */}
        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-30 pointer-events-none">
           <AnimatePresence>
             {!activeId && showInstructions && (
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="flex items-center gap-4 bg-zinc-950/40 backdrop-blur-xl border border-white/5 px-5 py-2.5 rounded-full"
               >
                 <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    <MousePointer2 size={12} className="text-white" />
                 </div>
                 <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">
                   {isMobile ? "Tap items to explore" : "Hover dots to scan hardware"}
                 </p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  </section>
);
}

// Internal UI Components for cleaner code
function HeaderBlock({ data, onOpenFocus, mobile }: any) {
  return (
    <div className="flex items-center gap-5 mb-5">
      <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover/card:scale-110 transition-transform duration-500 overflow-hidden">
        {data.item?.image_url ? (
          <Image src={data.item.image_url} alt="t" width={64} height={64} className="object-cover" />
        ) : (
          <ShoppingCart size={24} className="text-zinc-700" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
           <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] font-black text-purple-400 uppercase tracking-widest leading-none">
             {data.category}
           </span>
        </div>
        <h4 className="text-white font-black text-lg md:text-xl leading-none italic uppercase tracking-tighter mb-1 truncate">{data.brand}</h4>
        <p className="text-zinc-400 text-xs md:text-sm font-bold truncate opacity-80">{data.name}</p>
      </div>
    </div>
  );
}

function ActionButtons({ data, onOpenFocus, mobile }: any) {
  return (
    <div className="flex gap-3">
      <button 
        onClick={() => onOpenFocus(data.item, data.type)}
        className="flex-1 py-3.5 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
      >
        View Specs <ArrowRight size={14} />
      </button>
      {data.affiliate && (
        <a 
          href={data.affiliate}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl transition-all shadow-xl shadow-purple-900/40 flex items-center justify-center"
        >
          <ShoppingCart size={18} />
        </a>
      )}
    </div>
  );
}
