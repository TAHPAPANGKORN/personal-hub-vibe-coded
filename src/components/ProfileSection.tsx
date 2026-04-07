"use client";

import Image from "next/image";
import { Globe } from "lucide-react";
import { FaYoutube, FaTwitch, FaTwitter, FaInstagram } from "react-icons/fa";
import { motion } from "framer-motion";

export const ProfileSection = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-32 h-32 rounded-full border-4 border-zinc-800 p-1 bg-gradient-to-tr from-purple-500 to-blue-500 shadow-xl overflow-hidden"
      >
        <Image
          src="/profile.jpg"
          alt="Profile"
          fill
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
          My Personal Setup
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto font-medium leading-relaxed">
          A curated visual showcase of the tactical hardware, coding arsenal, and peripherals that fuel my daily grind.
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center space-x-4"
      >
        <SocialIcon icon={<FaYoutube size={20} />} href="https://www.youtube.com/@tah2832#" />
        <SocialIcon icon={<FaTwitch size={20} />} href="https://www.twitch.tv/tahaiiya01" />
        <SocialIcon icon={<FaTwitter size={20} />} href="https://x.com/mogutan41181592" />
        <SocialIcon icon={<FaInstagram size={20} />} href="https://www.instagram.com/xfattahz/" />
        <SocialIcon icon={<Globe size={20} />} href="https://www.papangkorn.info" />
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
