import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") {
      const saved = sessionStorage.getItem(location.key);
      if (saved !== null) window.scrollTo(0, Number(saved));
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