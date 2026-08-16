import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TbUserMinus, TbUserPlus } from "react-icons/tb";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface FollowButtonProps {
  username: string;
  isFollowedByMe: boolean;
  onChanged?: (isFollowing: boolean) => void;
}

export const FollowButton = ({
  username,
  isFollowedByMe,
  onChanged,
}: FollowButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [following, setFollowing] = useState(isFollowedByMe);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    setFollowing(isFollowedByMe);
  }, [isFollowedByMe]);

  const toggle = async () => {
    if (busy || inFlight.current) return;
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    const next = !following;
    inFlight.current = true;
    setBusy(true);
    setFollowing(next);
    try {
      await api(`/api/users/${username}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      onChanged?.(next);
    } catch {
      setFollowing(!next);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      title={following ? "unfollow" : "follow"}
      onClick={() => void toggle()}
      className={`btn px-2 py-1 text-xs ${
        following ? "btn-outline" : "btn-primary"
      }`}
    >
      {following ? (
        <>
          <TbUserMinus size={13} /> following
        </>
      ) : (
        <>
          <TbUserPlus size={13} /> follow
        </>
      )}
    </button>
  );
};
