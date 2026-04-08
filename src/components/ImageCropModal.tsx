"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, Scissors, RotateCw } from "lucide-react";

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
  title = "Adjust Image"
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc);

    const rotRad = (rotation * Math.PI) / 180;

    // Step 1: Create a canvas for the full rotated image
    const bBoxWidth =
      Math.abs(Math.cos(rotRad) * image.width) +
      Math.abs(Math.sin(rotRad) * image.height);
    const bBoxHeight =
      Math.abs(Math.sin(rotRad) * image.width) +
      Math.abs(Math.cos(rotRad) * image.height);

    const rotationCanvas = document.createElement("canvas");
    rotationCanvas.width = bBoxWidth;
    rotationCanvas.height = bBoxHeight;
    const rotCtx = rotationCanvas.getContext("2d");
    if (!rotCtx) return null;

    rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
    rotCtx.rotate(rotRad);
    rotCtx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    rotCtx.translate(-image.width / 2, -image.height / 2);
    rotCtx.drawImage(image, 0, 0);

    // Step 2: Create a separate canvas for the crop area and draw from the rotation canvas
    const MAX_SIZE = 1024;
    const outputWidth = Math.min(pixelCrop.width, MAX_SIZE);
    const outputHeight = Math.round(
      pixelCrop.height * (outputWidth / pixelCrop.width)
    );

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = outputWidth;
    cropCanvas.height = outputHeight;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return null;

    // This is the correct way: draw from the rotated canvas, specifying the source area
    cropCtx.drawImage(
      rotationCanvas,
      pixelCrop.x,   // source x
      pixelCrop.y,   // source y
      pixelCrop.width,  // source width
      pixelCrop.height, // source height
      0,             // dest x
      0,             // dest y
      outputWidth,   // dest width (scaled)
      outputHeight   // dest height (scaled)
    );

    return new Promise((resolve) => {
      cropCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.88);
    });
  };

  const handleConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedBlob) {
        const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
        onCropComplete(file);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Scissors size={20} className="text-purple-500" />
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 min-h-[400px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            classes={{
                containerClassName: "bg-black",
                mediaClassName: "max-w-none",
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-6 bg-zinc-900 border-t border-zinc-800 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Zoom Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span>Zoom</span>
                <span className="text-white">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <ZoomIn size={16} className="text-zinc-500" />
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Rotation Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span>Rotation</span>
                <span className="text-white">{rotation}°</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCw size={16} className="text-zinc-500" />
                <input
                    type="range"
                    value={rotation}
                    min={0}
                    max={360}
                    step={1}
                    aria-labelledby="Rotation"
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20"
            >
              Confirm Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
