"use client";
import { motion } from "framer-motion";

export function FlipButton({
  flipped,
  onFlip,
  text1,
  text2,
}: {
  flipped: boolean;
  onFlip: () => void;
  text1: string;
  text2: string;
}) {
  const flipVariants = {
    one: {
      backgroundColor: "rgba(0,113,227,0.85)",
      color: "#ffffff",
    },
    two: {
      backgroundColor: "rgba(5,150,105,0.9)",
      color: "#ffffff",
    },
  };

  return (
    <motion.button
      onClick={onFlip}
      animate={flipped ? "two" : "one"}
      variants={flipVariants}
      transition={{ duration: 0.4, type: "spring" }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      style={{ borderRadius: 999, padding: "8px 20px", fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer", width: "100%" }}
    >
      <motion.div
        animate={{ rotateX: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, type: "spring" }}
        style={{ backfaceVisibility: "hidden" }}
      >
        {flipped ? text2 : text1}
      </motion.div>
    </motion.button>
  );
}
