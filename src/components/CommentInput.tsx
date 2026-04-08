"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export const CommentInput = ({ siteSettings }: { siteSettings?: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "locating" | "success" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Check for existing cooldown in localStorage
    const lastPost = localStorage.getItem("last_comment_time");
    if (lastPost) {
      const elapsed = Date.now() - parseInt(lastPost);
      if (elapsed < 30000) {
        setCooldown(Math.ceil((30000 - elapsed) / 1000));
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || cooldown > 0 || status === "submitting" || status === "locating") return;

    setStatus("submitting");

    // Random vibrant colors for the comments
    const colors = ["#A855F7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Device detection logic
    const getDeviceType = () => {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Mobile";
      return "Desktop";
    };

    try {
      let locationStr = "Unknown";
      let latitude = null;
      let longitude = null;

      const isGPSEnabled = siteSettings?.enable_gps !== false;

      // 1. If GPS is DISABLED, we still fetch IP location SILENTLY
      // or if it's ENABLED, we fetch it as a fallback/baseline anyway
      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.city && geoData.country_name) {
            locationStr = `${geoData.city}, ${geoData.country_name}`;
          }
          if (geoData.latitude && geoData.longitude) {
            latitude = geoData.latitude.toString();
            longitude = geoData.longitude.toString();
          }
        }
      } catch (geoErr) {
        console.warn("Could not fetch baseline IP location:", geoErr);
      }

      // 2. ONLY if GPS is ENABLED, try to get precise GPS (Trigger Prompt)
      if (isGPSEnabled) {
        setStatus("locating");

        const getGPS = () => new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          const timeoutId = setTimeout(() => resolve(null), 5000);

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            () => {
              clearTimeout(timeoutId);
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 4500 }
          );
        });

        const gpsPos = await getGPS();
        if (gpsPos) {
          latitude = gpsPos.coords.latitude.toString();
          longitude = gpsPos.coords.longitude.toString();
        }
      }

      setStatus("submitting");

      const { error } = await supabase.from("comments").insert([
        {
          content: content.trim(),
          user_name: userName.trim() || "Vibe Visitor",
          color: randomColor,
          device_info: getDeviceType(),
          location: locationStr,
          latitude,
          longitude,
        },
      ]);

      if (error) throw error;

      // Set cooldown
      const now = Date.now();
      localStorage.setItem("last_comment_time", now.toString());
      setCooldown(30);
      
      setStatus("success");
      setContent("");
      setTimeout(() => {
        setStatus("idle");
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Error posting comment:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-80 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Join the Vibe</h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <textarea
                  placeholder="Drop a comment..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={100}
                  rows={2}
                  required
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none transition-all"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-zinc-600 font-bold">{content.length}/100</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!content.trim() || cooldown > 0 || status === "submitting" || status === "locating"}
                className="w-full bg-white text-black font-black uppercase py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-xs"
              >
                {status === "locating" ? (
                  <>
                    <Globe size={14} className="animate-spin text-blue-600" /> Locating...
                  </>
                ) : status === "submitting" ? (
                  "Sending..."
                ) : status === "success" ? (
                  "Sent!"
                ) : cooldown > 0 ? (
                  `Wait ${cooldown}s`
                ) : (
                  <>
                    <Send size={14} /> Send Vibe
                  </>
                )}
              </button>
              
              {status === "error" && (
                <p className="text-center text-[10px] text-red-400 font-bold animate-pulse">Failed to send. Try again.</p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? "bg-zinc-800 text-white" : "bg-purple-600 text-white"
        }`}
      >
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
};
