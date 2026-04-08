// ============================================================
// src/components/admin/PcSpecsTab.tsx
// Manages the PC Build tab: form + drag-and-drop list.
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageSourceInput } from "@/components/admin/ImageSourceInput";
import type { PcSpec, CropType } from "@/types/admin";

interface PcSpecsTabProps {
  pcSpecs: PcSpec[];
  fetchingData: boolean;
  deletingId: string | null;
  onFileChangeForCrop: (e: React.ChangeEvent<HTMLInputElement>, type: CropType) => void;
  onRefetch: () => Promise<void>;
  setPcSpecs: React.Dispatch<React.SetStateAction<PcSpec[]>>;
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
  pendingPcFile: File | null;
  setPendingPcFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export function PcSpecsTab({
  pcSpecs, fetchingData, deletingId,
  onFileChangeForCrop, onRefetch, setPcSpecs, setDeletingId,
  pendingPcFile, setPendingPcFile,
}: PcSpecsTabProps) {
  const { uploadImage } = useImageUpload();

  const [editingPcId, setEditingPcId] = useState<string | null>(null);
  const [pcType, setPcType] = useState("");
  const [pcName, setPcName] = useState("");
  const [pcBrand, setPcBrand] = useState("");
  const [pcDetails, setPcDetails] = useState("");
  const [pcImageUrl, setPcImageUrl] = useState("");
  const [pcDescription, setPcDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { confirm, confirmProps } = useConfirm();

  const resetForm = useCallback(() => {
    setEditingPcId(null);
    setPcType("");
    setPcName("");
    setPcBrand("");
    setPcDetails("");
    setPcImageUrl("");
    setPendingPcFile(null);
    setPcDescription("");
  }, [setPendingPcFile]);

  const handleEdit = (pc: PcSpec) => {
    setEditingPcId(pc.id);
    setPcType(pc.component_type);
    setPcName(pc.name);
    setPcBrand(pc.brand ?? "");
    setPcDetails(pc.specs_detail ?? "");
    setPcImageUrl(pc.image_url ?? "");
    setPcDescription(pc.description ?? "");
    setPendingPcFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    confirm({
      title: "Delete PC Component?",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setDeletingId(id);
        const { error } = await supabase.from("pc_specs").delete().eq("id", id);
        if (!error) {
          toast.success(`Deleted ${name}!`);
          await onRefetch();
          if (editingPcId === id) resetForm();
        } else {
          toast.error(`Error: ${error.message}`);
        }
        setDeletingId(null);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let finalImageUrl = pcImageUrl;
    if (pendingPcFile) {
      const { publicUrl, error } = await uploadImage(pendingPcFile, "pc_");
      if (error) { toast.error(`Error uploading image: ${error}`); setSubmitting(false); return; }
      finalImageUrl = publicUrl ?? "";
    }

    const payload = {
      component_type: pcType,
      name: pcName,
      brand: pcBrand,
      specs_detail: pcDetails,
      image_url: finalImageUrl || null,
      description: pcDescription || null,
    } as Partial<PcSpec> & { sort_order?: number };

    let dbError;
    if (editingPcId) {
      const { error } = await supabase.from("pc_specs").update(payload).eq("id", editingPcId);
      dbError = error;
    } else {
      payload.sort_order = pcSpecs.length;
      const { error } = await supabase.from("pc_specs").insert([payload]);
      dbError = error;
    }

    if (dbError) {
      toast.error(`Error: ${dbError.message}`);
    } else {
      toast.success(editingPcId ? "PC Part updated successfully!" : "PC Part added successfully!");
      resetForm();
      onRefetch();
    }
    setSubmitting(false);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const elements = Array.from(pcSpecs);
    const [item] = elements.splice(result.source.index, 1);
    elements.splice(result.destination.index, 0, item);
    setPcSpecs(elements);
    await Promise.all(elements.map((el, idx) => supabase.from("pc_specs").update({ sort_order: idx }).eq("id", el.id)));
  };

  const inputCls = "w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
        {editingPcId && <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">EDIT MODE</div>}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium text-white">{editingPcId ? `Editing: ${pcName}` : "Add PC Component"}</h2>
          {editingPcId && <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-white underline">Cancel Edit</button>}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Component Type (CPU, GPU, RAM...)</label>
            <input type="text" placeholder="e.g. GPU" value={pcType} onChange={(e) => setPcType(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name (Model)</label>
            <input type="text" placeholder="e.g. RTX 4090" value={pcName} onChange={(e) => setPcName(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Brand (Optional)</label>
            <input type="text" placeholder="e.g. ASUS ROG" value={pcBrand} onChange={(e) => setPcBrand(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Specs Detail (Optional)</label>
            <input type="text" placeholder="e.g. 24GB GDDR6X" value={pcDetails} onChange={(e) => setPcDetails(e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1">The Story (Why this part?)</label>
            <textarea value={pcDescription} onChange={(e) => setPcDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Tell the story behind this component..." />
          </div>

          <div className="md:col-span-2">
            <ImageSourceInput
              label="Component Image (Optional)"
              imageFile={pendingPcFile}
              imageUrl={pcImageUrl}
              cropType="pc"
              onFileChange={onFileChangeForCrop}
              onClearImage={() => { setPendingPcFile(null); setPcImageUrl(""); }}
              onUrlChange={(url) => { setPcImageUrl(url); setPendingPcFile(null); }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:ring-2 disabled:opacity-50 ${editingPcId ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-white hover:bg-zinc-200 text-black"}`}
        >
          {submitting ? "Saving..." : editingPcId ? "Update Component" : "Add Component"}
        </button>
      </form>

      {/* LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-xl font-bold text-white">My PC Specs</h2>
          <span className="text-xs text-zinc-500 italic hidden md:block">Drag to reorder</span>
        </div>

        {fetchingData ? (
          <div className="text-zinc-500 text-center py-8">Loading items...</div>
        ) : pcSpecs.length === 0 ? (
          <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">No components found.</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pc-items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 gap-4">
                  {pcSpecs.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-zinc-700 transition-colors">
                          <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
                            <div {...provided.dragHandleProps} className="cursor-grab text-zinc-600 hover:text-white pt-2 sm:pt-0 mr-1 active:cursor-grabbing">
                              <GripVertical size={20} />
                            </div>
                            <div className="h-16 w-16 shrink-0 bg-white/5 p-2 rounded-lg border border-zinc-800 relative flex items-center justify-center">
                              {item.image_url
                                ? <Image src={item.image_url} alt={item.name} fill className="object-contain p-1" sizes="64px" />
                                : <span className="text-[10px] text-zinc-600 font-black uppercase text-center">{item.component_type.slice(0, 3)}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-sm leading-tight">{item.name}</h3>
                              <div className="flex flex-wrap gap-2 items-center text-[10px] text-zinc-500 mt-1">
                                <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-purple-500/20">{item.component_type}</span>
                                {item.specs_detail && <span className="italic truncate max-w-[150px]">• {item.specs_detail}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto justify-end border-t border-zinc-800 sm:border-0 pt-3 sm:pt-0">
                            <button onClick={() => handleEdit(item)} className="flex-1 sm:flex-none p-2.5 text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 rounded-lg transition-all border border-zinc-700 sm:border-transparent flex items-center justify-center gap-2">
                              <Pencil size={14} /><span className="sm:hidden text-xs font-bold uppercase tracking-widest">Edit</span>
                            </button>
                            <button onClick={() => handleDelete(item.id, item.name)} disabled={deletingId === item.id} className="flex-1 sm:flex-none p-2.5 text-red-400 bg-red-950/20 hover:bg-red-900/40 rounded-lg transition-all border border-red-900/20 sm:border-transparent flex items-center justify-center gap-2 disabled:opacity-50">
                              <Trash2 size={14} /><span className="sm:hidden text-xs font-bold uppercase tracking-widest">Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
      <ConfirmModal {...confirmProps} />
    </div>
  );
}
