// ============================================================
// src/hooks/useImageCrop.ts
// Manages the entire image crop workflow state.
// Decouples cropping logic from form state management.
// ============================================================

import { useState, useCallback } from "react";
import type { CropType } from "@/types/admin";

interface CropTarget {
  file: File | null;
  url: string;
}

interface UseImageCropProps {
  onGearCropDone: (file: File) => void;
  onGameCropDone: (file: File) => void;
  onPcCropDone: (file: File) => void;
}

export function useImageCrop({ onGearCropDone, onGameCropDone, onPcCropDone }: UseImageCropProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [activeCropType, setActiveCropType] = useState<CropType | null>(null);

  const handleFileChangeForCrop = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: CropType) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setActiveCropType(type);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      // Reset input value so the same file can be re-selected
      e.target.value = "";
    },
    []
  );

  const onCropCompleteHandler = useCallback(
    (file: File) => {
      if (activeCropType === "gear") onGearCropDone(file);
      else if (activeCropType === "game") onGameCropDone(file);
      else if (activeCropType === "pc") onPcCropDone(file);

      setCropModalOpen(false);
      setImageToCrop(null);
      setActiveCropType(null);
    },
    [activeCropType, onGearCropDone, onGameCropDone, onPcCropDone]
  );

  const closeCropModal = useCallback(() => {
    setCropModalOpen(false);
    setImageToCrop(null);
    setActiveCropType(null);
  }, []);

  return {
    cropModalOpen,
    imageToCrop,
    activeCropType,
    handleFileChangeForCrop,
    onCropCompleteHandler,
    closeCropModal,
  };
}
