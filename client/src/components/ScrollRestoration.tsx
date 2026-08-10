import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const TICK_MS = 50;
const MAX_TICKS = 40;
const STABLE_TICKS = 8;

const maxScroll = () =>
  document.documentElement.scrollHeight - window.innerHeight;

const scrollToTarget = (target: number) => {
  const applied = Math.max(0, Math.min(target, maxScroll()));
  window.scrollTo(0, applied);
  return applied;
};

const restorePosition = (target: number) => {
  let lastApplied = scrollToTarget(target);
  let lastMax = maxScroll();
  let stableTicks = 0;
  let ticks = 0;
  let timer: number | undefined;

  const stop = () => {
    if (timer !== undefined) window.clearTimeout(timer);
  };

  const tick = () => {
    ticks += 1;
    if (
      Math.abs(window.scrollY - lastApplied) > 1 ||
      Math.abs(window.scrollY - target) <= 1
    ) {
      stop();
      return;
    }
    const max = maxScroll();
    lastApplied = scrollToTarget(target);
    if (Math.abs(window.scrollY - lastApplied) > 1) {
      stop();
      return;
    }
    if (Math.abs(window.scrollY - target) <= 1) {
      stop();
      return;
    }
    stableTicks = max === lastMax ? stableTicks + 1 : 0;
    lastMax = max;
    if (stableTicks >= STABLE_TICKS || ticks >= MAX_TICKS) {
      stop();
      return;
    }
    timer = window.setTimeout(tick, TICK_MS);
  };

  timer = window.setTimeout(tick, TICK_MS);
  return stop;
};

export const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") {
      const saved = sessionStorage.getItem(location.key);
      if (saved !== null && Number.isFinite(Number(saved))) {
        return restorePosition(Number(saved));
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location, navigationType]);

  useEffect(() => {
    return () => {
      sessionStorage.setItem(location.key, String(window.scrollY));
    };
  }, [location]);

  return null;
};