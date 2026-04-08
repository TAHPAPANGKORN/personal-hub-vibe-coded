"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";
import { Trash2, Plus, Target, ImageIcon, Save, X, CheckSquare, Square, GripVertical, Loader2 } from "lucide-react";
import Image from "next/image";
import type { GearItem, PcSpec, Hotspot, SiteSettings, CropType } from "@/types/admin";

interface SetupVisualTabProps {
  siteSettings: SiteSettings | null;
  hotspots: Hotspot[];
  gearItems: GearItem[];
  pcSpecs: PcSpec[];
  fetchingData: boolean;
  onRefetch: () => Promise<void>;
  onFileChangeForCrop: (e: React.ChangeEvent<HTMLInputElement>, type: CropType) => void;
  pendingSetupFile: File | null;
  setPendingSetupFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export function SetupVisualTab({
  siteSettings, hotspots, gearItems, pcSpecs,
  fetchingData, onRefetch, onFileChangeForCrop,
  pendingSetupFile, setPendingSetupFile
}: SetupVisualTabProps) {
  const { uploadImage } = useImageUpload();
  const { confirm, confirmProps } = useConfirm();
  const imageRef = useRef<HTMLDivElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newPoint, setNewPoint] = useState<{ x: number, y: number } | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<{ type: "gear" | "pc", id: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isAllSelected = hotspots.length > 0 && selectedIds.length === hotspots.length;

  const [search, setSearch] = useState("");
  const filteredOptions = [
    ...gearItems.map(g => ({ ...g, type: "gear" as const, displayName: `${g.brand} ${g.model_name}`, sub: g.category })),
    ...pcSpecs.map(p => ({ ...p, type: "pc" as const, displayName: `${p.brand} ${p.name}`, sub: p.component_type }))
  ].filter(opt => 
    opt.displayName.toLowerCase().includes(search.toLowerCase()) || 
    opt.sub.toLowerCase().includes(search.toLowerCase())
  );

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdding || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPoint({ x, y });
  };

