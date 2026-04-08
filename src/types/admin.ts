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
  // Visibility toggles
  show_games: boolean;
  show_pc_specs: boolean;
  show_gear: boolean;
  show_floating_comments: boolean;
  show_comment_input: boolean;
  enable_gps: boolean;
  // Profile fields
  profile_title: string | null;
  profile_description: string | null;
  profile_image_url: string | null;
  social_youtube: string | null;
  social_twitch: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  social_website: string | null;
  setup_main_image_url: string | null;
  show_setup_visual: boolean;
}

export interface Hotspot {
  id: string;
  gear_id: string | null;
  pc_id: string | null;
  x_percent: number;
  y_percent: number;
  created_at: string;
}

export type AdminTab = "profile" | "gear" | "categories" | "games" | "pc_specs" | "comments" | "setup_visual";
export type CropType = "gear" | "game" | "pc" | "profile" | "setup";
export type FocusType = "gear" | "pc";
