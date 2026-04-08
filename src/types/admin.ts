// ============================================================
// src/types/admin.ts
// Central type definitions for all Admin dashboard entities.
// ============================================================

export interface GearItem {
  id: string;
  category: string;
  model_name: string;
  brand: string;
  image_url: string | null;
  affiliate_link: string | null;
  description: string | null;
  likes: number;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface GameItem {
  id: string;
  name: string;
  rank: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface PcSpec {
  id: string;
  component_type: string;
  name: string;
  brand: string | null;
  specs_detail: string | null;
  image_url: string | null;
  description: string | null;
  likes: number;
  sort_order: number;
}

export interface Comment {
  id: string;
  content: string;
  user_name: string;
  color: string;
  device_info: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  show_games: boolean;
  show_pc_specs: boolean;
  show_gear: boolean;
  show_floating_comments: boolean;
  show_comment_input: boolean;
  enable_gps: boolean;
}

export type AdminTab = "gear" | "categories" | "games" | "pc_specs" | "comments";
export type CropType = "gear" | "game" | "pc";
export type FocusType = "gear" | "pc";