  const handleDragEnd = async (e: any, info: any, hotspotId: string) => {
    if (!imageRef.current) return;
    
    setMovingId(hotspotId);
    const rect = imageRef.current.getBoundingClientRect();
    
    // Use clientX/Y for reliable viewport-relative coordinates
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || info.point.x;
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY) || info.point.y;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    // Constrain within 0-100%
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));

    const { error } = await supabase
      .from("hotspots")
      .update({ x_percent: boundedX, y_percent: boundedY })
      .eq("id", hotspotId);

    if (error) {
      toast.error("Failed to move hotspot");
    } else {
      toast.success("Position updated", { duration: 1000 });
      // We don't onRefetch here immediately to avoid a double-render jump
      // but we do need the updated state from parent
      await onRefetch();
    }
    setMovingId(null);
  };

  const handleUploadMain = async () => {
    if (!pendingSetupFile || !siteSettings) return;
    setSubmitting(true);
    const { publicUrl, error } = await uploadImage(pendingSetupFile, "setup_");
    if (error) {
      toast.error(`Error: ${error}`);
      setSubmitting(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("site_settings")
      .update({ setup_main_image_url: publicUrl })
      .eq("id", siteSettings.id);

    if (dbError) toast.error(dbError.message);
    else {
      toast.success("Main setup photo updated!");
      setPendingSetupFile(null);
      onRefetch();
    }
    setSubmitting(false);
  };

  const handleSaveHotspot = async () => {
    if (!newPoint || !selectedTarget) return;
    setSubmitting(true);
    const payload = {
      x_percent: newPoint.x,
      y_percent: newPoint.y,
      gear_id: selectedTarget.type === "gear" ? selectedTarget.id : null,
      pc_id: selectedTarget.type === "pc" ? selectedTarget.id : null,
    };
    const { error } = await supabase.from("hotspots").insert([payload]);
    if (error) toast.error(error.message);
    else {
      toast.success("Hotspot added!");
      setIsAdding(false);
      setNewPoint(null);
      setSelectedTarget(null);
      onRefetch();
    }
    setSubmitting(false);
  };

  const handleDeleteHotspot = async (id: string) => {
    confirm({
      title: "Delete Hotspot?",
      message: "Are you sure you want to remove this interactive point?",
      onConfirm: async () => {
        setDeletingId(id);
        const { error } = await supabase.from("hotspots").delete().eq("id", id);
        if (error) toast.error(error.message);
        else {
          toast.success("Hotspot removed!");
          onRefetch();
        }
        setDeletingId(null);
      }
    });
  };

  const handleBulkDelete = async () => {
    confirm({
      title: `Delete ${selectedIds.length} Hotspots?`,
      message: "This will permanently remove all selected interactive points.",
      onConfirm: async () => {
        setSubmitting(true);
        const { error } = await supabase.from("hotspots").delete().in("id", selectedIds);
        if (error) toast.error(error.message);
        else {
          toast.success("Hotspots deleted!");
          setSelectedIds([]);
          onRefetch();
        }
        setSubmitting(false);
      }
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(hotspots.map(h => h.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getTargetName = (h: Hotspot) => {
    if (h.gear_id) {
      const g = gearItems.find(i => i.id === h.gear_id);
      return g ? `${g.brand} ${g.model_name}` : "Unknown Gear";
    }
    if (h.pc_id) {
      const p = pcSpecs.find(i => i.id === h.pc_id);
      return p ? `${p.brand} ${p.name}` : "Unknown PC Spec";
    }
    return "Unknown Target";
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      
      {/* 1. MASTER PHOTO UPLOAD SECTON */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <ImageIcon className="text-purple-400" size={20} />
              </div>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Setup Vision</h2>
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">The master photo for your interactive showcase</p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <input type="file" accept="image/*" onChange={(e) => onFileChangeForCrop(e, "setup")} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              <button className="h-11 px-6 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-zinc-700 whitespace-nowrap">
                <ImageIcon size={16} /> Select Master Photo
              </button>
            </div>
            {pendingSetupFile && (
              <button 
                onClick={handleUploadMain} disabled={submitting}
                className="h-11 px-6 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20 whitespace-nowrap"
              >
                <Save size={16} /> {submitting ? "Saving..." : "Apply"}
              </button>
            )}
          </div>
        </div>

        {/* IMAGE PREVIEW & DRAG-AND-DROP AREA */}
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800 group shadow-inner">
          {siteSettings?.setup_main_image_url ? (
            <div ref={imageRef} onClick={handleImageClick} className={`relative w-full h-full ${isAdding ? "cursor-crosshair" : "cursor-default"}`}>
              <Image src={siteSettings.setup_main_image_url} alt="Setup" fill className="object-cover transition-opacity duration-500 group-hover:opacity-90" priority />
              
              {/* Existing Hotspots (Draggable) */}
              <AnimatePresence>
                {hotspots.map((h) => (
                  <motion.div 
                    key={h.id}
                    drag
                    dragConstraints={imageRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragStart={() => setMovingId(h.id)}
                    onDragEnd={(e, info) => handleDragEnd(e, info, h.id)}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group/point"
                    style={{ left: `${h.x_percent}%`, top: `${h.y_percent}%` }}
                    whileDrag={{ scale: 1.5, zIndex: 100 }}
                  >
                    <div className={`w-7 h-7 bg-purple-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center cursor-move transition-all ${movingId === h.id ? "opacity-50 ring-4 ring-purple-600/50" : "animate-pulse"}`}>
                       <Target size={14} className="text-white" />
                    </div>
                    {/* Ghost Coordinate Display while dragging */}
                    {movingId === h.id && (
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[8px] font-mono text-white whitespace-nowrap">
                         UPDATING...
                       </div>
                    )}
                    {/* Tooltip on hover */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-zinc-950 border border-zinc-800 p-2 rounded-lg opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-2xl">
                      <p className="text-[10px] font-black text-white uppercase tracking-tighter">{getTargetName(h)}</p>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">Drag to reposition</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* New Point being added */}
              {isAdding && newPoint && (
                <div 
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-4 border-purple-500 shadow-2xl animate-bounce"
                  style={{ left: `${newPoint.x}%`, top: `${newPoint.y}%` }}
                />
              )}

              {/* Overlay Instructions when Adding */}
              {isAdding && !newPoint && (
                <div className="absolute inset-0 bg-purple-950/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                  <div className="bg-zinc-950/90 border border-purple-500/50 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="p-2 bg-purple-500/20 rounded-xl"><Target className="text-purple-400 animate-spin-slow" size={24} /></div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-tight italic">Hotspot Mode Active</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Click anywhere on the photo to mark a gear item</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-zinc-600 italic">
              <ImageIcon size={48} className="opacity-20" />
              <p>Upload a high-quality photo of your setup to start adding hotspots</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. INVENTORY LIST & BULK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 xl:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Inventory Targets</h3>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="h-10 px-4 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all whitespace-nowrap"
                >
                  <Trash2 size={14} /> Delete ({selectedIds.length})
                </button>
              )}
              <button 
                onClick={() => { setIsAdding(!isAdding); setNewPoint(null); setSelectedTarget(null); }}
                className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${isAdding ? "bg-red-950 text-red-500 border border-red-900/50" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
              >
                {isAdding ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Hotspot</>}
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-4 px-2">
             <button onClick={toggleSelectAll} className="p-1 text-zinc-500 hover:text-white transition-colors">
               {isAllSelected ? <CheckSquare size={18} className="text-purple-500" /> : <Square size={18} />}
             </button>
             <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Select All Hotspots</span>
          </div>

          <div className="space-y-4">
            {hotspots.length === 0 ? (
              <p className="text-zinc-600 text-xs italic py-4 text-center">No hotspots added to this photo yet.</p>
            ) : (
              hotspots.map(h => (
                <div key={h.id} className={`bg-zinc-950/50 border p-5 rounded-2xl flex items-center justify-between group transition-all ${selectedIds.includes(h.id) ? "border-purple-500 shadow-lg shadow-purple-900/10" : "border-zinc-800/50 hover:border-zinc-700"}`}>
                  <div className="flex items-center gap-6 min-w-0 flex-1 mr-4">
                    <button onClick={() => toggleSelect(h.id)} className="p-1 text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0">
                      {selectedIds.includes(h.id) ? <CheckSquare size={20} className="text-purple-500" /> : <Square size={20} />}
                    </button>
                    <div className="w-14 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-mono tracking-tight shrink-0">
                      <GripVertical size={14} className="opacity-20 mr-1" /> {Math.round(h.x_percent)}:{Math.round(h.y_percent)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-black text-base tracking-tight mb-0.5 truncate">{getTargetName(h)}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80 truncate">{h.gear_id ? "Gear Peripheral" : "PC Component"}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteHotspot(h.id)} disabled={deletingId === h.id} className="p-3 text-zinc-600 hover:text-red-500 transition-colors bg-zinc-900/50 rounded-xl hover:bg-red-500/10 shrink-0">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SELECTOR FORM (Only visible when adding) */}
        {isAdding && newPoint && (
           <div className="lg:col-span-12 xl:col-span-5 bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-right-4 duration-500">
             <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest italic mb-6">Link to Hardware</h3>
             <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Search Catalog</label>
                  <input type="text" placeholder="Search gear or specs..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder:text-zinc-700" />
                </div>
                <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2 pr-1">
                  {filteredOptions.map((opt) => (
                    <button key={`${opt.type}-${opt.id}`} onClick={() => setSelectedTarget({ type: opt.type, id: opt.id })}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedTarget?.id === opt.id ? "bg-purple-600 border-purple-400 shadow-lg shadow-purple-900/20" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"}`}>
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                        {opt.image_url ? <Image src={opt.image_url} alt="t" width={32} height={32} className="object-cover" /> : <span className="text-[8px] font-black">{opt.type.toUpperCase()}</span>}
                      </div>
                      <div className="min-w-0">
                         <p className={`text-xs font-bold truncate ${selectedTarget?.id === opt.id ? "text-white" : "text-zinc-300"}`}>{opt.displayName}</p>
                         <p className={`text-[8px] font-black uppercase tracking-[0.1em] ${selectedTarget?.id === opt.id ? "text-purple-200" : "text-zinc-600"}`}>{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={handleSaveHotspot} disabled={submitting || !selectedTarget}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-900/30 active:scale-95"
                >
                  {submitting ? "Positioning..." : "Confirm & Save Point"}
                </button>
             </div>
           </div>
        )}
      </div>

      <ConfirmModal {...confirmProps} />
    </div>
  );
}
