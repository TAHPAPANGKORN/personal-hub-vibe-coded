"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, RotateCw, Scissors, Check } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (file: File) => void;
  aspect?: number;
  title?: string;
}

export const ImageCropModal = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspect = 1,
  title = "Adjust Image",
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  // Lock body scroll when modal is open — critical for mobile
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, imageSrc]);

  const onCropCompleteInternal = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", reject);
      img.setAttribute("crossOrigin", "anonymous");
      img.src = url;
    });

  const getCroppedImg = async (
    src: string,
    pixelCrop: any,
    rot = 0,
    flip = { horizontal: false, vertical: false }
  ): Promise<Blob | null> => {
    const image = await createImage(src);
    const rotRad = (rot * Math.PI) / 180;

    const bBoxWidth =
      Math.abs(Math.cos(rotRad) * image.width) +
      Math.abs(Math.sin(rotRad) * image.height);
    const bBoxHeight =
      Math.abs(Math.sin(rotRad) * image.width) +
      Math.abs(Math.cos(rotRad) * image.height);

    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = bBoxWidth;
    rotCanvas.height = bBoxHeight;
    const rotCtx = rotCanvas.getContext("2d");
    if (!rotCtx) return null;

    rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
    rotCtx.rotate(rotRad);
    rotCtx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    rotCtx.translate(-image.width / 2, -image.height / 2);
    rotCtx.drawImage(image, 0, 0);

    const MAX = 1024;
    const outW = Math.min(pixelCrop.width, MAX);
    const outH = Math.round(pixelCrop.height * (outW / pixelCrop.width));

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = outW;
    cropCanvas.height = outH;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return null;

    cropCtx.drawImage(rotCanvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH);

    return new Promise((resolve) =>
      cropCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.88)
    );
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setConfirming(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (blob) {
        const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
        onCropComplete(file);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop — overscroll-none prevents page scroll on mobile
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-sm overscroll-none"
      // Prevent touchmove from bubbling to the page
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Scissors size={18} className="text-purple-400" />
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Cropper Area — flex-1 fills all remaining space ─ */}
      {/*
        CRITICAL for mobile:
        - `touch-action: none` on container prevents browser scroll interception
        - position: relative is required by react-easy-crop
        - `overflow: hidden` clips the crop overlay correctly
      */}
      <div
        className="relative flex-1 overflow-hidden bg-zinc-950"
        style={{ touchAction: "none" }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={setZoom}
          // showGrid gives visual feedback on mobile
          showGrid
          style={{
            containerStyle: {
              background: "#09090b", // zinc-950
            },
          }}
        />
      </div>

      {/* ── Controls — compact single row on mobile ─────── */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-4 pt-3 pb-4 shrink-0 space-y-3">
        {/* Sliders */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Zoom */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <ZoomIn size={11} /> Zoom
              </span>
              <span className="text-[10px] font-bold text-white">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Rotation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <RotateCw size={11} /> Rotate
              </span>
              <span className="text-[10px] font-bold text-white">{rotation}°</span>
            </div>
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
          >
            {confirming ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <><Check size={16} /> Confirm Crop</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
