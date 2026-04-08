// ============================================================
// src/hooks/useImageUpload.ts
// Reusable hook for uploading a File to Supabase Storage
// and returning the resulting public URL.
// ============================================================

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "gear_images";

interface UploadResult {
  publicUrl: string | null;
  error: string | null;
}

export function useImageUpload() {
  const uploadImage = useCallback(
    async (file: File, prefix: string = ""): Promise<UploadResult> => {
      const fileExt = file.name.split(".").pop() ?? "jpg";
      const fileName = `${prefix}${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        return { publicUrl: null, error: uploadError.message };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

      return { publicUrl, error: null };
    },
    []
  );

  return { uploadImage };
}
