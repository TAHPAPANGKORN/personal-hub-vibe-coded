// ============================================================
// src/components/admin/GamesTab.tsx
// Manages the Games & Ranks tab: form + drag-and-drop list.
// ============================================================

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageSourceInput } from "@/components/admin/ImageSourceInput";
import type { GameItem, CropType } from "@/types/admin";

interface GamesTabProps {
  gamesList: GameItem[];
  fetchingData: boolean;
  deletingId: string | null;
  onFileChangeForCrop: (e: React.ChangeEvent<HTMLInputElement>, type: CropType) => void;
  onRefetch: () => Promise<void>;
  setGamesList: React.Dispatch<React.SetStateAction<GameItem[]>>;
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
  pendingGameFile: File | null;
  setPendingGameFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export function GamesTab({
  gamesList, fetchingData, deletingId,
  onFileChangeForCrop, onRefetch, setGamesList, setDeletingId,
  pendingGameFile, setPendingGameFile,
}: GamesTabProps) {
  const { uploadImage } = useImageUpload();

  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [gameName, setGameName] = useState("");
  const [gameRank, setGameRank] = useState("");
  const [gameImageUrl, setGameImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const resetForm = useCallback(() => {
    setEditingGameId(null);
    setGameName("");
    setGameRank("");
    setGameImageUrl("");
    setPendingGameFile(null);
    setMessage("");
  }, [setPendingGameFile]);

  const handleEdit = (game: GameItem) => {
    setEditingGameId(game.id);
    setGameName(game.name);
    setGameRank(game.rank ?? "");
    setGameImageUrl(game.image_url ?? "");
    setPendingGameFile(null);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("games").delete().eq("id", id);
    if (!error) {
      await onRefetch();
      if (editingGameId === id) resetForm();
    }
    setDeletingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    let finalImageUrl = gameImageUrl;
    if (pendingGameFile) {
      const { publicUrl, error } = await uploadImage(pendingGameFile, "game_");
      if (error) { setMessage(`Error uploading game image: ${error}`); setSubmitting(false); return; }
      finalImageUrl = publicUrl ?? "";
    }

    const payload = {
      name: gameName,
      rank: gameRank,
      image_url: finalImageUrl || null,
    } as Partial<GameItem> & { sort_order?: number };

    let dbError;
    if (editingGameId) {
      const { error } = await supabase.from("games").update(payload).eq("id", editingGameId);
      dbError = error;
    } else {
      payload.sort_order = gamesList.length;
      const { error } = await supabase.from("games").insert([payload]);
      dbError = error;
    }

    if (dbError) {
      setMessage(`Error: ${dbError.message}`);
    } else {
      setMessage(editingGameId ? "Game updated successfully!" : "Game added successfully!");
      resetForm();
      onRefetch();
      setTimeout(() => setMessage(""), 3000);
    }
    setSubmitting(false);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const elements = Array.from(gamesList);
    const [item] = elements.splice(result.source.index, 1);
    elements.splice(result.destination.index, 0, item);
    setGamesList(elements);
    await Promise.all(elements.map((el, idx) => supabase.from("games").update({ sort_order: idx }).eq("id", el.id)));
  };

  const inputCls = "w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
        {editingGameId && <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">EDIT MODE</div>}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium text-white">{editingGameId ? `Editing Game: ${gameName}` : "Add New Game & Rank"}</h2>
          {editingGameId && <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-white underline">Cancel Edit</button>}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Game Name (e.g. Valorant)</label>
            <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Current Rank (Optional)</label>
            <input type="text" value={gameRank} onChange={(e) => setGameRank(e.target.value)} className={inputCls} />
          </div>

          <div className="md:col-span-2">
            <ImageSourceInput
              label="Game Icon / Logo (Optional)"
              imageFile={pendingGameFile}
              imageUrl={gameImageUrl}
              cropType="game"
              onFileChange={onFileChangeForCrop}
              onClearImage={() => { setPendingGameFile(null); setGameImageUrl(""); }}
              onUrlChange={(url) => { setGameImageUrl(url); setPendingGameFile(null); }}
            />
            <p className="text-xs text-zinc-500 mt-2">If no image is provided, the first letter of the game will be used as a stylized icon.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:ring-2 disabled:opacity-50 ${editingGameId ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-white hover:bg-zinc-200 text-black"}`}
        >
          {submitting ? "Saving..." : editingGameId ? "Update Game" : "Add Game"}
        </button>
      </form>

      {/* LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-xl font-bold text-white">Existing Games & Ranks</h2>
          <span className="text-xs text-zinc-500 italic hidden md:block">Drag to reorder</span>
        </div>

        {fetchingData ? (
          <div className="text-zinc-500 text-center py-8">Loading items...</div>
        ) : gamesList.length === 0 ? (
          <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">No games added yet.</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="games-items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gamesList.map((game, index) => (
                    <Draggable key={game.id} draggableId={game.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps} className="cursor-grab text-zinc-600 hover:text-white mr-1 active:cursor-grabbing">
                              <GripVertical size={20} />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 relative flex items-center justify-center font-black text-white text-xl">
                                {game.image_url
                                  ? <Image src={game.image_url} alt={game.name} fill className="object-cover" sizes="48px" />
                                  : game.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-white font-semibold line-clamp-1">{game.name}</h3>
                                {game.rank && <p className="text-[10px] uppercase font-bold text-zinc-500">{game.rank}</p>}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0 ml-2">
                            <button onClick={() => handleEdit(game)} className="p-2 text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 rounded-lg transition-colors border border-zinc-700" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(game.id, game.name)} disabled={deletingId === game.id} className="p-2 text-red-400 bg-red-950/30 hover:bg-red-900/50 border border-red-900/30 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                              <Trash2 size={14} />
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
    </div>
  );
}
