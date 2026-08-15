import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TbHeart } from "react-icons/tb";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export interface LikeState {
  isLikedByMe: boolean;
  likesCount: number;
}

interface LikeButtonProps {
  writeupId: string;
  likesCount: number;
  isLikedByMe: boolean;
  onChanged?: (next: LikeState) => void;
}

export const LikeButton = ({
  writeupId,
  likesCount,
  isLikedByMe,
  onChanged,
}: LikeButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [liked, setLiked] = useState(isLikedByMe);
  const [count, setCount] = useState(likesCount);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    setLiked(isLikedByMe);
    setCount(likesCount);
  }, [isLikedByMe, likesCount]);

  const toggle = async () => {
    if (busy || inFlight.current) return;
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    const next = !liked;
    inFlight.current = true;
    setBusy(true);
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await api(`/api/writeups/${writeupId}/like`, {
        method: next ? "POST" : "DELETE",
      });
      onChanged?.({ isLikedByMe: next, likesCount: count + (next ? 1 : -1) });
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      title={liked ? "unlike" : "like"}
      onClick={() => void toggle()}
      className={`flex items-center gap-1 transition-colors hover:text-blood-400 ${
        liked ? "text-blood-400" : "text-neon-500"
      }`}
    >
      <TbHeart size={14} fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
};