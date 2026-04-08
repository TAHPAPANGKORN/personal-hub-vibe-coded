import { supabase } from "@/lib/supabase";
import { ClientPageContent } from "@/components/ClientPageContent";

export const revalidate = 60; // Revalidate every 60 seconds

async function getGearItems() {
  const { data, error } = await supabase
    .from("gear_items")
    .select("id, category, model_name, brand, image_url, affiliate_link, description, likes, sort_order")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getGames() {
  const { data, error } = await supabase
    .from("games")
    .select("id, name, rank, image_url")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getPcSpecs() {
  const { data, error } = await supabase
    .from("pc_specs")
    .select("id, component_type, name, brand, specs_detail, image_url, description, likes, sort_order")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("id, show_games, show_pc_specs, show_gear, show_floating_comments, show_comment_input, enable_gps").limit(1).single();
  if (error || !data) return { 
    show_games: true, 
    show_pc_specs: true, 
    show_gear: true, 
    show_floating_comments: true, 
    show_comment_input: true, 
    enable_gps: true 
  };
  return data;
}

export default async function Home() {
  const gearItems = await getGearItems();
  const gamesList = await getGames();
  const categoriesList = await getCategories();
  const pcSpecsList = await getPcSpecs();
  const siteSettings = await getSiteSettings();

  return (
    <ClientPageContent 
      gearItems={gearItems}
      gamesList={gamesList}
      categoriesList={categoriesList}
      pcSpecsList={pcSpecsList}
      siteSettings={siteSettings}
    />
  );
}
