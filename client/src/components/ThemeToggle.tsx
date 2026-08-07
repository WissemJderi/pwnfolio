import { useEffect, useState } from "react";
import { TbBug, TbMoon, TbSun } from "react-icons/tb";
import type { IconType } from "react-icons";

type Theme = "dark" | "light" | "hacker";

const THEMES: { id: Theme; icon: IconType; label: string }[] = [
  { id: "dark", icon: TbMoon, label: "dark" },
  { id: "light", icon: TbSun, label: "light" },
  { id: "hacker", icon: TbBug, label: "hacker" },
];

const getInitial = (): Theme => {
  const saved = localStorage.getItem("pf-theme");
  if (saved === "dark" || saved === "light" || saved === "hacker") return saved;
  return "dark";
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pf-theme", theme);
  }, [theme]);

  return (
    <div className="flex items-center gap-0.5 rounded-sm border border-line-700 bg-core-800/50 p-0.5">
      {THEMES.map(({ id, icon: Icon, label }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            title={`${label} theme`}
            aria-pressed={active}
            onClick={() => setTheme(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
              active
                ? "bg-neon-500/15 text-neon-400"
                : "text-ink-400 hover:bg-core-700/50 hover:text-ink-200"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
};