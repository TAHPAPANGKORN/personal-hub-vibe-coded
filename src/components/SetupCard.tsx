"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SetupCardProps {
  category: string;
  model_name: string;
  brand: string;
  image_url?: string;
  affiliate_link?: string;
  className?: string;
  index: number;
}

export const SetupCard = ({
  category,
  model_name,
  brand,
  image_url,
  affiliate_link,
  className,
  index,
}: SetupCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className={cn(
        "group relative flex flex-col space-y-3 rounded-2xl transition-all duration-300",
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
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No Image</span>
          </div>
        )}

        {/* External Link Icon Floating on Image */}
        {affiliate_link && (
          <a
            href={affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-black/60 group-hover:opacity-100"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Text Container */}
      <div className="flex flex-col px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
          {category}
        </span>
        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
          {model_name}
        </h3>
        {brand && brand.toLowerCase() !== model_name.toLowerCase() && (
          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{brand}</p>
        )}
      </div>
    </motion.div>
  );
};
