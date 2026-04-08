"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Heart, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: "gear" | "pc";
}

export const FocusModal = ({ isOpen, onClose, item, type }: FocusModalProps) => {
  const [likes, setLikes] = useState(item?.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (item) {
      setLikes(item.likes || 0);
      const likedItems = JSON.parse(localStorage.getItem("hyped_items") || "[]");
      setHasLiked(likedItems.includes(item.id));
    }
  }, [item]);

  if (!item) return null;

  const handleHype = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) return;

    try {
      const tableName = type === "gear" ? "gear_items" : "pc_specs";
      
      // OPTIMISTIC UPDATE: Update UI first
      const newLikes = likes + 1;
      setLikes(newLikes);
      setHasLiked(true);

      // Persist to localStorage
      const likedItems = JSON.parse(localStorage.getItem("hyped_items") || "[]");
      localStorage.setItem("hyped_items", JSON.stringify([...likedItems, item.id]));

      // Update Database using Secure RPC
      const { error } = await supabase.rpc("increment_hype", {
        row_id: item.id,
        table_name: tableName,
      });

      if (error) {
        // Rollback if DB fails
        setLikes(likes);
        setHasLiked(false);
        console.error("Error hyping item via RPC:", error);
      }
    } catch (err) {
      console.error("Error hyping item:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col md:flex-row"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            {/* Left: Image Section */}
            <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto bg-black flex items-center justify-center">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.model_name || item.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-700">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                    <ShieldCheck size={32} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">Minimalist View</span>
                </div>
              )}
              
              {/* Floating Hype on Image */}
              <button 
                onClick={handleHype}
                className={`absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border transition-all duration-300 ${
                  hasLiked 
                  ? "bg-purple-500 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" 
                  : "bg-black/40 border-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Heart size={18} className={hasLiked ? "fill-current" : ""} />
                <span className="text-sm font-bold">{likes} Hype</span>
              </button>
            </div>

            {/* Right: Content Section */}
            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto flex flex-col justify-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                    {type === "gear" ? item.category : item.component_type}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter leading-none">
                    {item.model_name || item.name}
                  </h2>
                  <p className="text-lg text-zinc-400 font-medium">
                    {item.brand}
                  </p>
                </div>

                <div className="h-px w-12 bg-purple-500/50" />

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">The Story</h3>
                  <p className="text-zinc-300 leading-relaxed font-medium italic">
                    "{item.description || "The owner hasn't shared the story behind this piece yet, but its presence speaks for itself."}"
                  </p>
                </div>

                {type === "pc" && item.specs_detail && (
                  <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/50">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Technical Specs</h3>
                    <p className="text-sm text-white font-mono">{item.specs_detail}</p>
                  </div>
                )}

                <div className="pt-4 flex flex-wrap gap-4">
                  {item.affiliate_link && (
                    <a
                      href={item.affiliate_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors shadow-xl"
                    >
                      <ExternalLink size={16} />
                      Get This Gear
                    </a>
                  )}
                  
                  {likes > 10 && (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 transition-all animate-pulse">
                      <span className="text-sm font-black uppercase">Highly Hyped</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
