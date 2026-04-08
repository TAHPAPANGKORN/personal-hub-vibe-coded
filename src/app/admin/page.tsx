// ============================================================
// src/app/admin/page.tsx
// Entry point for the Admin dashboard.
// Responsibilities: auth gating, data fetching, crop wiring.
// All UI is delegated to components in src/components/admin/.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ImageCropModal } from "@/components/ImageCropModal";
import { GearTab } from "@/components/admin/GearTab";
import { GamesTab } from "@/components/admin/GamesTab";
import { PcSpecsTab } from "@/components/admin/PcSpecsTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { CommentsTab } from "@/components/admin/CommentsTab";
import { useAdminData } from "@/hooks/useAdminData";
import { useImageCrop } from "@/hooks/useImageCrop";
import type { AdminTab, SiteSettings } from "@/types/admin";
import type { Session } from "@supabase/supabase-js";

// Pending crop files are lifted up here so they can be set by useImageCrop
// and consumed by each Tab component upon form submission.
export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("gear");

  // Pending crop results — lifted here to bridge the crop hook → tab components
  const [pendingGearFile, setPendingGearFile] = useState<File | null>(null);
  const [pendingGameFile, setPendingGameFile] = useState<File | null>(null);
  const [pendingPcFile, setPendingPcFile] = useState<File | null>(null);

  // ── Data ──────────────────────────────────────────────────
  const adminData = useAdminData(
    // Called when categories load, sets default first category for Gear form
    useCallback(() => {}, [])
  );

  // ── Image Crop ────────────────────────────────────────────
  const { cropModalOpen, imageToCrop, activeCropType, handleFileChangeForCrop, onCropCompleteHandler, closeCropModal } =
    useImageCrop({
      onGearCropDone: (file) => { setPendingGearFile(file); },
      onGameCropDone: (file) => { setPendingGameFile(file); },
      onPcCropDone:  (file) => { setPendingPcFile(file); },
    });

  // ── Auth ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) adminData.refetch();
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) adminData.refetch();
    });

    // Real-time site settings sync
    const settingsChannel = supabase
      .channel("admin_settings_sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "site_settings" }, (payload) => {
        adminData.setSiteSettings(payload.new as SiteSettings);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      settingsChannel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth UI ───────────────────────────────────────────────
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setAuthLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert(error.message);
            setAuthLoading(false);
          }}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full space-y-4 shadow-xl"
        >
          <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-2.5 font-medium transition-colors mt-4">
            Sign In
          </button>
        </form>
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "gear",       label: "Manage Gear Items" },
    { key: "games",      label: "Manage Games & Ranks" },
    { key: "categories", label: "Manage Categories" },
    { key: "pc_specs",   label: "Manage PC Build" },
    { key: "comments",   label: "Manage Comments" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">

      {/* STICKY HEADER */}
      <div className="flex justify-between items-center bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm sticky top-4 z-10">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-lg transition-colors border border-zinc-700"
        >
          Sign Out
        </button>
      </div>

      {/* VISIBILITY SETTINGS */}
      {adminData.siteSettings && (
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-6 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              Public Visibility
            </h2>
            {adminData.savingSettings && (
              <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full animate-pulse border border-purple-500/20">Syncing...</span>
            )}
          </div>
          <div className="flex flex-wrap gap-6 md:gap-10">
            {[
              { label: "PC Specs", field: "show_pc_specs" as keyof SiteSettings },
              { label: "Gear & Tech", field: "show_gear" as keyof SiteSettings },
              { label: "Games & Rank", field: "show_games" as keyof SiteSettings },
            ].map(setting => {
              const active = adminData.siteSettings![setting.field] !== false;
              return (
                <label key={setting.field} className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className="relative shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={active}
                      onChange={(e) => adminData.handleToggleSetting(setting.field, e.target.checked)}
                      disabled={adminData.savingSettings} />
                    <div className={`block w-11 h-6 rounded-full transition-all duration-300 shadow-inner ${active ? "bg-purple-600" : "bg-zinc-800 border border-zinc-700"} peer-focus:ring-2 peer-focus:ring-purple-500/50`} />
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-md ${active ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className={`text-[11px] font-bold transition-colors uppercase tracking-tight ${active ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                    {setting.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex space-x-2 border-b border-zinc-800 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0" style={{ WebkitOverflowScrolling: "touch" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.key ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-500 hover:text-white"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "gear" && (
        <GearTab
          items={adminData.items}
          categoriesList={adminData.categoriesList}
          fetchingData={adminData.fetchingData}
          deletingId={adminData.deletingId}
          onFileChangeForCrop={handleFileChangeForCrop}
          onRefetch={adminData.refetch}
          setItems={adminData.setItems}
          setDeletingId={adminData.setDeletingId}
          pendingGearFile={pendingGearFile}
          setPendingGearFile={setPendingGearFile}
        />
      )}
      {activeTab === "games" && (
        <GamesTab
          gamesList={adminData.gamesList}
          fetchingData={adminData.fetchingData}
          deletingId={adminData.deletingId}
          onFileChangeForCrop={handleFileChangeForCrop}
          onRefetch={adminData.refetch}
          setGamesList={adminData.setGamesList}
          setDeletingId={adminData.setDeletingId}
          pendingGameFile={pendingGameFile}
          setPendingGameFile={setPendingGameFile}
        />
      )}
      {activeTab === "categories" && (
        <CategoriesTab
          categoriesList={adminData.categoriesList}
          items={adminData.items}
          fetchingData={adminData.fetchingData}
          deletingId={adminData.deletingId}
          onRefetch={adminData.refetch}
          setCategoriesList={adminData.setCategoriesList}
          setDeletingId={adminData.setDeletingId}
        />
      )}
      {activeTab === "pc_specs" && (
        <PcSpecsTab
          pcSpecs={adminData.pcSpecs}
          fetchingData={adminData.fetchingData}
          deletingId={adminData.deletingId}
          onFileChangeForCrop={handleFileChangeForCrop}
          onRefetch={adminData.refetch}
          setPcSpecs={adminData.setPcSpecs}
          setDeletingId={adminData.setDeletingId}
          pendingPcFile={pendingPcFile}
          setPendingPcFile={setPendingPcFile}
        />
      )}
      {activeTab === "comments" && (
        <CommentsTab
          commentsList={adminData.commentsList}
          siteSettings={adminData.siteSettings}
          fetchingData={adminData.fetchingData}
          deletingId={adminData.deletingId}
          savingSettings={adminData.savingSettings}
          onRefetch={adminData.refetch}
          setDeletingId={adminData.setDeletingId}
          onToggleSetting={adminData.handleToggleSetting}
        />
      )}

      {/* CROP MODAL */}
      {imageToCrop && (
        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={imageToCrop}
          onClose={closeCropModal}
          onCropComplete={onCropCompleteHandler}
          aspect={1}
          title={`Adjust ${activeCropType?.toUpperCase()} Image`}
        />
      )}
    </div>
  );
}
