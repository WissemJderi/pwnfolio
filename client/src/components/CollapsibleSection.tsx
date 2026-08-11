import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TbChevronDown } from "react-icons/tb";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const CollapsibleSection = ({
  id,
  title,
  collapsed,
  onToggle,
  children,
}: CollapsibleSectionProps) => (
  <section id={id}>
    <button
      type="button"
      aria-expanded={!collapsed}
      aria-controls={`${id}-content`}
      onClick={onToggle}
      className="mb-3 flex w-full cursor-pointer items-center justify-between gap-2 border-b border-line-700/70 pb-2 font-mono text-sm font-semibold text-neon-400 transition-colors hover:text-neon-300"
    >
      <span className="flex items-baseline gap-2">
        <span className="text-ink-500">##</span> {title}
      </span>
      <TbChevronDown
        size={16}
        className={`shrink-0 transition-transform duration-200 ${
          collapsed ? "-rotate-90" : ""
        }`}
      />
    </button>
    <AnimatePresence initial={false}>
      {!collapsed && (
        <motion.div
          id={`${id}-content`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </section>
);