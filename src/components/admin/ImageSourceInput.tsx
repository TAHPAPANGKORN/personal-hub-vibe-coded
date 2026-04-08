// ============================================================
// src/components/admin/ImageSourceInput.tsx
// Reusable image field: file upload with cropping + URL fallback.
// Used by GearTab, GamesTab, and PcSpecsTab.
// ============================================================

"use client";

import { ImageIcon, Trash2 } from "lucide-react";
import type { CropType } from "@/types/admin";

interface ImageSourceInputProps {
  label: string;
  imageFile: File | null;
  imageUrl: string;
  cropType: CropType;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: CropType) => void;
  onClearImage: () => void;
  onUrlChange: (url: string) => void;
  showUrlInput?: boolean;
}

export function ImageSourceInput({
  label,
  imageFile,
  imageUrl,
  cropType,
  onFileChange,
  onClearImage,
  onUrlChange,
  showUrlInput = true,
}: ImageSourceInputProps) {
  const previewSrc = imageFile ? URL.createObjectURL(imageFile) : imageUrl || null;
  const hasImage = Boolean(imageFile || imageUrl);

  return (
    <div className="space-y-4 bg-black/20 p-5 rounded-xl border border-zinc-700/50">
      <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
        <ImageIcon size={16} /> {label}
      </h3>

      {hasImage && previewSrc && (
        <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-700 rounded-xl">
          <div className="relative h-16 w-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
            <img src={previewSrc} alt="Preview" className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-zinc-400 font-bold uppercase truncate">
              {imageFile ? imageFile.name : "Active Remote Image"}
            </div>
            <button
              type="button"
              onClick={onClearImage}
              className="mt-1 text-[10px] text-red-400 hover:text-red-300 font-black uppercase tracking-widest flex items-center gap-1"
            >
              <Trash2 size={10} /> Remove Image
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-zinc-400 mb-2 font-bold uppercase tracking-wider">
          {hasImage ? "Replace Image File" : "Upload Image File"}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e, cropType)}
          className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 focus:outline-none transition-all cursor-pointer"
        />
      </div>

      {showUrlInput && (
        <>
          <div className="flex items-center space-x-4 py-1">
            <div className="flex-grow border-t border-zinc-800" />
            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">OR Paste URL directly</span>
            <div className="flex-grow border-t border-zinc-800" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-2">External URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                onUrlChange(e.target.value);
              }}
              disabled={!!imageFile}
              placeholder={imageFile ? "Custom file attached (URL disabled)" : "https://..."}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white disabled:opacity-30 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-opacity"
            />
          </div>
        </>
      )}
    </div>
  );
}
