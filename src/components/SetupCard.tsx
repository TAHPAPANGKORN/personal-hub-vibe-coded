"use client";

import Image from "next/image";
import { ExternalLink, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SetupCardProps {
  id: string;
  category: string;
  model_name: string;
  brand: string;
  image_url?: string;
  affiliate_link?: string;
  likes?: number;
  className?: string;
  index: number;
  priority?: boolean;
  onClick?: () => void;
}

export const SetupCard = ({
  id,
  category,
  model_name,
  brand,
  image_url,
  affiliate_link,
  likes = 0,
  className,
  index,
  priority = false,
  onClick,
}: SetupCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col space-y-3 rounded-2xl transition-all duration-300 cursor-pointer",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-800/40 border border-zinc-800/60 transition-colors group-hover:bg-zinc-800/80 group-hover:border-zinc-700">
        {image_url ? (
          <Image
            src={image_url}
            alt={model_name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 250px"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No Image</span>
          </div>
        )}

        {/* Hype Count Overlay */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart size={10} className="fill-purple-500 text-purple-500" />
          {likes}
        </div>

        {/* External Link Icon Floating on Image */}
        {affiliate_link && (
          <a
            href={affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-black/60 group-hover:opacity-100"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Text Container */}
      <div className="flex flex-col px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
          {category}
        </span>
        <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
          {model_name}
        </h3>
        {brand && brand.toLowerCase() !== model_name.toLowerCase() && (
          <p className="text-sm text-zinc-400 line-clamp-1 mt-0.5">{brand}</p>
        )}
      </div>
    </motion.div>
  );
};
