// ============================================================
// src/components/admin/CommentsTab.tsx
// Real-time comments moderation dashboard.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { Trash2, Globe, MapPin, Monitor, Smartphone, Calendar, MessageSquare, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Comment, SiteSettings } from "@/types/admin";

interface CommentsTabProps {
  commentsList: Comment[];
  siteSettings: SiteSettings | null;
  fetchingData: boolean;
  deletingId: string | null;
  savingSettings: boolean;
  onRefetch: () => Promise<void>;
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
  onToggleSetting: (field: keyof SiteSettings, value: boolean) => Promise<void>;
}

export function CommentsTab({
  commentsList, siteSettings, fetchingData, deletingId,
  savingSettings, onRefetch, setDeletingId, onToggleSetting,
}: CommentsTabProps) {
  const [commentSearch, setCommentSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedComments, setSelectedComments] = useState<string[]>([]);

  const uniqueLocations = useMemo(
    () => [...new Set(commentsList.map(c => c.location).filter((l): l is string => !!l && l !== "Unknown"))],
    [commentsList]
  );

  const filteredComments = useMemo(() => commentsList.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(commentSearch.toLowerCase()) ||
      comment.user_name.toLowerCase().includes(commentSearch.toLowerCase());
    const matchesLocation = locationFilter === "all" || comment.location === locationFilter;
    const matchesDate = !dateFilter || new Date(comment.created_at).toDateString() === new Date(dateFilter).toDateString();
    return matchesSearch && matchesLocation && matchesDate;
  }), [commentsList, commentSearch, locationFilter, dateFilter]);

  const todayCount = useMemo(
    () => commentsList.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length,
    [commentsList]
  );
  const geoCount = useMemo(() => commentsList.filter(c => c.location && c.location !== "Unknown").length, [commentsList]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) alert(error.message);
    else await onRefetch();
    setDeletingId(null);
  };

  const handleDeleteAll = async () => {
    if (!confirm("⚠️ DANGER: This will delete ALL comments. Proceed?")) return;
    const { error } = await supabase.from("comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) alert(error.message);
    else onRefetch();
  };

  const handleDeleteSelected = async () => {
    if (selectedComments.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedComments.length} selected comments?`)) return;
    const { error } = await supabase.from("comments").delete().in("id", selectedComments);
    if (error) { alert(`Error: ${error.message}`); return; }
    setSelectedComments([]);
    await onRefetch();
  };

  const toggleSelection = (id: string) =>
    setSelectedComments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleSelectAll = () => {
    const allIds = filteredComments.map(c => c.id);
    setSelectedComments(prev => prev.length === allIds.length ? [] : allIds);
  };

  const toggleSettingCls = (active: boolean) => active ? "bg-purple-600" : "bg-zinc-800 border border-zinc-700";
  const toggleThumbCls = (active: boolean) => active ? "translate-x-5" : "translate-x-0";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tight">Guestbook Vibes</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Real-time moderator dashboard</p>
        </div>

        {siteSettings && (
          <div className="flex flex-wrap items-center gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
            {[
              { label: "Floating", field: "show_floating_comments" as keyof SiteSettings },
              { label: "Submit", field: "show_comment_input" as keyof SiteSettings },
              { label: "GPS", field: "enable_gps" as keyof SiteSettings },
            ].map(setting => {
              const active = siteSettings[setting.field] !== false;
              return (
                <label key={setting.field} className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <div className="relative shrink-0 scale-75">
                    <input type="checkbox" className="sr-only peer" checked={active}
                      onChange={(e) => onToggleSetting(setting.field, e.target.checked)} disabled={savingSettings} />
                    <div className={`block w-11 h-6 rounded-full transition-all duration-300 ${toggleSettingCls(active)}`} />
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${toggleThumbCls(active)}`} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? "text-zinc-200" : "text-zinc-500"}`}>{setting.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl hover:border-purple-500/30 transition-colors">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Total Vibes</p>
          <h4 className="text-3xl font-black text-white">{commentsList.length}</h4>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl hover:border-green-500/30 transition-colors">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">New Today</p>
          <h4 className="text-3xl font-black text-white">{todayCount}</h4>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl hover:border-blue-500/30 transition-colors">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Geo Tags</p>
          <h4 className="text-3xl font-black text-white">{geoCount}</h4>
        </div>
        <div className="bg-red-950/20 border border-red-900/30 p-5 rounded-2xl shadow-xl group hover:bg-red-900/10 transition-colors cursor-pointer" onClick={handleDeleteAll}>
          <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-1 italic">DANGER ZONE</p>
          <h4 className="text-xl font-black text-red-400 mt-2 truncate">Clear All</h4>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search vibes..."
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-300 outline-none hover:bg-zinc-800 transition-colors [color-scheme:dark]" />
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-300 outline-none hover:bg-zinc-800 transition-colors max-w-[100px] md:max-w-none">
                <option value="all">Everywhere</option>
                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>

          {selectedComments.length > 0 && (
            <div className="hidden md:flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
              <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20 whitespace-nowrap">
                Selected: {selectedComments.length}
              </span>
              <button onClick={handleDeleteSelected} disabled={fetchingData}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-50">
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE STICKY BATCH ACTION */}
      {selectedComments.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-zinc-900 border border-purple-500/30 p-4 rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] flex items-center justify-between backdrop-blur-xl bg-opacity-90">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Moderator Action</span>
              <span className="text-lg font-black text-white leading-none">{selectedComments.length} Vibes Selected</span>
            </div>
            <button onClick={handleDeleteSelected} disabled={fetchingData}
              className="px-8 py-4 bg-red-600 text-white text-sm font-black rounded-xl shadow-xl shadow-red-600/30 active:scale-95 transition-all disabled:opacity-50">
              DELETE ALL
            </button>
          </div>
        </div>
      )}

      {/* COMMENT LIST */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {filteredComments.length === 0 ? (
          <div className="text-zinc-500 text-center py-20 font-medium italic">No vibes discovered yet...</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            <div className="bg-white/[0.03] p-3 flex items-center gap-4 border-b border-zinc-800">
              <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
                checked={selectedComments.length > 0 && selectedComments.length === filteredComments.length}
                onChange={toggleSelectAll} />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select All</span>
            </div>

            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 md:p-6 flex flex-col md:flex-row items-start gap-4 md:gap-6 group transition-all duration-300 border-l-4 ${selectedComments.includes(comment.id) ? "bg-purple-500/10 border-purple-500" : "hover:bg-white/[0.03] border-transparent"}`}
              >
                {/* AVATAR + CHECKBOX */}
                <div className="flex items-center gap-4 shrink-0">
                  <input type="checkbox"
                    className="w-5 h-5 rounded-lg border-2 border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer appearance-none checked:bg-purple-600 checked:border-purple-600"
                    style={{ backgroundImage: selectedComments.includes(comment.id) ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'4\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'20 6 9 17 4 12\'%3E%3C/polyline%3E%3C/svg%3E")' : "none", backgroundSize: "70% 70%", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
                    checked={selectedComments.includes(comment.id)}
                    onChange={() => toggleSelection(comment.id)} />

                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: comment.color || "#A855F7" }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                    <span className="relative z-10">{comment.user_name?.charAt(0).toUpperCase()}</span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-black text-white tracking-tight leading-none">{comment.user_name}</span>
                    <div className="h-1 w-1 rounded-full bg-zinc-700" />

                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/50 rounded-full text-[10px] font-bold text-zinc-400">
                      <Calendar size={10} />
                      {new Date(comment.created_at).toLocaleDateString()}
                      <span className="text-zinc-600">•</span>
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>

                    {comment.device_info && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${comment.device_info.toLowerCase() === "desktop" ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                        {comment.device_info.toLowerCase() === "desktop" ? <Monitor size={10} /> : <Smartphone size={10} />}
                        {comment.device_info}
                      </div>
                    )}

                    {comment.location && comment.location !== "Unknown" && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Globe size={11} className="animate-pulse" /> {comment.location}
                      </div>
                    )}
                  </div>

                  <div className="relative group/msg">
                    <MessageSquare size={14} className="absolute -left-6 top-1 text-zinc-700 opacity-0 group-hover/msg:opacity-100 transition-opacity hidden md:block" />
                    <p className="text-base text-zinc-200 font-medium leading-relaxed max-w-2xl">{comment.content}</p>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    {comment.latitude && comment.longitude && (
                      <a href={`https://www.google.com/maps?q=${comment.latitude},${comment.longitude}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white bg-purple-500/5 hover:bg-purple-600 px-3.5 py-2 rounded-xl border border-purple-500/20 transition-all shadow-lg hover:shadow-purple-500/20 group/map">
                        <MapPin size={12} className="group-hover/map:scale-125 transition-transform" /> Pinpoint Location
                      </a>
                    )}
                    <button onClick={() => handleDelete(comment.id)} disabled={deletingId === comment.id}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors group/del disabled:opacity-50">
                      <Trash2 size={12} className="group-hover/del:animate-bounce" /> Delete
                    </button>
                  </div>
                </div>

                {/* STATUS INDICATOR */}
                <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/5 text-green-500/50 rounded-lg text-[8px] font-black uppercase border border-green-500/10">
                    <ShieldCheck size={10} /> Live Vibe
                  </div>
                  <div className="text-[10px] font-bold text-zinc-700 font-mono">#{comment.id.slice(0, 8)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
