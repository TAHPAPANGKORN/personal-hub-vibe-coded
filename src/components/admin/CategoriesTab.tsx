// ============================================================
// src/components/admin/CategoriesTab.tsx
// Manages the Categories tab: form + drag-and-drop list.
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import type { Category, GearItem } from "@/types/admin";

interface CategoriesTabProps {
  categoriesList: Category[];
  items: GearItem[];
  fetchingData: boolean;
  deletingId: string | null;
  onRefetch: () => Promise<void>;
  setCategoriesList: React.Dispatch<React.SetStateAction<Category[]>>;
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function CategoriesTab({
  categoriesList, items, fetchingData, deletingId,
  onRefetch, setCategoriesList, setDeletingId,
}: CategoriesTabProps) {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const resetForm = useCallback(() => {
    setEditingCatId(null);
    setCatName("");
    setMessage("");
  }, []);

  const handleEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setMessage("");
  };

  const handleDelete = async (id: string, name: string) => {
    const isInUse = items.some(gear => gear.category === name);
    if (isInUse) {
      alert(`Cannot delete category "${name}"! It is currently being used by active gear items. Please reassign those items before deleting this category.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      await onRefetch();
      if (editingCatId === id) resetForm();
    }
    setDeletingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const payload: Partial<Category> & { sort_order?: number } = { name: catName };
    let dbError;
    if (editingCatId) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editingCatId);
      dbError = error;
    } else {
      payload.sort_order = categoriesList.length;
      const { error } = await supabase.from("categories").insert([payload]);
      dbError = error;
    }

    if (dbError) {
      setMessage(`Error: ${dbError.message}`);
    } else {
      setMessage(editingCatId ? "Category updated!" : "Category added!");
      resetForm();
      onRefetch();
      setTimeout(() => setMessage(""), 3000);
    }
    setSubmitting(false);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const elements = Array.from(categoriesList);
    const [item] = elements.splice(result.source.index, 1);
    elements.splice(result.destination.index, 0, item);
    setCategoriesList(elements);
    await Promise.all(elements.map((el, idx) => supabase.from("categories").update({ sort_order: idx }).eq("id", el.id)));
  };

  const inputCls = "w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
        {editingCatId && <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">EDIT MODE</div>}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium text-white">{editingCatId ? `Editing Category: ${catName}` : "Add New Category"}</h2>
          {editingCatId && <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-white underline">Cancel Edit</button>}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Category Name</label>
          <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} className={inputCls} required />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${editingCatId ? "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500" : "bg-white hover:bg-zinc-200 text-black focus:ring-white"}`}
        >
          {submitting ? "Saving..." : editingCatId ? "Update Category" : "Add Category"}
        </button>
      </form>

      {/* LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-xl font-bold text-white">Existing Categories</h2>
          <span className="text-xs text-zinc-500 italic hidden md:block">Drag to reorder sections</span>
        </div>

        {fetchingData ? (
          <div className="text-zinc-500 text-center py-8">Loading items...</div>
        ) : categoriesList.length === 0 ? (
          <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">No categories found. Add one above!</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories-items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-3">
                  {categoriesList.map((cat, index) => {
                    const itemCount = items.filter(i => i.category === cat.name).length;
                    return (
                      <Draggable key={cat.id} draggableId={cat.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div {...provided.dragHandleProps} className="cursor-grab text-zinc-600 hover:text-white mr-1 active:cursor-grabbing">
                                <GripVertical size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm tracking-tight">{cat.name}</h3>
                                {itemCount > 0 && (
                                  <span className="text-[9px] font-black uppercase tracking-tighter bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/10 inline-block mt-0.5">
                                    {itemCount} items
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-end border-t border-zinc-800 sm:border-0 pt-3 sm:pt-0">
                              <button onClick={() => handleEdit(cat)} className="flex-1 sm:flex-none p-2 text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2">
                                <Pencil size={14} /><span className="sm:hidden text-[10px] font-black uppercase tracking-widest">Edit</span>
                              </button>
                              <button onClick={() => handleDelete(cat.id, cat.name)} disabled={deletingId === cat.id} className="flex-1 sm:flex-none p-2 text-zinc-500 hover:text-red-400 bg-red-950/20 hover:bg-red-900/40 rounded-lg transition-colors border border-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50">
                                <Trash2 size={14} /><span className="sm:hidden text-[10px] font-black uppercase tracking-widest">Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
