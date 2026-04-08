// ============================================================
// src/components/admin/GearTab.tsx
// Manages the Gear items tab: form + drag-and-drop list.
// ============================================================

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageSourceInput } from "@/components/admin/ImageSourceInput";
import type { GearItem, Category, CropType } from "@/types/admin";

interface GearTabProps {
  items: GearItem[];
  categoriesList: Category[];
  fetchingData: boolean;
  deletingId: string | null;
  onFileChangeForCrop: (e: React.ChangeEvent<HTMLInputElement>, type: CropType) => void;
  onRefetch: () => Promise<void>;
  setItems: React.Dispatch<React.SetStateAction<GearItem[]>>;
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
  // Injected crop result
  pendingGearFile: File | null;
  setPendingGearFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export function GearTab({
  items, categoriesList, fetchingData, deletingId,
  onFileChangeForCrop, onRefetch, setItems, setDeletingId,
  pendingGearFile, setPendingGearFile,
}: GearTabProps) {
  const { uploadImage } = useImageUpload();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState(categoriesList[0]?.name ?? "");
  const [modelName, setModelName] = useState("");
  const [brand, setBrand] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const resetForm = useCallback(() => {
    setEditingId(null);
    setCategory(categoriesList[0]?.name ?? "");
    setModelName("");
    setBrand("");
    setImageUrl("");
    setPendingGearFile(null);
    setAffiliateLink("");
    setDescription("");
    setMessage("");
  }, [categoriesList, setPendingGearFile]);

  const handleEdit = (item: GearItem) => {
    setEditingId(item.id);
    setCategory(item.category);
    setModelName(item.model_name);
    setBrand(item.brand);
    setImageUrl(item.image_url ?? "");
    setPendingGearFile(null);
    setAffiliateLink(item.affiliate_link ?? "");
    setDescription(item.description ?? "");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("gear_items").delete().eq("id", id);
    if (!error) {
      await onRefetch();
      if (editingId === id) resetForm();
    }
    setDeletingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    let finalImageUrl = imageUrl;
    if (pendingGearFile) {
      const { publicUrl, error } = await uploadImage(pendingGearFile, "gear_");
      if (error) { setMessage(`Error uploading image: ${error}`); setSubmitting(false); return; }
      finalImageUrl = publicUrl ?? "";
    }

    const payload = {
      category, model_name: modelName, brand,
      image_url: finalImageUrl || null,
      affiliate_link: affiliateLink || null,
      description: description || null,
    } as Partial<GearItem> & { sort_order?: number };

    let dbError;
    if (editingId) {
      const { error } = await supabase.from("gear_items").update(payload).eq("id", editingId);
      dbError = error;
    } else {
      payload.sort_order = items.length;
      const { error } = await supabase.from("gear_items").insert([payload]);
      dbError = error;
    }

    if (dbError) {
      setMessage(`Error: ${dbError.message}`);
    } else {
      setMessage(editingId ? "Gear updated successfully!" : "Gear added successfully!");
      resetForm();
      onRefetch();
      setTimeout(() => setMessage(""), 3000);
    }
    setSubmitting(false);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCat = source.droppableId.replace("gear-", "");
    const destCat = destination.droppableId.replace("gear-", "");
    let newItems = [...items];
    const draggedItem = newItems.filter(i => i.category === sourceCat)[source.index];
    if (!draggedItem) return;

    newItems = newItems.filter(i => i.id !== draggedItem.id);

    if (sourceCat === destCat) {
      const destItems = newItems.filter(i => i.category === destCat);
      destItems.splice(destination.index, 0, draggedItem);
      const others = newItems.filter(i => i.category !== destCat);
      const updated = destItems.map((item, idx) => ({ ...item, sort_order: idx }));
      setItems([...others, ...updated]);
      await Promise.all(updated.map(el => supabase.from("gear_items").update({ sort_order: el.sort_order }).eq("id", el.id)));
    } else {
      draggedItem.category = destCat;
      const destItems = newItems.filter(i => i.category === destCat);
      destItems.splice(destination.index, 0, draggedItem);
      const sourceRemaining = newItems.filter(i => i.category === sourceCat);
      const others = newItems.filter(i => i.category !== destCat && i.category !== sourceCat);
      const updatedDest = destItems.map((item, idx) => ({ ...item, sort_order: idx }));
      const updatedSource = sourceRemaining.map((item, idx) => ({ ...item, sort_order: idx }));
      setItems([...others, ...updatedSource, ...updatedDest]);
      await Promise.all([...updatedDest, ...updatedSource].map(el =>
        supabase.from("gear_items").update({ sort_order: el.sort_order, category: el.category }).eq("id", el.id)
      ));
    }
  };

  const inputCls = "w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
        {editingId && <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">EDIT MODE</div>}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium text-white">{editingId ? `Editing: ${modelName}` : "Add New Gear Item"}</h2>
          {editingId && <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-white underline">Cancel Edit</button>}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1">Category</label>
            {categoriesList.length > 0 ? (
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} required>
                {!category && <option value="" disabled>Select a category...</option>}
                {categoriesList.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            ) : (
              <div className="text-yellow-500 text-sm py-2">Please create a category first via the Categories tab.</div>
            )}
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Model Name</label>
            <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Brand</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls} required />
          </div>

          <div className="md:col-span-2">
            <ImageSourceInput
              label="Image Source"
              imageFile={pendingGearFile}
              imageUrl={imageUrl}
              cropType="gear"
              onFileChange={onFileChangeForCrop}
              onClearImage={() => { setPendingGearFile(null); setImageUrl(""); }}
              onUrlChange={(url) => { setImageUrl(url); setPendingGearFile(null); }}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1">Affiliate/Purchase Link (Optional)</label>
            <input type="url" value={affiliateLink} onChange={(e) => setAffiliateLink(e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1">The Story (Why this gear?)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Tell the story of why you chose this piece..." />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || categoriesList.length === 0}
          className={`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${editingId ? "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500" : "bg-white hover:bg-zinc-200 text-black focus:ring-white"}`}
        >
          {submitting ? "Saving..." : editingId ? "Update Gear Item" : "Add New Gear Item"}
        </button>
      </form>

      {/* LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-xl font-bold text-white">Existing Gear Items</h2>
          <span className="text-xs text-zinc-500 italic hidden md:block">Drag items by the handle to reorder</span>
        </div>

        {fetchingData ? (
          <div className="text-zinc-500 text-center py-8">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">No gear items found.</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-8">
              {categoriesList.map((cat) => {
                const catItems = items.filter(i => i.category === cat.name);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
                      <h3 className="text-sm font-semibold text-purple-400 capitalize bg-purple-500/10 px-3 py-1 rounded-full">{cat.name}</h3>
                      <span className="text-xs text-zinc-600">{catItems.length} items</span>
                    </div>
                    <Droppable droppableId={`gear-${cat.name}`}>
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {catItems.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-4 group hover:border-zinc-700 transition-colors">
                                  <div className="flex gap-3 md:gap-4 items-start">
                                    <div {...provided.dragHandleProps} className="cursor-grab hover:text-white text-zinc-600 py-4 mr-1 active:cursor-grabbing">
                                      <GripVertical size={20} />
                                    </div>
                                    <div className="h-16 w-16 shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 relative">
                                      {item.image_url
                                        ? <Image src={item.image_url} alt={item.model_name} fill className="object-cover" sizes="64px" />
                                        : <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-500">No Img</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-white font-bold text-sm leading-tight line-clamp-1">{item.model_name}</h3>
                                      <p className="text-xs text-zinc-500 mt-1">{item.brand}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/50">
                                    <button onClick={() => handleEdit(item)} className="flex-1 md:flex-none flex items-center justify-center gap-2 p-2.5 text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 rounded-lg transition-all border border-zinc-700">
                                      <Pencil size={14} /><span className="md:hidden text-[10px] font-black uppercase tracking-widest">Edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(item.id, item.model_name)} disabled={deletingId === item.id} className="flex-1 md:flex-none flex items-center justify-center gap-2 p-2.5 text-red-400 bg-red-950/20 hover:bg-red-900/40 border border-red-900/20 rounded-lg transition-all disabled:opacity-50">
                                      <Trash2 size={14} /><span className="md:hidden text-[10px] font-black uppercase tracking-widest">Delete</span>
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
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
