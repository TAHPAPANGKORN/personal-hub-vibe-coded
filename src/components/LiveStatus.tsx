"use client";

import { useEffect, useState } from "react";
import { Music, Gamepad2, Activity, Monitor } from "lucide-react";
import Image from "next/image";

// Replace this with the user's real Discord ID from .env, or fallback to a dummy/developer one for testing
const DISCORD_ID = process.env.NEXT_PUBLIC_DISCORD_ID || "156114103033184256"; // Photic's ID as fallback

export const LiveStatus = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!DISCORD_ID) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error("Lanyard error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Poll every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-8">
        <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-purple-500 animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  const isOnline = data.discord_status !== "offline";
  const spotify = data.spotify;
  
  // Find Apple Music / Custom Listening Activity (often synced via apps like Cider or Mac RPC)
  const appleMusic = data.activities?.find((a: any) => 
    a.name === "Apple Music" || a.name === "Cider" || a.name === "Music" || (a.type === 2 && a.name !== "Spotify")
  );
  
  // Find a playing game (type 0 means playing a game)
  const game = data.activities?.find((a: any) => 
    a.type === 0 && a.name !== "Apple Music" && !a.name.includes("Visual Studio") && !a.name.includes("Xcode")
  );
  
  // Find VS Code or coding activity
  const coding = data.activities?.find((a: any) => a.name.includes("Visual Studio") || a.name.includes("Xcode"));

  return (
    <div className="flex flex-col items-center justify-center space-y-3 mt-2">
      {/* Container matching the dark aesthetic */}
      <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 shadow-lg backdrop-blur-sm">
        
        {/* Core Status indicator */}
        <div className="flex items-center gap-2 pr-3 sm:border-r sm:border-zinc-800">
          <span className="relative flex h-3 w-3">
             {isOnline && (
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  data.discord_status === 'dnd' ? 'bg-red-400' : 'bg-green-400'
               }`}></span>
             )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              !isOnline ? 'bg-zinc-500' : 
              data.discord_status === 'dnd' ? 'bg-red-500' : 
              data.discord_status === 'idle' ? 'bg-yellow-500' : 'bg-green-500'
            }`}></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {isOnline ? data.discord_status : "Offline"}
          </span>
        </div>

        {/* Dynamic Activity: Priorities are Spotify > Apple Music > Gaming > Coding > Nothing */}
        {spotify ? (
           <a href={`https://open.spotify.com/track/${spotify.track_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-6 w-6 relative shrink-0">
                <Image src={spotify.album_art_url} alt="Album Art" fill className="rounded object-cover" />
              </div>
              <div className="flex flex-col items-start overflow-hidden w-48 sm:w-auto">
                <div className="flex items-center gap-1.5 w-full">
                  <Music size={12} className="text-green-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate w-full">{spotify.song}</span>
                </div>
                <span className="text-[10px] text-zinc-400 truncate w-full">by {spotify.artist}</span>
              </div>
           </a>
        ) : appleMusic ? (
           <div className="flex items-center gap-3">
              <div className="flex flex-col items-start overflow-hidden w-48 sm:w-auto">
                <div className="flex items-center gap-1.5 w-full">
                  <Music size={12} className="text-pink-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate w-full">{appleMusic.details || "Listening to Music"}</span>
                </div>
                {appleMusic.state && (
                  <span className="text-[10px] text-zinc-400 truncate w-full">by {appleMusic.state}</span>
                )}
              </div>
           </div>
        ) : game ? (
           <div className="flex items-center gap-3">
              <div className="flex flex-col items-start overflow-hidden w-48 sm:w-auto">
                <div className="flex items-center gap-1.5 w-full">
                  <Gamepad2 size={12} className="text-purple-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate w-full">Playing {game.name}</span>
                </div>
                {game.details && (
                  <span className="text-[10px] text-zinc-400 truncate w-full">{game.details}</span>
                )}
              </div>
           </div>
        ) : coding ? (
           <div className="flex items-center gap-3">
              <div className="flex flex-col items-start overflow-hidden w-48 sm:w-auto">
                <div className="flex items-center gap-1.5 w-full">
                  <Monitor size={12} className="text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate w-full">Coding in {coding.name}</span>
                </div>
                {coding.details && (
                  <span className="text-[10px] text-zinc-400 truncate w-full">{coding.details}</span>
                )}
              </div>
           </div>
        ) : (
           <div className="flex items-center gap-1.5">
             <Activity size={12} className="text-zinc-500" />
             <span className="text-xs text-zinc-500 font-medium">Chilling...</span>
           </div>
        )}
      </div>
    </div>
  );
};
