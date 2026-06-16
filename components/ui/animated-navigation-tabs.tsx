"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Item = {
  id: string | number;
  tile: string;
};

export function AnimatedNavigationTabs({
  items,
  active,
  onChange,
}: {
  items: Item[];
  active: string;
  onChange: (id: string) => void;
}) {
  const [isHover, setIsHover] = useState<string | null>(null);

  return (
    <ul className="flex items-center justify-center flex-wrap gap-0">
      {items.map((item) => (
        <button
          key={item.id}
          className={cn(
            "py-2 relative duration-300 transition-colors hover:!text-[var(--text)]",
            active === String(item.id) ? "text-[var(--text)]" : "text-[var(--text-2)]"
          )}
          onClick={() => onChange(String(item.id))}
          onMouseEnter={() => setIsHover(String(item.id))}
          onMouseLeave={() => setIsHover(null)}
        >
          <div className="px-5 py-2 relative text-sm font-medium">
            <span style={{ position: "relative", zIndex: 1 }}>{item.tile}</span>
            {isHover === String(item.id) && (
              <motion.div
                layoutId="hover-bg"
                className="absolute bottom-0 left-0 right-0 w-full h-full"
                style={{ borderRadius: 6, background: "var(--card-2)", zIndex: 0 }}
              />
            )}
          </div>
          {active === String(item.id) && (
            <motion.div
              layoutId="active"
              className="absolute bottom-0 left-0 right-0 w-full h-0.5"
              style={{ background: "#0071E3" }}
            />
          )}
        </button>
      ))}
    </ul>
  );
}
