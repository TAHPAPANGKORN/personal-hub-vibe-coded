import { supabase } from "@/lib/supabase";
import { ClientPageContent } from "@/components/ClientPageContent";

export const revalidate = 60; // Revalidate every 60 seconds

async function getGearItems() {
  const { data, error } = await supabase
    .from("gear_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getGames() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getPcSpecs() {
  const { data, error } = await supabase
    .from("pc_specs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).single();
  if (error || !data) return { show_games: true, show_pc_specs: true, show_gear: true };
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
