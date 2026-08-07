import { motion, useScroll, useSpring } from "framer-motion";

export const ReadingProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-neon-500 shadow-[0_0_10px_rgba(var(--pf-glow),0.5)]"
      style={{ scaleX }}
    />
  );
};