// ============================================================
// src/components/admin/ProfileTab.tsx
// CRUD for the Hero / Profile section of the public page.
// Edits profile_title, description, social links, and avatar.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageSourceInput } from "@/components/admin/ImageSourceInput";
import { User } from "lucide-react";
import Image from "next/image";
import type { SiteSettings, CropType } from "@/types/admin";

interface ProfileTabProps {
  siteSettings: SiteSettings | null;
  onFileChangeForCrop: (e: React.ChangeEvent<HTMLInputElement>, type: CropType) => void;
  pendingProfileFile: File | null;
  setPendingProfileFile: React.Dispatch<React.SetStateAction<File | null>>;
  onRefetchSettings: () => Promise<void>;
}

export function ProfileTab({
  siteSettings,
  onFileChangeForCrop,
  pendingProfileFile,
  setPendingProfileFile,
  onRefetchSettings,
}: ProfileTabProps) {
  const { uploadImage } = useImageUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitch, setTwitch] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Populate form from siteSettings when loaded
  useEffect(() => {
    if (!siteSettings) return;
    setTitle(siteSettings.profile_title ?? "My Personal Setup");
    setDescription(siteSettings.profile_description ?? "");
    setImageUrl(siteSettings.profile_image_url ?? "");
    setYoutube(siteSettings.social_youtube ?? "");
    setTwitch(siteSettings.social_twitch ?? "");
    setTwitter(siteSettings.social_twitter ?? "");
    setInstagram(siteSettings.social_instagram ?? "");
    setWebsite(siteSettings.social_website ?? "");
  }, [siteSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    let finalImageUrl = imageUrl;
    if (pendingProfileFile) {
      const { publicUrl, error } = await uploadImage(pendingProfileFile, "profile_");
      if (error) {
        setMessage(`Error uploading avatar: ${error}`);
        setSubmitting(false);
        return;
      }
      finalImageUrl = publicUrl ?? "";
    }

    const { error } = await supabase
      .from("site_settings")
      .update({
        profile_title: title,
        profile_description: description,
        profile_image_url: finalImageUrl || null,
        social_youtube: youtube || null,
        social_twitch: twitch || null,
        social_twitter: twitter || null,
        social_instagram: instagram || null,
        social_website: website || null,
      })
      .eq("id", siteSettings!.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Profile updated successfully!");
      setPendingProfileFile(null);
      await onRefetchSettings();
      setTimeout(() => setMessage(""), 3000);
    }
    setSubmitting(false);
  };

  const inputCls =
    "w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder:text-zinc-600";

  const currentAvatarSrc = pendingProfileFile
    ? URL.createObjectURL(pendingProfileFile)
    : imageUrl || null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 relative overflow-hidden shrink-0 flex items-center justify-center">
            {currentAvatarSrc ? (
              <Image src={currentAvatarSrc} alt="Avatar Preview" fill className="object-cover" sizes="64px" />
            ) : (
              <User size={28} className="text-zinc-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Profile Settings</h2>
            <p className="text-xs text-zinc-500 mt-1">Manage the hero section shown on the public page.</p>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
            {message}
          </div>
        )}

        {/* AVATAR */}
        <ImageSourceInput
          label="Avatar / Profile Picture"
          imageFile={pendingProfileFile}
          imageUrl={imageUrl}
          cropType="profile"
          onFileChange={onFileChangeForCrop}
          onClearImage={() => { setPendingProfileFile(null); setImageUrl(""); }}
          onUrlChange={(url) => { setImageUrl(url); setPendingProfileFile(null); }}
        />

        {/* TITLE & DESCRIPTION */}
        <div className="space-y-5">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
            Page Content
          </h3>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Page Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Personal Setup"
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="A curated visual showcase..."
            />
          </div>
        </div>

        {/* SOCIAL LINKS */}
        <div className="space-y-5">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
            Social Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "YouTube URL", value: youtube, setter: setYoutube, placeholder: "https://youtube.com/@..." },
              { label: "Twitch URL", value: twitch, setter: setTwitch, placeholder: "https://twitch.tv/..." },
              { label: "Twitter / X URL", value: twitter, setter: setTwitter, placeholder: "https://x.com/..." },
              { label: "Instagram URL", value: instagram, setter: setInstagram, placeholder: "https://instagram.com/..." },
              { label: "Personal Website", value: website, setter: setWebsite, placeholder: "https://..." },
            ].map(({ label, value, setter, placeholder }) => (
              <div key={label}>
                <label className="block text-sm text-zinc-400 mb-1">{label}</label>
                <input
                  type="url"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !siteSettings}
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-8 py-3 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
