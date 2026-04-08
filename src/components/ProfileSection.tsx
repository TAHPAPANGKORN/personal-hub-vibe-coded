"use client";

import Image from "next/image";
import { Globe } from "lucide-react";
import { FaYoutube, FaTwitch, FaTwitter, FaInstagram } from "react-icons/fa";
import { motion } from "framer-motion";
import { LiveStatus } from "./LiveStatus";
import type { SiteSettings } from "@/types/admin";

interface ProfileSectionProps {
  onlineCount?: number;
  settings?: SiteSettings | null;
}

export const ProfileSection = ({ onlineCount = 1, settings }: ProfileSectionProps) => {
  const title       = settings?.profile_title       ?? "My Personal Setup";
  const description = settings?.profile_description ?? "A curated visual showcase of the tactical hardware, coding arsenal, and peripherals that fuel my daily grind.";
  const avatarSrc   = settings?.profile_image_url   ?? "/profile.jpg";
  const youtube     = settings?.social_youtube      ?? "https://www.youtube.com/@tah2832#";
  const twitch      = settings?.social_twitch       ?? "https://www.twitch.tv/tahaiiya01";
  const twitter     = settings?.social_twitter      ?? "https://x.com/mogutan41181592";
  const instagram   = settings?.social_instagram    ?? "https://www.instagram.com/xfattahz/";
  const website     = settings?.social_website      ?? "https://www.papangkorn.info";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-32 h-32 rounded-full border-4 border-zinc-800 p-1 bg-gradient-to-tr from-purple-500 to-blue-500 shadow-xl overflow-hidden"
      >
        <Image
          src={avatarSrc}
          alt="Profile"
          fill
          priority
          sizes="128px"
          className="rounded-full object-cover bg-zinc-900"
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center space-y-2 mt-4"
      >
        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 pb-1 pr-4">
          {title}
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto font-medium leading-relaxed pb-2">
          {description}
        </p>
        <LiveStatus onlineCount={onlineCount} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center space-x-4"
      >
        {youtube   && <SocialIcon icon={<FaYoutube size={20} />}   href={youtube} />}
        {twitch    && <SocialIcon icon={<FaTwitch size={20} />}    href={twitch} />}
        {twitter   && <SocialIcon icon={<FaTwitter size={20} />}   href={twitter} />}
        {instagram && <SocialIcon icon={<FaInstagram size={20} />} href={instagram} />}
        {website   && <SocialIcon icon={<Globe size={20} />}       href={website} />}
      </motion.div>
    </div>
  );
};

const SocialIcon = ({ icon, href }: { icon: React.ReactNode; href: string }) => (
  <a
    href={href}
    className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-300 shadow-lg"
    target="_blank"
    rel="noopener noreferrer"
  >
    {icon}
  </a>
);
