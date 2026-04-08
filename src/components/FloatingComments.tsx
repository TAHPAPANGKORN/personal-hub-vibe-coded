"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Comment {
  id: string;
  content: string;
  user_name: string;
  color: string;
  created_at: string;
}

interface ActiveComment extends Comment {
  instanceId: string; // Unique ID for each animation instance
  lane: number;
}

interface FloatingCommentProps {
  instanceId: string;
  content: string;
  userName: string;
  color: string;
  lane: number;
  onComplete: (id: string) => void;
}

const FloatingComment = ({ instanceId, content, userName, color, lane, onComplete }: FloatingCommentProps) => {
  // Random duration between 10 and 16 seconds for smoother, slightly slower movement
  const duration = useRef(10 + Math.random() * 6).current;
  
  return (
    <motion.div
      initial={{ x: "100vw" }}
      animate={{ x: "-150%" }} // Fly past the left edge
      transition={{ duration, ease: "linear" }}
      onAnimationComplete={() => onComplete(instanceId)}
      style={{ 
        top: `${lane * 45 + 60}px`,
        willChange: "transform",
        transform: "translateZ(0)" // Force 3D context for GPU priority
      }}
      className="absolute whitespace-nowrap pointer-events-none select-none flex items-center"
    >
      <div 
        className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        style={{ borderColor: `${color}33` }}
      >
        <span 
          className="text-[11px] font-black uppercase tracking-[0.15em] leading-[1] mt-[1px]" 
          style={{ color }}
        >
          {userName}
        </span>
        <div className="w-[1px] h-3 bg-white/10" /> {/* Divider for better alignment */}
        <span className="text-sm font-bold text-white leading-[1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {content}
        </span>
      </div>
    </motion.div>
  );
};

export const FloatingComments = () => {
  const [activeComments, setActiveComments] = useState<ActiveComment[]>([]);
  const [commentPool, setCommentPool] = useState<Comment[]>([]);
  const laneCount = 7; // Fewer lanes, more focused
  const currentLane = useRef(0);
  const poolRef = useRef<Comment[]>([]);

  useEffect(() => {
    poolRef.current = commentPool;
  }, [commentPool]);

  useEffect(() => {
    // 1. Fetch initial comments to populate the pool
    const fetchInitialComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setCommentPool(data);
        // Start showing the first few immediately
        data.slice(0, 5).forEach((comment, index) => {
          setTimeout(() => {
            addCommentToStream(comment);
          }, index * 2500);
        });
      }
    };

    fetchInitialComments();

    // 2. Real-time subscription for NEW comments
    const channel = supabase
      .channel("live_comments_tweak")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, (payload) => {
        const newComment = payload.new as Comment;
        setCommentPool(prev => [newComment, ...prev.slice(0, 19)]);
        addCommentToStream(newComment);
      })
      .subscribe();

    // 3. Looping logic: Periodically pick from pool if stream is quiet
    const loopInterval = setInterval(() => {
      if (poolRef.current.length > 0 && activeComments.length < 2) {
        const randomComment = poolRef.current[Math.floor(Math.random() * poolRef.current.length)];
        // Add a random delay so it's not strictly robotic
        setTimeout(() => {
          addCommentToStream(randomComment);
        }, Math.random() * 8000);
      }
    }, 45000); // Check every 45 seconds (Rare vibes)

    return () => {
      channel.unsubscribe();
      clearInterval(loopInterval);
    };
  }, []);

  const addCommentToStream = (comment: Comment) => {
    const lane = currentLane.current;
    currentLane.current = (currentLane.current + 1) % laneCount;

    const instanceId = `${comment.id}-${Math.random().toString(36).substr(2, 9)}`;

    setActiveComments((prev) => [
      ...prev,
      { ...comment, instanceId, lane }
    ]);
  };

  const removeComment = (instanceId: string) => {
    setActiveComments((prev) => prev.filter((c) => c.instanceId !== instanceId));
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 h-[450px]">
      <AnimatePresence>
        {activeComments.map((comment) => (
          <FloatingComment
            key={comment.instanceId}
            instanceId={comment.instanceId}
            content={comment.content}
            userName={comment.user_name}
            color={comment.color}
            lane={comment.lane}
            onComplete={removeComment}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
