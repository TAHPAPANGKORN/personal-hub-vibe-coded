"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { Pencil, Trash2, ImageIcon, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // TABS
  const [activeTab, setActiveTab] = useState<"gear" | "categories" | "games" | "pc_specs" | "comments">("gear");

  // DATA STATES
  const [items, setItems] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [gamesList, setGamesList] = useState<any[]>([]);
  const [pcSpecs, setPcSpecs] = useState<any[]>([]);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // GEAR FORM STATES
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [modelName, setModelName] = useState("");
  const [brand, setBrand] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // CATEGORY FORM STATES
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);
  const [catMessage, setCatMessage] = useState("");

  // GAMES FORM STATES
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [gameName, setGameName] = useState("");
  const [gameRank, setGameRank] = useState("");
  const [gameImageUrl, setGameImageUrl] = useState("");
  const [gameImageFile, setGameImageFile] = useState<File | null>(null);
  const [submittingGame, setSubmittingGame] = useState(false);
  const [gameMessage, setGameMessage] = useState("");


  // PC SPECS FORM STATES
  const [editingPcId, setEditingPcId] = useState<string | null>(null);
  const [pcType, setPcType] = useState("");
  const [pcName, setPcName] = useState("");
  const [pcBrand, setPcBrand] = useState("");
  const [pcDetails, setPcDetails] = useState("");
  const [pcImageUrl, setPcImageUrl] = useState("");
  const [pcImageFile, setPcImageFile] = useState<File | null>(null);
  const [pcDescription, setPcDescription] = useState("");
  const [submittingPc, setSubmittingPc] = useState(false);
  const [pcMessage, setPcMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setFetchingData(true);
    
    // Fetch Gear 
    const { data: gearData } = await supabase
      .from("gear_items")
      .select("id, category, model_name, brand, image_url, affiliate_link, description, likes, sort_order")
      .order("sort_order", { ascending: true });
      
    // Fetch Categories
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });

    // Fetch Games
    const { data: pcData } = await supabase.from("pc_specs").select("id, component_type, name, brand, specs_detail, image_url, description, likes, sort_order").order("sort_order", { ascending: true });

    const { data: gameData } = await supabase
      .from("games")
      .select("id, name, rank, image_url")
      .order("sort_order", { ascending: true });

    // Fetch Comments
    const { data: commentData } = await supabase
      .from("comments")
      .select("id, content, user_name, color, device_info, created_at")
      .order("created_at", { ascending: false });

    setItems(gearData || []);
    setCategoriesList(catData || []);
    setGamesList(gameData || []);
    setPcSpecs(pcData || []);
    setCommentsList(commentData || []);

    const { data: settingsData } = await supabase.from("site_settings").select("show_games, show_pc_specs, show_gear").limit(1).single();
    if (settingsData) {
      setSiteSettings(settingsData);
    } else {
      const { data: newSettings } = await supabase.from("site_settings").insert([{ show_games: true, show_pc_specs: true, show_gear: true }]).select().single();
      if (newSettings) setSiteSettings(newSettings);
    }
    
    // Set default category if available and not explicitly set
    if (catData && catData.length > 0 && !category && !editingId) {
      setCategory(catData[0].name);
    }
    
    setFetchingData(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleToggleSetting = async (field: string, value: boolean) => {
    if (!siteSettings) return;
    setSavingSettings(true);
    const newSettings = { ...siteSettings, [field]: value };
    setSiteSettings(newSettings);
    const { error } = await supabase.from("site_settings").update({ [field]: value }).eq("id", siteSettings.id);
    if (error) {
      console.error("Error updating settings:", error);
      // Rollback on error
      setSiteSettings(siteSettings);
    }
    setSavingSettings(false);
  };

  // --- GEAR LOGIC ---

  const resetForm = () => {
    setEditingId(null);
    setCategory(categoriesList.length > 0 ? categoriesList[0].name : "");
    setModelName("");
    setBrand("");
    setImageUrl("");
    setImageFile(null);
    setAffiliateLink("");
    setDescription("");
    setMessage("");
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setCategory(item.category);
    setModelName(item.model_name);
    setBrand(item.brand);
    setImageUrl(item.image_url || "");
    setImageFile(null);
    setAffiliateLink(item.affiliate_link || "");
    setDescription(item.description || "");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("gear_items").delete().eq("id", id);
    if (!error) {
      await fetchData();
      if (editingId === id) resetForm();
    }
    setDeletingId(null);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    let finalImageUrl = imageUrl;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('gear_images')
        .upload(fileName, imageFile);

      if (uploadError) {
        setMessage(`Error uploading image: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('gear_images').getPublicUrl(fileName);
      finalImageUrl = publicUrl;
    }

    const payload: any = {
      category,
      model_name: modelName,
      brand,
      image_url: finalImageUrl || null,
      affiliate_link: affiliateLink || null,
      description: description || null,
    };

    let error;
    if (editingId) {
      const { error: updateErr } = await supabase.from("gear_items").update(payload).eq("id", editingId);
      error = updateErr;
    } else {
      // For new insert, automatically push to the bottom
      payload.sort_order = items.length;
      const { error: insertErr } = await supabase.from("gear_items").insert([payload]);
      error = insertErr;
    }

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(editingId ? "Gear updated successfully!" : "Gear added successfully!");
      resetForm();
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    }
    setSubmitting(false);
  };

  // --- CATEGORY LOGIC ---

  const resetCatForm = () => {
    setEditingCatId(null);
    setCatName("");
    setCatMessage("");
  };

  const handleEditCat = (cat: any) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatMessage("");
  };

  const handleDeleteCat = async (id: string, name: string) => {
    // PROTECT CATEGORY IF IN USE
    const isInUse = items.some(gear => gear.category === name);
    if (isInUse) {
      alert(`Cannot delete category "${name}"! It is currently being used by active gear items. Please reassign those items before deleting this category.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      await fetchData();
      if (editingCatId === id) resetCatForm();
    }
    setDeletingId(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCat(true);
    setCatMessage("");

    const payload: any = {
      name: catName,
    };

    let error;
    if (editingCatId) {
      const { error: updateErr } = await supabase.from("categories").update(payload).eq("id", editingCatId);
      error = updateErr;
    } else {
      payload.sort_order = categoriesList.length;
      const { error: insertErr } = await supabase.from("categories").insert([payload]);
      error = insertErr;
    }

    if (error) {
      setCatMessage(`Error: ${error.message}`);
    } else {
      setCatMessage(editingCatId ? "Category updated!" : "Category added!");
      resetCatForm();
      fetchData();
      setTimeout(() => setCatMessage(""), 3000);
    }
    setSubmittingCat(false);
  };

  // --- GAMES LOGIC ---
  const resetGameForm = () => {
    setEditingGameId(null);
    setGameName("");
    setGameRank("");
    setGameImageUrl("");
    setGameImageFile(null);
    setGameMessage("");
  };

  const handleEditGame = (game: any) => {
    setEditingGameId(game.id);
    setGameName(game.name);
    setGameRank(game.rank);
    setGameImageUrl(game.image_url || "");
    setGameImageFile(null);
    setGameMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteGame = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("games").delete().eq("id", id);
    if (!error) {
      await fetchData();
      if (editingGameId === id) resetGameForm();
    }
    setDeletingId(null);
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingGame(true);
    setGameMessage("");

    let finalImageUrl = gameImageUrl;

    if (gameImageFile) {
      const fileExt = gameImageFile.name.split('.').pop();
      const fileName = `game_${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('gear_images')
        .upload(fileName, gameImageFile);

      if (uploadError) {
        setGameMessage(`Error uploading game image: ${uploadError.message}`);
        setSubmittingGame(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('gear_images').getPublicUrl(fileName);
      finalImageUrl = publicUrl;
    }

    const payload: any = {
      name: gameName,
      rank: gameRank,
      image_url: finalImageUrl || null,
    };

    let error;
    if (editingGameId) {
      const { error: updateErr } = await supabase.from("games").update(payload).eq("id", editingGameId);
      error = updateErr;
    } else {
      payload.sort_order = gamesList.length;
      const { error: insertErr } = await supabase.from("games").insert([payload]);
      error = insertErr;
    }

    if (error) {
      setGameMessage(`Error: ${error.message}`);
    } else {
      setGameMessage(editingGameId ? "Game updated successfully!" : "Game added successfully!");
      resetGameForm();
      fetchData();
      setTimeout(() => setGameMessage(""), 3000);
    }
    setSubmittingGame(false);
  };


  
  // --- PC SPECS LOGIC ---
  const resetPcForm = () => {
    setEditingPcId(null);
    setPcType("");
    setPcName("");
    setPcBrand("");
    setPcDetails("");
    setPcImageUrl("");
    setPcImageFile(null);
    setPcDescription("");
    setPcMessage("");
  };

  const handleEditPc = (pc: any) => {
    setEditingPcId(pc.id);
    setPcType(pc.component_type);
    setPcName(pc.name);
    setPcBrand(pc.brand || "");
    setPcDetails(pc.specs_detail || "");
    setPcImageUrl(pc.image_url || "");
    setPcDescription(pc.description || "");
    setPcImageFile(null);
    setPcMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletePc = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("pc_specs").delete().eq("id", id);
    if (!error) {
      await fetchData();
      if (editingPcId === id) resetPcForm();
    }
    setDeletingId(null);
  };

  const handleAddPc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPc(true);
    setPcMessage("");

    let finalImageUrl = pcImageUrl;

    if (pcImageFile) {
      const fileExt = pcImageFile.name.split('.').pop();
      const fileName = `pc_${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('gear_images').upload(fileName, pcImageFile);

      if (uploadError) {
        setPcMessage(`Error uploading image: ${uploadError.message}`);
        setSubmittingPc(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('gear_images').getPublicUrl(fileName);
      finalImageUrl = publicUrl;
    }

    const payload: any = {
      component_type: pcType,
      name: pcName,
      brand: pcBrand,
      specs_detail: pcDetails,
      image_url: finalImageUrl || null,
      description: pcDescription || null,
    };

    let error;
    if (editingPcId) {
      const { error: updateErr } = await supabase.from("pc_specs").update(payload).eq("id", editingPcId);
      error = updateErr;
    } else {
      payload.sort_order = pcSpecs.length;
      const { error: insertErr } = await supabase.from("pc_specs").insert([payload]);
      error = insertErr;
    }

    if (error) {
      setPcMessage(`Error: ${error.message}`);
    } else {
      setPcMessage(editingPcId ? "PC Part updated successfully!" : "PC Part added successfully!");
      resetPcForm();
      fetchData();
      setTimeout(() => setPcMessage(""), 3000);
    }
    setSubmittingPc(false);
  };

  const handleOnDragEndPc = async (result: DropResult) => {
    if (!result.destination) return;
    
    const elements = Array.from(pcSpecs);
    const [reorderedItem] = elements.splice(result.source.index, 1);
    elements.splice(result.destination.index, 0, reorderedItem);

    setPcSpecs(elements);

    const updates = elements.map((el, idx) => 
      supabase.from("pc_specs").update({ sort_order: idx }).eq("id", el.id)
    );
    await Promise.all(updates);
  };


  // --- DRAG AND DROP HANDLERS ---
  const handleOnDragEndGear = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    
    const sourceCatName = source.droppableId.replace("gear-", "");
    const destCatName = destination.droppableId.replace("gear-", "");
    
    let newItems = [...items];
    const sourceCatItems = newItems.filter(i => i.category === sourceCatName);
    const draggedItem = sourceCatItems[source.index];
    
    if (!draggedItem) return;

    newItems = newItems.filter(i => i.id !== draggedItem.id);
    
    if (sourceCatName === destCatName) {
      const destCatItems = newItems.filter(i => i.category === destCatName);
      destCatItems.splice(destination.index, 0, draggedItem);
      
      const otherItems = newItems.filter(i => i.category !== destCatName);
      const updatedDestCatItems = destCatItems.map((item, idx) => ({ ...item, sort_order: idx }));
      
      setItems([...otherItems, ...updatedDestCatItems]);
      
      const updates = updatedDestCatItems.map((el) => 
        supabase.from("gear_items").update({ sort_order: el.sort_order }).eq("id", el.id)
      );
      await Promise.all(updates);
    } else {
      draggedItem.category = destCatName;
      const destCatItems = newItems.filter(i => i.category === destCatName);
      destCatItems.splice(destination.index, 0, draggedItem);
      
      const sourceCatItemsRemaining = newItems.filter(i => i.category === sourceCatName);
      const otherItems = newItems.filter(i => i.category !== destCatName && i.category !== sourceCatName);
      
      const updatedDestCatItems = destCatItems.map((item, idx) => ({ ...item, sort_order: idx }));
      const updatedSourceCatItems = sourceCatItemsRemaining.map((item, idx) => ({ ...item, sort_order: idx }));
      
      setItems([...otherItems, ...updatedSourceCatItems, ...updatedDestCatItems]);
      
      const updates = [...updatedDestCatItems, ...updatedSourceCatItems].map((el) => 
        supabase.from("gear_items").update({ sort_order: el.sort_order, category: el.category }).eq("id", el.id)
      );
      await Promise.all(updates);
    }
  };

  const handleOnDragEndGames = async (result: DropResult) => {
    if (!result.destination) return;
    
    const elements = Array.from(gamesList);
    const [reorderedItem] = elements.splice(result.source.index, 1);
    elements.splice(result.destination.index, 0, reorderedItem);

    setGamesList(elements);

    // Save to DB
    const updates = elements.map((el, idx) => 
      supabase.from("games").update({ sort_order: idx }).eq("id", el.id)
    );
    await Promise.all(updates);
  };

  const handleOnDragEndCategories = async (result: DropResult) => {
    if (!result.destination) return;
    
    const elements = Array.from(categoriesList);
    const [reorderedItem] = elements.splice(result.source.index, 1);
    elements.splice(result.destination.index, 0, reorderedItem);

    setCategoriesList(elements);

    // Save to DB
    const updates = elements.map((el, idx) => 
      supabase.from("categories").update({ sort_order: idx }).eq("id", el.id)
    );
    await Promise.all(updates);
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) alert(error.message);
    else await fetchData();
    setDeletingId(null);
  };

  const handleDeleteAllComments = async () => {
    if (!confirm("⚠️ DANGER: This will delete ALL comments. Proceed?")) return;
    const { error } = await supabase.from("comments").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to delete all
    if (error) alert(error.message);
    else fetchData();
  };


  // --- RENDERING ---

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-2.5 font-medium transition-colors mt-4"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm sticky top-4 z-10">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button onClick={handleLogout} className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-lg transition-colors border border-zinc-700">
          Sign Out
        </button>
      </div>

      {/* VISIBILITY SETTINGS */}
      {siteSettings && (
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 md:p-6 mb-8 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
              Public Visibility
            </h2>
            {savingSettings && (
              <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full animate-pulse border border-purple-500/20">
                Syncing...
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-6 md:gap-10">
            {[
              { label: 'PC Specs', field: 'show_pc_specs', icon: '🖥️' },
              { label: 'Gear & Tech', field: 'show_gear', icon: '⌨️' },
              { label: 'Games & Rank', field: 'show_games', icon: '🎮' },
            ].map(setting => (
              <label key={setting.field} className="flex items-center gap-3 cursor-pointer group select-none">
                <div className="relative shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={!!siteSettings[setting.field]}
                    onChange={(e) => handleToggleSetting(setting.field, e.target.checked)}
                    disabled={savingSettings}
                  />
                  <div className={`block w-11 h-6 rounded-full transition-all duration-300 shadow-inner ${siteSettings[setting.field] ? 'bg-purple-600' : 'bg-zinc-800 border border-zinc-700'} peer-focus:ring-2 peer-focus:ring-purple-500/50`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-md ${siteSettings[setting.field] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className={`text-[11px] font-bold transition-colors uppercase tracking-tight ${siteSettings[setting.field] ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                   {setting.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex space-x-2 border-b border-zinc-800 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab("gear")}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'gear' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
        >
          Manage Gear Items
        </button>
        <button 
          onClick={() => setActiveTab("games")}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'games' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
        >
          Manage Games & Ranks
        </button>
        <button 
          onClick={() => setActiveTab("categories")}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'categories' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
        >
          Manage Categories
        </button>

        <button 
          onClick={() => setActiveTab("pc_specs")}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'pc_specs' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
        >
          Manage PC Build
        </button>

        <button 
          onClick={() => setActiveTab("comments")}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'comments' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
        >
          Manage Comments
        </button>
      </div>

      {activeTab === "gear" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* GEAR FORM */}
          <form onSubmit={handleAddItem} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
            {editingId && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                EDIT MODE
              </div>
            )}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-white">
                {editingId ? `Editing: ${modelName}` : "Add New Gear Item"}
              </h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-white underline">
                  Cancel Edit
                </button>
              )}
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">Category</label>
                {categoriesList.length > 0 ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  >
                    {!category && <option value="" disabled>Select a category...</option>}
                    {categoriesList.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-yellow-500 text-sm py-2">Please create a category first via the Categories tab.</div>
                )}
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Model Name</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>
              
              <div className="md:col-span-2 space-y-4 bg-black/20 p-5 rounded-xl border border-zinc-700/50">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <ImageIcon size={16} /> Image Source
                </h3>
                
                {(imageFile || imageUrl) && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-700 rounded-xl mb-4">
                    <div className="relative h-16 w-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                      <img 
                        src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} 
                        alt="Preview" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="text-xs text-zinc-400">Image Preview</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-zinc-400 mb-2">Upload Device File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImageFile(e.target.files[0]);
                        setImageUrl("");
                      }
                    }}
                    className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 focus:outline-none transition-all cursor-pointer"
                  />
                </div>

                <div className="flex items-center space-x-4 py-1">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">OR Paste URL directly</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-2">External URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageFile(null);
                    }}
                    disabled={!!imageFile}
                    placeholder={imageFile ? "Custom file attached (URL disabled)" : "https://..."}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white disabled:opacity-30 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-opacity"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">Affiliate/Purchase Link (Optional)</label>
                <input
                  type="url"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">The Story (Why this gear?)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                  placeholder="Tell the story of why you chose this piece..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || categoriesList.length === 0}
              className={`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
                editingId ? 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500' : 'bg-white hover:bg-zinc-200 text-black focus:ring-white'
              }`}
            >
              {submitting ? 'Saving...' : editingId ? 'Update Gear Item' : 'Add New Gear Item'}
            </button>
          </form>

          {/* GEAR ITEMS LIST  */}
          <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-xl font-bold text-white">Existing Gear Items</h2>
              <span className="text-xs text-zinc-500 italic hidden md:block">Drag items by the handle to reorder</span>
            </div>
            
            {fetchingData ? (
              <div className="text-zinc-500 text-center py-8">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">
                No gear items found. 
              </div>
            ) : (
                <DragDropContext onDragEnd={handleOnDragEndGear}>
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
                              <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                              >
                                {catItems.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided) => (
                                      <div 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between group hover:border-zinc-700 transition-colors"
                                      >
                                        <div className="flex gap-4">
                                          <div {...provided.dragHandleProps} className="cursor-grab hover:text-white text-zinc-600 py-4 mr-1 active:cursor-grabbing">
                                            <GripVertical size={20} />
                                          </div>
                                          <div className="h-16 w-16 shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 relative">
                                            {item.image_url ? (
                                              <Image src={item.image_url} alt={item.model_name} fill className="object-cover" sizes="64px" />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-500">No Img</div>
                                            )}
                                          </div>
                                          <div>
                                            <h3 className="text-white font-semibold line-clamp-1">{item.model_name}</h3>
                                            <p className="text-xs text-zinc-400 line-clamp-1">{item.brand}</p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-4 md:mt-2 md:pl-10">
                                          <div></div>
                                          <div className="flex gap-2">
                                            <button onClick={() => handleEdit(item)} className="p-2 text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 rounded-lg transition-colors border border-zinc-700" title="Edit">
                                              <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id, item.model_name)} className="p-2 text-red-400 bg-red-950/30 hover:bg-red-900/50 border border-red-900/30 rounded-lg transition-colors" title="Delete">
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
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
      )}

      {activeTab === "games" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <form onSubmit={handleAddGame} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
            {editingGameId && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                EDIT MODE
              </div>
            )}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-white">
                {editingGameId ? `Editing Game: ${gameName}` : "Add New Game & Rank"}
              </h2>
              {editingGameId && (
                <button type="button" onClick={resetGameForm} className="text-xs text-zinc-400 hover:text-white underline">
                  Cancel Edit
                </button>
              )}
            </div>
            
            {gameMessage && (
              <div className={`p-3 rounded-lg text-sm ${gameMessage.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {gameMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Game Name (e.g. Valorant)</label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Current Rank (Optional)</label>
                <input
                  type="text"
                  value={gameRank}
                  onChange={(e) => setGameRank(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

               <div className="md:col-span-2 space-y-4 bg-black/20 p-5 rounded-xl border border-zinc-700/50">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <ImageIcon size={16} /> Game Icon / Logo (Optional)
                </h3>
                <p className="text-xs text-zinc-500">If no image is provided, the first letter of the game will be used as a stylized icon.</p>
                
                {(gameImageFile || gameImageUrl) && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-700 rounded-xl mb-4">
                    <div className="relative h-16 w-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                      <img 
                        src={gameImageFile ? URL.createObjectURL(gameImageFile) : gameImageUrl} 
                        alt="Preview" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="text-xs text-zinc-400">Image Preview</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">Upload Device File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setGameImageFile(e.target.files[0]);
                        setGameImageUrl("");
                      }
                    }}
                    className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 flex-1 cursor-pointer"
                  />
                </div>
                <div className="flex items-center space-x-4 py-1">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">OR Paste URL</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>
                <div>
                  <input
                    type="url"
                    value={gameImageUrl}
                    onChange={(e) => {
                      setGameImageUrl(e.target.value);
                      setGameImageFile(null);
                    }}
                    disabled={!!gameImageFile}
                    placeholder={gameImageFile ? "Custom file attached (URL disabled)" : "https://..."}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white disabled:opacity-30 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submittingGame}
              className={`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:ring-2 disabled:opacity-50 ${
                editingGameId ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white hover:bg-zinc-200 text-black'
              }`}
            >
              {submittingGame ? 'Saving...' : editingGameId ? 'Update Game' : 'Add Game'}
            </button>
          </form>

          {/* GAMES LIST */}
           <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-xl font-bold text-white">Existing Games & Ranks</h2>
              <span className="text-xs text-zinc-500 italic hidden md:block">Drag to reorder</span>
            </div>
            
            {fetchingData ? (
              <div className="text-zinc-500 text-center py-8">Loading items...</div>
            ) : gamesList.length === 0 ? (
              <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">
                No games added yet.
              </div>
            ) : (
                <DragDropContext onDragEnd={handleOnDragEndGames}>
                  <Droppable droppableId="games-items">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {gamesList.map((game, index) => (
                          <Draggable key={game.id} draggableId={game.id} index={index}>
                            {(provided) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} className="cursor-grab text-zinc-600 hover:text-white mr-1 active:cursor-grabbing">
                                    <GripVertical size={20} />
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 relative flex items-center justify-center font-black text-white text-xl">
                                      {game.image_url ? (
                                        <Image src={game.image_url} alt={game.name} fill className="object-cover" sizes="48px" />
                                      ) : (
                                        game.name.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="text-white font-semibold line-clamp-1">{game.name}</h3>
                                      {game.rank && (
                                        <p className="text-[10px] uppercase font-bold text-zinc-500">{game.rank}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 shrink-0 ml-2">
                                    <button onClick={() => handleEditGame(game)} className="p-2 text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 rounded-lg transition-colors border border-zinc-700" title="Edit">
                                      <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteGame(game.id, game.name)} className="p-2 text-red-400 bg-red-950/30 hover:bg-red-900/50 border border-red-900/30 rounded-lg transition-colors" title="Delete">
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
      )}

      {activeTab === "categories" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* CATEGORY FORM */}
          <form onSubmit={handleAddCategory} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
             {editingCatId && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                EDIT MODE
              </div>
            )}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-white">
                {editingCatId ? `Editing Category: ${catName}` : "Add New Category"}
              </h2>
              {editingCatId && (
                <button type="button" onClick={resetCatForm} className="text-xs text-zinc-400 hover:text-white underline">
                  Cancel Edit
                </button>
              )}
            </div>
            
            {catMessage && (
              <div className={`p-3 rounded-lg text-sm ${catMessage.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {catMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Category Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submittingCat}
              className={`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
                editingCatId ? 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500' : 'bg-white hover:bg-zinc-200 text-black focus:ring-white'
              }`}
            >
              {submittingCat ? 'Saving...' : editingCatId ? 'Update Category' : 'Add Category'}
            </button>
          </form>

          {/* CATEGORIES LIST  */}
          <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-xl font-bold text-white">Existing Categories</h2>
              <span className="text-xs text-zinc-500 italic hidden md:block">Drag to reorder sections</span>
            </div>
            
            {fetchingData ? (
              <div className="text-zinc-500 text-center py-8">Loading items...</div>
            ) : categoriesList.length === 0 ? (
              <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">
                No categories found. Add one above!
              </div>
            ) : (
                <DragDropContext onDragEnd={handleOnDragEndCategories}>
                  <Droppable droppableId="categories-items">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col gap-3"
                      >
                        {categoriesList.map((cat, index) => (
                          <Draggable key={cat.id} draggableId={cat.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps} className="cursor-grab text-zinc-600 hover:text-white mr-1 active:cursor-grabbing">
                                    <GripVertical size={20} />
                                  </div>
                                  <h3 className="text-white font-medium">{cat.name}</h3>
                                  {items.filter(i => i.category === cat.name).length > 0 && (
                                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full ml-2">
                                      {items.filter(i => i.category === cat.name).length} items
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditCat(cat)} className="p-2 text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 hover:text-purple-400 rounded-lg transition-colors border border-transparent hover:border-zinc-700" title="Edit">
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteCat(cat.id, cat.name)} className="p-2 text-zinc-500 hover:text-red-400 bg-transparent hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-900/30" title="Delete">
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
      )}


      {activeTab === "pc_specs" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <form onSubmit={handleAddPc} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
            {editingPcId && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">EDIT MODE</div>
            )}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-white">
                {editingPcId ? `Editing: ${pcName}` : "Add PC Component"}
              </h2>
              {editingPcId && (
                <button type="button" onClick={resetPcForm} className="text-xs text-zinc-400 hover:text-white underline">Cancel Edit</button>
              )}
            </div>
            
            {pcMessage && (
              <div className={`p-3 rounded-lg text-sm ${pcMessage.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {pcMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Component Type (CPU, GPU, RAM...)</label>
                <input type="text" placeholder="e.g. GPU" value={pcType} onChange={(e) => setPcType(e.target.value)} required className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name (Model)</label>
                <input type="text" placeholder="e.g. RTX 4090" value={pcName} onChange={(e) => setPcName(e.target.value)} required className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Brand (Optional)</label>
                <input type="text" placeholder="e.g. ASUS ROG" value={pcBrand} onChange={(e) => setPcBrand(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Specs Detail (Optional)</label>
                <input type="text" placeholder="e.g. 24GB GDDR6X" value={pcDetails} onChange={(e) => setPcDetails(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">The Story (Why this part?)</label>
                <textarea
                  value={pcDescription}
                  onChange={(e) => setPcDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                  placeholder="Tell the story behind this component..."
                />
              </div>
              
              <div className="md:col-span-2 space-y-4 bg-black/20 p-5 rounded-xl border border-zinc-700/50">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <ImageIcon size={16} /> Component Image (Optional)
                </h3>
                {(pcImageFile || pcImageUrl) && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-700 rounded-xl mb-4">
                    <div className="relative h-16 w-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                      <img src={pcImageFile ? URL.createObjectURL(pcImageFile) : pcImageUrl} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={(e) => { if(e.target.files && e.target.files.length > 0) { setPcImageFile(e.target.files[0]); setPcImageUrl(""); } }} className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">OR Paste URL</label>
                  <input type="url" placeholder="https://..." value={pcImageUrl} onChange={(e) => { setPcImageUrl(e.target.value); setPcImageFile(null); }} disabled={!!pcImageFile} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white disabled:opacity-30 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={submittingPc} className={`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:ring-2 disabled:opacity-50 ${editingPcId ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white hover:bg-zinc-200 text-black'}`}>
              {submittingPc ? 'Saving...' : editingPcId ? 'Update Component' : 'Add Component'}
            </button>
          </form>

          {/* PC LIST */}
           <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-xl font-bold text-white">My PC Specs</h2>
              <span className="text-xs text-zinc-500 italic hidden md:block">Drag to reorder</span>
            </div>
            
            {fetchingData ? (
              <div className="text-zinc-500 text-center py-8">Loading items...</div>
            ) : pcSpecs.length === 0 ? (
              <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">No components found.</div>
            ) : (
                <DragDropContext onDragEnd={handleOnDragEndPc}>
                  <Droppable droppableId="pc-items">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 gap-4">
                        {pcSpecs.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} className="cursor-grab text-zinc-600 hover:text-white mr-2 active:cursor-grabbing">
                                    <GripVertical size={20} />
                                  </div>
                                  <div className="h-16 w-16 shrink-0 bg-white/5 p-2 rounded-lg border border-zinc-800 relative flex items-center justify-center">
                                    {item.image_url ? (
                                      <Image src={item.image_url} alt={item.name} fill className="object-contain p-1" sizes="64px" />
                                    ) : (
                                      <span className="text-xs text-zinc-500 font-bold">{item.component_type}</span>
                                    )}
                                  </div>
                                  <div className="ml-2">
                                    <h3 className="text-white font-bold">{item.name}</h3>
                                    <div className="flex gap-2 items-center text-xs text-zinc-400 mt-1">
                                      <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">{item.component_type}</span>
                                      {item.specs_detail && <span>• {item.specs_detail}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditPc(item)} className="p-2 text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 rounded-lg"><Pencil size={14} /></button>
                                  <button onClick={() => handleDeletePc(item.id, item.name)} className="p-2 text-red-400 bg-red-950/30 hover:bg-red-900/50 rounded-lg"><Trash2 size={14} /></button>
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
      )}

      {activeTab === "comments" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center px-2">
            <div>
              <h2 className="text-xl font-bold text-white">Guestbook Vibes</h2>
              <p className="text-xs text-zinc-500 mt-1">Real-time bullet comments from your visitors</p>
            </div>
            <button 
              onClick={handleDeleteAllComments}
              className="px-4 py-2 bg-red-950/30 text-red-400 border border-red-900/30 rounded-xl text-xs font-bold hover:bg-red-900/50 transition-all"
            >
              Clear All Comments
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            {commentsList.length === 0 ? (
              <div className="text-zinc-500 text-center py-12">No vibes yet. Be the first to post something!</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {commentsList.map((comment) => (
                  <div key={comment.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white shadow-lg"
                        style={{ backgroundColor: comment.color || '#A855F7' }}
                      >
                        {comment.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{comment.user_name}</span>
                          {comment.device_info && (
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
                              {comment.device_info}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-sm mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 bg-transparent hover:bg-red-950/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Comment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
