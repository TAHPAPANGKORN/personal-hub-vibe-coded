// ============================================================
// src/hooks/useAdminData.ts
// Centralizes all data fetching and real-time subscriptions
// for the Admin dashboard. Keeps UI components clean.
// ============================================================

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type {
  GearItem,
  Category,
  GameItem,
  PcSpec,
  Comment,
  SiteSettings,
} from "@/types/admin";

interface AdminData {
  items: GearItem[];
  categoriesList: Category[];
  gamesList: GameItem[];
  pcSpecs: PcSpec[];
  commentsList: Comment[];
  siteSettings: SiteSettings | null;
  fetchingData: boolean;
  savingSettings: boolean;
  deletingId: string | null;
}

interface AdminDataActions {
  refetch: () => Promise<void>;
  setItems: React.Dispatch<React.SetStateAction<GearItem[]>>;
  setCategoriesList: React.Dispatch<React.SetStateAction<Category[]>>;
  setGamesList: React.Dispatch<React.SetStateAction<GameItem[]>>;
  setPcSpecs: React.Dispatch<React.SetStateAction<PcSpec[]>>;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings | null>>;
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
  handleToggleSetting: (field: keyof SiteSettings, value: boolean) => Promise<void>;
}

export function useAdminData(defaultCategoryCallback?: (name: string) => void): AdminData & AdminDataActions {
  const [items, setItems] = useState<GearItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [gamesList, setGamesList] = useState<GameItem[]>([]);
  const [pcSpecs, setPcSpecs] = useState<PcSpec[]>([]);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setFetchingData(true);

    const [gearRes, catRes, pcRes, gameRes, commentRes, settingsRes] = await Promise.all([
      supabase
        .from("gear_items")
        .select("id, category, model_name, brand, image_url, affiliate_link, description, likes, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("pc_specs")
        .select("id, component_type, name, brand, specs_detail, image_url, description, likes, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("games")
        .select("id, name, rank, image_url")
        .order("sort_order", { ascending: true }),
      supabase
        .from("comments")
        .select("id, content, user_name, color, device_info, location, latitude, longitude, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single(),
    ]);

    setItems((gearRes.data as GearItem[]) || []);
    setCategoriesList((catRes.data as Category[]) || []);
    setPcSpecs((pcRes.data as PcSpec[]) || []);
    setGamesList((gameRes.data as GameItem[]) || []);
    setCommentsList((commentRes.data as Comment[]) || []);

    if (settingsRes.data) {
      setSiteSettings(settingsRes.data as SiteSettings);
    } else {
      // Auto-create default settings if none exist
      const { data: newSettings } = await supabase
        .from("site_settings")
        .insert([{ show_games: true, show_pc_specs: true, show_gear: true, show_floating_comments: true, show_comment_input: true, enable_gps: true }])
        .select()
        .single();
      if (newSettings) setSiteSettings(newSettings as SiteSettings);
    }

    // Set the first category as default for Gear form
    if (catRes.data && catRes.data.length > 0) {
      defaultCategoryCallback?.(catRes.data[0].name);
    }

    setFetchingData(false);
  }, [defaultCategoryCallback]);

  const handleToggleSetting = useCallback(async (field: keyof SiteSettings, value: boolean) => {
    if (!siteSettings) return;
    setSavingSettings(true);
    const optimistic = { ...siteSettings, [field]: value };
    setSiteSettings(optimistic);
    const { error } = await supabase
      .from("site_settings")
      .update({ [field]: value })
      .eq("id", siteSettings.id);
    if (error) {
      console.error("Error updating settings:", error);
      setSiteSettings(siteSettings); // Rollback on error
    }
    setSavingSettings(false);
  }, [siteSettings]);

  return {
    items, categoriesList, gamesList, pcSpecs, commentsList, siteSettings,
    fetchingData, savingSettings, deletingId,
    refetch, setItems, setCategoriesList, setGamesList, setPcSpecs, setSiteSettings, setDeletingId,
    handleToggleSetting,
  };
}
